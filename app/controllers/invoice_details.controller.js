const Invoice_detailsService = require('../services/invoice_details.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const invoice_detailsService = new Invoice_detailsService(pool);
        const document = await invoice_detailsService.addInvoice_detail(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the invoice_details")
        );
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
        console.error('Lỗi khi tìm kiếm invoice_details:', error);
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || 'Lỗi khi tìm kiếm invoice_details'
            )
        );
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maHD } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const invoice_detailsService = new Invoice_detailsService(pool);

        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không
        if (!maHD || !maThuoc) {
            return next(new ApiError(400, 'maHD và maThuoc là bắt buộc'));
        }

        // Gọi hàm findById với đối tượng chứa maLanKham và maThuoc
        const document = await invoice_detailsService.findById({ maHD, maThuoc });

        // Kiểm tra kết quả
        if (!document) {
            return next(new ApiError(404, `Hóa đơn với maHD=${maHD} và maThuoc=${maThuoc} không tìm thấy`));
        }

        return res.status(200).json(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        console.error(`Lỗi khi tìm kiếm Hóa đơn với maHD=${req.query.maHD}, maThuoc=${req.query.maThuoc}:`, error);
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || `Lỗi khi tìm kiếm Hóa đơn với maHD=${req.query.maHD} và maThuoc=${req.query.maThuoc}`
            )
        );
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maHD } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const invoice_detailsService = new Invoice_detailsService(pool);

        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không
        if (!maHD || !maThuoc) {
            return next(new ApiError(400, 'maHD và maThuoc là bắt buộc'));
        }
        const document = await invoice_detailsService.update({maHD, maThuoc}, req.body);
        if (!document) {
            return next(new ApiError(404, 'invoice_details not found'));
        }
        return res.send({message: 'invoice_details was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while updating invoice_details with maHD=' + maHD + ' and maThuoc=' + maThuoc
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maHD } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const invoice_detailsService = new Invoice_detailsService(pool);
        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không 
        if (!maHD || !maThuoc) {
            return next(new ApiError(400, 'maHD và maThuoc là bắt buộc'));
        }
        const deletedCount = await invoice_detailsService.delete({ maHD, maThuoc });
        if (deletedCount === 0) {
            return next(new ApiError(404, `invoice_details with maHD=${maHD} and maThuoc=${maThuoc} not found`));
        }
        return res.send({
            message: `invoice_details with maHD=${maHD} and maThuoc=${maThuoc} was deleted successfully`
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting maHD with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const invoice_detailsService = new Invoice_detailsService(pool);
        const deletedCount = await invoice_detailsService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No invoice_details found to delete'));
        }   
        return res.send({
            message: `${deletedCount} invoice_details were deleted successfully`
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting invoice_details'
            )
        );
    }
};