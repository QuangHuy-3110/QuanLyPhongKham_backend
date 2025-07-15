const sendEmail = require("../services/email.service");

exports.sendEmailController = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Kiểm tra trường to
    if (!to || typeof to !== "string" || to.trim() === "") {
      return res.status(400).json({ message: "Địa chỉ email người nhận không hợp lệ" });
    }

    // Gọi hàm sendEmail với đối tượng content
    await sendEmail(to, { subject, text, html });
    res.status(200).json({ message: "Email đã gửi thành công!" });
  } catch (error) {
    console.error("Lỗi trong sendEmailController:", error);
    res.status(500).json({ message: "Lỗi khi gửi email", error: error.message });
  }
};