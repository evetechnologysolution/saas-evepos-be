import axios from "axios";

const MIDTRANS_URL = process.env.MIDTRANS_URL;
const MIDTRANS_KEY = process.env.MIDTRANS_KEY;

const convertToE164 = (phoneNumber) => {
    let normalizedPhoneNumber;

    if (phoneNumber.startsWith("0")) {
        // Ganti 0 dengan 62 (kode negara Indonesia)
        normalizedPhoneNumber = "62" + phoneNumber.slice(1);
    } else if (phoneNumber.startsWith("62")) {
        normalizedPhoneNumber = phoneNumber;
    } else {
        // Menambahkan 62 jika tidak ada prefix
        normalizedPhoneNumber = "62" + phoneNumber.slice(1);
    }

    return `+${normalizedPhoneNumber}`;
};

const generatePaymentMidtrans = async (data) => {
    try {
        const success = `${data?.baseUrl || process.env.FE_URL}/payment/success/${data?._id || 1}`;
        const paymentId =
            data?._id || "ORD-" + (Math.floor(Math.random() * Date.now()) % Math.pow(10, 10));

        const paymentData = {
            transaction_details: {
                order_id: paymentId,
                gross_amount: data.totalPrice,
            },
            title: "Payment for Evewash",
            customer_required: true,
            customer_details: {
                first_name: data.customer.name,
                email: data.customer.email,
                phone: convertToE164(data.customer.phone),
                notes: "Thank you for your purchase. Please follow the instructions to pay.",
            },
            usage_limit: 1,
            expiry: {
                duration: 1,
                unit: "days",
            },
            enabled_payments: [
                "bri_va", "bni_va", "bca_va", "permata_va", "other_va",
                "credit_card", "shopeepay", "gopay"
            ],
            callbacks: {
                finish: success,
            },
        };

        const createPaymentResponse = await axios.post(
            `${MIDTRANS_URL}/v1/payment-links`,
            paymentData,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: MIDTRANS_KEY,
                },
            }
        );

        return {
            status: 200,
            invoiceUrl: createPaymentResponse.data.payment_url,
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message,
            error: err,
        };
    }
};

const checkPaymentMidtrans = async (data) => {
    try {
        const check = await axios.get(`${MIDTRANS_URL}/v1/${data.order_id}/status`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: MIDTRANS_KEY,
            },
        });

        return {
            status: 200,
            data: check,
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message,
        };
    }
};

const deletePaymentMidtrans = async (data) => {
    try {
        const check = await axios.delete(`${MIDTRANS_URL}/v1/payment-links/${data.order_id}`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: MIDTRANS_KEY,
            },
        });

        return {
            status: 200,
            data: check,
        };
    } catch (err) {
        return {
            status: 500,
            message: err.message,
        };
    }
};

export { generatePaymentMidtrans, checkPaymentMidtrans, deletePaymentMidtrans };
