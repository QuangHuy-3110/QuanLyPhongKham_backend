const express = require('express');
const cors = require('cors');

const patientRoutes = require('./app/routes/patient.route'); // Nhập route ví dụ
const doctorRoutes = require('./app/routes/doctor.route'); // Nhập route bác sĩ
const drugRoutes = require('./app/routes/drug.route'); // Nhập route thuốc
const recordRoutes = require('./app/routes/record.route'); // Nhập route hồ sơ bệnh án
const prescriptionRoutes = require('./app/routes/prescription.route'); // Nhập route toa thuốc
const specialtiesRoutes = require('./app/routes/specialties.route'); // Nhập route chuyên khoa
const doctorRoleRoutes = require('./app/routes/doctor_role.route'); // Nhập route quản lý mối quan hệ bác sĩ - chuyên khoa
const appointmentRoutes = require('./app/routes/appointment.route'); // Nhập route cuộc hẹn
const workingTimeRoutes = require('./app/routes/working_time.route'); // Nhập route thời gian làm việc
const examinationRoutes = require('./app/routes/examination.route'); // Nhập route khám bệnh
const distributorRoutes = require('./app/routes/distributor.route'); // Nhập route nhà phân phối
const invoiceRoutes = require('./app/routes/invoice.route'); // Nhập route hóa đơn nhập
const invoice_detailsRoutes = require('./app/routes/invoice_details.route'); // Nhập route chi tiết hóa đơn nhập

const emailRouter = require('./app/routes/email.route'); // Import router email


const ApiError = require('./app/api-error');

const app = express();
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to clinic application' });
});

app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/drugs', drugRoutes);  
app.use('/api/records', recordRoutes); // API quản lý hồ sơ bệnh án
app.use('/api/prescriptions', prescriptionRoutes); // API quản lý toa thuốc
app.use('/api/specialties', specialtiesRoutes); // API quản lý chuyên khoa
app.use('/api/doctor-roles', doctorRoleRoutes); // API quản lý mối quan hệ bác sĩ - chuyên khoa
app.use('/api/appointments', appointmentRoutes); // API quản lý cuộc hẹn
app.use('/api/working-times', workingTimeRoutes); // API quản lý thời gian làm việc
app.use('/api/examinations', examinationRoutes); // API quản lý khám bệnh
app.use('/api/distributors', distributorRoutes); // API quản lý khám bệnh
app.use('/api/invoices', invoiceRoutes); // API quản lý khám bệnh
app.use('/api/invoice_details', invoice_detailsRoutes); // API quản lý khám bệnh
app.use('/api/email', emailRouter);  // API gửi email sẽ có đường dẫn: /api/email/send



//handle 404 response
app.use((req, res, next) => {
    //code se chay khi khong co route duoc dinh nghia nao
    //khop yeu cau goi next() de chuyen sang middleware xu ly loi
    return next(new ApiError(404, 'Resource not found'));
});

// define error-handling middleware last, after other app.use() and routes calls
// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('Error:', err); // Log lỗi để debug
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Lỗi server không xác định';
    res.status(statusCode).json({
        statusCode,
        message
    });
});

module.exports = app;