const pool = require('../utils/db.util');  // Require pool trước (giả sử đường dẫn đúng)
const ApiError = require('../api-error');  // Require ApiError

// SỬA: Require AuthService với error handling
let AuthService;
try {
  AuthService = require('../services/login.service');
  console.log('AuthService loaded successfully!');  // Log để test
} catch (error) {
  console.error('Failed to load AuthService:', error);
  process.exit(1);  // Dừng server nếu require fail
}

exports.login = async (req, res, next) => {
    try {
        const authService = new AuthService(pool);  // Bây giờ AuthService đã defined
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return next(new ApiError(400, 'Missing fields: username, password, role'));
        }
        console.log('Calling login service with:', { username, role });  // Log input
        const result = await authService.login(username, password, role);
        return res.send(result);
    } catch (error) {
        console.error('Detailed login error:', error);  // Log chi tiết
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi đăng nhập'));
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const authService = new AuthService(pool);
        const { username, email, role } = req.body;
        if (!username || !email || !role) {
            return next(new ApiError(400, 'Missing fields: username, email, role'));
        }
        console.log('Calling forgotPassword service with:', { username, role });  // Log input
        const result = await authService.forgotPassword(username, email, role);
        return res.send(result);
    } catch (error) {
        console.error('Detailed forgotPassword error:', error);  // Log chi tiết
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi đặt lại mật khẩu'));
    }
};