import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/core/user.js";
import { sendUrlForgotPassword } from "../../lib/nodemailer.js";
import { errorResponse } from "../../utils/errorResponse.js";

export const loginUser = async (req, res) => {
    try {
        // Chek user
        const userExist = await User.findOne({ username: req.body.username })
            .populate([
                {
                    path: "tenantRef",
                    select: "ownerName businessName status",
                    populate: {
                        path: "surveyRef",
                        select: "_id",
                    },
                },
            ])
            .lean({ virtuals: true });

        if (!userExist)
            return res.status(400).json({ message: "User is not found" });
        if (!userExist?.isActive)
            return res.status(400).json({ message: "User is not active" });

        const validPassword = await bcrypt.compare(
            req.body.password,
            userExist.password,
        );
        if (!validPassword)
            return res.status(400).json({ message: "Invalid password" });

        // Create and asign a token
        const token = jwt.sign(
            { _id: userExist._id },
            process.env.TOKEN_SECRET,
            // { expiresIn: process.env.TIMEEXPIRES || "5d" }
        );

        const userWithoutPassword = userExist;
        delete userWithoutPassword.password;
        delete userWithoutPassword.resetToken;
        delete userWithoutPassword.resetTokenExpiry;

        return res.json({
            message: "Login Berhasil",
            accessToken: token,
            user: userWithoutPassword,
        });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const getMyUser = async (req, res) => {
    try {
        const userExist = await User.findOne({
            _id: req.userData._id,
            isActive: true,
        })
            .select("-password")
            .populate([
                {
                    path: "tenantRef",
                    select: "ownerName businessName status",
                    populate: {
                        path: "surveyRef",
                        select: "_id",
                    },
                },
            ])
            .lean({ virtuals: true });
        res.json({ user: userExist });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const forgotPasswordByToken = async (req, res) => {
    try {
        const { email, baseUrl } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email wajib diisi." });
        }

        // Check if the email exists in the database
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "Data tidak ditemukan." });
        }

        // Generate a new token
        const token = nanoid(64);
        const fixUrl =
            baseUrl || process.env.FE_URL || "https://saas-evepos.vercel.app";
        const resetUrl = `${fixUrl}/auth/reset-password?token=${token}`;

        // Update the member with the new OTP
        const updatedUser = await User.findOneAndUpdate(
            { _id: existingUser._id },
            {
                $set: {
                    resetToken: token,
                    resetTokenExpiry: Date.now() + 10 * 60 * 1000, // 10 menit
                },
            },
            { new: true, select: "-password" },
        ).lean();

        // Send the OTP via email if the update was successful
        if (updatedUser) {
            await sendUrlForgotPassword({ ...updatedUser, resetUrl });
            return res.json({ message: "Berhasil mengirim token." });
        } else {
            return res.status(500).json({ message: "Gagal mengirim token." });
        }
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

export const changePasswordByToken = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token)
            return res.status(400).json({ message: "Token wajib diisi." });

        if (!password)
            return res.status(400).json({ message: "Password wajib diisi." });

        // Check if the member exists
        const existingUser = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });
        if (!existingUser)
            return res
                .status(400)
                .json({ message: "Token tidak valid atau sudah kedaluwarsa." });

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedData = await User.updateOne(
            { _id: existingUser._id },
            {
                $set: {
                    password: hashedPassword,
                    resetToken: "",
                },
            },
        );

        if (updatedData.nModified === 0) {
            return res.status(400).json({ message: "Gagal ubah password." });
        }

        return res.json({ message: "Berhasil ubah password." });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
