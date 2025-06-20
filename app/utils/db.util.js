require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

// Kiểm tra cấu hình cơ sở dữ liệu
if (!config.db || !config.db.host || !config.db.user || !config.db.database) {
    throw new Error('Cấu hình cơ sở dữ liệu không đầy đủ. Vui lòng kiểm tra tệp config.');
}

// Thiết lập pool với các giá trị mặc định
const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit || 10, // Giá trị mặc định
    queueLimit: config.db.queueLimit || 0
});

// Kiểm tra kết nối ban đầu
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Kết nối MySQL thành công!');
        connection.release();
    } catch (error) {
        console.error('Lỗi khi kết nối MySQL:', error.message);
        throw error;
    }
})();

module.exports = pool;