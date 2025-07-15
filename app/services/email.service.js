const nodemailer = require("nodemailer");
require("dotenv").config();

// Cấu hình transporter cho Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "quanghuy.0511204@gmail.com",
    pass: process.env.EMAIL_PASS || "cgyc gxuq dpne hxlx",
  },
});

// Hàm gửi email
const sendEmail = async (to, content) => {
  try {
    // Kiểm tra trường to
    if (!to || typeof to !== "string" || to.trim() === "") {
      throw new Error("No recipients defined");
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || "quanghuy.0511204@gmail.com",
      to: to.trim(),
      subject: content.subject || "No Subject",
      text: content.text || "",
      html: content.html || "", // Thêm hỗ trợ nội dung HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email gửi thành công:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

// Kiểm tra kết nối SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Lỗi kết nối SMTP:", error);
  } else {
    console.log("✅ Kết nối SMTP sẵn sàng");
  }
});

module.exports = sendEmail;