const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class PrescriptionService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    async addPrescription(prescription) {
        const connection = await this.pool.getConnection();
        try {
            const { maLanKham, maThuoc, lieuluong, soluong, thoigianSD} = prescription;
            
            const [existing] = await connection.query(
                'SELECT maLanKham FROM toathuoc WHERE maLanKham = ? and maThuoc = ?',
                [maLanKham, maThuoc]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Toa thuốc đã tồn tại');
            }
            
            // Chèn hồ sơ bệnh nhân mới
            await connection.query(
                'INSERT INTO toathuoc (maLanKham, maThuoc, lieuluong, soluong, thoigianSD) VALUES (?, ?, ?, ?, ?)',
                [maLanKham, maThuoc, lieuluong, soluong, thoigianSD]
            );
            
            return { maLanKham, maThuoc, lieuluong, soluong, thoigianSD };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã toa thuốc đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }   
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã lần khám không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {    
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm toa thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm toa thuốc');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            // Tìm kiếm hồ sơ lần khám
            const filterConditions = [];
            const filterValues = [];
            if (filter.maLanKham) {
                filterConditions.push('maLanKham = ?');
                filterValues.push(`%${filter.maLanKham}%`);
            }
            if (filter.maThuoc) {
                filterConditions.push('maThuoc = ?');
                filterValues.push(`%${filter.maThuoc}%`);
            }
            if (filter.lieuluong) {
                filterConditions.push('lieuluong LIKE ?');
                filterValues.push(`%${filter.lieuluong}%`);
            }
            const whereClause = filterConditions.length > 0 ? 'WHERE ' + filterConditions.join(' AND ') : '';
            const query = `SELECT * FROM toathuoc ${whereClause}`;
            const [rows] = await connection.query(query, filterValues);
            // if (rows.length === 0) {
            //     throw new ApiError(404, 'Không tìm thấy toa thuốc nào');
            // }
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm toa thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm toa thuốc');
        } finally {
            connection.release();
        }
    }

    async findById({ maLanKham, maThuoc }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maLanKham và maThuoc
            if (!maLanKham || !maThuoc) {
                throw new ApiError(400, 'maLanKham và maThuoc không được để trống');
            }
            // if (typeof maLanKham !== 'string' || typeof maThuoc !== 'string') {
            //     throw new ApiError(400, 'maLanKham và maThuoc phải là chuỗi');
            // }
            // if (!maLanKham.match(/^LK\d{4}$/)) {
            //     throw new ApiError(400, 'maLanKham không hợp lệ, phải có định dạng LKxxxx');
            // }
            // if (!maThuoc.match(/^TH\d{4}$/)) { // Giả định maThuoc có định dạng THxxxx
            //     throw new ApiError(400, 'maThuoc không hợp lệ, phải có định dạng THxxxx');
            // }
    
            // Truy vấn bảng TOATHUOC
            const query = 'SELECT * FROM TOATHUOC WHERE maLanKham = ? AND maThuoc = ?';
            const [rows] = await connection.query(query, [maLanKham, maThuoc]);
            if (rows.length === 0) {
                throw new ApiError(404, `Không tìm thấy toa thuốc với maLanKham: ${maLanKham} và maThuoc: ${maThuoc}`);
            }
    
            return rows[0];
        } catch (error) {
            // Xử lý lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã lần khám không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            console.error('Lỗi khi tìm kiếm toa thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm toa thuốc');
        } finally {
            connection.release();
        }
    }

    async update({ maLanKham, maThuoc }, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maLanKham và maThuoc
            if (!maLanKham || !maThuoc) {   
                throw new ApiError(400, 'maLanKham và maThuoc không được để trống');
            }
            if (typeof maLanKham !== 'string' || typeof maThuoc !== 'string') {
                throw new ApiError(400, 'maLanKham và maThuoc phải là chuỗi');
            }
            // Kiểm tra xem hồ sơ lần khám có tồn tại không
            const [existing] = await connection.query(
                'SELECT * FROM toathuoc WHERE maLanKham = ? AND maThuoc = ?',
                [maLanKham, maThuoc]
            );
            if (existing.length === 0) {
                throw new ApiError(404, `Không tìm thấy toa thuốc với maLanKham: ${maLanKham} và maThuoc: ${maThuoc}`);
            }
            // Cập nhật toa thuốc
            const { lieuluong, soluong, thoigianSD } = payload;
            const query = `
                UPDATE toathuoc
                SET lieuluong = ?, soluong = ?, thoigianSD = ?
                WHERE maLanKham = ? AND maThuoc = ?
            `;
            const params = [lieuluong, soluong, thoigianSD, maLanKham, maThuoc];
            const [result] = await connection.query(query, params);
            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy toa thuốc với maLanKham: ' + maLanKham + ' và maThuoc: ' + maThuoc);
            }
            // Trả về thông tin toa thuốc đã cập nhật
            return { maLanKham, maThuoc, lieuluong, soluong, thoigianSD };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã toa thuốc đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }   
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã lần khám không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật toa thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật toa thuốc');
        } finally {
            connection.release();
        }
    }

    async delete({ maLanKham, maThuoc }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maLanKham và maThuoc
            if (!maLanKham || !maThuoc) {
                throw new ApiError(400, 'maLanKham và maThuoc không được để trống');
            }
            if (typeof maLanKham !== 'string' || typeof maThuoc !== 'string') {
                throw new ApiError(400, 'maLanKham và maThuoc phải là chuỗi');
            }
            // Xóa hồ sơ lần khám
            const query = 'DELETE FROM toathuoc WHERE maLanKham = ? AND maThuoc = ?';
            const [result] = await connection.query(query, [maLanKham, maThuoc]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy toa thuốc với maLanKham: ${maLanKham} và maThuoc: ${maThuoc}`);
            }
            return { message: 'Toa thuốc đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã lần khám không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa toa thuốc:', error); 
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa toa thuốc');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra xem có hồ sơ lần khám nào không
            const [rows] = await connection.query('SELECT COUNT(*) AS count FROM toathuoc');
            if (rows[0].count === 0) {
                throw new ApiError(400, 'Không có toa thuốc nào để xóa');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra số lượng toa thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi kiểm tra số lượng toa thuốc');
        } finally {
            connection.release();
        }
    }
}

module.exports = PrescriptionService;