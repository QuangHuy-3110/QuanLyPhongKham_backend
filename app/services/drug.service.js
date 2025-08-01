const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class DrugService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    async addDrug(drug) {
        const connection = await this.pool.getConnection();
        try {
            const { maThuoc, tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc } = drug;

            // Kiểm tra cccdBS đã tồn tại
            const [existing] = await connection.query(
                'SELECT maThuoc FROM thuoc WHERE maThuoc = ?',
                [maThuoc]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Mã số thuốc đã tồn tại');
            }
            const [existing_maNPP] = await connection.query(
                'SELECT maNPP FROM nhaphanphoi WHERE maNPP = ?',
                [maNPP]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Mã nhà phân phối không tồn tại');
            }
            // Chèn thuốc mới
            
            await connection.query(
                'INSERT INTO thuoc (maThuoc, tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [maThuoc, tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc]
            );
    
            // Trả về thông tin bệnh nhân
            return { maThuoc, tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc};
        } catch (error) {
            // Xử lý lỗi nếu có
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã số thuốc đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {  
                throw new ApiError(400, 'Mã nhà phân phối không tồn tại');
            }
            // Log lỗi và ném ra ApiError   
            console.error('Lỗi khi thêm thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm thuốc');
        } finally {
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {

            const conditions = [];
            const values = [];
            if(filter.xoa) {
                conditions.push('xoa = ?');
                values.push(filter.xoa);
            }
            if(filter.maNPP) {
                conditions.push('maNPP = ?');
                values.push(filter.maNPP);
            }
            let query = 'SELECT * FROM thuoc';
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            const [rows] = await connection.query(query, values);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm thuốc');
        } finally {
            connection.release();
        }
    }

    async findByName(name) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM thuoc WHERE tenThuoc LIKE ?';
            const [rows] = await connection.query(query, [`%${name}%`]);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm thuốc theo tên:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm thuốc theo tên');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM thuoc WHERE maThuoc = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy thuốc với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm thuốc theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm thuốc theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            const { tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc, xoa } = payload;

            const query = `
                UPDATE thuoc
                SET tenThuoc = ?, soluongThuoc = ?, donvitinhThuoc = ?, maNPP = ?, soluong_minThuoc = ?, giaThuoc = ?, xoa = ?
                WHERE maThuoc = ?
            `;
            const params = [tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc, xoa, id];
            const [result] = await connection.query(query, params);
            
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy thuốc với ID: ' + id);
            }
            // Trả về thông tin thuốc đã cập nhật   
            return { maThuoc: id, tenThuoc, soluongThuoc, donvitinhThuoc, maNPP, soluong_minThuoc, giaThuoc, xoa };
            
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED') {
                throw new ApiError(400, 'Mã NPP không tồn tại');
            }
            console.error('Lỗi khi cập nhật thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật thuốc');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'DELETE FROM thuoc WHERE maThuoc = ?';
            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy thuốc với ID: ' + id);
            }
            return { message: 'Thuốc đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa thuốc');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            const query = 'DELETE FROM thuoc';
            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} thuốc đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả thuốc:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả thuốc');
        } finally {
            connection.release();
        }
    }
}

module.exports = DrugService;