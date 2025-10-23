const express = require('express');
const cors = require('cors');
require('dotenv').config();  // Load biến từ .env

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
const logRoutes = require('./app/routes/log.route');
const log_detailsRoutes = require('./app/routes/log_details.route');
const loginRoutes = require('./app/routes/login.route'); // Nhập route login

const emailRouter = require('./app/routes/email.route'); // Import router email

const StatisticalService = require('./app/routes/statistical.route');

const ApiError = require('./app/api-error');

const app = express();

// Cải thiện CORS: Chỉ cho phép origin cụ thể (thêm frontend port 3001)
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],  // Frontend Vue
  credentials: true
}));

app.use(express.json());

// THÊM: Middleware log tất cả incoming requests (để debug 404)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.path} - From IP: ${req.ip || 'unknown'}`);
  // Nếu có body (JSON), log ngắn gọn (tránh log sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body keys: ${Object.keys(req.body).join(', ')}`);
  }
  next();
});

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
app.use('/api/distributors', distributorRoutes); // API quản lý nhà phân phối (sửa comment)
app.use('/api/invoices', invoiceRoutes); // API quản lý hóa đơn (sửa comment)
app.use('/api/invoice_details', invoice_detailsRoutes); // API quản lý chi tiết hóa đơn (sửa comment)
app.use('/api/logs', logRoutes); // API quản lý log (sửa comment)
app.use('/api/log_details', log_detailsRoutes); // API quản lý chi tiết log (sửa comment)
app.use('/api/email', emailRouter);  // API gửi email sẽ có đường dẫn: /api/email/send
app.use('/api/auth', loginRoutes); // API đăng nhập và quên mật khẩu
app.use('/api/statistical', StatisticalService); // API thống kê


// THÊM: Route catch-all 404 với log cụ thể (thay thế middleware cũ)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 404 - No route found for: ${req.method} ${req.path}`);
    return next(new ApiError(404, `Resource not found: ${req.path}`));  // Thêm path vào message để dễ debug
});

// define error-handling middleware last, after other app.use() and routes calls
// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    }); // Log chi tiết hơn để debug
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Lỗi server không xác định';
    res.status(statusCode).json({
        statusCode,
        message
    });
});

module.exports = app;