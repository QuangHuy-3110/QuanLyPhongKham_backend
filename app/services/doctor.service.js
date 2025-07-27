const bcrypt = require('bcryptjs');
const crypto = require("crypto");
// const sendEmail = require("./email.service");
const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class DoctorService {
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

    async addDoctor(doctor) {
        const connection = await this.pool.getConnection();
        try {
            const { cccdBS, tenBS, ngaysinhBS, sdtBS, emailBS, 
                    diachiBS, soCCHN, noicapCCHN, matkhau } = doctor;

            // Kiểm tra cccdBS đã tồn tại
            const [existing] = await connection.query(
                'SELECT cccdBS FROM bacsi WHERE cccdBS = ?',
                [cccdBS]
            );
            if (existing.length > 0) {
                throw new ApiError(400, 'Số CCCD đã tồn tại');
            }
    
            // Sinh maBN
            const [lastDoctor] = await connection.query(
                'SELECT maBS FROM bacsi ORDER BY maBS DESC LIMIT 1'
            );
            let maBS;
            if (lastDoctor.length === 0) {
                maBS = 'BS0001';
            } else {
               const lastId = parseInt(lastDoctor[0].maBS.replace('BS', ''));
                if (isNaN(lastId)) {
                    maBS = 'BS0001'; // Gán bằng 1 nếu không phải số
                } else {
                    maBS = `BS${String(lastId + 1).padStart(4, '0')}`;
                }
            }
    
            // Chuyển đổi định dạng ngày sinh
            const formattedDate = this.formatDateToMySQL(ngaysinhBS);
    
            // Chèn bác sĩ với maBS
            await connection.query(
                'INSERT INTO bacsi (maBS, cccdBS, tenBS, ngaysinhBS, sdtBS, emailBS, diachiBS, soCCHN, noicapCCHN, matkhau) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [maBS, cccdBS, tenBS, formattedDate, sdtBS, emailBS, diachiBS, soCCHN, noicapCCHN,  matkhau]
            );
    
            // Trả về thông tin bệnh nhân
            return { maBS, cccdBS, tenBS, ngaysinhBS: formattedDate, sdtBS, emailBS, diachiBS, soCCHN, noicapCCHN, matkhau };
        } catch (error) {
            console.error('Lỗi khi thêm bác sĩ:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm bác sĩ');
        } finally {
            connection.release();
        }
    }

    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10); // Tạo salt với độ khó 10
        const hashedPassword = await bcrypt.hash(password, salt); // Băm mật khẩu
        return hashedPassword;
    }

    async add_admin(doctor) {
        const connection = await this.pool.getConnection();
        try {
            const { maBS, tenBS, vaitro, pass } = doctor;
            console.log(pass)
            let matkhau = await this.hashPassword(pass)
            console.log(matkhau)
            // Chèn bác sĩ với maBS
            await connection.query(
                'INSERT INTO bacsi (maBS, tenBS, vaiTro, matkhau) VALUES (?, ?, ?, ?)',
                [maBS, tenBS, vaitro, matkhau]
            );
    
            // Trả về thông tin bệnh nhân
            return { maBS, tenBS, vaitro, matkhau };
        } catch (error) {
            console.error('Lỗi khi thêm bác sĩ:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm admin');
        } finally {
            connection.release();
        }
    }

    async find(filter) {
        const connection = await this.pool.getConnection();
        try {
            let query = 'SELECT * FROM bacsi';
            const values = [];
            
            // Build WHERE clause based on filter parameters
            const conditions = [];
            if (filter.cccdBS) {
                conditions.push('cccdBS LIKE ?');
                values.push(`%${filter.cccdBS}%`);
            }
            if (filter.tenBS) {
                conditions.push('tenBS LIKE ?');
                values.push(`%${filter.tenBS}%`);
            }
            if (filter.sdtBS) {
                conditions.push('sdtBS LIKE ?');
                values.push(`%${filter.sdtBS}%`);
            }
            if (filter.emailBS) {
                conditions.push('emailBS LIKE ?');
                values.push(`%${filter.emailBS}%`);
            }
            if (filter.soCCHN) {
                conditions.push('soCCHN LIKE ?');
                values.push(`%${filter.soCCHN}%`);
            }

            if (filter.xoa) {
                conditions.push('xoa LIKE ?');
                values.push(`%${filter.xoa}%`);
            }
    
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
    
            const [rows] = await connection.query(query, values);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bác sĩ:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm bác sĩ');
        } finally {
            connection.release();
        }
    }
    
    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM bacsi WHERE xoa = 0 AND maBS = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy bác sĩ với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bác sĩ theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm bác sĩ theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            const { cccdBS, tenBS, ngaysinhBS, sdtBS, emailBS, diachiBS, soCCHN, noicapCCHN, matkhau, xoa } = payload;

            // Chuyển đổi định dạng ngày sinh
            const formattedDate = this.formatDateToMySQL(ngaysinhBS);

            const query = `
                UPDATE bacsi
                SET cccdBS = ?, tenBS = ?, ngaysinhBS = ?, sdtBS = ?, emailBS = ?,
                    diachiBS = ?, soCCHN = ?, noicapCCHN = ?, matkhau = ?, xoa = ?
                WHERE maBS = ?
            `;
            const params = [cccdBS, tenBS, formattedDate, sdtBS, emailBS, diachiBS, soCCHN, noicapCCHN, matkhau, xoa, id];
            const [result] = await connection.query(query, params);
            
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy bác sĩ với ID: ' + id);
            }
            return { maBS: id, cccdBS, tenBS, ngaysinhBS: formattedDate, sdtBS, emailBS, diachiBS, soCCHN, noicapCCHN, matkhau, xoa };
        } catch (error) {
            console.error('Lỗi khi cập nhật bác sĩ:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật bác sĩ');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'DELETE FROM bacsi WHERE maBS = ?';
            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy bác sĩ với ID: ' + id);
            }
            return { message: 'Bác sĩ đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa bác sĩ:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa bác sĩ');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            const query = 'DELETE FROM bacsi';
            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} bác sĩ đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả bác sĩ:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả bác sĩ');
        } finally {
            connection.release();
        }
    }
}

module.exports = DoctorService;