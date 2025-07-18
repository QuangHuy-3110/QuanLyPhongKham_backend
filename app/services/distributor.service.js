const mysql = require('mysql2/promise');
const ApiError = require('../api-error');

class DistributorService {
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

    async addDistributor(distributor) {
        const connection = await this.pool.getConnection();
        try {
            const { maNPP, tenNPP, diachiNPP, sdtNPP, 
                    emailNPP, stkNPP , nganhangNPP} = distributor;
            
            // Chèn hồ sơ NPP mới
            await connection.query(
                'INSERT INTO nhaphanphoi (maNPP, tenNPP, diachiNPP, sdtNPP, emailNPP, stkNPP , nganhangNPP) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [maNPP, tenNPP, diachiNPP, sdtNPP, emailNPP, stkNPP , nganhangNPP]
            );
            
            // Trả về thông tin hồ sơ lần khám
            return { maNPP, tenNPP, diachiNPP, sdtNPP, emailNPP, stkNPP , nganhangNPP };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError(400, 'Nhà phân phối đã tồn tại');
            }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError       
            console.error('Lỗi khi thêm nhà phân phối:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm nhà phân phối!');
        } finally {
            // Giải phóng kết nối
            connection.release();
        }
    }

    async find (filter){
        const connection = await this.pool.getConnection();
        try {
             // Xây dựng truy vấn SQL
            let query = 'SELECT * FROM nhaphanphoi';
            let params = [];

            // Thêm điều kiện vào truy vấn nếu có bộ lọc
            if (filter) {
                const conditions = [];
                if (filter.tenNPP) {
                    conditions.push('tenNPP = ?');
                    params.push(filter.tenNPP);
                }
                if (filter.diachiNPP) {
                    conditions.push('diachiNPP = ?');
                    params.push(filter.diachiNPP);
                }
                if (filter.sdtNPP) {
                    conditions.push('sdtNPP = ?');
                    params.push(filter.sdtNPP);
                }
                if (filter.emailNPP) {
                    conditions.push('emailNPP = ?');
                    params.push(filter.emailNPP);
                }
                if (filter.stkNPP) {
                    conditions.push('stkNPP = ?');
                    params.push(filter.stkNPP);
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
            console.error('Lỗi khi tìm kiếm nhà phân phối:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm nhà phân phối!');
        } finally {
            connection.release();
        }
    }

    async findById(id) {
        const connection = await this.pool.getConnection();
        try {
            const query = 'SELECT * FROM nhaphanphoi WHERE xoa = 0 AND maNPP = ?';
            const [rows] = await connection.query(query, [id]);
            if (rows.length === 0) {
                throw new ApiError(404, 'Không tìm thấy nhà phân phối với ID: ' + id);
            }
            return rows[0];
        } catch (error) {
            console.error('Lỗi khi tìm kiếm nhà phân phối theo ID:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi tìm kiếm nhà phân phối theo ID');
        } finally {
            connection.release();
        }
    }

    async update(id, payload) {
        const connection = await this.pool.getConnection();
        try {
            // Lấy các trường từ payload
            const {tenNPP, diachiNPP, sdtNPP, emailNPP, stkNPP , nganhangNPP, xoa} = payload;
            // Cập nhật hồ sơ lần khám
            const query = `
                UPDATE nhaphanphoi
                SET tenNPP = ?, diachiNPP = ?, sdtNPP = ?, 
                    emailNPP = ?, stkNPP = ?, nganhangNPP = ?, xoa = ?
                WHERE maNPP = ?
            `;
            const params = [tenNPP, diachiNPP, sdtNPP, emailNPP, stkNPP , nganhangNPP, xoa, id];
            
            const [result] = await connection.query(query, params);
            // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
            if (result.affectedRows === 0) {
                throw new ApiError(404, 'Không tìm thấy nhà phân phối với ID: ' + id);
            }
            
            // Trả về thông tin hồ sơ lần khám đã cập nhật
            return { maNPP: id, tenNPP, diachiNPP, sdtNPP, emailNPP, stkNPP , nganhangNPP, xoa };
        } catch (error) {
            // Xử lý lỗi và trả về thông báo lỗi
            // if (error.code === 'ER_DUP_ENTRY') {
            //     throw new ApiError(400, 'Mã lần khám đã tồn tại');
            // }
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.error('Lỗi khi cập nhật nhà phân phối:', error);
                throw new ApiError(400, 'Trường dữ liệu không hợp lệ');
            }
            // Log lỗi và ném ra ApiError
            console.error('Lỗi khi cập nhật nhà phân phối:', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi cập nhật nhà phân phối');
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

            const query = 'DELETE FROM nhaphanphoi WHERE maNPP = ?';

            const [result] = await connection.query(query, [id]);
            if (result.affectedRows === 0) {
                throw error instanceof ApiError ? error : new ApiError(404, 'Không tìm thấy nhà phân phối với ID: ' + id);
            }
            return { message: 'Nhà phân phối đã được xóa thành công' };
        } catch (error) {
            console.error('Lỗi khi xóa nhà phân phối :', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa nhà phân phối ');
        } finally {
            connection.release();
        }
    }

    async deleteAll() {
        const connection = await this.pool.getConnection();
        try {
            // Xóa tất cả nhà phân phối 
            const query = 'DELETE FROM nhaphanphoi';

            const [result] = await connection.query(query);
            return { message: `${result.affectedRows} nhà phân phối đã được xóa thành công` };
        } catch (error) {
            console.error('Lỗi khi xóa tất cả nhà phân phối :', error);
            throw error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả nhà phân phối ');
        } finally {
            connection.release();
        }
    }

}

module.exports = DistributorService;