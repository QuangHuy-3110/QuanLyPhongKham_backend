const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class SpecialtiesService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    async addSpecialties(Specialties) {
        const connection = await this.pool.getConnection();
        try {
            const { maCK, tenCK } = Specialties;

            // Kiểm tra xem chuyên khoa đã tồn tại chưa
            const [existing] = await connection.query(
                'SELECT maCK FROM chuyenkhoa WHERE maCK = ?',
                [maCK]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Chuyên khoa đã tồn tại');
            }
            // Chèn chuyên khoa mới
            await connection.query(
                'INSERT INTO chuyenkhoa (maCK, tenCK) VALUES (?, ?)',
                [maCK, tenCK]
            );
            // Trả về thông tin chuyên khoa
            return { maCK, tenCK };
        } catch (error) {
            // Log lỗi và ném ra ApiError
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã chuyên khoa đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {  
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi thêm chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm chuyên khoa');
        } finally {
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            // Truy vấn tất cả chuyên khoa
            const filterConditions = [];
            const filterValues = [];
            if (filter.maCK) {
                filterConditions.push('maCK LIKE ?');
                filterValues.push(`%${filter.maCK}%`);
            }
            if (filter.tenCK) {
                filterConditions.push('tenCK LIKE ?');
                filterValues.push(`%${filter.tenCK}%`);
            }
            let query;
            if (filterConditions.length > 0) {
                query = `SELECT * FROM chuyenkhoa WHERE ${filterConditions.join(' AND ')}`;
            } else {
                // Nếu không có bộ lọc, lấy tất cả chuyên khoa
                query = 'SELECT * FROM chuyenkhoa';
            }
            const [rows] = await connection.query(query, filterValues);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hồ sơ bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hồ sơ bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            // Truy vấn hồ sơ bệnh nhân theo ID
            const query = 'SELECT * FROM chuyenkhoa WHERE maCK = ?';
            const [rows] = await connection.query(query, [id]);

            // Kiểm tra xem có bản ghi nào không
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy chuyên khoa với ID: ' + id);
            }
            return rows[0]; // Trả về bản ghi đầu tiên
        } catch (error) {
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi tìm kiếm chuyên khoa theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm chuyên khoa theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            const { maCK, tenCK } = payload;
            const query = 'UPDATE chuyenkhoa SET maCK = ?, tenCK = ? WHERE maCK = ?';
            const [result] = await connection.query(query, [maCK, tenCK, id]);

            // Kiểm tra xem có bản ghi nào được cập nhật không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy chuyên khoa với ID: ' + id);
            }
            return { message: 'Chuyên khoa đã được cập nhật thành công' };
        } catch (error) {
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật chuyên khoa');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            // Xóa chuyên khoa theo ID
            const query = 'DELETE FROM chuyenkhoa WHERE maCK = ?';
            const [result] = await connection.query(query, [id]);

            // Kiểm tra xem có bản ghi nào bị xóa không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy chuyên khoa với ID: ' + id);
            }
            return { message: 'Chuyên khoa đã được xóa thành công' };
        } catch (error) {
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa chuyên khoa');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả chuyên khoa
            const query = 'DELETE FROM chuyenkhoa';
            const [result] = await connection.query(query);

            // Kiểm tra xem có bản ghi nào bị xóa không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy chuyên khoa nào để xóa');
            }
            return { message: 'Tất cả chuyên khoa đã được xóa thành công' };
        } catch (error) {
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa tất cả chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả chuyên khoa');
        } finally {
            connection.release();
        }
    }
}

module.exports = SpecialtiesService;