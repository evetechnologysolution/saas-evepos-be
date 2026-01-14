import axios from "axios";

const XENDIT_URL = process.env.XENDIT_URL;
const XENDIT_KEY = process.env.XENDIT_KEY;

const convertToE164 = (phoneNumber) => {
    let normalizedPhoneNumber = phoneNumber;

    // Jika nomor telepon dimulai dengan "0", ganti dengan "62"
    if (normalizedPhoneNumber.startsWith("0")) {
        normalizedPhoneNumber = "62" + normalizedPhoneNumber.slice(1);
    }

    // Jika nomor sudah dimulai dengan "62", biarkan apa adanya
    // Jika tidak dimulai dengan "62", tambahkan "62"
    else if (!normalizedPhoneNumber.startsWith("62")) {
        normalizedPhoneNumber = "62" + normalizedPhoneNumber;
    }

    return `+${normalizedPhoneNumber}`;
}

export const generatePayment = async (data) => {
    try {
        const success = `${data?.baseUrl || process.env.FE_URL}/payment/success/${data?._id || 1}`;
        const failed = `${data?.baseUrl || process.env.FE_URL}/payment/failed/${data?._id || 1}`;
        const paymentId = data?._id || "ORD-" + Math.floor(Math.random() * Date.now()) % Math.pow(10, 10);

        let paymentData = {
            external_id: paymentId,
            amount: data.totalPrice,
            description: "Invoice for Evewash",
            invoice_duration: 3600,
            currency: "IDR",
            locale: "id",
            success_redirect_url: success,
            failure_redirect_url: failed,
            payment_methods: [
                "BNI", "BSI", "BRI", "MANDIRI", "CIMB", "PERMATA",
                "QRIS", "CREDIT_CARD", "OVO", "SHOPEEPAY", "BCA",
                // "DANA", "LINKAJA", // perlu aktivasi di akun xendit
            ],
            customer: {
                given_names: data.customer.name,
                email: data.customer.email,
                mobile_number: convertToE164(data.customer.phone),
            },
            customer_notification_preference: {
                invoice_created: [
                    "whatsapp",
                    // "email"
                ],
                invoice_paid: [
                    "whatsapp",
                    // "email"
                ]
            },
        };

        const createPaymentResponse = await axios.post(
            `${XENDIT_URL}/v2/invoices`,
            paymentData,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: XENDIT_KEY,
                },
            }
        );

        return {
            status: 200,
            invoiceUrl: createPaymentResponse.data.invoice_url
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
}

export const checkPayment = async (data) => {
    try {
        const check = await axios.get(
            `${XENDIT_URL}/v2/invoices?external_id=${data.external_id}`,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: XENDIT_KEY,
                },
            }
        );

        return {
            status: 200,
            id: check?.data[0]?.id || "",
            external_id: check?.data[0]?.external_id || "",
            amount: check?.data[0]?.amount || "",
            invoice_url: check?.data[0]?.invoice_url || "",
            statusPayment: check?.data[0]?.status || "",
            created: check?.data[0]?.created || "",
            updated: check?.data[0]?.updated || "",
            currency: check?.data[0]?.currency || "",
            payment_channel: check?.data[0]?.payment_channel || "",
            payment_destination: check?.data[0]?.payment_destination || "",
            payment_id: check?.data[0]?.payment_id || "",
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
}