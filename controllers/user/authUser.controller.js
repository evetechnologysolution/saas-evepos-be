import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/core/user.js";

export const loginUser = async (req, res) => {
    try {
        // Chek user
        const userExist = await User.findOne({ username: req.body.username })
            .populate([
                { path: "tenantRef", select: "ownerName businessName status" }
            ]);
        if (!userExist) return res.status(400).json({ message: "User is not found" });
        if (!userExist?.isActive) return res.status(400).json({ message: "User is not active" });

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
            message: "Login Berhasil",
            accessToken: token,
            user: userWithoutPassword
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};