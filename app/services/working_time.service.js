const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class WorkingTimeService {
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
    async addWorkingTime(WorkingTime) {
        const connection = await this.pool.getConnection();
        try {
            const { maBS , ngaythangnam, giobatdau, gioketthuc} = WorkingTime;
            const formattedDate = this.formatDateToMySQL(ngaythangnam);
            const [existing] = await connection.query(
                'SELECT maBS , ngaythangnam, giobatdau FROM thoigiankham WHERE maBS = ? and ngaythangnam = ?  and giobatdau = ?',
                [maBS , formattedDate, giobatdau]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Thời gian khám đã tồn tại');
            }
            
            await connection.query(
                'INSERT INTO thoigiankham (maBS , ngaythangnam, giobatdau, gioketthuc) VALUES (?, ?, ?, ?)',
                [maBS , formattedDate, giobatdau, gioketthuc]
            );
            
            return { maBS , ngaythangnam: formattedDate, giobatdau, gioketthuc };
        } catch (error) {
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm thời gian khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm thời gian khám');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            // Xây dựng truy vấn SQL
            let query = 'SELECT * FROM thoigiankham';
            const params = [];

            // Thêm điều kiện vào truy vấn nếu có bộ lọc
            if (filter) {
                let conditions = [];
                if (filter.maBS) {
                    conditions.push('maBS = ?');
                    params.push(filter.maBS);
                }
                if (filter.ngaythangnam) {
                    conditions.push('ngaythangnam = ?');
                    params.push(filter.ngaythangnam);
                }
                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
            }

            // Thực hiện truy vấn
            const [rows] = await connection.query(query, params);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm thời gian khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm thời gian khám');
        } finally {
            connection.release();
        }
    }

    async findById({ maBS , ngaythangnam, giobatdau }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maBS, ngaythangnam và giobatdau
            if (!maBS || !ngaythangnam || !giobatdau) {
                throw new ApiError(400, 'maBS, ngaythangnam và giobatdau không được để trống');
            }
            // if (typeof maBS !== 'string' || typeof ngaythangnam !== 'string' || typeof giobatdau !== 'string') {
            //     throw new ApiError(400, 'maBS, ngaythangnam và giobatdau phải là chuỗi');
            // }
            // Tìm kiếm thời gian khám theo mã bác sĩ, ngày tháng năm và giờ bắt đầu
            const [rows] = await connection.query(
                'SELECT * FROM thoigiankham WHERE maBS = ? AND ngaythangnam = ? AND giobatdau = ?',
                [maBS, ngaythangnam, giobatdau]
            );
            if (rows.length === 0) {
                throw new ApiError(404, `Không tìm thấy thời gian khám với maBS: ${maBS}, ngày: ${ngaythangnam} và giờ bắt đầu: ${giobatdau}`);
            }
            return rows[0];
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi tìm kiếm thời gian khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm thời gian khám');
        } finally {
            connection.release();
        }
    }

    async update({ maBS , ngaythangnam, giobatdau }, payload) {
        const connection = await this.pool.getConnection();
        try {
            // const formattedDate = this.formatDateToMySQL(ngaythangnam);
            // Kiểm tra maBS, ngaythangnam và giobatdau
            if (!maBS || !ngaythangnam || !giobatdau) {
                throw new ApiError(400, 'maBS, ngaythangnam và giobatdau không được để trống');
            }
            if (typeof maBS !== 'string' || typeof ngaythangnam !== 'string' || typeof giobatdau !== 'string') {
                throw new ApiError(400, 'maBS, ngaythangnam và giobatdau phải là chuỗi');
            }
            // Tìm kiếm thời gian khám theo mã bác sĩ, ngày tháng năm và giờ bắt đầu
            const [rows] = await connection.query(
                'SELECT * FROM thoigiankham WHERE maBS = ? AND ngaythangnam = ? AND giobatdau = ?',
                [maBS, ngaythangnam, giobatdau]
            );
            if (rows.length === 0) {
                throw new ApiError(404, `Không tìm thấy thời gian khám với maBS: ${maBS}, ngày: ${ngaythangnam} và giờ bắt đầu: ${giobatdau}`);
            }
            // Cập nhật thông tin thời gian khám
            const query = 'UPDATE thoigiankham SET ? WHERE maBS = ? AND ngaythangnam = ? AND giobatdau = ? ';
            const [result] = await connection.query(query, [payload, maBS, ngaythangnam, giobatdau]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy thời gian khám để cập nhật với maBS: ${maBS}, ngày: ${ngaythangnam} và giờ bắt đầu: ${giobatdau}`);
            }
            return { message: 'Thời gian khám đã được cập nhật thành công' };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật thời gian khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật thời gian khám');
        } finally {
            connection.release();
        }
    }

    async delete({ maBS , ngaythangnam, giobatdau }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maBS, ngaythangnam và giobatdau
            if (!maBS || !ngaythangnam || !giobatdau) {
                throw new ApiError(400, 'maBS, ngaythangnam và giobatdau không được để trống');
            }
            if (typeof maBS !== 'string' || typeof ngaythangnam !== 'string' || typeof giobatdau !== 'string') {
                throw new ApiError(400, 'maBS, ngaythangnam và giobatdau phải là chuỗi');
            }
            // Tìm kiếm thời gian khám theo mã bác sĩ, ngày tháng năm và giờ bắt đầu
            const [rows] = await connection.query(
                'SELECT * FROM thoigiankham WHERE maBS = ? AND ngaythangnam = ? AND giobatdau = ?',
                [maBS, ngaythangnam, giobatdau]
            );
            if (rows.length === 0) {
                throw new ApiError(404, `Không tìm thấy thời gian khám với maBS: ${maBS}, ngày: ${ngaythangnam} và giờ bắt đầu: ${giobatdau}`);
            }
            // Xóa thời gian khám
            const query = 'DELETE FROM thoigiankham WHERE maBS = ? AND ngaythangnam = ? AND giobatdau = ?';
            const [result] = await connection.query(query, [maBS, ngaythangnam, giobatdau]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy thời gian khám để xóa với maBS: ${maBS}, ngày: ${ngaythangnam} và giờ bắt đầu: ${giobatdau}`);
            }
            return { message: 'Thời gian khám đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa thời gian khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa thời gian khám');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả thời gian khám
            const [result] = await connection.query('DELETE FROM thoigiankham');
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy thời gian khám để xóa');
            }
            return { message: 'Tất cả thời gian khám đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa tất cả thời gian khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả thời gian khám');
        } finally {
            connection.release();
        }
    }
}

module.exports = WorkingTimeService;