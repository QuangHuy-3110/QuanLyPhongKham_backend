const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class DoctorRoleService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    async addDoctorRole(DoctorRole) {
        const connection = await this.pool.getConnection();
        try {
            const {maBS, maCK} = DoctorRole;
            
            // Kiểm tra xem bác sĩ đã tồn tại chưa
            const [existing] = await connection.query(
                'SELECT maBS FROM bacsi WHERE maBS = ?',
                [maBS]
            );
            if (existing.length === 0) {
                throw new ApiError(404, 'Bác sĩ không tồn tại');
            }   
            // Kiểm tra xem chuyên khoa đã tồn tại chưa
            const [existingSpecialty] = await connection.query(
                'SELECT maCK FROM chuyenkhoa WHERE maCK = ?',
                [maCK]
            );
            if (existingSpecialty.length === 0) {
                throw new ApiError(404, 'Chuyên khoa không tồn tại');
            }
            // Kiểm tra xem mối quan hệ đã tồn tại chưa
            const [existingRelation] = await connection.query(  
                'SELECT maBS, maCK FROM vaitrobacsi WHERE maBS = ? AND maCK = ?',
                [maBS, maCK]
            );
            if (existingRelation.length > 0) {
                throw new ApiError(400, 'Mối quan hệ bác sĩ - chuyên khoa đã tồn tại');
            }
            // Chèn mối quan hệ bác sĩ - chuyên khoa mới
            await connection.query(
                'INSERT INTO vaitrobacsi (maBS, maCK) VALUES (?, ?)',
                [maBS, maCK]
            );
            // Trả về thông tin mối quan hệ
            return { maBS, maCK };
        } catch (error) {
            // Log lỗi và ném ra ApiError
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mối quan hệ bác sĩ - chuyên khoa đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi thêm mối quan hệ bác sĩ - chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm mối quan hệ bác sĩ - chuyên khoa');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            // Truy vấn tất cả mối quan hệ bác sĩ - chuyên khoa
            const filterConditions = [];
            const filterValues = [];
            if (filter.maBS) {
                filterConditions.push('maBS LIKE ?');
                filterValues.push(`%${filter.maBS}%`);
            }
            if (filter.maCK) {
                filterConditions.push('maCK LIKE ?');
                filterValues.push(`%${filter.maCK}%`);
            }
            let query;
            if (filterConditions.length > 0) {
                query = `SELECT * FROM vaitrobacsi WHERE ${filterConditions.join(' AND ')}`;
            } else {
                // Nếu không có bộ lọc, lấy tất cả mối quan hệ
                query = 'SELECT * FROM vaitrobacsi';
            }
            const [rows] = await connection.query(query, filterValues);
            return rows;
        } catch (error) {
            // Xử lý lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi tìm kiếm mối quan hệ bác sĩ - chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm mối quan hệ bác sĩ - chuyên khoa');
        } finally {
            connection.release();
        }
    }

    async findById({maBS, maCK}) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maBS và maCK
            if (!maBS || !maCK) {
                throw new ApiError(400, 'maBS và maCK không được để trống');
            }
            if (typeof maBS !== 'string' || typeof maCK !== 'string') {
                throw new ApiError(400, 'maBS và maCK phải là chuỗi');
            }
            // Truy vấn mối quan hệ bác sĩ - chuyên khoa
            const [rows] = await connection.query(
                'SELECT * FROM vaitrobacsi WHERE maBS = ? AND maCK = ?',
                [maBS, maCK]
            );
            if (rows.length === 0) {
                throw new ApiError(404, `Không tìm thấy mối quan hệ với maBS: ${maBS} và maCK: ${maCK}`);
            }
            return rows[0];
        } catch (error) {
            // Xử lý lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi tìm kiếm mối quan hệ bác sĩ - chuyên khoa theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm mối quan hệ bác sĩ - chuyên khoa theo ID');
        } finally {
            connection.release();
        }
    }

    async update({ maBS, maCK }, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maBS và maCK
            if (!maBS || !maCK) {
                throw new ApiError(400, 'maBS và maCK không được để trống');
            }
            if (typeof maBS !== 'string' || typeof maCK !== 'string') {
                throw new ApiError(400, 'maBS và maCK phải là chuỗi');
            }
            // Kiểm tra xem mối quan hệ có tồn tại không
            const [existing] = await connection.query(
                'SELECT * FROM vaitrobacsi WHERE maBS = ? AND maCK = ?',
                [maBS, maCK]
            );
            if (existing.length === 0) {
                throw new ApiError(404, `Không tìm thấy mối quan hệ với maBS: ${maBS} và maCK: ${maCK}`);
            }
            // Cập nhật mối quan hệ bác sĩ - chuyên khoa
            const query = 'UPDATE vaitrobacsi SET ? WHERE maBS = ? AND maCK = ?';
            const [result] = await connection.query(query, [payload, maBS, maCK]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy mối quan hệ với maBS: ${maBS} và maCK: ${maCK}`);
            }
            return { message: 'Mối quan hệ đã được cập nhật thành công' };
        } catch (error) {
            // Xử lý lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi cập nhật mối quan hệ bác sĩ - chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật mối quan hệ bác sĩ - chuyên khoa');
        } finally {
            connection.release();
        }
    }

    async delete({ maBS, maCK }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maBS và maCK
            if (!maBS || !maCK) {
                throw new ApiError(400, 'maBS và maCK không được để trống');
            }
            if (typeof maBS !== 'string' || typeof maCK !== 'string') {
                throw new ApiError(400, 'maBS và maCK phải là chuỗi');
            }
            // Kiểm tra xem mối quan hệ có tồn tại không
            const [existing] = await connection.query(
                'SELECT * FROM vaitrobacsi WHERE maBS = ? AND maCK = ?',
                [maBS, maCK]
            );
            if (existing.length === 0) {
                throw new ApiError(404, `Không tìm thấy mối quan hệ với maBS: ${maBS} và maCK: ${maCK}`);
            }
            // Xóa mối quan hệ bác sĩ - chuyên khoa
            const query = 'DELETE FROM vaitrobacsi WHERE maBS = ? AND maCK = ?';
            const [result] = await connection.query(query, [maBS, maCK]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy mối quan hệ với maBS: ${maBS} và maCK: ${maCK}`);
            }
            return { message: 'Mối quan hệ đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi xóa mối quan hệ bác sĩ - chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa mối quan hệ bác sĩ - chuyên khoa');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả mối quan hệ bác sĩ - chuyên khoa
            const query = 'DELETE FROM vaitrobacsi';
            const [result] = await connection.query(query);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không có mối quan hệ nào để xóa');
            }
            return { message: 'Tất cả mối quan hệ đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            console.error('Lỗi khi xóa tất cả mối quan hệ bác sĩ - chuyên khoa:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả mối quan hệ bác sĩ - chuyên khoa');
        } finally {
            connection.release();
        }
    }
}

module.exports = DoctorRoleService;