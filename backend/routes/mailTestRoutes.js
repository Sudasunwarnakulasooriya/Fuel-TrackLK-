const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send-test", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.verify();

        await transporter.sendMail({
            from: `"Fuel Tracker App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "SMTP Test Email",
            text: "SMTP is working successfully.",
        });

        return res.status(200).json({
            success: true,
            message: "Test email sent successfully",
        });
    } catch (error) {
        console.error("SMTP test error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send test email",
            error: error.message,
        });
    }
});

module.exports = router;