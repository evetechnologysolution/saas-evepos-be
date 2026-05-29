import { sendTextMessage } from "../../lib/sendWhatsAppMessage.js";
import { errorResponse } from "../../utils/errorResponse.js";

export const verify = async (req, res) => {
    try {
        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "evewash_verify_123456";

        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        const isValid = mode === "subscribe" && token === VERIFY_TOKEN;

        if (!isValid) {
            return res.sendStatus(403);
        }

        return res.status(200).send(challenge);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            success: false,
            message: err.message || "Webhook verification failed",
        });
    }
};

export const greetings = async (req, res) => {
    try {
        const body = req.body;

        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (message) {
            const from = message.from;
            const text = message.text?.body;

            // console.log("Pesan masuk:", from, text);

            const content =
                `👋 Selamat datang di Evewash!

Kini pesan laundry delivery jadi lebih mudah dan praktis.

Silakan lakukan pemesanan melalui:
https://evewash.com

atau bisa klik tombol *Pesan Sekarang* di bawah 👇

✨ Pickup & delivery
✨ Cepat dan praktis
✨ Laundry tanpa ribet

Terima kasih telah menggunakan layanan Evewash 💙`

            /**
             * Trigger otomatis
             */
            if (text) {
                const result = await sendTextMessage(from, content);
                return res.status(result?.statusCode || 200).json(result);
            }

            // if (text?.toLowerCase() === "menu") {
            //     await sendTextMessage(
            //         from,
            //         "Silakan akses katalog:\nhttps://evewash.com"
            //     );
            // }
        }

        return res.status(200).json({ message: "Pesan baru" });

    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
}