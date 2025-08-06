const Invoice_detailsService = require('../services/invoice_details.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const invoice_detailsService = new Invoice_detailsService(pool);
        const document = await invoice_detailsService.addInvoice_detail(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ Invoice_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm chi tiết hóa đơn'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const invoice_detailsService = new Invoice_detailsService(pool);
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maHD) {
            filter.maHD = req.query.maHD;
        }
        if (req.query.maThuoc) {
            filter.maThuoc = req.query.maThuoc;
        }
        if (req.query.soluong) {
            filter.soluong = req.query.soluong;
        }
        if (req.query.donvitinh) {
            filter.donvitinh = req.query.donvitinh;
        }
        if (req.query.dongia) {
            filter.dongia = req.query.dongia;
        }
        if (req.query.thanhtien) {
            filter.thanhtien = req.query.thanhtien;
        }

        // Gọi hàm find với bộ lọc
        const documents = await invoice_detailsService.find(filter);

        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm chi tiết hóa đơn:', error);
        // Truyền lỗi trực tiếp từ Invoice_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách chi tiết hóa đơn'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maHD } = req.params; // Lấy maHD từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const invoice_detailsService = new Invoice_detailsService(pool);

        // Kiểm tra xem maHD và maThuoc có được cung cấp không
        if (!maHD || !maThuoc) {
            return next(new ApiError(400, 'maHD và maThuoc là bắt buộc'));
        }

        // Gọi hàm findById với đối tượng chứa maHD và maThuoc
        const document = await invoice_detailsService.findById({ maHD, maThuoc });

        // Kiểm tra kết quả
        if (!document) {
            return next(new ApiError(404, `Chi tiết hóa đơn với maHD=${maHD} và maThuoc=${maThuoc} không tìm thấy`));
        }

        return res.status(200).json(document);
    } catch (error) {
        console.error(`Lỗi khi tìm kiếm chi tiết hóa đơn với maHD=${req.params.maHD}, maThuoc=${req.query.maThuoc}:`, error);
        // Truyền lỗi trực tiếp từ Invoice_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin chi tiết hóa đơn với maHD=${req.params.maHD} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maHD } = req.params; // Lấy maHD từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const invoice_detailsService = new Invoice_detailsService(pool);

        // Kiểm tra xem maHD và maThuoc có được cung cấp không
        if (!maHD || !maThuoc) {
            return next(new ApiError(400, 'maHD và maThuoc là bắt buộc'));
        }
        const document = await invoice_detailsService.update({maHD, maThuoc}, req.body);
        if (!document) {
            return next(new ApiError(404, 'Chi tiết hóa đơn không tìm thấy'));
        }
        return res.send({message: 'Chi tiết hóa đơn được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ Invoice_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật chi tiết hóa đơn với maHD=${req.params.maHD} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maHD } = req.params; // Lấy maHD từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const invoice_detailsService = new Invoice_detailsService(pool);
        // Kiểm tra xem maHD và maThuoc có được cung cấp không 
        if (!maHD || !maThuoc) {
            return next(new ApiError(400, 'maHD và maThuoc là bắt buộc'));
        }
        const deletedCount = await invoice_detailsService.delete({ maHD, maThuoc });
        if (deletedCount === 0) {
            return next(new ApiError(404, `Chi tiết hóa đơn với maHD=${maHD} và maThuoc=${maThuoc} không tìm thấy`));
        }
        return res.send({
            message: `Chi tiết hóa đơn với maHD=${maHD} và maThuoc=${maThuoc} được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ Invoice_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa chi tiết hóa đơn với maHD=${req.params.maHD} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const invoice_detailsService = new Invoice_detailsService(pool);
        const deletedCount = await invoice_detailsService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy chi tiết hóa đơn để xóa'));
        }   
        return res.send({
            message: `${deletedCount} chi tiết hóa đơn được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ Invoice_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả chi tiết hóa đơn'));
    }
};