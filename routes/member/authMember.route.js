import express from "express";
import passport from "passport";
import { MongoClient } from "mongodb";
import { isAuthMember } from "../../middleware/auth.js";
import {
    getMyMember,
    loginMember,
    registerMember,
    registerMemberV2,
    registerMemberTestEmail,
    verifyMember,
    checkMember,
    callbackMember,
    forgotPasswordMember,
    verifyOtpForgotPasswordMember,
    changeMemberPassword,
    forgotPasswordMemberByToken,
    changeMemberPasswordByToken,
} from "../../controllers/member/authMember.controller.js";

const router = express.Router();

router.get("/member/my-account", isAuthMember, getMyMember);
router.post("/member/login", loginMember);
router.post("/member/register", registerMember);
router.post("/member/register/v2", registerMemberV2);
router.post("/member/register/test", registerMemberTestEmail);
router.post("/member/register/verify", verifyMember);
router.post("/member/check", checkMember);
router.post("/member/callback", callbackMember);
router.post("/member/forgot-password", forgotPasswordMember);
router.post("/member/forgot-password-verify", verifyOtpForgotPasswordMember);
router.post("/member/change-password", changeMemberPassword);
router.post("/member/v2/forgot-password", forgotPasswordMemberByToken);
router.post("/member/v2/change-password", changeMemberPasswordByToken);

const isProduction = process.env.NODE_ENV === "production";

// Route for initiating Google login
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    }),
);

// Callback route for Google
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${isProduction ? process.env.WEB_URL : process.env.WEB_URL_DEV}/login`,
    }),
    (req, res) => {
        res.redirect(`${isProduction ? process.env.WEB_URL : process.env.WEB_URL_DEV}/dashboard?gm=1&t=${req.user.token}`);
    },
);

// Google success route
router.get("/google/success", (req, res) => {
    if (!req.user) {
        return res.status(400).json({ message: "Authentication failed!" });
    }
    return res.json({ message: "Authentication successful!", user: req.user });
});

// Google failed route
router.get("/google/failed", (req, res) => {
    return res.status(400).json({ message: "Authentication failed!" });
});

// Logout route
router.get("/logout", async (req, res) => {
    return res.status(200).json({ message: "Logout successful" });
});

router.get("/logout/v2", async (req, res) => {
    if (req.logout) {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "Logout failed", error: err });
            }

            req.session.destroy(async (err) => {
                if (err) {
                    return res.status(500).json({ message: "Failed to destroy session", error: err });
                }

                const client = await MongoClient.connect(process.env.DB_CONNECTION);
                const db = client.db();
                const collection = db.collection("sessions");

                await collection.deleteOne({ _id: req.sessionID });

                res.clearCookie("connect.sid", { path: "/" });

                return res.json({ message: "Logout successful" });
            });
        });
    } else {
        req.session.destroy(async (err) => {
            if (err) {
                return res.status(500).json({ message: "Failed to destroy session", error: err });
            }

            const client = await MongoClient.connect(process.env.DB_CONNECTION);
            const db = client.db();
            const collection = db.collection("sessions");

            await collection.deleteOne({ _id: req.sessionID });

            res.clearCookie("connect.sid", { path: "/" });

            return res.json({ message: "Logout successful" });
        });
    }
});

export default router;
