const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../services/email.service');  // Import sendEmail từ email.service.js (điều chỉnh đường dẫn nếu cần)
const ApiError = require('../api-error');  // Đường dẫn tùy cấu trúc

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

class AuthService {
    constructor(client) {
        this.pool = client;  // Pool kết nối MySQL
        // XÓA: Không cần tạo transporter nữa, dùng sendEmail từ service riêng
        console.log('AuthService initialized successfully!');  // Log để test
    }

    // Helper generate random code (tương tự Appointment's formatDate)
    generateRandomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }

    // Helper parse date (tương tự Appointment's formatDateToMySQL, nếu cần cho ngaysinh)
    parseDateForBackend(date) {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d)) return date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async login(username, password, role) {
        const connection = await this.pool.getConnection();
        try {
            let user;
            if (role === 'benhnhan') {
                const [rows] = await connection.query(
                    'SELECT * FROM benhnhan WHERE tendangnhapBN = ?',
                    [username]
                );
                if (rows.length === 0) {
                    throw new ApiError(404, 'Tên đăng nhập không tồn tại');
                }
                user = rows[0];
                const isMatch = await bcrypt.compare(password, user.matkhauBN);
                if (!isMatch) {
                    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
                }
                const token = jwt.sign(
                    { user_id: user.maBN, username: user.tendangnhapBN, role: 'patient' },
                    SECRET_KEY,
                    { expiresIn: '24h' }
                );
                return { token, user: { id: user.maBN, role: 'patient' } };
            } else if (role === 'bacsi') {
                const [rows] = await connection.query(
                    'SELECT * FROM bacsi WHERE maBS = ?',
                    [username]
                );
                if (rows.length === 0) {
                    throw new ApiError(404, 'Tên đăng nhập không tồn tại');
                }
                user = rows[0];
                const isMatch = await bcrypt.compare(password, user.matkhau);
                if (!isMatch) {
                    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
                }
                const userRole = user.vaiTro === 'DOCTOR' ? 'doctor' : 'admin';
                const token = jwt.sign(
                    { user_id: user.maBS, username: user.maBS, role: userRole },
                    SECRET_KEY,
                    { expiresIn: '24h' }
                );
                return { token, user: { id: user.maBS, role: userRole } };
            } else {
                throw new ApiError(400, 'Vui lòng chọn vai trò');
            }
        } catch (error) {
            console.error('Lỗi khi đăng nhập:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi đăng nhập');
        } finally {
            connection.release();
        }
    }

    async forgotPassword(username, email, role) {
        const connection = await this.pool.getConnection();
        try {
            let user;
            if (role === 'benhnhan') {
                const [rows] = await connection.query(
                    'SELECT * FROM benhnhan WHERE tendangnhapBN = ? AND emailBN = ?',
                    [username, email]
                );
                if (rows.length === 0) {
                    throw new ApiError(404, 'Tên đăng nhập hoặc email không khớp');
                }
                user = rows[0];
            } else if (role === 'bacsi') {
                const [rows] = await connection.query(
                    'SELECT * FROM bacsi WHERE maBS = ? AND emailBS = ?',
                    [username, email]
                );
                if (rows.length === 0) {
                    throw new ApiError(404, 'Tên đăng nhập hoặc email không khớp');
                }
                user = rows[0];
            } else {
                throw new ApiError(400, 'Vui lòng chọn vai trò');
            }

            const code = this.generateRandomCode();
            const hashedPassword = await bcrypt.hash(code, 10);
            
            // Update password
            if (role === 'benhnhan') {
                user.ngaysinhBN = this.parseDateForBackend(user.ngaysinhBN);
                await connection.query(
                    'UPDATE benhnhan SET matkhauBN = ?, ngaysinhBN = ? WHERE maBN = ?',
                    [hashedPassword, user.ngaysinhBN, user.maBN]
                );
            } else {
                user.ngaysinhBS = this.parseDateForBackend(user.ngaysinhBS);
                await connection.query(
                    'UPDATE bacsi SET matkhau = ?, ngaysinhBS = ? WHERE maBS = ?',
                    [hashedPassword, user.ngaysinhBS, user.maBS]
                );
            }

            // SỬA: Gọi sendEmail từ service riêng (không cần transporter)
            const content = {
                subject: 'Mật Khẩu Mới Cho Tài Khoản Của Bạn',
                html: `
                    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #007bff; padding: 20px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 24px;">Đặt Lại Mật Khẩu</h1>
                        </div>
                        <div style="padding: 30px; text-align: center;">
                            <p>Kính gửi ${role === 'benhnhan' ? user.hotenBN : user.tenBS},</p>
                            <p>Bạn đã yêu cầu đặt lại mật khẩu. Mật khẩu mới của bạn là:</p>
                            <div style="display: inline-block; background-color: #f8f9fa; padding: 10px 20px; font-size: 24px; font-weight: bold; letter-spacing: 2px; border: 1px solid #e0e0e0; border-radius: 5px; margin: 20px 0;">${code}</div>
                            <p>Vui lòng sử dụng mật khẩu này để đăng nhập và đổi lại mật khẩu nếu cần.</p>
                        </div>
                        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 14px; color: #666;">
                            <p>Trân trọng,<br>Phòng Khám</p>
                        </div>
                    </div>
                `,
                text: `Kính gửi ${role === 'benhnhan' ? user.hotenBN : user.tenBS},\n\nBạn đã yêu cầu đặt lại mật khẩu. Mật khẩu mới: ${code}\n\nTrân trọng, Phòng Khám`  // Fallback text nếu cần
            };

            await sendEmail(email, content);  // Gọi service email

            return { message: 'Mật khẩu đã được gửi đến email của bạn!' };
        } catch (error) {
            console.error('Lỗi khi đặt lại mật khẩu:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi đặt lại mật khẩu');
        } finally {
            connection.release();
        }
    }
}

module.exports = AuthService;