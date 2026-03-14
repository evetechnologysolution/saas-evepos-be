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

export const sendOtpForgotPassword = async (data) => {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif;">
                <div style="text-align: center; background-color: #5274D9; padding: 15px">
                    <h1 style="color: #FFFFFF">EVEWASH</h1>
                </div>

                <div style="padding: 30px;">
                    <h2>Verify Your Email Address</h2>
                    <p>Hi ${data.name},</p>
                    <p>Thank you for submitting a password reset request. Here is your OTP code <strong>${data.otp}</strong>.</p>
                    <p>Please enter the OTP code to verify your email.</p>
                    <br/>
                    <p>If you did not request this, please ignore this email.</p>
                    <br/>
                    <p>Regards,</p>
                    <p>Evewash</p>
                </div>
            </div>
        `;

        const send = await transporter.sendMail({
            from: {
                name: "Evewash",
                address: "sanusi@evetechsolution.com",
                replyTo: "sanusi@evetechsolution.com",
            },
            to: data.email,
            // bcc: "evetechnologysolution@gmail.com",
            subject: "Evewash - Forgot Password",
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
        const regionParts = [data?.province || "", data?.city || "", data?.district || "", data?.subdistrict || ""];

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
            sendMailOptions.cc = process.env.EMAIL_CC.split(",").map((email) => email.trim());
        }

        if (sendMailOptions.cc.length === 0) {
            delete sendMailOptions.cc;
        }

        // Menambahkan bcc hanya jika ada di environment
        if (process.env.EMAIL_BCC) {
            sendMailOptions.bcc = process.env.EMAIL_BCC.split(",").map((email) => email.trim()); // Support multiple addresses
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

export const sendOrderMail = async (data) => {
    try {
        const regionParts = [
            data.customer?.province || "",
            data.customer?.city || "",
            data.customer?.district || "",
            data.customer?.subdistrict || "",
        ];

        const region = regionParts.filter((part) => part).join(", ");

        let orderRows = "";

        for (let i = 0; i < data.orders.length; i++) {
            const item = data.orders[i];

            let quantity = `x ${item.qty}`;
            if (item.category === "Kiloan") {
                quantity = item.qty === 0 ? "Akan ditimbang di outlet" : `x ${item.qty} Kg`;
            }

            orderRows += `
                <tr>
                    <td>
                        <img 
                            src="${item.image}" 
                            alt="${item.name}" 
                            style="width: 50px; height: 50px; margin-right: 10px; vertical-align: middle;" 
                        />
                    </td>
                    <td>
                        ${item.name}
                        ${
                            item.variant.length > 0
                                ? (() => {
                                      let variantDetails = "";
                                      for (let j = 0; j < item.variant.length; j++) {
                                          const field = item.variant[j];
                                          variantDetails += `
                                    <span>
                                        <br />
                                        <em>${field.name}: ${field.option}</em>
                                    </span>
                                `;
                                      }
                                      return variantDetails;
                                  })()
                                : ""
                        }
                        ${item.islaundryBag ? "Laundry Bag Day:" : ""}
                    </td>
                    <td align="center">${quantity}</td>
                    <td align="center">Rp. ${numberWithCommas(item.qty * item.price)}</td>
                </tr>
            `;
        }

        const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 0; margin: 0;">
          <div style="max-width: 700px; background: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- HEADER -->
            <div style="background-color: #5274D9; padding: 5px; text-align: center;">
              <h1 style="color: #fff; font-size: 28px; letter-spacing: 1px; margin: 0;">EVEWASH</h1>
              <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px;">Laundry & Pick-Up Service</p>
            </div>
      
            <!-- CONTENT -->
            <div style="padding: 30px 40px; color: #333;">
              <p style="font-size: 16px;">Hai <strong>${data.customer.name}</strong>,</p>
              <p style="font-size: 15px; margin-bottom: 25px;">
                Pesanan Anda telah kami terima! 🚚<br/>
                Mohon tunggu untuk penjemputan oleh tim kami.
              </p>
      
              <div style="background-color: #f1f4ff; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #5274D9;">📋 Detail Pesanan</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tbody>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Order ID</td>
                        <td style="vertical-align: top;"><strong>: ${data?.orderId || "-"}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Nama</td>
                        <td style="vertical-align: top;"><strong>: ${data.customer.name}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">No. Hp</td>
                        <td style="vertical-align: top;"><strong>: ${data.customer.phone}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Wilayah</td>
                        <td style="vertical-align: top;"><strong>: ${region || "-"}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Alamat</td>
                        <td style="vertical-align: top;"><strong>: ${data?.customer?.address || "-"}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px; width:20%">Detail Alamat</td>
                        <td style="vertical-align: top;"><strong>: ${data.customer?.addressNotes || "-"}</strong></td>
                    </tr>
                    <tr>
                      <td style="vertical-align: top; padding: 4px;">Lokasi</td>
                      <td style="vertical-align: top;">
                        <strong>
                          : ${
                              data?.customer?.location?.lat && data?.customer?.location?.lng
                                  ? `<a href="https://www.google.com/maps/?q=${data?.customer?.location?.lat},${data?.customer?.location?.lng}" target="_blank" style="color:#5274D9; text-decoration:none;">Lihat di Google Maps</a>`
                                  : "Tidak tersedia"
                          }
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="vertical-align: top; padding: 4px;">Penjemputan</td>
                      <td style="vertical-align: top;"><strong>: ${
                          data?.pickupDateTime && !data?.isDropOff
                              ? `${formatDateTime(data?.pickupDateTime)} - ${formatOnlyTime(addNHour(data?.pickupDateTime, 3))} WIB`
                              : "Bawa sendiri ke outlet"
                      }</strong>
                        <span style="color:#666;">${data?.isDropOff ? "(Self DropOff)" : "(Evewash PickUp)"}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="vertical-align: top; padding: 4px;">Pengantaran</td>
                      <td style="vertical-align: top;"><strong>: ${
                          data?.selfPickup
                              ? "Diambil sendiri di outlet"
                              : data?.deliveryDate
                                ? `${formatDate(data?.deliveryDate)}, 12.00 - 16.00 WIB`
                                : "Konfirmasi sebelum antar"
                      }</strong>
                        <span style="color:#666;">${data?.selfPickup ? "(Self PickUp)" : "(Evewash Delivery)"}</span>
                      </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Catatan</td>
                        <td style="vertical-align: top;"><strong>: ${data?.notes || "-"}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Voucher</td>
                        <td style="vertical-align: top;"><strong>: Rp ${numberWithCommas(data?.voucherDiscPrice || 0)}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Diskon</td>
                        <td style="vertical-align: top;"><strong>: Rp ${numberWithCommas(data?.discountPrice || 0)}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px;">Ongkir</td>
                        <td style="vertical-align: top;"><strong>: Rp ${numberWithCommas(data?.deliveryPrice || 0)}</strong></td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding: 4px; font-size:16px; color:#5274D9;">Total Bayar</td>
                        <td style="vertical-align: top; font-size:16px;"><strong>: Rp ${numberWithCommas(data?.billedAmount || 0)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
      
              <!-- ORDER ITEMS -->
              <div>
                <h3 style="color: #5274D9;">🧺 Item Cucian</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
                  <tbody>
                    ${orderRows}
                  </tbody>
                </table>
              </div>
      
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;"/>
      
              <!-- FOOTER -->
              <div style="font-size: 13px; color: #555;">
                <p>Terima kasih atas kepercayaan Anda,</p>
                <p style="font-weight: bold; color: #5274D9;">Evewash Team</p>
                <br/>
                <div style="background-color: #f9f9f9; padding: 10px; border-radius: 6px;">
                  <p style="margin: 0 0 5px;"><strong>Hubungi Kami</strong></p>
                  <p style="margin: 0;">Email: <a href="mailto:evewashsolo@gmail.com" style="color:#5274D9;">evewashsolo@gmail.com</a></p>
                  <p style="margin: 0;">WA: <a href="https://wa.me/6285601598326" style="color:#5274D9;">0856-0159-8326</a></p>
                  <p style="margin: 5px 0 0;">Alamat: Jl. Pesanggrahan No.39F, Langenharjo, Solo Baru, Jawa Tengah 57552 (Ruko abu-abu sebelah Alfamart)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

        const sendMailOptions = {
            from: {
                name: "Evewash",
                address: "sanusi@evetechsolution.com",
                replyTo: "sanusi@evetechsolution.com",
            },
            // to: data.customer.email,
            to: process.env?.EMAIL_TO || "sanusi@evetechsolution.com",
            subject: "Evewash - Order",
            html: htmlContent,
        };

        sendMailOptions.cc = [];

        // Menambahkan cc hanya jika ada di environment
        if (data.customer.email) {
            sendMailOptions.cc.push(data.customer.email);
        }
        if (process.env.EMAIL_CC) {
            sendMailOptions.cc = process.env.EMAIL_CC.split(",").map((email) => email.trim());
        }

        if (sendMailOptions.cc.length === 0) {
            delete sendMailOptions.cc;
        }

        // Menambahkan bcc hanya jika ada di environment
        if (process.env.EMAIL_BCC) {
            sendMailOptions.bcc = process.env.EMAIL_BCC.split(",").map((email) => email.trim()); // Support multiple addresses
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

export const sendSubsExpiredEmail = async (data) => {
    try {
        const htmlContent = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f6f9fc;margin:0;padding:0;">
      <div style="max-width:700px;background:#ffffff;margin:30px auto;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">

        <div style="background-color:#5274D9;padding:5px;text-align:center;">
          <h1 style="color:#fff;margin:0;">EVEPOS</h1>
          <p style="color:#e0e7ff;font-size:14px;margin-top:5px;">
            Subscription Berakhir
          </p>
        </div>

        <div style="padding:30px 40px;color:#333;">
          <h2>Halo ${data.username},</h2>

          <p>Kami ingin memberitahukan bahwa masa langganan EvePOS kamu telah <strong>berakhir</strong>.</p>

          <div style="background:#fff4f4;padding:15px;border-radius:8px;margin:25px 0;">
            📅 Tanggal berakhir: <strong>${data.endDate}</strong>
          </div>

          <p>Saat ini beberapa fitur mungkin sudah tidak dapat digunakan hingga langganan diaktifkan kembali.</p>

          <p>Terima kasih telah menggunakan EvePOS sebagai solusi bisnis kamu.</p>

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
            subject: "Subscription EvePOS Kamu Telah Berakhir",
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

export const sendPaymentSuccessEmail = async (data) => {
    try {
        const htmlContent = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f6f9fc;margin:0;padding:0;">
      <div style="max-width:700px;background:#ffffff;margin:30px auto;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color:#22c55e;padding:18px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;">PAYMENT SUCCESS</h1>
          <p style="color:#dcfce7;font-size:14px;margin-top:5px;">
            Terima kasih, pembayaran berhasil dikonfirmasi
          </p>
        </div>
        <div style="padding:30px 40px;color:#333;">
          <h2>Halo ${data.name || "Customer"},</h2>
          <p>Pembayaran untuk layanan berikut telah <strong>berhasil</strong> kami terima.</p>
          <div style="background:#f0fdf4;padding:20px;border-radius:8px;margin:25px 0;">
            <p style="margin:6px 0;"><strong>Layanan :</strong> ${data.serviceName || "-"}</p>
          </div>
          <p>Layanan kamu sekarang sudah aktif dan dapat digunakan.</p>
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
            subject: "Pembayaran Berhasil",
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

export const sendPaymentFailedEmail = async (data) => {
    try {
        const htmlContent = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f6f9fc;margin:0;padding:0;">
      <div style="max-width:700px;background:#ffffff;margin:30px auto;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color:#ef4444;padding:18px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;">PAYMENT FAILED</h1>
          <p style="color:#fee2e2;font-size:14px;margin-top:5px;">
            Pembayaran kamu tidak dapat diproses
          </p>
        </div>
        <div style="padding:30px 40px;color:#333;">
          <h2>Halo ${data.name || "Customer"},</h2>
          <p>Mohon maaf, pembayaran untuk layanan berikut <strong>gagal</strong> kami proses.</p>
          <div style="background:#fef2f2;padding:20px;border-radius:8px;margin:25px 0;">
            <p style="margin:6px 0;"><strong>Layanan :</strong> ${data.serviceName || "-"}</p>
          </div>
          <p>Silakan coba kembali atau hubungi tim kami jika kamu membutuhkan bantuan.</p>
          <br/>
          <p>Salam,</p>
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
            subject: "Pembayaran Gagal",
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
