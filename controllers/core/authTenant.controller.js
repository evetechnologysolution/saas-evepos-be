import mongoose from "mongoose";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Pending from "../../models/core/tenantPending.js";
import Tenant from "../../models/core/tenant.js";
import User from "../../models/core/user.js";
import { convertToE164 } from "../../lib/textSetting.js";
import { sendVerificationRegister } from "../../lib/nodemailer.js";
import { ERROR_CONFIG } from "../../utils/errorMessages.js";

export const registerTenant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let objData = req.body;

        if (objData.phone) {
            objData.phone = convertToE164(objData.phone);
        }

        // cek existing dalam transaction
        const dataExists = await Tenant.findOne(
            {
                $or: [
                    { email: objData.email },
                    { phone: objData.phone },
                ],
            },
            null,
            { session }
        );

        if (dataExists) {
            throw new Error("ACCOUNT_ALREADY_EXISTS");
        }

        const userExists = await User.findOne(
            { username: objData?.username },
            null,
            { session }
        );

        if (userExists) {
            throw new Error("USERNAME_ALREADY_EXISTS");
        }

        // Hash password
        let hashedPassword;
        if (objData.password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(objData.password, salt);
        }

        // Generate token
        const token = nanoid(64);
        const fixUrl = objData?.baseUrl || process.env.FRONTEND_URL || "https://evepos-web.vercel.app";
        const verifyUrl = `${fixUrl}/tenant/register-verify?t=${token}`;

        // Cek pending
        let pending = await Pending.findOne(
            {
                $or: [
                    { email: objData.email },
                    { phone: objData.phone },
                ],
            },
            null,
            { session }
        );

        if (!pending) {
            // REGISTER BARU → save()
            pending = new Pending({
                username: objData.username,
                email: objData.email,
                phone: objData.phone,
                password: hashedPassword,
                token,
                tokenExpiry: Date.now() + 10 * 60 * 1000,
            });

            await pending.save({ session });
        } else {
            // RESEND / UPDATE → update lalu save()
            pending.password = hashedPassword;
            pending.token = token;
            pending.tokenExpiry = Date.now() + 10 * 60 * 1000;

            await pending.save({ session });
        }

        if (pending?.email) {
            await sendVerificationRegister({
                ...pending.toObject(),
                verifyUrl,
            });
        }

        await session.commitTransaction();

        return res.json({
            message: "Register success!",
            user: pending
        });

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                code: "DUPLICATE_KEY",
                field,
                message: `${field} already exists`,
            });
        }

        const error = ERROR_CONFIG[err.message] || ERROR_CONFIG.INTERNAL_ERROR;

        return res.status(error.status).json({
            code: err.message,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};

export const verifyRegisterTenant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const objData = req.body;

        if (!objData?.token) {
            throw new Error("TOKEN_REQUIRED");
        }

        // Ambil pending tenant
        const existingData = await Pending.findOne(
            { token: objData?.token, tokenExpiry: { $gt: Date.now() } },
            null,
            { session }
        ).lean();

        if (!existingData) {
            throw new Error("TOKEN_INVALID");
        }

        const _tenantId = new mongoose.Types.ObjectId();

        const newTenant = new Tenant({
            ...existingData,
            _id: _tenantId,
            createdAt: undefined,
            updatedAt: undefined,
            status: "pending"
        });

        const newUser = new User({
            ...existingData,
            _id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            tenantRef: _tenantId,
            role: "owner"
        });

        // Save in parallel
        const promises = [
            newTenant.save({ session }),
            newUser.save({ session }),
            Pending.deleteOne({ _id: existingData?._id }, { session }),
        ];

        const [tenantResult, userResult] = await Promise.all(promises);

        // Create and asign a token
        const jwtToken = jwt.sign(
            { _id: userResult?._id },
            process.env.TOKEN_SECRET,
            // { expiresIn: process.env.TIMEEXPIRES || "5d" }
        );

        const userWithoutPassword = userResult.toObject();
        delete userWithoutPassword.password;

        // Commit transaction
        await session.commitTransaction();

        const result = {
            message: "Verifikasi Berhasil",
            accessToken: jwtToken,
            user: {
                ...userWithoutPassword,
                tenantRef: {
                    _id: tenantResult?._id,
                    ownerName: tenantResult?.ownerName,
                    businessName: tenantResult?.businessName,
                    status: tenantResult?.status
                }
            }
        }

        return res.json(result);
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                code: "DUPLICATE_KEY",
                field,
                message: `${field} already exists`,
            });
        }

        const error = ERROR_CONFIG[err.message] || ERROR_CONFIG.INTERNAL_ERROR;

        return res.status(error.status).json({
            code: err.message,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};