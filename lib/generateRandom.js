import MemberVoucher from "../models/member/voucherMember.js";

const generateRandomId = (length = 10) => {
    const randomNum =
        Math.floor(Math.random() * Date.now()) + Math.floor(Math.random() * 1000000);

    // Mengubah angka menjadi string dan mengambil limit karakter pertama
    const id = randomNum.toString().slice(0, length);

    return id;
};

const generateOtp = () => {
    // Generate angka acak 6 digit
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const randomVoucherCode = (length = 10, charType = "") => {
    const characters =
        charType === "number"
            ? "0123456789"
            : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
