const nodemailer = require("nodemailer");
const dns = require('dns');

// Force Node.js to use IPv4 first for all DNS lookups to fix Render's IPv6 ENETUNREACH error
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    family: 4
});