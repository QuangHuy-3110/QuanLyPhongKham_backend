const InvoiceService = require('../services/invoice.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const invoiceService = new InvoiceService(pool);
        const document = await invoiceService.addInvoice(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ InvoiceService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm hóa đơn'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const invoiceService = new InvoiceService(pool);
        let filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maNPP) {
            filter.maNPP = req.query.maNPP;
        }
        if (req.query.ngaynhap) {
            filter.ngaynhap = req.query.ngaynhap;
        }
        if (req.query.tongtien) {
            filter.tongtien = req.query.tongtien;
        }
        if (req.query.xoa) {
            filter.xoa = req.query.xoa; 
        }

        // Gọi hàm find với bộ lọc
        const documents = await invoiceService.find(filter);
        return res.status(200).json(documents);
    } catch (error) {
        // Truyền lỗi trực tiếp từ InvoiceService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách hóa đơn'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }   
        const invoiceService = new InvoiceService(pool);
        const document = await invoiceService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Hóa đơn không tìm thấy'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ InvoiceService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin hóa đơn với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const invoiceService = new InvoiceService(pool);
        const document = await invoiceService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Hóa đơn không tìm thấy'));
        }
        return res.send({message: 'Hóa đơn được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ InvoiceService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật hóa đơn với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const invoiceService = new InvoiceService(pool);
        const document = await invoiceService.delete(req.params.id);       
        if (!document) {    
            return next(new ApiError(404, 'Hóa đơn không tìm thấy'));
        }
        return res.send({message: 'Hóa đơn được xóa thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ InvoiceService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa hóa đơn với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const invoiceService = new InvoiceService(pool);
        const deletedCount = await invoiceService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy hóa đơn để xóa'));
        }
        return res.send({
            message: `${deletedCount} hóa đơn được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ InvoiceService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả hóa đơn'));
    }
};