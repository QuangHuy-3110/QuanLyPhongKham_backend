const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class Invoice_detailsService {
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

    async addInvoice_detail(invoice) {
        const connection = await this.pool.getConnection();
        try {
            const { maHD, maThuoc, soluong, donvitinh, dongia, thanhtien} = invoice;
            
            // Kiểm tra maHD tồn tại
            const [existingRecord] = await connection.query(
                'SELECT maHD FROM hoadonnhap WHERE maHD = ?',
                [maHD]
            );
            if (existingRecord.length === 0) {
                throw new ApiError(400, 'Mã hóa đơn không tồn tại');
            }

            // Kiểm tra maThuoc tồn tại
            const [existingDrug] = await connection.query(
                'SELECT maThuoc FROM thuoc WHERE maThuoc = ?',
                [maThuoc]
            );
            if (existingDrug.length === 0) {
                throw new ApiError(400, 'Mã hóa đơn không tồn tại');
            }
           
            // Chèn chi tiết hóa đơn mới
            await connection.query(
                'INSERT INTO chitiethoadon (maHD, maThuoc, soluong, donvitinh, dongia, thanhtien) VALUES (?, ?, ?, ?, ?, ?)',
                [maHD, maThuoc, soluong, donvitinh, dongia, thanhtien]
            );
            
            // Trả về thông tin hóa đơn nhập
            return { maHD, maThuoc, soluong, donvitinh, dongia, thanhtien};
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'chitiethoadon đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {  
                throw new ApiError(400, 'Mã hóa đơn không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {  
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm chi tiết hóa đơn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm chi tiết hóa đơn');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
             // Xây dựng truy vấn SQL
            let query = 'SELECT * FROM chitiethoadon';
            let params = [];

            // Thêm điều kiện vào truy vấn nếu có bộ lọc
            if (filter) {
                const conditions = [];
                if (filter.maHD) {
                    conditions.push('maHD = ?');
                    params.push(filter.maHD);
                }
                if (filter.maThuoc) {
                    conditions.push('maThuoc = ?');
                    params.push(filter.maThuoc);
                }
                if (filter.dongia) {
                    conditions.push('dongia = ?');
                    params.push(filter.dongia);
                }
                if (filter.donvitinh) {
                    conditions.push('donvitinh = ?');
                    params.push(filter.donvitinh);
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
            console.error('Lỗi khi tìm kiếm chi tiết hóa đơn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm chi tiết hóa đơn');
        } finally {
            connection.release();
        }
    }

    async findById({maHD, maThuoc}) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM chitiethoadon WHERE xoa = 0 AND maHD = ? AND maThuoc = ?';
            const [rows] = await connection.query(query, [maHD, maThuoc]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy chi tiết hóa đơn với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm chi tiết hóa đơn theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm chi tiết hóa đơn theo ID');
        } finally {
            connection.release();
        }
    }

    async update({maHD, maThuoc}, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Lấy các trường từ payload
            const {soluong, donvitinh, dongia, thanhtien, xoa} = payload;
            // Cập nhật hồ sơ lần khám
            const query = `
                UPDATE chitiethoadon
                SET soluong = ?, donvitinh = ?, dongia = ?, thanhtien = ?, xoa = ?, 
                WHERE maHD = ? AND maThuoc = ?
            `;
            const params = [soluong, donvitinh, dongia, thanhtien, xoa, maHD, maThuoc];
            
            const [result] = await connection.query(query, params);
            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy chitiethoadon với ID: ' + id);
            }
            
            // Trả về thông tin chi tiết hóa đơn đã cập nhật
            return { soluong, donvitinh, dongia, thanhtien, xoa, maHD, maThuoc };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Mã chi tiết hóa đơn đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã hóa đơn không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật chi tiết hóa đơn:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật chi tiết hóa đơn');
        } finally {
            connection.release();
        }
    }

    async delete({ maHD, maThuoc }) {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra maLanKham và maThuoc
            if (!maHD|| !maThuoc) {
                throw new ApiError(400, 'maHD và maThuoc không được để trống');
            }
            if (typeof maHD !== 'string' || typeof maThuoc !== 'string') {
                throw new ApiError(400, 'maHD và maThuoc phải là chuỗi');
            }
            // Xóa hồ sơ lần khám
            const query = 'DELETE FROM chitiethoadon WHERE maHD = ? AND maThuoc = ?';
            const [result] = await connection.query(query, [maHD, maThuoc]);
            if (result.affectedRows === 0) {
                throw new ApiError(404, `Không tìm thấy chitiethoadon với maHD: ${maHD} và maThuoc: ${maThuoc}`);
            }
            return { message: 'chitiethoadon đã được xóa thành công' };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new ApiError(400, 'Mã hóa đơn không tồn tại');
            }
            if (error.code === 'ER_NO_REFERENCED_ROW') {
                throw new ApiError(400, 'Mã thuốc không tồn tại');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi xóa chitiethoadon:', error); 
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa chitiethoadon');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Kiểm tra xem có hồ sơ lần khám nào không
            const [rows] = await connection.query('SELECT COUNT(*) AS count FROM chitiethoadon');
            if (rows[0].count === 0) {
                throw new ApiError(400, 'Không có chitiethoadon nào để xóa');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra số lượng chitiethoadon:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi kiểm tra số lượng chitiethoadon');
        } finally {
            connection.release();
        }
    }

}

module.exports = Invoice_detailsService;