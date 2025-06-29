const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class AppointmentService {
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
    async addAppointment (appointment) {
        const connection = await this.pool.getConnection();
        try {
            const {mota, khunggio, trangthai, ngaythangnam, maBS, maBN, maCK } = appointment;

            // Kiểm tra xem bệnh nhân có tồn tại không
            const [existingPatient] = await connection.query(   
                'SELECT maBN FROM benhnhan WHERE maBN = ?',
                [maBN]  
            );
            if (existingPatient.length === 0) {
                throw new ApiError(404, 'Bệnh nhân không tồn tại với ID: ' + maBN);
            }
            // Kiểm tra xem bác sĩ có tồn tại không
            const [existingDoctor] = await connection.query(
                'SELECT maBS FROM bacsi WHERE maBS = ?',
                [maBS]
            );
            if (existingDoctor.length === 0) {
                throw new ApiError(404, 'Bác sĩ không tồn tại với ID: ' + maBS);
            }
            // Kiểm tra xem chuyên khoa có tồn tại không
            const [existingSpecialty] = await connection.query(
                'SELECT maCK FROM chuyenKhoa WHERE maCK = ?',
                [maCK]
            );
            if (existingSpecialty.length === 0) {
                throw new ApiError(404, 'Chuyên khoa không tồn tại với ID: ' + maCK);
            }
            // Sinh mã cuộc hẹn
            const [lastAppointment] = await connection.query(
                'SELECT mahen FROM lichhen ORDER BY mahen DESC LIMIT 1'
            );
            let mahen;
            if (lastAppointment.length === 0) {
                mahen = 'LH00000001';   
            } else {
                const lastId = parseInt(lastAppointment[0].mahen.replace('LH', ''));
                mahen = `LH${String(lastId + 1).padStart(8, '0')}`;
            }   
            // Chuyển đổi định dạng ngày tháng năm
            const formattedDate = this.formatDateToMySQL(ngaythangnam);
            // Chèn cuộc hẹn
            await connection.query(
                'INSERT INTO lichhen (mahen, mota, khunggio, trangthai, ngaythangnam, maBS, maBN, maCK) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                    [mahen, mota, khunggio, trangthai, formattedDate, maBS, maBN, maCK]
            );
            // Trả về thông tin cuộc hẹn
            return { mahen, mota, khunggio, trangthai, ngaythangnam: formattedDate, maBS, maBN, maCK };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            console.error('Lỗi khi thêm cuộc hẹn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm cuộc hẹn');
        } finally {
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
            const { maBN, maBS, trangthai, ngaythangnam } = filter;
            let query = 'SELECT * FROM lichhen WHERE 1=1';
            const params = [];

            if (maBN) {
                query += ' AND maBN = ?';
                params.push(maBN);
            }
            if (maBS) {
                query += ' AND maBS = ?';
                params.push(maBS);
            }
            if (trangthai) {
                query += ' AND trangthai = ?';
                params.push(trangthai);
            }
            if (ngaythangnam) {
                const formattedDate = this.formatDateToMySQL(ngaythangnam);
                query += ' AND ngaythangnam = ?';
                params.push(formattedDate);
            }

            const [rows] = await connection.query(query, params);
            return rows;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm cuộc hẹn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm cuộc hẹn');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM lichhen WHERE mahen = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy cuộc hẹn với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm cuộc hẹn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm cuộc hẹn');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            const { mota, khunggio, trangthai, ngaythangnam, maBS, maBN, maCK } = payload;

            // Kiểm tra xem cuộc hẹn có tồn tại không
            const [existingAppointment] = await connection.query(
                'SELECT * FROM lichhen WHERE mahen = ?',
                [id]
            );
            if (existingAppointment.length === 0) {
                throw new ApiError(404, 'Không tìm thấy cuộc hẹn với ID: ' + id);
            }

            // Kiểm tra xem bệnh nhân có tồn tại không
            const [existingPatient] = await connection.query(
                'SELECT maBN FROM benhnhan WHERE maBN = ?',
                [maBN]
            );
            if (existingPatient.length === 0) {
                throw new ApiError(404, 'Bệnh nhân không tồn tại với ID: ' + maBN);
            }

            // Kiểm tra xem bác sĩ có tồn tại không
            const [existingDoctor] = await connection.query(
                'SELECT maBS FROM bacsi WHERE maBS = ?',
                [maBS]
            );
            if (existingDoctor.length === 0) {
                throw new ApiError(404, 'Bác sĩ không tồn tại với ID: ' + maBS);
            }

            // Kiểm tra xem chuyên khoa có tồn tại không
            const [existingSpecialty] = await connection.query(
                'SELECT maCK FROM chuyenKhoa WHERE maCK = ?',
                [maCK]
            );
            if (existingSpecialty.length === 0) {
                throw new ApiError(404, 'Chuyên khoa không tồn tại với ID: ' + maCK);
            }

            // Chuyển đổi định dạng ngày tháng năm
            const formattedDate = this.formatDateToMySQL(ngaythangnam);

            // Cập nhật cuộc hẹn
            const query = `
                UPDATE lichhen 
                SET mota = ?, khunggio = ?, trangthai = ?, ngaythangnam = ?, maBS = ?, maBN = ?, maCK = ?
                WHERE mahen = ?
            `;
            const [result] = await connection.query(query, [
                mota, khunggio, trangthai, formattedDate, maBS, maBN, maCK, id
            ]);

            if (result.affectedRows === 0) {
                throw new Api
                Error(404, 'Không tìm thấy cuộc hẹn với ID: ' + id);
            }
            return { message: 'Cuộc hẹn đã được cập nhật thành công', mahen: id };
        } catch (error) {
            console.error('Lỗi khi cập nhật cuộc hẹn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật cuộc hẹn');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra xem cuộc hẹn có tồn tại không
            const [existingAppointment] = await connection.query(
                'SELECT * FROM lichhen WHERE mahen = ?',
                [id]
            );
            if (existingAppointment.length === 0) {
                throw new ApiError(404, 'Không tìm thấy cuộc hẹn với ID: ' + id);
            }

            // Xóa cuộc hẹn
            const query = 'DELETE FROM lichhen WHERE mahen = ?';
            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy cuộc hẹn với ID: ' + id);
            }
            return { message: 'Cuộc hẹn đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa cuộc hẹn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa cuộc hẹn');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả cuộc hẹn
            const query = 'DELETE FROM lichhen';
            const [result] = await connection.query(query);
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không có cuộc hẹn nào để xóa');
            }
            return { message: 'Tất cả cuộc hẹn đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả cuộc hẹn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả cuộc hẹn');
        } finally {
            connection.release();
        }
    }
}

module.exports = AppointmentService;