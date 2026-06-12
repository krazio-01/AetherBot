import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

let transporter: Transporter | null = null;

const getTransporter = () => {
    if (!process.env.USER || !process.env.PASSWORD) throw new Error('Missing email credentials in .env');

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: process.env.SERVICE || 'gmail',
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: process.env.SECURE === 'true',
            auth: {
                user: process.env.USER,
                pass: process.env.PASSWORD,
            },
        });
    }

    return transporter;
}

const deliverSmtpEmail = async (
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
): Promise<Transporter> => {
    try {
        const mailer: Transporter = getTransporter();

        const mail_configs: SendMailOptions = {
            from: `"AetherBot" <${process.env.USER}>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        };

        await mailer.sendMail(mail_configs);
        return mailer;
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
    let htmlContent = await fs.readFile(templatePath, 'utf8');

    variables['year'] = new Date().getFullYear().toString();

    htmlContent = htmlContent.replace(/{{(.*?)}}/g, (match, variableName) => {
        const trimmedVariable = variableName.trim();
        return trimmedVariable in variables ? variables[trimmedVariable] : match;
    });

    await deliverSmtpEmail(to, subject, '', htmlContent);
};
