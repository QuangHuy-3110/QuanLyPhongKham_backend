// app/config/chatbot.config.js
// Cấu hình các keyword/chức năng cần đăng nhập

module.exports = {
  // Danh sách keyword yêu cầu đăng nhập (case-insensitive)
  restrictedKeywords: [
    // Đặt lịch hẹn
    'đặt lịch', 'book', 'appointment', 'hẹn khám', 'schedule',
    'lịch hẹn', 'book_appointment',
    
    // Tư vấn
    'tư vấn', 'consultation', 'consult', 'advise',
    
    // Khám bệnh
    'khám bệnh', 'exam', 'medical exam', 'checkup',
    
    // Xem lịch cá nhân
    'xem lịch', 'view schedule', 'my appointments', 'lịch của tôi',
    'check appointment',
    
    // Hồ sơ bệnh án
    'hồ sơ', 'profile', 'medical record', 'health record',
    'bệnh án', 'medical history',
    
    // Đơn thuốc
    'đơn thuốc', 'prescription', 'my prescription',
    
    // Kết quả xét nghiệm
    'kết quả', 'test result', 'xét nghiệm',
    
    // Hủy lịch hẹn (cần auth để verify ownership)
    'hủy lịch', 'cancel appointment', 'cancel booking',
    
    // Thanh toán
    'thanh toán', 'payment', 'pay', 'invoice', 'hóa đơn',
  ],

  // Thông báo hiển thị khi guest bị chặn
  restrictedMessage: '🔒 Bạn cần đăng nhập để sử dụng tính năng này. Vui lòng đăng nhập để đặt lịch, tư vấn hoặc xem hồ sơ nhé!',

  // Các chức năng cho phép guest sử dụng (optional, dùng để document)
  allowedForGuests: [
    'Hỏi thông tin chung về phòng khám',
    'Xem giờ làm việc',
    'Xem danh sách bác sĩ',
    'Hỏi về dịch vụ',
    'Hỏi về giá cả tham khảo',
    'Hỏi địa chỉ, liên hệ',
    'Chào hỏi, hội thoại thông thường',
  ],

  // Timeout cho Rasa API (ms)
  rasaTimeout: 10000,

  // Retry config nếu Rasa fail
  maxRetries: 2,
  retryDelay: 1000,
};