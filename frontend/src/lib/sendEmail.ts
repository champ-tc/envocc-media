import nodemailer from 'nodemailer';

type SmtpError = Error & {
    code?: string;
    response?: string;
    responseCode?: number;
};

export const sendEmail = async ({
    to,
    subject,
    html,
    text,
}: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}) => { 
    const smtpUser = process.env.SMTP_EMAIL;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP_EMAIL หรือ SMTP_PASSWORD ยังไม่ได้ตั้งค่า");
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // ใช้ STARTTLS
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        requireTLS: true,
    });

    try {
        const info = await transporter.sendMail({
            from: `"Media Envocc" <${smtpUser}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('[MAIL SENT]', info.messageId);
        return info;
    } catch (error) {
        const smtpError = error as SmtpError;
        console.error('[EMAIL ERROR]', {
            code: smtpError.code,
            responseCode: smtpError.responseCode,
            response: smtpError.response,
            message: smtpError.message,
        });
        throw error;
    }
};
