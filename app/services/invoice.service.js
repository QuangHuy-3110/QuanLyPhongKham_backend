const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class InvoiceService {
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

    async addInvoice(invoice) {
        const connection = await this.pool.getConnection();
        try {
            const { maHD, maNPP, ngaynhap, tongtien} = invoice;
            
            // Kiểm tra maNPP tồn tại
            const [existingRecord] = await connection.query(
                'SELECT maNPP FROM nhaphanphoi WHERE maNPP = ?',
                [maNPP]
            );
            if (existingRecord.length === 0) {
                throw new ApiError(400, 'Mã nhà phân phối không tồn tại');
            }
           
            // Chuyển đổi định dạng ngày
            const formattedDate = this.formatDateToMySQL(ngaynhap);
    
            // Chèn hóa đơn mới
            await connection.query(
                'INSERT INTO hoadonnhap (maHD, maNPP, ngaynhap, tongtien) VALUES (?, ?, ?, ?)',
                [maHD, maNPP, formattedDate, tongtien]
            );
            
            // Trả về thông tin hóa đơn nhập
            return { maHD, maNPP, ngaynhap: formattedDate, tongtien};
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã hóa đơn đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {  
                throw new ApiError(400, 'Mã nhà phân phối không tồn tại');
            }
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm hóa đơn nhập:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm hóa đơn nhập');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
             // Xây dựng truy vấn SQL
            let query = 'SELECT * FROM hoadonnhap';
            let params = [];

            // Thêm điều kiện vào truy vấn nếu có bộ lọc
            if (filter) {
                const conditions = [];
                if (filter.maNPP) {
                    conditions.push('maNPP = ?');
                    params.push(filter.maNPP);
                }
                if (filter.ngaynhap) {
                    conditions.push('ngaynhap = ?');
                    params.push(filter.ngaynhap);
                }
                if (filter.tongtien) {
                    conditions.push('tongtien = ?');
                    params.push(filter.tongtien);
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
            console.error('Lỗi khi tìm kiếm hóa đơn nhập:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hóa đơn nhập');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM hoadonnhap WHERE xoa = 0 AND maHD = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy hóa đơn nhập với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm hóa đơn nhập theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm hóa đơn nhập theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Lấy các trường từ payload
            const {maNPP, ngaynhap, tongtien, xoa} = payload;
            // Chuyển đổi định dạng ngày
            const formattedDate = this.formatDateToMySQL(ngaynhap);
            // Cập nhật hồ sơ lần khám
            const query = `
                UPDATE hoadonnhap
                SET maNPP = ?, ngaynhap = ?, tongtien = ?, xoa = ?, 
                WHERE maHD = ?
            `;
            const params = [maNPP, formattedDate, tongtien, xoa, id];
            
            const [result] = await connection.query(query, params);
            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy hóa đơn nhập với ID: ' + id);
            }
            
            // Trả về thông tin hóa đơn nhập đã cập nhật
            return { maHD: id, ngaynhap: formattedDate, tongtien, xoa };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã hóa đơn nhập đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã NPP không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật hóa đơn nhập:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật hóa đơn nhập');
        } finally {
            connection.release();
        }
    }

    async delete(id) {
        const connection = await this.pool.getConnection();
        try {
            // Xóa hóa đơn nhập
            if (!id) {
                throw new ApiError(400, 'ID không được để trống');
            }

            const query = 'DELETE FROM hoadonnhap WHERE maHD = ?';

            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw error instanceof ApiError ? error : new ApiError(404, 'Không tìm thấy hóa đơn nhập với ID: ' + id);
            }
            return { message: 'hóa đơn nhập đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa hóa đơn nhập:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa hóa đơn nhập');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả hóa đơn nhập
            const query = 'DELETE FROM hoadonnhap';

            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} hóa đơn nhập đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả hóa đơn nhập:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả hóa đơn nhập');
        } finally {
            connection.release();
        }
    }

}

module.exports = InvoiceService;