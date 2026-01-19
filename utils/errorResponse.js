export const errorResponse = (res, {
    statusCode = 400,
    code = "ERROR",
    message = "Terjadi kesalahan",
    errors = null
}) => {
    return res.status(statusCode).json({
        code,
        message,
        ...(errors && { errors })
    });
};
