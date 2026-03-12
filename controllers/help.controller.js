import Member from "../models/member/member.js";
import { convertToE164 } from "../lib/textSetting.js";
import { sendRequestDelete } from "../lib/nodemailer.js";

export const sendEmailDelete = async (req, res) => {
    try {
        const { phone, reason = "-" } = req.body;

        // Validasi input
        if (!phone) {
            return res.status(400).json({ message: "Phone is required!" });
        }

        // Konversi nomor ke format E.164
        const formattedPhone = convertToE164(phone);

        // Cari member berdasarkan nomor telepon
        const member = await Member.findOne({ phone: formattedPhone })
            .populate([{ path: "tenantRef", select: "isEvewash" }])
            .lean();

        if (!member || !member?.isEvewash) {
            return res.status(404).json({ message: "Member not found!" });
        }

        // Kirim email penghapusan akun
        const send = await sendRequestDelete({
            ...member.toObject(),
            reason,
        });

        return res.status(send.status).json({ message: send.message });
    } catch (err) {
        console.error("Error in sendEmailDelete:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
