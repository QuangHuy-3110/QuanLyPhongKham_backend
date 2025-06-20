const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class RecordService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    // Hàm chuyển đổi định dạng ngày sinh từ 'dd/mm/yyyy' sang 'yyyy-mm-dd'
    formatDateToMySQL(dateString) {
        if (!dateString) return null;
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

    async addRecord(record) {
        const connection = await this.pool.getConnection();
        try {
            const { maBN, ngaylapHS } = record;

            const [lastRecodr] = await connection.query(
                'SELECT maHS FROM hosobenhnhan ORDER BY maHS DESC LIMIT 1'
            );
            let maHS;
            if (lastRecodr.length === 0) {
                maHS = 'HS00000001';
            } else {
                const lastId = parseInt(lastRecodr[0].maHS.replace('HS', ''));
                maHS = `HS${String(lastId + 1).padStart(8, '0')}`;
            }

            const [existing] = await connection.query(
                'SELECT maHS FROM hosobenhnhan WHERE maHS = ?',
                [maHS]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Hồ sơ đã tồn tại');
            }
    
            // Chuyển đổi định dạng ngày
            const formattedDate = this.formatDateToMySQL(ngaylapHS);
    
            // Chèn hồ sơ bệnh nhân mới
            await connection.query(
                'INSERT INTO hosobenhnhan (maHS, maBN, ngaylapHS) VALUES (?, ?, ?)',
                [maHS, maBN, formattedDate]
            );
    
            // Trả về thông tin hồ sơ bệnh nhân
            return { maHS, maBN, ngaylapHS: formattedDate };
        } catch (error) {
            // Xử lý lỗi nếu có
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã hồ sơ đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi thêm hồ sơ bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm hồ sơ bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            // Truy vấn tất cả hồ sơ bệnh nhân
            const filterConditions = [];
            const filterValues = [];
            let rows = [];
            if (filter.maBN) {
                filterConditions.push('maBN LIKE ?');
                filterValues.push(`%${filter.maBN}%`);
            }
            if (filter.ngaylapHS) {
                filterConditions.push('ngaylapHS LIKE ?');
                filterValues.push(`%${filter.ngaylapHS}%`);
            }
            if (filterConditions.length > 0) {
                const query = `SELECT * FROM hosobenhnhan WHERE ${filterConditions.join(' AND ')}`;
                rows = await connection.query(query, filterValues);
            }
            else {  
                // Nếu không có bộ lọc, lấy tất cả hồ sơ bệnh nhân
                const query = 'SELECT * FROM hosobenhnhan';
                rows = await connection.query(query);
            }
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy hồ sơ bệnh nhân nào');
            }
            // Trả về danh sách hồ sơ bệnh nhân
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hồ sơ bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hồ sơ bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async findByMaBN(maBN) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM hosobenhnhan WHERE maBN LIKE ?';
            const [rows] = await connection.query(query, [`%${maBN}%`]);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hồ sơ bệnh nhân theo mã bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hồ sơ bệnh nhân theo mã bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM hosobenhnhan WHERE maHS = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy hồ sơ bệnh nhân với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hồ sơ bệnh nhân theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hồ sơ bệnh nhân theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Lấy các trường từ payload
            const { maBN, ngaylapHS } = payload;  
            // Chuyển đổi định dạng ngày
            const formattedDate = this.formatDateToMySQL(ngaylapHS);
            // Cập nhật hồ sơ bệnh nhân
            const query = `
                UPDATE hosobenhnhan 
                SET maBN = ?, ngaylapHS = ?
                WHERE maHS = ?
            `;
            const params = [maBN, formattedDate, id];
            const [result] = await connection.query(query, params);

            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy hồ sơ bệnh nhân với ID: ' + id);
            }
            // Trả về thông tin hồ sơ bệnh nhân đã cập nhật
            return { maHS: id, maBN, ngaylapHS: formattedDate };
        } catch (error) {
            console.error('Lỗi khi cập nhật hồ sơ bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật hồ sơ bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            // Xóa hồ sơ bệnh nhân
            const query = 'DELETE FROM hosobenhnhan WHERE maHS = ?';
            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy hồ sơ bệnh nhân với ID: ' + id);
            }
            return { message: 'Hồ sơ bệnh nhân đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa hồ sơ bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa hồ sơ bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả hồ sơ bệnh nhân
            const query = 'DELETE FROM hosobenhnhan';
            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} hồ sơ bệnh nhân đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả hồ sơ bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả hồ sơ bệnh nhân');
        } finally {
            connection.release();
        }
    }
}

module.exports = RecordService;