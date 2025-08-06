const AppointmentService = require('../services/appointment.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const appointmentService = new AppointmentService(pool);
        const document = await appointmentService.addAppointment(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ AppointmentService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm cuộc hẹn'));
    }
}

exports.findAll = async (req, res, next) => {
    let documents = []
    try {
        const appointmentService = new AppointmentService(pool);
        const { maBN, maBS, ngaythangnam, trangthai } = req.query;
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (maBN) {
            filter.maBN = maBN;
        }
        if (maBS) {
            filter.maBS = maBS;
        }
        if (ngaythangnam) {
            filter.ngaythangnam = ngaythangnam;
        }
        if (trangthai) {
            filter.trangthai = trangthai;
        }

        // Gọi hàm find với bộ lọc
        documents = await appointmentService.find(filter);
        return res.send(documents);
    } catch (error) {
        // Truyền lỗi trực tiếp từ AppointmentService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách cuộc hẹn'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const appointmentService = new AppointmentService(pool);
        const document = await appointmentService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Appointment not found'));
        }
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ AppointmentService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin cuộc hẹn với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const appointmentService = new AppointmentService(pool);
        const document = await appointmentService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Appointment not found'));
        }
        return res.send({message: 'Appointment was updated successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ AppointmentService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật cuộc hẹn với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const appointmentService = new AppointmentService(pool);
        const document = await appointmentService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Appointment not found'));
        }
        return res.send({message: 'Appointment was deleted successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ AppointmentService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa cuộc hẹn với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const appointmentService = new AppointmentService(pool);
        const documents = await appointmentService.deleteAll();
        return res.send({
            message: `${documents.deletedCount} appointments were deleted successfully`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ AppointmentService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả cuộc hẹn'));
    }
};