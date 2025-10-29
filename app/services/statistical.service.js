const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class StatisticalService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    // 1. Lấy thống kê bệnh nhân tổng và đã kích hoạt
    async getBenhNhanStats() {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('CALL GetBenhNhanStats(@total_benhnhan, @activated_benhnhan)');
            const [rows] = await connection.query('SELECT @total_benhnhan AS total_benhnhan, @activated_benhnhan AS activated_benhnhan');
            return rows[0];
        } catch (error) {
            throw new ApiError(500, 'Error fetching BenhNhan stats: ' + error.message);
        } finally {
            connection.release();
        }
    }

    // 2. Lấy số lịch hẹn chưa khám
    async getLichHenChuaKham() {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('CALL GetLichHenChuaKham(@so_lichhen_chuakham)');
            const [rows] = await connection.query('SELECT @so_lichhen_chuakham AS so_lichhen_chuakham');
            return rows[0];
        } catch (error) {
            throw new ApiError(500, 'Error fetching LichHenChuaKham: ' + error.message);
        } finally {
            connection.release();
        }
    }

    // 3. Lấy số lượng hồ sơ khám bệnh
    async getHoSoKhamBenh() {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('CALL GetHoSoKhamBenh(@so_hoso)');
            const [rows] = await connection.query('SELECT @so_hoso AS so_hoso');
            return rows[0];
        } catch (error) {
            throw new ApiError(500, 'Error fetching HoSoKhamBenh: ' + error.message);
        } finally {
            connection.release();
        }
    }

    // 4. Lấy số lượng bác sĩ
    async getSoLuongBacSi() {
        const connection = await this.pool.getConnection();
        try {
            await connection.query('CALL GetSoLuongBacSi(@so_bacsi)');
            const [rows] = await connection.query('SELECT @so_bacsi AS so_bacsi');
            return rows[0];
        } catch (error) {
            throw new ApiError(500, 'Error fetching SoLuongBacSi: ' + error.message);
        } finally {
            connection.release();
        }
    }

    // 5. Lấy thống kê thu chi (tháng và năm)
    async getThuChiStats() {
        const connection = await this.pool.getConnection();
        try {
            // Gọi thủ tục KHÔNG có tham số
            const [resultSets] = await connection.query('CALL GetThuChiStats()');

            // MySQL trả về nhiều result sets:
            // resultSets[0] → thống kê theo ngày trong tháng
            // resultSets[1] → thống kê theo tháng trong năm
            const dailyStats = resultSets[0];
            const monthlyStats = resultSets[1];

            return { dailyStats, monthlyStats };
        } catch (error) {
            throw new ApiError(500, 'Error fetching ThuChiStats: ' + error.message);
        } finally {
            connection.release();
        }
    }

    // 6. Lấy thống kê bác sĩ (trả về bảng kết quả)
    async getBacSiStats(thang, nam) {
        // Validation cơ bản (tùy chọn, để tránh lỗi)
        if (!Number.isInteger(thang) || thang < 1 || thang > 12) {
            throw new ApiError(400, 'Tháng phải là số nguyên từ 1 đến 12');
        }
        if (!Number.isInteger(nam) || nam < 1900) {
            throw new ApiError(400, 'Năm phải là số nguyên hợp lệ (>= 1900)');
        }

        const connection = await this.pool.getConnection();
        try {
            // Sử dụng parameterized query để truyền tham số an toàn
            const [rows] = await connection.query('CALL GetBacSiStats(?, ?)', [thang, nam]);
            return rows[0]; // mysql2 trả về mảng result sets, rows[0] là bảng kết quả đầu tiên
        } catch (error) {
            throw new ApiError(500, 'Error fetching BacSiStats: ' + error.message);
        } finally {
            connection.release();
        }
    }
}

module.exports = StatisticalService;