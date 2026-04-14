# Quản Lý Phòng Khám - Backend

Đây là ứng dụng Backend cho hệ thống Quản Lý Phòng Khám, cung cấp API và xử lý nghiệp vụ.

## Công nghệ sử dụng
- **Node.js & Express (v5)**: Backend Server và Framework.
- **MySQL2**: Kết nối cơ sở dữ liệu MySQL.
- **Socket.io / ws**: Xử lý WebSockets theo thời gian thực.
- **JSONWebToken (JWT) & bcryptjs**: Cơ chế xác thực và bảo mật mật khẩu.
- **Nodemailer**: Dịch vụ gửi email.

## Cài đặt và Chạy

1. Cài đặt các thư viện phụ thuộc:
    ```bash
    npm install
    ```

2. Hãy đảm bảo bạn cấu hình các biến môi trường (như MySQL credentials, JWT secret) trong file `.env` trước khi khởi chạy.

3. Chạy server phát triển (yêu cầu cài nodemon):
    ```bash
    npm run start # Mặc định chạy `nodemon server.js`
    # Hoặc
    node server.js
    ```
