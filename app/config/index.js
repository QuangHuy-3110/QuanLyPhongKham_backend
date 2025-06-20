
const config = {
    app: {
        port: process.env.PORT || 3000, // Cổng mặc định là 3000 nếu không có biến môi trường PORT
    },
    db: {
        host: process.env.MYSQL_HOST || 'localhost', // Địa chỉ host MySQL
        user: process.env.MYSQL_USER || 'root',      // Tên người dùng MySQL
        password: process.env.MYSQL_PASSWORD || '1', // Mật khẩu MySQL
        database: process.env.MYSQL_DATABASE || 'ql_phongkham', // Tên cơ sở dữ liệu
        connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10,// Giới hạn kết nối (dùng cho pool)
        queueLimit: process.env.DB_QUEUE_LIMIT || 0 
    },

};

module.exports = config;