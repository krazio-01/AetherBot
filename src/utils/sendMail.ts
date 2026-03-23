import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

const sendEmail = async (
    userEmail: string | string[],
    subject: string,
    text: string,
    html?: string,
): Promise<Transporter> => {
    try {
        if (!process.env.USER || !process.env.PASSWORD)
            throw new Error('missing email credentials in .env');

        const transporter: Transporter = nodemailer.createTransport({
            service: process.env.SERVICE || 'gmail',
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: process.env.SECURE === 'true',
            auth: {
                user: process.env.USER,
                pass: process.env.PASSWORD,
            },
        });

        const mail_configs: SendMailOptions = {
            from: `"AetherBot" <${process.env.USER}>`,
            to: userEmail,
            subject: subject,
            text: text,
            html: html,
        };

        await transporter.sendMail(mail_configs);
        return transporter;
    } catch (error) {
        console.error('Error sending email:', error instanceof Error ? error.message : error);
        throw new Error('Failed to send email');
    }
};

export default sendEmail;
