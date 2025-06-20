// const bcrypt = require('bcryptjs');
// const crypto = require("crypto");
// const sendEmail = require("./email.service");
const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class PatientService {
    constructor(client) {
        this.pool = client; // client là một pool kết nối MySQL
    }

    // Hàm chuyển đổi định dạng ngày sinh từ 'dd/mm/yyyy' sang 'yyyy-mm-dd'
    formatDateToMySQL(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) {
            throw new ApiError(400, 'Định dạng ngày sinh không hợp lệ');
        }
        const [day, month, year] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            throw new ApiError(400, 'Ngày sinh không hợp lệ');
        }
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    async addPatient(patient) {
        const connection = await this.pool.getConnection();
        try {
            const { emailBN, cccdBN, soBHYT, hotenBN, sdtBN, ngaysinhBN, 
                    diachiBN, chieucao, cannang, nhommau } = patient;

            // Kiểm tra cccdBN đã tồn tại
            const [existing] = await connection.query(
                'SELECT cccdBN FROM benhnhan WHERE cccdBN = ?',
                [cccdBN]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Số CCCD đã tồn tại');
            }
    
            // Sinh maBN
            const [lastPatient] = await connection.query(
                'SELECT maBN FROM benhnhan ORDER BY maBN DESC LIMIT 1'
            );
            let maBN;
            if (lastPatient.length === 0) {
                maBN = 'BN0001';
            } else {
                const lastId = parseInt(lastPatient[0].maBN.replace('BN', ''));
                maBN = `BN${String(lastId + 1).padStart(4, '0')}`;
            }
    
            // Chuyển đổi định dạng ngày sinh
            const formattedDate = this.formatDateToMySQL(ngaysinhBN);
    
            // Chèn bệnh nhân với maBN
            await connection.query(
                'INSERT INTO benhnhan (maBN, emailBN, cccdBN, soBHYT, hotenBN, sdtBN, ngaysinhBN, diachiBN, chieucao, cannang, nhommau) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [maBN, emailBN, cccdBN, soBHYT, hotenBN, sdtBN, formattedDate, 
                    diachiBN, chieucao, cannang, nhommau]
            );
    
            // Trả về thông tin bệnh nhân
            return { maBN, emailBN, cccdBN, soBHYT, hotenBN, sdtBN, ngaysinhBN: formattedDate, diachiBN, chieucao, cannang, nhommau };
        } catch (error) {
            console.error('Lỗi khi thêm bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM benhnhan';
            const [rows] = await connection.query(query, filter);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async findByName(name) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM benhnhan WHERE hotenBN LIKE ?';
            const [rows] = await connection.query(query, [`%${name}%`]);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bệnh nhân theo tên:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm bệnh nhân theo tên');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM benhnhan WHERE maBN = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy bệnh nhân với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bệnh nhân theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm bệnh nhân theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            const { emailBN, cccdBN, soBHYT, hotenBN, sdtBN, ngaysinhBN, 
                    diachiBN, chieucao, cannang, nhommau } = payload;

            // Chuyển đổi định dạng ngày sinh
            const formattedDate = this.formatDateToMySQL(ngaysinhBN);

            const query = `
                UPDATE benhnhan 
                SET emailBN = ?, cccdBN = ?, soBHYT = ?, hotenBN = ?, sdtBN = ?, 
                    ngaysinhBN = ?, diachiBN = ?, chieucao = ?, cannang = ?, nhommau = ?
                WHERE maBN = ?
            `;
            const params = [emailBN, cccdBN, soBHYT, hotenBN, sdtBN, formattedDate, 
                            diachiBN, chieucao, cannang, nhommau, id];
            const [result] = await connection.query(query, params);
            
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy bệnh nhân với ID: ' + id);
            }
            return { maBN: id, emailBN, cccdBN, soBHYT, hotenBN, sdtBN, ngaysinhBN: formattedDate, diachiBN, chieucao, cannang, nhommau };
        } catch (error) {
            console.error('Lỗi khi cập nhật bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'DELETE FROM benhnhan WHERE maBN = ?';
            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy bệnh nhân với ID: ' + id);
            }
            return { message: 'Bệnh nhân đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa bệnh nhân');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            const query = 'DELETE FROM benhnhan';
            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} bệnh nhân đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả bệnh nhân:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả bệnh nhân');
        } finally {
            connection.release();
        }
    }
}

module.exports = PatientService;