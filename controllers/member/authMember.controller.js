import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Tenant from "../../models/core/tenant.js";
import Member from "../../models/member/member.js";
import MemberPending from "../../models/member/memberPending.js";
import MemberVoucher from "../../models/member/voucherMember.js";
import Order from "../../models/pos/order.js";

import { convertToE164, capitalizeFirstLetter } from "../../lib/textSetting.js";
import { generateRandomId, generateOtp } from "../../lib/generateRandom.js";

import { sendVerificationRegister, sendOtpForgotPassword, sendUrlForgotPassword } from "../../lib/nodemailer.js";

export const getMyMember = async (req, res) => {
    try {
        const memberExist = await Member.findOne({
            _id: req?.memberData?._id || req?.userData?._id,
        })
            .select("-password -otp -resetToken -resetTokenExpiry")
            .populate({ path: "tenantRef", select: "isEvewash" })
            .lean();

        if (!memberExist || !memberExist?.tenantRef?.isEvewash) {
            return res.status(400).json({ message: "Member not found" });
        }

        const [activeVouchers, hasOrder] = await Promise.all([
            MemberVoucher.countDocuments({
                memberRef: memberExist._id,
                isUsed: { $ne: true },
                expiry: { $gt: new Date() },
            }),
            Order.exists({ "customer.memberId": memberExist.memberId }),
        ]);

        res.json({
            user: {
                ...memberExist,
                voucher: activeVouchers || 0,
                firstWash: !hasOrder,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const loginMember = async (req, res) => {
    try {
        let query = { email: req.body.email };
        if (req.body.phone) {
            query = { phone: convertToE164(req.body.phone) };
        }

        query.isVerified = true;

        const memberExist = await Member.findOne(query).populate({ path: "tenantRef", select: "isEvewash" }).lean();
        if (!memberExist || !memberExist?.tenantRef?.isEvewash) return res.status(400).json({ message: "Member not found" });

        const validPassword = await bcrypt.compare(req.body.password, memberExist.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign({ _id: memberExist._id }, process.env.TOKEN_SECRET);

        const { password, ...memberWithoutPassword } = memberExist;

        const [activeVouchers, hasOrder] = await Promise.all([
            MemberVoucher.countDocuments({
                memberRef: memberExist._id,
                isUsed: { $ne: true },
                expiry: { $gt: new Date() },
            }),
            Order.exists({ "customer.memberId": memberExist.memberId }),
        ]);

        return res.json({
            message: "Login Successful",
            accessToken: token,
            member: {
                ...memberWithoutPassword,
                voucher: activeVouchers || 0,
                firstWash: !hasOrder,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const loginMemberOtp = async (req, res) => {
    try {
        const pendingData = await MemberPending.findOne({ email: req.body.email })
            .populate({ path: "tenantRef", select: "isEvewash" })
            .lean();

        if (pendingData && pendingData?.tenantRef?.isEvewash) {
            const otp = generateOtp();

            const objData = { ...pendingData, otp };

            const newData = await MemberPending.findOneAndUpdate({ email: objData.email }, { $set: objData }, { new: true, upsert: true });

            if (newData && objData.email) {
                await sendVerificationRegister(newData.toObject());
            }

            return res.status(400).json({ message: "Not verified. OTP sent to email" });
        }

        const memberExist = await Member.findOne({ email: req.body.email }).populate({ path: "tenantRef", select: "isEvewash" }).lean();
        if (!memberExist || !memberExist?.tenantRef?.isEvewash) return res.status(400).json({ message: "Member not found" });

        const validPassword = await bcrypt.compare(req.body.password, memberExist.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign({ _id: memberExist._id }, process.env.TOKEN_SECRET);

        const memberWithoutPassword = memberExist;
        delete memberWithoutPassword.password;

        return res.json({
            message: "Login Successful",
            accessToken: token,
            member: memberWithoutPassword,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const registerMember = async (req, res) => {
    try {
        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        let objData = { ...req.body, tenantRef: checkTenant?._id };

        if (!objData.phone) {
            return res.status(400).json({ message: "Phone is required!" });
        }

        if (objData.phone) {
            objData.phone = convertToE164(objData.phone);
        }

        const conditions = [];

        if (objData.phone && objData.phone.trim() !== "") {
            conditions.push({ phone: objData.phone.trim() });
        }

        if (objData.email && objData.email.trim() !== "") {
            conditions.push({ email: objData.email.trim() });
        }

        if (conditions.length > 0) {
            const exist = await Member.findOne({ tenantRef: checkTenant?._id, $or: conditions });

            if (exist) {
                const duplicatedField = exist.phone === objData.phone ? "Phone" : exist.email === objData.email ? "Email" : "Data";

                return res.status(400).json({ message: `${duplicatedField} already exists` });
            }
        }

        if (!objData.memberId) {
            const currYear = new Date().getFullYear();
            const number = generateRandomId();
            objData.memberId = `EM${currYear}${number}`;
        }

        if (objData.password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(objData.password, salt);
            objData.password = hashedPassword;
        }

        const newData = new Member(objData);
        await newData.save();

        return res.json({ message: "Register success!" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const registerMemberV2 = async (req, res) => {
    try {
        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        let objData = { ...req.body, tenantRef: checkTenant?._id, isVerified: true };

        if (!objData.phone) {
            return res.status(400).json({ message: "Phone is required!" });
        }

        objData.phone = convertToE164(objData.phone);

        const existing = await Member.findOne({ phone: objData.phone, tenantRef: checkTenant?._id });

        if (existing?.isVerified) {
            return res.status(400).json({
                message: "You have already registered. Please log in or reset your password if needed.",
            });
        }

        if (objData.email && objData.email.trim() !== "") {
            let checkEmail = null;

            if (existing) {
                checkEmail = await Member.findOne({
                    _id: { $ne: existing?._id },
                    email: objData.email.trim(),
                });
            } else {
                checkEmail = await Member.findOne({ email: objData.email.trim(), tenantRef: checkTenant?._id });
            }

            if (checkEmail) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }

        if (objData.password && objData.password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            objData.password = await bcrypt.hash(objData.password, salt);
        } else {
            delete objData.password;
        }

        if (existing) {
            delete objData.phone;

            await Member.updateOne({ _id: existing._id }, { $set: objData });

            if (existing?.memberId) {
                const objOrder = {};

                if (objData.firstName || objData.lastName) {
                    const first = objData.firstName ? capitalizeFirstLetter(objData.firstName) : "";

                    const last = objData.lastName ? capitalizeFirstLetter(objData.lastName) : "";

                    const fullName = `${first} ${last}`.trim();

                    if (fullName) {
                        objOrder["customer.name"] = fullName;
                    }
                } else if (objData.name) {
                    objOrder["customer.name"] = capitalizeFirstLetter(objData.name);
                }

                if (req.body.phone) objOrder["customer.phone"] = req.body.phone;
                if (objData.email) objOrder["customer.email"] = objData.email;

                await Order.updateMany({ "customer.memberId": existing?.memberId }, { $set: objOrder });
            }
        } else {
            if (!objData.memberId) {
                const currYear = new Date().getFullYear();
                const number = generateRandomId();
                objData.memberId = `EM${currYear}${number}`;
            }

            const newMember = new Member(objData);
            await newMember.save();
        }

        return res.json({ message: "Register success!" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const registerMemberOtp = async (req, res) => {
    try {
        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        let objData = { ...req.body, tenantRef: checkTenant?._id };

        const memberExists = await Member.findOne({ email: objData.email, tenantRef: checkTenant?._id }).lean();

        if (memberExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        if (objData.password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(objData.password, salt);
            objData.password = hashedPassword;
        }

        const otp = generateOtp();

        objData.otp = otp;

        const newData = await MemberPending.findOneAndUpdate(
            { email: objData.email, tenantRef: checkTenant?._id },
            { $set: objData },
            { new: true, upsert: true },
        );

        if (newData && objData.email) {
            await sendVerificationRegister(newData.toObject());
        }

        return res.json({ message: "OTP sent to email" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const registerMemberTestEmail = async (req, res) => {
    try {
        let objData = req.body;

        if (!objData.email) {
            return res.status(400).json({ message: "Email is required" });
        }

        objData.otp = generateOtp();

        await sendVerificationRegister(objData);

        return res.json({ message: "OTP sent to email" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const verifyMember = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        const pending = await MemberPending.findOne({ email, tenantRef: checkTenant?._id }).lean();

        if (!pending) return res.status(400).json({ message: "Invalid email" });
        if (pending.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

        let objData = pending;

        if (!objData.memberId) {
            const currYear = new Date().getFullYear();
            const number = generateRandomId();
            objData.memberId = `EM${currYear}${number}`;
        }

        delete objData.createdAt;
        delete objData.updatedAt;

        const data = new Member(objData);
        const newData = await data.save();

        if (newData) {
            await MemberPending.deleteOne({ _id: objData._id });
        }

        return res.json({ message: "Member registered successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const checkMember = async (req, res) => {
    try {
        const { email, phone } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        let query = { email };
        if (phone) {
            query = { phone: convertToE164(phone) };
        }

        const existingMember = await Member.findOne({ ...query, tenantRef: checkTenant?._id }).lean();

        if (!existingMember) {
            return res.status(400).json({ message: "Member not found" });
        }

        return res.status(200).json({ message: "Member found" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const callbackMember = async (req, res) => {
    try {
        const { email, displayName, firstName, lastName } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        let memberData = await Member.findOne({ email, tenantRef: checkTenant?._id }).lean();

        if (!memberData) {
            const currYear = new Date().getFullYear();
            const memberId = `EM${currYear}${generateRandomId()}`;

            const created = await Member.create({
                memberId,
                name: displayName,
                firstName,
                lastName,
                email,
                phone: "",
                isGmail: true,
                tenantRef: checkTenant?._id,
            });

            memberData = created.toObject();
        }

        delete memberData.password;

        const [activeVouchers, hasOrder] = await Promise.all([
            MemberVoucher.countDocuments({
                memberRef: memberData._id,
                isUsed: { $ne: true },
                expiry: { $gt: new Date() },
            }),
            Order.exists({ "customer.memberId": memberData.memberId }),
        ]);

        const token = jwt.sign({ _id: memberData._id }, process.env.TOKEN_SECRET);

        return res.json({
            message: "Login Successful",
            accessToken: token,
            member: {
                ...memberData,
                voucher: activeVouchers || 0,
                firstWash: !hasOrder,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const forgotPasswordMember = async (req, res) => {
    try {
        const { email } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        const existingMember = await Member.findOne({ email, tenantRef: checkTenant?._id }).lean();
        if (!existingMember) {
            return res.status(400).json({ message: "Email not found" });
        }

        const otp = generateOtp();

        const updatedMember = await Member.findOneAndUpdate(
            { _id: existingMember._id },
            { $set: { otp } },
            { new: true, fields: { password: 0 } },
        );

        if (updatedMember) {
            await sendOtpForgotPassword(updatedMember.toObject());
            return res.json({ message: "OTP sent to email" });
        } else {
            return res.status(500).json({ message: "Failed to generate OTP" });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const verifyOtpForgotPasswordMember = async (req, res) => {
    try {
        const { email, phone, otp } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        let query = { email };
        if (phone) {
            query = { phone: convertToE164(phone) };
        }

        const existingMember = await Member.findOne({ ...query, tenantRef: checkTenant?._id }).lean();

        if (!existingMember) {
            return res.status(400).json({ message: "Invalid email or phone" });
        }

        if (existingMember.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        return res.json({ message: "OTP Correct" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const changeMemberPassword = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        let query = { email };
        if (phone) {
            query = { phone: convertToE164(phone) };
        }

        const existingMember = await Member.findOne({ ...query, tenantRef: checkTenant?._id }).lean();
        if (!existingMember) {
            return res.status(400).json({ message: "Member not found" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedData = await Member.updateOne({ _id: existingMember._id }, { $set: { password: hashedPassword } });

        if (updatedData.nModified === 0) {
            return res.status(400).json({ message: "Password update failed" });
        }

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const forgotPasswordMemberByToken = async (req, res) => {
    try {
        const { phone, email, baseUrl } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        const existingMember = await Member.findOne({ phone, email, tenantRef: checkTenant?._id }).lean();
        if (!existingMember) {
            return res.status(400).json({ message: "Data not found" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const fixUrl = baseUrl || "https://evewash.com";
        const resetUrl = `${fixUrl}/change-password?t=${token}`;

        const updatedMember = await Member.findOneAndUpdate(
            { _id: existingMember._id },
            {
                $set: {
                    resetToken: token,
                    resetTokenExpiry: Date.now() + 3600000,
                },
            },
            { new: true, fields: { password: 0 } },
        );

        if (updatedMember) {
            await sendUrlForgotPassword({ ...updatedMember.toObject(), resetUrl });
            return res.json({ message: "Token sent to email" });
        } else {
            return res.status(500).json({ message: "Failed to generate Token" });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const changeMemberPasswordByToken = async (req, res) => {
    try {
        const { token, password } = req.body;

        const checkTenant = await Tenant.findOne({ isEvewash: true }).lean();

        if (!checkTenant) return res.status(400).json({ message: "Tenant Evewash not found" });

        const existingMember = await Member.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
            tenantRef: checkTenant?._id,
        }).lean();

        if (!existingMember) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedData = await Member.updateOne(
            { _id: existingMember._id },
            {
                $set: {
                    password: hashedPassword,
                    resetToken: "",
                },
            },
        );

        if (updatedData.nModified === 0) {
            return res.status(400).json({ message: "Password update failed" });
        }

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
