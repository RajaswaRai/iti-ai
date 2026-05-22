import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendPasswordResetEmail = async (toEmail: string, resetToken: string, userName: string) => {
    const resetLink = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;

    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1d4ed8; margin: 0;">ITI AI Assistant</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Sistem Manajemen Knowledge</p>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="color: #334155; font-size: 16px;">Halo <strong>${userName}</strong>,</p>
            <p style="color: #334155; line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Admin Anda. Jika Anda tidak melakukan permintaan ini, abaikan saja email ini.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Atur Ulang Kata Sandi</a>
            </div>
            
            <p style="color: #ef4444; font-size: 13px; text-align: center;">Tautan ini hanya berlaku selama <strong>15 menit</strong> untuk alasan keamanan.</p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Institut Teknologi Indonesia. Hak Cipta Dilindungi.</p>
        </div>
    </div>
    `;

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "Permintaan Reset Kata Sandi - ITI AI Assistant",
        html: htmlTemplate,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email reset password berhasil dikirim ke: ${toEmail}`);
    } catch (error) {
        console.error("Gagal mengirim email SMTP:", error);
        throw new Error("Gagal mengirim email. Pastikan konfigurasi SMTP benar.");
    }
};