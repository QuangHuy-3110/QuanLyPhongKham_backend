const app = require('./app');
const { Server: WebSocketServer } = require('ws');
require('dotenv').config();
const config = require('./app/config');
const pool = require('./app/utils/db.util');
const axios = require('axios');
const jwt = require('jsonwebtoken');  // Thêm JWT

async function startServer() {
  try {
    const port = config.app.port || 3000;

    // Tạo HTTP server từ app
    const httpServer = app.listen(port, () => {
      console.log(`HTTP server chạy trên cổng ${port}`);
    });

    // Tích hợp WebSocket server vào HTTP server
    const wss = new WebSocketServer({ server: httpServer });
    const clients = new Map(); // Lưu client bác sĩ và admin theo doctorId
    const patientClients = new Map(); // Lưu client bệnh nhân theo patientId
    const chatSessions = new Map();  // Session Rasa theo userId
    const userStates = new Map();  // MỚI: Lưu trạng thái { logged_in: bool } theo userId

    // Hàm verify token
    function verifyToken(token) {
      try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (err) {
        return null;
      }
    }

    wss.on('connection', (ws) => {
      console.log('Client đã kết nối!');

      ws.on('message', async (message) => {
        try {
          const parsedMessage = JSON.parse(message);

          // Lưu client bác sĩ hoặc admin (giữ nguyên)
          if (parsedMessage.type === 'init' && parsedMessage.doctorId) {
            clients.set(parsedMessage.doctorId, ws);
            console.log(`${parsedMessage.doctorId === 'Admin' ? 'Admin' : 'Bác sĩ'} ${parsedMessage.doctorId} đã kết nối`);
          }

          // MỚI: Init bệnh nhân (logged_in dựa trên token)
          if (parsedMessage.type === 'init_patient') {
            const { patientId, token } = parsedMessage;
            const isLoggedIn = !!token && !!verifyToken(token);
            userStates.set(patientId, { logged_in: isLoggedIn });
            patientClients.set(patientId, ws);
            console.log(`Bệnh nhân ${patientId} đã kết nối (logged_in: ${isLoggedIn})`);
          }

          // MỚI: Init guest (không token)
          if (parsedMessage.type === 'init_guest') {
            const { guestId } = parsedMessage;  // guestId như 'guest_xxx'
            userStates.set(guestId, { logged_in: false });
            patientClients.set(guestId, ws);
            console.log(`Guest ${guestId} đã kết nối (logged_in: false)`);
          }

          // MỚI: Xử lý tin nhắn chat từ bệnh nhân/guest (gửi đến Rasa với logged_in)
          if (parsedMessage.type === 'chat_message') {
            const { userId, message } = parsedMessage;  // userId = patientId hoặc guestId
            const rasaUrl = process.env.RASA_URL || 'http://localhost:5005';

            // Lấy trạng thái logged_in
            const state = userStates.get(userId);
            const isLoggedIn = state ? state.logged_in : false;
            console.log(`Chat từ ${userId} (logged_in: ${isLoggedIn})`);

            // SỬA: Filter keyword với ngoặc đơn đúng, mở rộng keyword (optional)
            const advancedKeywords = ['đặt lịch', 'lịch hẹn', 'book_appointment', 'tư vấn', 'consultation', 'khám bệnh', 'exam'];
            const isAdvancedRequest = advancedKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
            
            if (!isLoggedIn && isAdvancedRequest) {
              console.log(`Block advanced request từ guest ${userId}: "${message}"`);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'bot_response',
                  data: { 
                    messages: [{ text: 'Bạn cần đăng nhập để sử dụng tính năng này. Hãy đăng nhập để đặt lịch hoặc tư vấn nhé!' }], 
                    sessionId: null  // Hoặc dùng sessionId hiện tại nếu có
                  }
                }));
              }
              return;  // Không gửi đến Rasa
            }

            // Tạo/lấy session_id cho Rasa
            let sessionId = chatSessions.get(userId);
            if (!sessionId) {
              sessionId = `session_${userId}_${Date.now()}`;
              chatSessions.set(userId, sessionId);
            }

            try {
              // Gọi Rasa REST API với metadata logged_in
              const response = await axios.post(`${rasaUrl}/webhooks/rest/webhook`, {
                sender: sessionId,
                message: message,
                metadata: { 
                  patientId: userId, 
                  logged_in: isLoggedIn  // Rasa sẽ dùng custom action để set slot
                }
              }, { timeout: 10000 });

              const botResponse = response.data;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'bot_response',
                  data: { 
                    messages: botResponse, 
                    sessionId 
                  }
                }));
                console.log(`Full bot response cho ${userId}:`, JSON.stringify(botResponse, null, 2));
              }
            } catch (error) {
              console.error('Lỗi gọi Rasa:', error.message);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'bot_response',
                  data: { messages: [{ text: 'Lỗi kết nối bot. Vui lòng thử lại.' }] }
                }));
              }
            }
          }

          // Xử lý lịch hẹn mới từ bệnh nhân
          if (parsedMessage.type === 'new_appointment') {
            const appointment = parsedMessage.data;

            // Gửi thông báo đến bác sĩ
            const doctorWs = clients.get(appointment.maBS);
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
                type: 'appointment_update',
                data: appointment,
              }));
              console.log(`Thông báo gửi đến bác sĩ ${appointment.maBS}`);
            } else {
              console.log(`Bác sĩ ${appointment.maBS} không trực tuyến`);
            }

            // Gửi thông báo đến admin
            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'appointment_update',
                data: appointment,
              }));
              console.log('Thông báo gửi đến Admin');
            } else {
              console.log('Admin không trực tuyến');
            }
          }

          // Xử lý hủy lịch hẹn từ admin
          if (parsedMessage.type === 'cancel_appointment' && parsedMessage.sender === 'Admin') {
            const appointment = parsedMessage.data;

            // Gửi thông báo đến bệnh nhân
            const patientWs = patientClients.get(appointment.maBN);
            if (patientWs && patientWs.readyState === WebSocket.OPEN) {
              patientWs.send(JSON.stringify({
                type: 'appointment_cancelled',
                data: appointment,
              }));
              console.log(`Thông báo hủy gửi đến bệnh nhân ${appointment.maBN}`);
            } else {
              console.log(`Bệnh nhân ${appointment.maBN} không trực tuyến`);
            }

            // Gửi thông báo đến bác sĩ (tùy chọn)
            const doctorWs = clients.get(appointment.maBS);
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
                type: 'appointment_cancelled',
                data: appointment,
              }));
              console.log(`Thông báo hủy gửi đến bác sĩ ${appointment.maBS}`);
            } else {
              console.log(`Bác sĩ ${appointment.maBS} không trực tuyến`);
            }
          }

          // Xử lý hẹn từ bác sĩ
          if (parsedMessage.type === 'appointment_examined' && parsedMessage.sender === 'doctor') {
            const appointment = parsedMessage.data;

            // Gửi thông báo đến bệnh nhân
            const patientWs = patientClients.get(appointment.maBN);
            if (patientWs && patientWs.readyState === WebSocket.OPEN) {
              patientWs.send(JSON.stringify({
                type: 'appointment_examined',
                data: appointment,
              }));
              console.log(`Thông báo đã khám gửi đến bệnh nhân ${appointment.maBN}`);
            } else {
              console.log(`Bệnh nhân ${appointment.maBN} không trực tuyến`);
            }

            // Gửi thông báo đến admin
            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'appointment_examined',
                data: appointment,
              }));
              console.log(`Thông báo đã khám gửi đến Admin`);
            } else {
              console.log(`Admin không trực tuyến`);
            }
          }

          // Thêm bệnh nhân
          if (parsedMessage.type === 'interact_patient' && parsedMessage.sender === 'doctor') {
            const patient = parsedMessage.data;

            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'patient_update',
                data: patient,
              }));
              console.log(`Thông báo thêm bệnh nhân gửi đến Admin`);
            } else {
              console.log(`Admin không trực tuyến`);
            }
          }

          // Xóa bệnh nhân
          if (parsedMessage.type === 'interact_patient' && parsedMessage.sender === 'Admin') {
            const patient = parsedMessage.data;

            // Gửi thông báo đến toàn bộ bác sĩ
            clients.forEach((ws, clientId) => {
              if (clientId !== 'Admin' && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'patient_update',
                  data: patient,
                }));
                console.log(`Thông báo xóa bệnh nhân gửi đến bác sĩ ${clientId}`);
              }
            });
          }

          // xóa số lượng thuốc
          if (parsedMessage.type === 'interact_drug' && parsedMessage.sender === 'doctor') {
            const drug = parsedMessage.data;

            clients.forEach((ws, clientId) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'drug_update',
                  data: drug,
                }));
                console.log(`Thông báo cập nhật số lượng thuốc gửi đến bác sĩ ${clientId}`);
              }
            });
          }

          // thêm thuốc
          if (parsedMessage.type === 'interact_drug' && parsedMessage.sender === 'Admin') {
            const drug = parsedMessage.data;

            clients.forEach((ws, clientId) => {
              if (clientId !== 'Admin' && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'drug_update',
                  data: drug,
                }));
                console.log(`Thông báo cập nhật số lượng thuốc gửi đến bác sĩ ${clientId}`);
              }
            });
          }

          // Thêm hồ sơ bệnh án
          if (parsedMessage.type === 'interact_record' && parsedMessage.sender === 'doctor') {
            const record = parsedMessage.data;

            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'record_created',
                data: record,
              }));
              console.log(`Thông báo thêm hồ sơ khám bệnh gửi đến Admin`);
            } else {
              console.log(`Admin không trực tuyến`);
            }
          }

          // Thêm sồ lần khám bệnh
          if (parsedMessage.type === 'interact_exam' && parsedMessage.sender === 'doctor') {
            const exam = parsedMessage.data;

            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'exam_created',
                data: exam,
              }));
              console.log(`Thông báo thêm số lần khám bệnh gửi đến Admin`);
            } else {
              console.log(`Admin không trực tuyến`);
            }
          }

          // Thêm lịch khám bệnh
          if (parsedMessage.type === 'created_schedule' && parsedMessage.sender === 'Admin') {
            const schedule = parsedMessage.data;

            const doctorWs = clients.get(schedule.maBS);
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
                type: 'created_schedule',
                data: schedule,
              }));
              console.log(`Thông báo thêm lịch làm việc cho bác sĩ ${schedule.maBS}`);
            } else {
              console.log(`Bác sĩ ${schedule.maBS} không trực tuyến`);
            }
          }
          
        } catch (error) {
          console.error('Lỗi khi xử lý tin nhắn:', error);
        }
      });

      ws.on('close', () => {
        // Xóa client bác sĩ hoặc admin (giữ nguyên)
        for (let [clientId, client] of clients) {
          if (client === ws) {
            clients.delete(clientId);
            console.log(`${clientId === 'Admin' ? 'Admin' : 'Bác sĩ'} ${clientId} đã ngắt kết nối`);
            break;
          }
        }

        // Xóa client bệnh nhân/guest
        for (let [userId, client] of patientClients) {
          if (client === ws) {
            patientClients.delete(userId);
            userStates.delete(userId);  // MỚI: Cleanup trạng thái
            chatSessions.delete(userId);  // Cleanup session
            console.log(`User ${userId} đã ngắt kết nối`);
            break;
          }
        }
      });
    });

    console.log(`WebSocket server tích hợp trên cổng ${port}`);
  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
    process.exit(1);
  }
}

startServer();