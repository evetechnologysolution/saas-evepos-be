import MemberVoucher from "../models/member/voucherMember.js";

const generateRandomId = (randomLength = 10) => {
    const max = 10 ** randomLength;

    const random = Math.floor(Math.random() * max)
        .toString()
        .padStart(randomLength, "0");

    return random;
};

export const generateRandomOrderId = (randomLength = 5) => {
    const now = new Date();

    const currYear = now.getFullYear().toString().slice(-2);
    const currMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currDate = String(now.getDate()).padStart(2, "0");

    const max = 10 ** randomLength;

    const random = Math.floor(Math.random() * max)
        .toString()
        .padStart(randomLength, "0");

    return `OR${currYear}${currMonth}${currDate}${random}`;
};

const generateOtp = () => {
    // Generate angka acak 6 digit
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const randomVoucherCode = (length = 10, charType = "") => {
    const characters = charType === "number" ? "0123456789" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }
    return code;
};

const generateVoucherCode = async (length = 10) => {
    let isUnique = false;
    let voucherCode = "";

    while (!isUnique) {
        voucherCode = randomVoucherCode(length, "number"); // Generate kode voucher baru
        const existingVoucher = await MemberVoucher.findOne({ voucherCode }); // Cek di database
        if (!existingVoucher) {
            isUnique = true; // Jika tidak ada, berarti unik
        }
    }

    return voucherCode;
};

export { generateRandomId, generateOtp, generateVoucherCode };
