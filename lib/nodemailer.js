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
{
  /* <img src="${logoUrlWhite}" alt="EvePOS Logo" width="130"> */
}

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
        replyTo: "sanusi@evetechsolution.com",
      },
      to: data.email,
      subject: "EvePOS - Register",
      html: htmlContent,
    });

    return {
      status: 200,
      message: send.response,
    };
  } catch (err) {
    return {
      status: 500,
      message: err.message,
    };
  }
};

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
        replyTo: "sanusi@evetechsolution.com",
      },
      to: data.email,
      // bcc: "evetechnologysolution@gmail.com",
      subject: "EvePOS - Forgot Password",
      html: htmlContent,
    });

    return {
      status: 200,
      message: send.response,
    };
  } catch (err) {
    return {
      status: 500,
      message: err.message,
    };
  }
};

export const sendRequestDelete = async (data) => {
  try {
    const regionParts = [
      data?.province || "",
      data?.city || "",
      data?.district || "",
      data?.subdistrict || "",
    ];

    const region = regionParts.filter((part) => part).join(", ");

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
        replyTo: "sanusi@evetechsolution.com",
      },
      to: process.env?.EMAIL_TO || "sanusi@evetechsolution.com",
      subject: "EvePOS - Permohonan Hapus Akun",
      html: htmlContent,
    };

    sendMailOptions.cc = [];

    if (process.env.EMAIL_CC) {
      sendMailOptions.cc = process.env.EMAIL_CC.split(",").map((email) =>
        email.trim(),
      );
    }

    if (sendMailOptions.cc.length === 0) {
      delete sendMailOptions.cc;
    }

    // Menambahkan bcc hanya jika ada di environment
    if (process.env.EMAIL_BCC) {
      sendMailOptions.bcc = process.env.EMAIL_BCC.split(",").map((email) =>
        email.trim(),
      ); // Support multiple addresses
    }

    const send = await transporter.sendMail(sendMailOptions);

    return {
      status: 200,
      message: send.response,
    };
  } catch (err) {
    return {
      status: 500,
      message: err.message,
    };
  }
};

export const sendRegisterPendingEmail = async (data) => {
  try {
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 0; margin: 0;">
      <div style="max-width: 700px; background: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

        <!-- HEADER -->
        <div style="background-color: #5274D9; padding: 5px; text-align: center;">
          <h1 style="color: #fff; font-size: 28px; margin: 0;">EVEPOS</h1>
          <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">
            Pendaftaran Berhasil 🎉
          </p>
        </div>

        <!-- CONTENT -->
        <div style="padding: 30px 40px; color: #333;">
          <h2 style="margin-top:0;">Halo ${data.username || ""},</h2>

          <p>Terima kasih telah mendaftar di <strong>EvePOS</strong>.</p>

          <p>Akun kamu sudah berhasil dibuat, namun <strong>belum aktif</strong> karena menunggu proses verifikasi email.</p>

          <p>Silakan cek inbox email kamu dan klik tombol verifikasi yang sudah kami kirimkan.</p>

          <div style="background:#f1f5ff; padding:15px; border-radius:8px; margin:25px 0;">
            ⏳ Link verifikasi hanya berlaku <strong>10 menit</strong>.
          </div>

          <p>Jika tidak menemukan email verifikasi:</p>
          <ul>
            <li>Cek folder spam / promotion</li>
            <li>Pastikan email yang didaftarkan benar</li>
            <li>Lakukan resend verifikasi</li>
          </ul>

          <p>Setelah verifikasi berhasil, kamu bisa langsung login dan menikmati fitur EvePOS.</p>

          <br/>

          <p>Salam sukses,</p>
          <p><strong>Tim EvePOS</strong></p>
        </div>

      </div>
    </div>
    `;

    const send = await transporter.sendMail({
      from: {
        name: "EvePOS",
        address: "sanusi@evetechsolution.com",
        replyTo: "sanusi@evetechsolution.com",
      },
      to: data.email,
      subject: "Pendaftaran Berhasil – Verifikasi Email Kamu",
      html: htmlContent,
    });

    return {
      status: 200,
      message: send.response,
    };
  } catch (err) {
    return {
      status: 500,
      message: err.message,
    };
  }
};

export const sendSubsReminderEmail = async (data) => {
  try {
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 0; margin: 0;">
      <div style="max-width: 700px; background: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

        <!-- HEADER -->
        <div style="background-color: #5274D9; padding: 5px; text-align: center;">
          <h1 style="color: #fff; font-size: 28px; margin: 0;">EVEPOS</h1>
          <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">
            Pengingat Masa Aktif Subscription
          </p>
        </div>

        <!-- CONTENT -->
        <div style="padding: 30px 40px; color: #333;">
          <h2 style="margin-top:0;">Halo ${data.username || ""},</h2>

          <p>Kami ingin menginformasikan bahwa masa aktif subscription kamu akan segera berakhir.</p>

          <div style="background:#f1f5ff; padding:18px; border-radius:8px; margin:25px 0;">
            <p style="margin:0;">📅 Tanggal berakhir:</p>
            <h3 style="margin:5px 0 10px 0;">${data.endDate}</h3>

            <p style="margin:0;">⏳ Sisa waktu:</p>
            <h2 style="margin:5px 0; color:#5274D9;">
              ${data.remainingDays} hari lagi
            </h2>
          </div>

          ${
            data.remainingDays == 3
              ? `
              <p style="color:#d32f2f; font-weight:bold;">
                ⚠️ Masa aktif subscription kamu hampir habis.
              </p>
              <p>
                Jika masa aktif berakhir, akses ke sistem akan dinonaktifkan sementara sampai subscription diperpanjang.
              </p>
              `
              : `
              <p>
                Silakan lakukan persiapan untuk perpanjangan agar layanan tetap dapat digunakan tanpa kendala.
              </p>
              `
          }

          <br/>

          <p>Terima kasih telah menggunakan <strong>EvePOS</strong>.</p>

          <br/>

          <p>Salam sukses,</p>
          <p><strong>Tim EvePOS</strong></p>
        </div>

      </div>
    </div>
    `;

    const send = await transporter.sendMail({
      from: {
        name: "EvePOS",
        address: "sanusi@evetechsolution.com",
        replyTo: "sanusi@evetechsolution.com",
      },
      to: data.email,
      subject: `Subscription Akan Berakhir dalam ${data.remainingDays} Hari`,
      html: htmlContent,
    });

    return {
      status: 200,
      message: send.response,
    };
  } catch (err) {
    return {
      status: 500,
      message: err.message,
    };
  }
};
