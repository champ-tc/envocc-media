import nodemailer from 'nodemailer';

export const sendEmail = async ({
    to,
    subject,
    html,
    text, // 👈 เพิ่มตรงนี้
}: {
    to: string;
    subject: string;
    html: string;
    text?: string; // 👈 และตรงนี้ กำหนดให้เป็น optional ก็ได้
}) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Media Envocc" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            text, // 👈 เพิ่มในที่ส่งจริงด้วย
            html,
        });

        console.log('[MAIL SENT]', info.messageId);
    } catch (error) {
        console.error('[EMAIL ERROR]', error);
    }
};
