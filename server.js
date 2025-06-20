const app = require('./app');

require('dotenv').config(); // Tải biến môi trường trước
const config = require('./app/config');
const pool = require('./app/utils/db.util');

async function startServer() {
    try {
        await pool.execute('SELECT 1'); // Truy vấn thử để kiểm tra kết nối Không cần kiểm tra kết nối vì db.util.js đã làm
        const port = config.app.port || 3000; // Giá trị cổng mặc định
        app.listen(port, () => {
            console.log(`Server chạy trên cổng ${port}`);
        });
    } catch (error) {
        console.error('Lỗi khi khởi động server:', error);
        process.exit(1);
    }
}

startServer();