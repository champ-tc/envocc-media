import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Media_Envocc" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html,
        });

        console.log('[MAIL SENT]', info.messageId);
    } catch (error) {
        console.error('[EMAIL ERROR]', error);
    }
};
