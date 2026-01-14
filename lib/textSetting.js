// Fungsi untuk mengkapitalisasi huruf pertama dari setiap kata
export function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function convertToE164(phoneNumber) {
    let normalizedPhoneNumber = phoneNumber.trim();

    // Jika nomor telepon dimulai dengan "+", hapus tanda "+"
    if (normalizedPhoneNumber.startsWith("+")) {
        normalizedPhoneNumber = normalizedPhoneNumber.slice(1);
    }

    // Jika nomor telepon dimulai dengan "0", ganti dengan "62"
    if (normalizedPhoneNumber.startsWith("0")) {
        normalizedPhoneNumber = "62" + normalizedPhoneNumber.slice(1);
    }

    // Jika nomor sudah dimulai dengan "62", biarkan apa adanya
    // Jika tidak dimulai dengan "62", tambahkan "62"
    else if (!normalizedPhoneNumber.startsWith("62")) {
        normalizedPhoneNumber = "62" + normalizedPhoneNumber;
    }

    // return `+${normalizedPhoneNumber}`;
    return normalizedPhoneNumber;
}

export function splitName(fullName = "") {
    const parts = fullName.trim().split(" ");
    return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
    };
}