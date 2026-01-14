export const ERROR_CONFIG = {
    INTERNAL_ERROR: {
        status: 500,
        message: "Terjadi kesalahan, silakan coba lagi."
    },

    UNAUTHORIZED: {
        status: 401,
        message: "Anda tidak memiliki akses."
    },

    FORBIDDEN: {
        status: 403,
        message: "Akses ditolak."
    },

    ACCOUNT_ALREADY_EXISTS: {
        status: 400,
        message: "Akun Anda sudah terdaftar, silakan login ulang."
    },

    DUPLICATE_DATA: {
        status: 400,
        message: "Email atau nomor HP sudah terdaftar."
    },

    DATA_NOT_FOUND: {
        status: 404,
        message: "Data tidak ditemukan."
    },

    INVALID_CREDENTIAL: {
        status: 401,
        message: "Email atau password salah."
    },

    TOKEN_REQUIRED: {
        status: 400,
        message: "Token wajib diisi."
    },

    TOKEN_INVALID: {
        status: 400,
        message: "Token tidak valid atau sudah kedaluwarsa."
    },
};
