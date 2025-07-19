const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class Log_detailsService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    // Hàm chuyển đổi định dạng ngày từ 'dd/mm/yyyy' sang 'yyyy-mm-dd'
    formatDateToMySQL(dateString) {
        if (!dateString) return null;

        // Kiểm tra nếu ngày đã ở định dạng yyyy-mm-dd
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (isoDateRegex.test(dateString)) {
            // Kiểm tra tính hợp lệ của ngày
            const date = new Date(dateString);
            if (!isNaN(date.getTime()) && date.toISOString().startsWith(dateString)) {
                return dateString; // Trả về nguyên giá trị nếu hợp lệ
            }
            throw new ApiError(400, 'Ngày không hợp lệ');
        }

        // Chuyển đổi nếu ngày ở định dạng dd/mm/yyyy
        const parts = dateString.split('/');
        if (parts.length !== 3) {
            throw new ApiError(400, 'Định dạng ngày không hợp lệ');
        }
        const [day, month, year] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            throw new ApiError(400, 'Ngày không hợp lệ');
        }
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    async addLog_detail(log) {
        const connection = await this.pool.getConnection();
        try {
            const { maNK, maThuoc, soluong, donvitinh} = log;
            
            // Kiểm tra maHD tồn tại
            const [existingRecord] = await connection.query(
                'SELECT maNK FROM nhatkidathang WHERE maNK = ?',
                [maNK]
            );
            if (existingRecord.length === 0) {
                throw new ApiError(400, 'Nhật kí đặt hàng không tồn tại');
            }

            // Kiểm tra maThuoc tồn tại
            const [existingDrug] = await connection.query(
                'SELECT maThuoc FROM thuoc WHERE maThuoc = ?',
                [maThuoc]
            );
            if (existingDrug.length === 0) {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }

            // Chèn chi tiết hóa đơn mới
            await connection.query(
                'INSERT INTO chitietnhatki (maNK, maThuoc, soluong, donvitinh) VALUES (?, ?, ?, ?)',
                [maNK, maThuoc, soluong, donvitinh]
            );
            
            // Trả về thông tin hóa đơn nhập
            return { maNK, maThuoc, soluong, donvitinh};
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'chitietnhatki đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {  
                throw new ApiError(400, 'Mã nhật kí không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {  
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm chi tiết nhật kí:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm chi tiết nhật kí');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
             // Xây dựng truy vấn SQL
            let query = 'SELECT * FROM chitietnhatki';
            let params = [];

            // Thêm điều kiện vào truy vấn nếu có bộ lọc
            if (filter) {
                const conditions = [];
                if (filter.maNK) {
                    conditions.push('maNK = ?');
                    params.push(filter.maNK);
                }
                if (filter.maThuoc) {
                    conditions.push('maThuoc = ?');
                    params.push(filter.maThuoc);
                }
                if (filter.donvitinh) {
                    conditions.push('donvitinh = ?');
                    params.push(filter.donvitinh);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
            }

            // Thực hiện truy vấn
            const [rows] = await connection.query(query, params);
            return rows;
            
        } catch (error) {
            console.error('Lỗi khi tìm kiếm chi tiết hóa đơn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm chi tiết hóa đơn');
        } finally {
            connection.release();
        }
    }

    async findById({maNK, maThuoc}) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM chitietnhatki WHERE maNK = ? AND maThuoc = ?';
            const [rows] = await connection.query(query, [maNK, maThuoc]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy chi tiết nhật kí với ID: ' + maNK, maThuoc);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm chi tiết nhật kí theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm chi tiết nhật kí theo ID');
        } finally {
            connection.release();
        }
    }

    async update({maNK, maThuoc}, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Lấy các trường từ payload
            const {soluong, donvitinh} = payload;
            // Cập nhật hồ sơ lần khám
            const query = `
                UPDATE chitietnhatki
                SET soluong = ?, donvitinh = ?
                WHERE maNK = ? AND maThuoc = ?
            `;
            const params = [soluong, donvitinh, maNK, maThuoc];
            
            const [result] = await connection.query(query, params);
            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy chi tiết nhật kí với ID: ' + id);
            }
            
            // Trả về thông tin chi tiết hóa đơn đã cập nhật
            return { soluong, donvitinh, maNK, maThuoc };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã chi tiết nhật kí đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã nhật kí đặt hàng không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật chi tiết nhật kí:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật chi tiết nhật kí');
        } finally {
            connection.release();
        }
    }

    async delete({ maNK, maThuoc }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maLanKham và maThuoc
            if (!maNK|| !maThuoc) {
                throw new ApiError(400, 'maNK và maThuoc không được để trống');
            }
            if (typeof maNK !== 'string' || typeof maThuoc !== 'string') {
                throw new ApiError(400, 'maNK và maThuoc phải là chuỗi');
            }
            // Xóa hồ sơ lần khám
            const query = 'DELETE FROM chitietnhatki WHERE maNK = ? AND maThuoc = ?';
            const [result] = await connection.query(query, [maNK, maThuoc]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy chitietnhatki với maNK: ${maNK} và maThuoc: ${maThuoc}`);
            }
            return { message: 'chitietnhatki đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã nhật kí không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa chitietnhatki:', error); 
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa chitietnhatki');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra xem có hồ sơ lần khám nào không
            const [rows] = await connection.query('SELECT COUNT(*) AS count FROM chitietnhatki');
            if (rows[0].count === 0) {
                throw new ApiError(400, 'Không có chitietnhatki nào để xóa');
            }
            const query = 'DELETE FROM chitietnhatki';
            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} chitietnhatki đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi kiểm tra số lượng chitietnhatki:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi kiểm tra số lượng chitietnhatki');
        } finally {
            connection.release();
        }
    }

}

module.exports = Log_detailsService;