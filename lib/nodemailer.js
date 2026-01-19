import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// const logoUrlWhite = "https://res.cloudinary.com/ddch2bsmk/image/upload/v1718795022/tumurun/tumurun_logo_white.png";
{/* <img src="${logoUrlWhite}" alt="EvePOS Logo" width="130"> */ }

export const sendVerificationRegister = async (data) => {
    try {
        const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 0; margin: 0;">
            <div style="max-width: 700px; background: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
                <!-- HEADER -->
                <div style="background-color: #5274D9; padding: 5px; text-align: center;">
                    <h1 style="color: #fff; font-size: 28px; letter-spacing: 1px; margin: 0;">EVEPOS</h1>
                    <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">Verify Your Email Address</p>
                </div>
        
                <!-- CONTENT -->
                <div style="padding: 30px 40px; color: #333;">
                    <p>Halo, terima kasih telah mendaftar sebagai tenant kami.</p>
                    <p>Hanya satu langkah lagi sebelum kamu dapat menikmati berbagai fitur gratis EvePOS selama 14 hari. Sebelum itu, kamu juga bisa lho langsung berlangganan paket aplikasi wirausaha EvePOS untuk akses fitur yang lebih lengkap dan tidak dibatasi waktu selama 14 hari saja.</p>
                    <p>Untuk menyelesaikan proses registrasi, silakan <strong>klik tautan berikut</strong> <a href=${data.verifyUrl}>verifikasi</a></p>
                    <br/>
                    <p>Catatan:</p>
                    <p>Verifikasi diatas hanya berlaku <strong>10 menit</strong> sejak email tersebut dikirim</p>
                    <br/>
                    <p>Jika ada pertanyaan atau informasi yang ingin kamu sampaikan, silakan menghubungi tim support.</p>
                    <p>Terima Kasih</p>
                    <br/>
                    <p>Salam,</p>
                    <p>EvePOS</p>
                </div>
            </div>
        </div>
        `;

        const send = await transporter.sendMail({
            from: {
                name: "EvePOS",
                address: "sanusi@evetechsolution.com",
                replyTo: "sanusi@evetechsolution.com"
            },
            to: data.email,
            subject: "EvePOS - Register",
            html: htmlContent,
        });

        return {
            status: 200,
            message: send.response
        };

    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
}

export const sendUrlForgotPassword = async (data) => {
    try {
        const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 0; margin: 0;">
                <div style="max-width: 700px; background: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                    <!-- HEADER -->
                    <div style="background-color: #5274D9; padding: 5px; text-align: center;">
                        <h1 style="color: #fff; font-size: 28px; letter-spacing: 1px; margin: 0;">EVEPOS</h1>
                        <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">Forgot Password</p>
                    </div>

                    <!-- CONTENT -->
                    <div style="padding: 30px 40px; color: #333;">
                        <h2>Lupa Password</h2>
                        <p>Hai ${data?.name || data?.fullname},</p>
                        <p>Terima kasih telah mengajukan permintaan lupa password. Untuk mengubah password silakan klik link berikut: <a href=${data.resetUrl}>Ubah Password</a>.</p>
                        <p>Jika Anda tidak mengajukan permintaan lupa password, harap abaikan email ini.</p>
                        <br/>
                        <p>Salam,</p>
                        <p>EvePOS</p>
                    </div>
                </div>
            </div>
        `;

        const send = await transporter.sendMail({
            from: {
                name: "EvePOS",
                address: "sanusi@evetechsolution.com",
                replyTo: "sanusi@evetechsolution.com"
            },
            to: data.email,
            // bcc: "evetechnologysolution@gmail.com",
            subject: "EvePOS - Forgot Password",
            html: htmlContent,
        });

        return {
            status: 200,
            message: send.response
        };

    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
}

export const sendRequestDelete = async (data) => {
    try {
        const regionParts = [
            data?.province || "",
            data?.city || "",
            data?.district || "",
            data?.subdistrict || "",
        ];

        const region = regionParts.filter(part => part).join(", ");

        const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 0; margin: 0;">
                <div style="max-width: 700px; background: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                    <!-- HEADER -->
                    <div style="background-color: #5274D9; padding: 5px; text-align: center;">
                        <h1 style="color: #fff; font-size: 28px; letter-spacing: 1px; margin: 0;">EVEPOS</h1>
                        <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">Request Delete Account</p>
                    </div>

                    <div style="padding: 30px;">
                        <p>Berikut data member yang mengajukan permohohan hapus akun:</p>
                        <div>
                            <p>
                                <span>Member ID :</span><br />
                                <em style="font-weight: bold;">${data?.memberId || "-"}</em>
                            </p>
                            <p>
                                <span>Nama :</span><br />
                                <em style="font-weight: bold;">${data?.name || "-"}</em>
                            </p>
                            <p>
                                <span>No. Hp :</span><br />
                                <em style="font-weight: bold;">${data?.phone || "-"}</em>
                            </p>
                            <p>
                                <span>Wilayah :</span><br />
                                <em style="font-weight: bold;">${region || "-"}</em >
                            </p >
                            <p>
                                <span>Alamat :</span><br />
                                <em style="font-weight: bold;">${data?.address || "-"}</em>
                            </p>
                            <p>
                                <span>Alasan Hapus Akun :</span><br />
                                <em style="font-weight: bold;">${data?.reason || "-"}</em>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const sendMailOptions = {
            from: {
                name: "EvePOS",
                address: "sanusi@evetechsolution.com",
                replyTo: "sanusi@evetechsolution.com"
            },
            to: process.env?.EMAIL_TO || "sanusi@evetechsolution.com",
            subject: "EvePOS - Permohonan Hapus Akun",
            html: htmlContent,
        };

        sendMailOptions.cc = [];

        if (process.env.EMAIL_CC) {
            sendMailOptions.cc = process.env.EMAIL_CC.split(',').map(email => email.trim());
        }

        if (sendMailOptions.cc.length === 0) {
            delete sendMailOptions.cc;
        }

        // Menambahkan bcc hanya jika ada di environment
        if (process.env.EMAIL_BCC) {
            sendMailOptions.bcc = process.env.EMAIL_BCC.split(',').map(email => email.trim()); // Support multiple addresses
        }

        const send = await transporter.sendMail(sendMailOptions);

        return {
            status: 200,
            message: send.response
        };

    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
}