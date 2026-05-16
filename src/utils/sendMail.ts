import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import fs from 'fs';
import path from 'path';

const deliverSmtpEmail = async (
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
): Promise<Transporter> => {
    try {
        if (!process.env.USER || !process.env.PASSWORD) throw new Error('Missing email credentials in .env');

        const transporter: Transporter = nodemailer.createTransport({
            service: process.env.SERVICE || 'gmail',
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: process.env.SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.PASSWORD,
            },
        });

        const mail_configs: SendMailOptions = {
            from: `"AetherBot" <${process.env.USER}>`,
            to: to,
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

export const sendEmail = async (
    to: string | string[],
    subject: string,
    templateFilename: string,
    variables: Record<string, string>,
) => {
    const templatePath = path.resolve(process.cwd(), 'src/templates', templateFilename);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    variables['year'] = new Date().getFullYear().toString();

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, value);
    }

    await deliverSmtpEmail(to, subject, '', htmlContent);
};
