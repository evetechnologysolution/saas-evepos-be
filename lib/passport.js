import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";

import Tenant from "../models/core/tenant.js";
import Member from "../models/member/member.js";
import MemberVoucher from "../models/member/voucherMember.js";
import Order from "../models/pos/order.js";

import { generateRandomId } from "../lib/generateRandom.js";

const isProduction = process.env.NODE_ENV === "production";

// Setup Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${isProduction ? process.env.BE_URL : process.env.BE_URL_DEV}/api/auth-member/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // check tenant evewash
                const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();
                // Check if user already exists
                let member = await Member.findOne({
                    email: profile.emails[0].value,
                    tenantRef: checkTenant?._id,
                }).lean();

                if (!member) {
                    const currYear = new Date().getFullYear();
                    const memberId = `EM${currYear}${generateRandomId()}`;

                    member = new Member({
                        memberId,
                        name: profile.displayName,
                        firstName: profile?.name?.givenName || "",
                        lastName: profile?.name?.familyName || "",
                        email: profile.emails[0].value,
                        phone: "",
                        isGmail: true,
                        tenantRef: checkTenant?._id || null,
                    });

                    await member.save();
                }

                // Generate JWT token
                const token = jwt.sign(
                    { _id: member._id, email: member.email },
                    process.env.TOKEN_SECRET,
                    // { expiresIn: process.env.TIMEEXPIRES || "5d" }
                );

                return done(null, { member, token });
            } catch (err) {
                return done(err, null);
            }
        },
    ),
);

// Serialize user to store in session
passport.serializeUser((data, done) => {
    done(null, data.member._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const member = await Member.findById(id).select("-password -otp").populate({ path: "tenantRef", select: "isEvewash" }).lean();

        if (!member || !member.isActive || !member?.tenantRef?.isEvewash) {
            return done(null, null);
        }

        const [activeVouchers, orderCount] = await Promise.all([
            MemberVoucher.countDocuments({
                memberRef: member._id,
                isUsed: { $ne: true },
                expiry: { $gt: new Date() },
            }),
            Order.countDocuments({ "customer.memberId": member.memberId }),
        ]);

        const hasOrder = orderCount > 0;

        done(null, {
            ...member,
            voucher: activeVouchers || 0,
            firstWash: !hasOrder,
        });
    } catch (err) {
        done(err, null);
    }
});

export default passport;
