import nodemailer from 'nodemailer';

type SmtpError = Error & {
    code?: string;
    response?: string;
    responseCode?: number;
};

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean) => {
    if (value === undefined) return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
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
    const smtpUser = process.env.SMTP_EMAIL || process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = parseBooleanEnv(process.env.SMTP_SECURE, smtpPort === 465);
    const smtpRequireTls = parseBooleanEnv(
        process.env.SMTP_REQUIRE_TLS || process.env.SMTP_STARTTLS,
        !smtpSecure
    );
    const smtpFrom = process.env.SMTP_FROM || `"Media Envocc" <${smtpUser}>`;

    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP_EMAIL/SMTP_USER หรือ SMTP_PASSWORD/SMTP_PASS ยังไม่ได้ตั้งค่า");
    }

    if (!smtpHost || Number.isNaN(smtpPort)) {
        throw new Error("SMTP_HOST หรือ SMTP_PORT ไม่ถูกต้อง");
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        requireTLS: smtpRequireTls,
    });

    try {
        const info = await transporter.sendMail({
            from: smtpFrom,
            to,
            subject,
            text,
            html,
        });

        return info;
    } catch (error) {
        const smtpError = error as SmtpError;
        console.error('[EMAIL ERROR]', {
            code: smtpError.code,
            responseCode: smtpError.responseCode,
        });
        throw error;
    }
};
