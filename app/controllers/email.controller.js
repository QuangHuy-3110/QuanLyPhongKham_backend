const sendEmail = require("../services/email.service");

exports.sendEmailController = async (req, res) => {
    try {
        const { to, subject, text } = req.body;
        await sendEmail(to, subject, text);
        res.status(200).json({ message: "Email đã gửi thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi gửi email", error: error.message });
    }
};

// module.exports = { sendEmailController };
