import jwt from "jsonwebtoken";
import User from "../models/core/user.js";
import Member from "../models/member.js";
import "dotenv/config.js";

export const isAuth = async (req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            const data = await User.findById(decoded._id);
            if (data) {
                req.userData = {
                    _id: data._id,
                    username: data.username,
                    fullname: data.fullname,
                    role: data.role,
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
            const data = await Member.findById(decoded._id).select("-password -otp");
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
