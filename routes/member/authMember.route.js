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

router.get("/my-account", isAuthMember, getMyMember);
router.post("/login", loginMember);
router.post("/register", registerMember);
router.post("/register/v2", registerMemberV2);
router.post("/register/test", registerMemberTestEmail);
router.post("/register/verify", verifyMember);
router.post("/check", checkMember);
router.post("/callback", callbackMember);
router.post("/forgot-password", forgotPasswordMember);
router.post("/forgot-password-verify", verifyOtpForgotPasswordMember);
router.post("/change-password", changeMemberPassword);
router.post("/v2/forgot-password", forgotPasswordMemberByToken);
router.post("/v2/change-password", changeMemberPasswordByToken);

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
        // failureRedirect: `${isProduction ? process.env.WEB_URL : process.env.WEB_URL_DEV}/login`,
        failureRedirect: `${process.env.WEB_URL}/login`,
    }),
    (req, res) => {
        // res.redirect(`${isProduction ? process.env.WEB_URL : process.env.WEB_URL_DEV}/dashboard?gm=1&t=${req.user.token}`);
        res.redirect(`${process.env.WEB_URL}/dashboard?gm=1&t=${req.user.token}`);
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
