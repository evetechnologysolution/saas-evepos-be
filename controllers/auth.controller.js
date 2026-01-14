import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/core/user.js";
import Member from "../models/member.js";
import MemberPending from "../models/memberPending.js";
import MemberVoucher from "../models/voucherMember.js";
import Order from "../models/order.js";
import { convertToE164, capitalizeFirstLetter } from "../lib/textSetting.js";
import { generateRandomId, generateOtp } from "../lib/generateRandom.js";
import { sendVerificationRegister, sendOtpForgotPassword, sendUrlForgotPassword } from "../lib/nodemailer.js";

export const loginUser = async (req, res) => {
    try {
        // Chek user
        const userExist = await User.findOne({ username: req.body.username, isActive: true });
        if (!userExist) return res.status(400).json({ message: "User is not found" });
        if (!userExist.isActive) return res.status(400).json({ message: "User is not active" });

        const validPassword = await bcrypt.compare(req.body.password, userExist.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid password" });

        // Create and asign a token
        const token = jwt.sign(
            { _id: userExist._id },
            process.env.TOKEN_SECRET,
            // { expiresIn: process.env.TIMEEXPIRES || "5d" }
        );

        const userWithoutPassword = userExist.toObject();
        delete userWithoutPassword.password;

        return res.json({
            message: "Login Successful",
            accessToken: token,
            user: userWithoutPassword
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getMyUser = async (req, res) => {
    try {
        const userExist = await User.findOne({ _id: req.userData._id, isActive: true }).select("-password");
        res.json({ user: userExist });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getMyMember = async (req, res) => {
    try {
        const memberExist = await Member.findOne({ _id: req.memberData._id }).select("-password -otp -resetToken -resetTokenExpiry");

        if (!memberExist) {
            return res.status(400).json({ message: "Member not found" });
        }

        const checkVoucher = await MemberVoucher.find({ member: req.memberData._id, isUsed: { $ne: true }, expiry: { $gt: new Date() } });

        res.json({
            user: {
                ...memberExist.toObject(),
                voucher: checkVoucher.length || 0
            }
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

        const memberExist = await Member.findOne(query);
        if (!memberExist) return res.status(400).json({ message: "Member not found" });

        const validPassword = await bcrypt.compare(req.body.password, memberExist.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid password" });

        const checkVoucher = await MemberVoucher.find({ member: memberExist._id, isUsed: { $ne: true }, expiry: { $gt: new Date() } });

        const token = jwt.sign(
            { _id: memberExist._id },
            process.env.TOKEN_SECRET,
            // { expiresIn: process.env.TIMEEXPIRES || "5d" }
        );

        const memberWithoutPassword = memberExist.toObject();
        delete memberWithoutPassword.password;

        return res.json({
            message: "Login Successful",
            accessToken: token,
            member: {
                ...memberWithoutPassword,
                voucher: checkVoucher.length || 0
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const loginMemberOtp = async (req, res) => {
    try {
        // Cek apakah member sudah verifikasi 
        // Jika belum, kirim otp buat verifikasi
        const pendingData = await MemberPending.findOne({ email: req.body.email });
        if (pendingData) {
            const otp = generateOtp();

            const objData = Object.assign(pendingData, { otp });

            const newData = await MemberPending.findOneAndUpdate(
                { email: objData.email },
                { $set: objData },
                { new: true, upsert: true }
            );
            if (newData && objData.email) {
                await sendVerificationRegister(newData.toObject());
            }
            return res.status(400).json({ message: "Not verified. OTP sent to email" });
        }

        const memberExist = await Member.findOne({ email: req.body.email });
        if (!memberExist) return res.status(400).json({ message: "Member not found" });

        const validPassword = await bcrypt.compare(req.body.password, memberExist.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign(
            { _id: memberExist._id },
            process.env.TOKEN_SECRET,
            // { expiresIn: process.env.TIMEEXPIRES || "5d" }
        );

        const memberWithoutPassword = memberExist.toObject();
        delete memberWithoutPassword.password;

        return res.json({
            message: "Login Successful",
            accessToken: token,
            member: memberWithoutPassword
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const registerMember = async (req, res) => {
    try {
        let objData = req.body;
        if (objData.phone) {
            objData.phone = convertToE164(objData.phone);
        }

        const memberExists = await Promise.resolve(
            Member.findOne({ phone: objData.phone }),
        );

        if (memberExists) {
            return res.status(400).json({ message: "Phone already exists" });
        }

        if (!objData.memberId) {
            const currYear = new Date().getFullYear();
            const number = generateRandomId();
            objData = Object.assign(objData, { memberId: `EM${currYear}${number}` });
        }

        if (objData.password) {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(objData.password, salt);
            objData = Object.assign(objData, { password: hashedPassword });
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
        let objData = { ...req.body, isVerified: true };

        // Normalisasi phone
        if (objData.phone) {
            objData.phone = convertToE164(objData.phone);
        }

        const existing = await Member.findOne({ phone: objData.phone });

        if (existing?.isVerified) {
            return res.status(400).json({ message: "You have already registered. Please log in or reset your password if needed." });
        }

        // Hash password jika diberikan
        if (objData.password && objData.password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            objData.password = await bcrypt.hash(objData.password, salt);
        } else {
            delete objData.password; // Hindari menimpa password lama dengan kosong
        }

        if (existing) {
            delete objData.phone; // Buang phone agar tidak mengupdate field ini

            await Member.updateOne({ _id: existing._id }, { $set: objData });

            if (existing?.memberId) {
                const objOrder = {};
                // Jika ada firstName / lastName, gabungkan menjadi name
                if (objData.firstName || objData.lastName) {
                    const first = objData.firstName ? capitalizeFirstLetter(objData.firstName) : "";
                    const last = objData.lastName ? capitalizeFirstLetter(objData.lastName) : "";
                    const fullName = `${first} ${last}`.trim();
                    if (fullName) {
                        objOrder["customer.name"] = fullName;
                    }
                } else if (objData.name) {
                    // fallback: gunakan field name langsung
                    objOrder["customer.name"] = capitalizeFirstLetter(objData.name);
                }
                if (req.body.phone) objOrder["customer.phone"] = req.body.phone;
                if (req.body.phone) objOrder["customer.phone"] = req.body.phone;
                if (objData.email) objOrder["customer.email"] = objData.email;
                await Order.updateMany(
                    { "customer.memberId": existing?.memberId },
                    {
                        $set: objOrder
                    }
                );
            }

        } else {
            // Buat memberId jika belum ada
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
        let objData = req.body;

        const memberExists = await Promise.resolve(
            Member.findOne({ email: objData.email }),
        );

        if (memberExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        if (objData.password) {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(objData.password, salt);
            objData = Object.assign(objData, { password: hashedPassword });
        }

        const otp = generateOtp();

        objData = Object.assign(objData, { otp });

        const newData = await MemberPending.findOneAndUpdate(
            { email: objData.email },
            { $set: objData },
            { new: true, upsert: true }
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

        objData = Object.assign(objData, { otp: generateOtp() });

        await sendVerificationRegister(objData);

        return res.json({ message: "OTP sent to email" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const verifyMember = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const pending = await MemberPending.findOne({ email });
        if (!pending) return res.status(400).json({ message: "Invalid email" });

        if (pending.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

        let objData = pending.toObject();

        if (!objData.memberId) {
            const currYear = new Date().getFullYear();
            const number = generateRandomId();
            objData = Object.assign(objData, { memberId: `EM${currYear}${number}` });
        }
        delete objData.date;

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

        let query = { email };
        if (phone) {
            query = { phone: convertToE164(phone) };
        }

        // Check if the member exists
        const existingMember = await Member.findOne(query);

        if (!existingMember) {
            return res.status(400).json({ message: "Member not found" });
        }

        return res.status(200).json({ message: "Member found" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const forgotPasswordMember = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists in the database
        const existingMember = await Member.findOne({ email });
        if (!existingMember) {
            return res.status(400).json({ message: "Email not found" });
        }

        // Generate a new OTP
        const otp = generateOtp();

        // Update the member with the new OTP
        const updatedMember = await Member.findOneAndUpdate(
            { _id: existingMember._id },
            { $set: { otp } },
            { new: true, fields: { password: 0 } } // Exclude password from the response
        );

        // Send the OTP via email if the update was successful
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

        let query = { email };
        if (phone) {
            query = { phone: convertToE164(phone) };
        }

        // Check if the member exists
        const existingMember = await Member.findOne(query);

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
        let query = { email };
        if (phone) {
            query = { phone: convertToE164(phone) };
        }

        // Check if the member exists
        const existingMember = await Member.findOne(query);
        if (!existingMember) {
            return res.status(400).json({ message: "Member not found" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedData = await Member.updateOne(
            query,
            { $set: { password: hashedPassword } }
        );

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
        const { email, baseUrl } = req.body;

        // Check if the email exists in the database
        const existingMember = await Member.findOne({ email });
        if (!existingMember) {
            return res.status(400).json({ message: "Email not found" });
        }

        // Generate a new token
        const token = crypto.randomBytes(32).toString("hex");
        const fixUrl = baseUrl || "https://evewash.com";
        const resetUrl = `${fixUrl}/change-password?t=${token}`;

        // Update the member with the new OTP
        const updatedMember = await Member.findOneAndUpdate(
            { _id: existingMember._id },
            {
                $set: {
                    resetToken: token,
                    resetTokenExpiry: Date.now() + 3600000 // Berlaku 1 jam
                }
            },
            { new: true, fields: { password: 0 } } // Exclude password from the response
        );

        // Send the OTP via email if the update was successful
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

        // Check if the member exists
        const existingMember = await Member.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!existingMember) return res.status(400).json({ message: "Invalid or expired token" });

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedData = await Member.updateOne(
            { _id: existingMember._id },
            {
                $set: {
                    password: hashedPassword,
                    resetToken: ""
                }
            }
        );

        if (updatedData.nModified === 0) {
            return res.status(400).json({ message: "Password update failed" });
        }

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};