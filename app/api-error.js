class ApiError extends Error {
  constructor(statusCode, message) {
      super(message); // Gọi constructor của Error để gán message
      this.statusCode = statusCode;
      this.message = message;
      Error.captureStackTrace(this, this.constructor); // Giữ stack trace
  }
}

module.exports = ApiError;