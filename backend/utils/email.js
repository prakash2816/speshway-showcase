const nodemailer = require("nodemailer");

/**
 * Send Email (No DB dependency — Works for DynamoDB projects)
 */
const sendEmailDynamo = async (options) => {
  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 2️⃣ Email details
    const mailOptions = {
      from: `"Speshway Showcase" <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [],
    };

    // 3️⃣ Send Email
    await transporter.sendMail(mailOptions);

    console.log("📩 Email successfully sent!");
    return true;

  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmailDynamo;
