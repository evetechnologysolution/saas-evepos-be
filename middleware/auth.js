import jwt from "jsonwebtoken";
import UserMaster from "../models/core/userMaster.js";
import User from "../models/core/user.js";
import Outlet from "../models/core/outlet.js";
import Member from "../models/member/member.js";
import "dotenv/config.js";

export const isAuthMaster = async (req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

            const userMasterResult = await UserMaster.findById(decoded._id).lean();

            if (userMasterResult) {
                req.userData = {
                    _id: userMasterResult._id,
                    username: userMasterResult.username,
                    fullname: userMasterResult.fullname,
                    email: userMasterResult.email,
                    phone: userMasterResult.phone,
                    role: userMasterResult.role,
                };
            }
            next();
        } else {
            return res.status(401).json({
                status: 401,
                message: "Auth failed, access denied!",
            });
        }
    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "Auth failed, access denied!",
        });
    }
};

export const isAuth = async (req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

            const userResult = await User.findById(decoded._id).lean();

            if (userResult) {
                let outletResult = null;
                if (userResult?.tenantRef) {
                    outletResult = await Outlet.findOne({ tenantRef: userResult?.tenantRef, isPrimary: true }).lean();
                }

                req.userData = {
                    _id: userResult._id,
                    username: userResult.username,
                    fullname: userResult.fullname,
                    email: userResult.email,
                    phone: userResult.phone,
                    role: userResult.role,
                    tenantRef: userResult?.tenantRef || null,
                    outletRef: userResult?.outletRef || outletResult?._id || null,
                };
            }
            next();
        } else {
            return res.status(401).json({
                status: 401,
                message: "Auth failed, access denied!",
            });
        }
    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "Auth failed, access denied!",
        });
    }
};

export const isAuthMember = async (req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            const data = await Member.findById(decoded._id).select("-password -otp").lean();
            if (data) {
                req.memberData = data;
            }
            next();
        } else {
            return res.status(401).json({
                status: 401,
                message: "Auth failed, access denied!",
            });
        }
    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "Auth failed, access denied!",
        });
    }
};

export const isAdminOrMember = async (req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            // Bisa tambahkan logika verifikasi token jika dibutuhkan
            next();
        } else {
            return res.status(401).json({
                status: 401,
                message: "Auth failed, access denied!",
            });
        }
    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "Auth failed, access denied!",
        });
    }
};

export const isAdmin = (req, res, next) => {
    try {
        if (req.userData && (req.userData.role === "super admin" || req.userData.role === "admin")) {
            next();
        } else {
            return res.status(403).json({
                message: "Akses ditolak. Anda tidak memiliki izin admin.",
            });
        }
    } catch (error) {
        return res.status(401).json({
            message: "Auth failed",
        });
    }
};
