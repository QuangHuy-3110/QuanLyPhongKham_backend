const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class ExaminationService {
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

    async addExamination(examination) {
        const connection = await this.pool.getConnection();
        try {
            const { trieuchung, thutuckham, chuandoan, lieutrinhdieutri, 
                    ngaytaikham, ngaythangnamkham, maHS , stt_lankham, maBS} = examination;
            
            // Kiểm tra maHS đã tồn tại
            const [existingRecord] = await connection.query(
                'SELECT maHS FROM hosobenhnhan WHERE maHS = ?',
                [maHS]
            );
            if (existingRecord.length === 0) {
                throw new ApiError(400, 'Mã hồ sơ bệnh nhân không tồn tại');
            }
            // Kiểm tra maBS đã tồn tại 
            const [existingDoctor] = await connection.query(
                'SELECT maBS FROM bacsi WHERE maBS = ?',
                [maBS]
            );
            if (existingDoctor.length === 0) {
                throw new ApiError(400, 'Mã bác sĩ không tồn tại');
            }
            // Sinh lanKham
            const [lastExamination] = await connection.query(
                'SELECT maLanKham FROM lankham ORDER BY maLanKham DESC LIMIT 1'
            );  
            let maLanKham;
            if (lastExamination.length === 0) {
                maLanKham = 'LK0000001';
            } else {
                const lastId = parseInt(lastExamination[0].maLanKham.replace('LK', ''));
                maLanKham = `LK${String(lastId + 1).padStart(8, '0')}`;
            }
    
            // Chuyển đổi định dạng ngày
            const formattedDate = this.formatDateToMySQL(ngaythangnamkham);
            const formattedNgayTaiKham = this.formatDateToMySQL(ngaytaikham);
    
            // Chèn hồ sơ bệnh nhân mới
            await connection.query(
                'INSERT INTO lankham (maLanKham, trieuchung, thutuckham, chuandoan, lieutrinhdieutri, ngaytaikham, ngaythangnamkham, maHS, stt_lankham, maBS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [maLanKham, trieuchung, thutuckham, chuandoan, lieutrinhdieutri, formattedNgayTaiKham, formattedDate, maHS, stt_lankham, maBS]
            );
            
            // Trả về thông tin hồ sơ lần khám
            return { maLanKham, trieuchung, thutuckham, chuandoan, lieutrinhdieutri,
                    ngaytaikham: formattedNgayTaiKham, ngaythangnamkham: formattedDate, maHS, stt_lankham, maBS };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã lần khám đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {  
                throw new ApiError(400, 'Mã hồ sơ bệnh nhân không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã bác sĩ không tồn tại');
            }
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm hồ sơ lần khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm hồ sơ lần khám');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
             // Xây dựng truy vấn SQL
            let query = 'SELECT * FROM lankham';
            let params = [];

            // Thêm điều kiện vào truy vấn nếu có bộ lọc
            if (filter) {
                const conditions = [];
                if (filter.maHS) {
                    conditions.push('maHS = ?');
                    params.push(filter.maHS);
                }
                if (filter.maBS) {
                    conditions.push('maBS = ?');
                    params.push(filter.maBS);
                }
                if (filter.ngaythangnam) {
                    conditions.push('ngaythangnam = ?');
                    params.push(filter.ngaythangnam);
                }
                if (filter.xoa) {
                    conditions.push('xoa = ?');
                    params.push(filter.xoa);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
            }

            // Thực hiện truy vấn
            const [rows] = await connection.query(query, params);
            return rows;
            
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hồ sơ lần khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hồ sơ lần khám');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM lankham WHERE xoa = 0 AND maLanKham = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy hồ sơ lần khám với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hồ sơ lần khám theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hồ sơ lần khám theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Lấy các trường từ payload
            const {trieuchung, thutuckham, chuandoan, lieutrinhdieutri, 
                    ngaytaikham, ngaythangnamkham, maHS , stt_lankham, maBS, xoa} = payload;
            // Chuyển đổi định dạng ngày
            const formattedDate = this.formatDateToMySQL(ngaythangnamkham);
            const formattedNgayTaiKham = this.formatDateToMySQL(ngaytaikham);
            // Cập nhật hồ sơ lần khám
            const query = `
                UPDATE lankham
                SET trieuchung = ?, thutuckham = ?, chuandoan = ?, lieutrinhdieutri = ?, 
                    ngaytaikham = ?, ngaythangnamkham = ?, maHS = ?, stt_lankham = ?, maBS = ?, xoa = 0
                WHERE maLanKham = ?
            `;
            const params = [trieuchung, thutuckham, chuandoan, lieutrinhdieutri,
                            formattedNgayTaiKham, formattedDate, maHS, stt_lankham, maBS, xoa, id];
            
            const [result] = await connection.query(query, params);
            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy hồ sơ lần khám với ID: ' + id);
            }
            
            // Trả về thông tin hồ sơ lần khám đã cập nhật
            return { maLanKham: id, trieuchung, thutuckham, chuandoan, lieutrinhdieutri,
                     ngaytaikham: formattedNgayTaiKham, ngaythangnamkham: formattedDate, maHS, stt_lankham, maBS, xoa };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã lần khám đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã hồ sơ bệnh nhân không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã bác sĩ không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật hồ sơ lần khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật hồ sơ lần khám');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            // Xóa hồ sơ lần khám
            if (!id) {
                throw new ApiError(400, 'ID không được để trống');
            }

            const query = 'DELETE FROM lankham WHERE maLanKham = ?';

            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw error instanceof ApiError ? error : new ApiError(404, 'Không tìm thấy hồ sơ lần khám với ID: ' + id);
            }
            return { message: 'Hồ sơ lần khám đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa hồ sơ lần khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa hồ sơ lần khám');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả hồ sơ lần khám
            const query = 'DELETE FROM lankham';

            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} hồ sơ lần khám đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả hồ sơ lần khám:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả hồ sơ lần khám');
        } finally {
            connection.release();
        }
    }

}

module.exports = ExaminationService;