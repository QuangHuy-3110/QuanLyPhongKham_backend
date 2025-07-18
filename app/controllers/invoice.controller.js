const InvoiceService = require('../services/invoice.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const invoiceService = new InvoiceService(pool);
        const document = await invoiceService.addInvoice(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the invoice")
        );
    }
}

exports.findAll = async (req, res, next) => {
    // let documents = [];
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
        // return res.send(documents);
        return res.status(200).json(documents);
    } catch (error) {
        return next(
            new ApiError(500, 'An error occurred while retrieving invoice')
        );
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
            return next(new ApiError(404, 'invoice not found'));
        }
        return res.send(document);  
    } catch (error) {
        return next(    
            new ApiError(
                500,    
                `Error occurred while retrieving invoice with id=${req.params.id}`
            )
        );
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
            return next(new ApiError(404, 'invoice not found'));
        }
        return res.send({message: 'invoice was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while updating invoice with id=${req.params.id}`
            )
        );
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
            return next(new ApiError(404, 'invoice not found'));
        }
        return res.send({message: 'invoice was deleted successfully'});
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting invoice with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const invoiceService = new InvoiceService(pool);
        const deletedCount = await invoiceService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No invoice found to delete'));
        }
        return res.send({
            message: `${deletedCount} invoice were deleted successfully`
        });
    } catch (error) {
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting invoice'
            )
        );
    }
};