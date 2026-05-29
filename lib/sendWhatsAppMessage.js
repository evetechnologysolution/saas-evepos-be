import axios from "axios";

const WA_API_URL = "https://graph.facebook.com/v25.0";
const PHONE_NUMBER_ID = "1111042448761012";
const WA_TOKEN = "EAAXUsCQDoR8BRj229sz56eM1NkGovRnz4sUVDmIeRUnPkSCqM7W3tB44i1nv4Ey6grgySIjyYZBKZApc6AHeWRfAMOe0LnfwvMEiuCBNvNXir2XYrSRZA5ZCGliEV2IOAfznABPzCjT3y7ms6zTIkPgUAOvDDEA4Q0K5IPJkqjjTzf7OZCTrlWQ85c3QzlAZDZD";
const BE_URL = "https://saas.evewash.com";

export const sendTextMessage = async (
    to,
    message
) => {
    try {
        const response = await axios.post(
            `${WA_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: {
                    body: message,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${WA_TOKEN}`,
                    "Content-Type":
                        "application/json",
                },
            }
        );

        return {
            success: true,
            statusCode: response.status,
            data: response.data,
        };
    } catch (err) {
        return {
            success: false,
            statusCode: err.response?.status || 500,
            message: err.response?.data || err.message,
        };
    }
};

const sendOrderMessage = async (to) => {
    try {
        const response = await axios.post(
            `${WA_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: "👋 Selamat datang di Evewash\n\nSilakan pilih layanan laundry kami."
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "pesan_sekarang",
                                    title: "Pesan Sekarang"
                                }
                            }
                        ]
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WA_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return {
            success: true,
            statusCode: response.status,
            data: response.data,
        };
    } catch (err) {
        return {
            success: false,
            statusCode: err.response?.status || 500,
            message: err.response?.data || err.message,
        };
    }
};

export const sendProductList = async (to) => {
    try {
        /**
         * Ambil product dari backend
         */
        const productResponse = await axios.get(
            `${BE_URL}/api/product/all?category=kiloan`
        );

        /**
         * Sesuaikan dengan struktur response API kamu
         */
        const products = productResponse?.data || [];

        /**
         * Manipulasi jadi rows WhatsApp
         */
        const rows = products.map((product) => ({
            id: product._id,
            title: product.name,
            description: `Rp${Number(
                product.price || 0
            ).toLocaleString("id-ID")}`,
        }));

        /**
         * Kirim interactive list WhatsApp
         */
        await axios.post(
            `${WA_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "list",
                    body: {
                        text:
                            "🧺 Silakan pilih layanan Evewash"
                    },
                    footer: {
                        text: "Evewash Laundry Delivery"
                    },
                    action: {
                        button: "Lihat Layanan",
                        sections: [
                            {
                                title: "Daftar Layanan",
                                rows,
                            },
                        ],
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${WA_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Product list berhasil dikirim");
    } catch (error) {
        console.error(
            "Gagal kirim product list:",
            error.response?.data || error.message
        );
    }
};