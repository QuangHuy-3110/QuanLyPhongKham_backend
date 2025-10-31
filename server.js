const app = require('./app');
const { Server: WebSocketServer } = require('ws');
require('dotenv').config();
const config = require('./app/config');
const chatbotConfig = require('./app/config/chatbot.config');  // ⚠️ MỚI: Import chatbot config
const pool = require('./app/utils/db.util');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

async function startServer() {
  try {
    const port = config.app.port || 3000;

    const httpServer = app.listen(port, () => {
      console.log(`HTTP server chạy trên cổng ${port}`);
    });

    const wss = new WebSocketServer({ server: httpServer });
    const clients = new Map();
    const patientClients = new Map();
    const chatSessions = new Map();
    const userStates = new Map();

    const humanChatStates = new Map();
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

          // Init bác sĩ/admin (giữ nguyên)
          if (parsedMessage.type === 'init' && parsedMessage.doctorId) {
            clients.set(parsedMessage.doctorId, ws);
            console.log(`${parsedMessage.doctorId === 'Admin' ? 'Admin' : 'Bác sĩ'} ${parsedMessage.doctorId} đã kết nối`);

            // ⚠️ MỚI: Nếu Admin kết nối, gửi cho họ danh sách chat đang chờ
            if (parsedMessage.doctorId === 'Admin') {
                const waitingUsers = [];
                humanChatStates.forEach((state, userId) => {
                    if (state === 'waiting') {
                        waitingUsers.push({ userId, state: userStates.get(userId) });
                    }
                });
                if (waitingUsers.length > 0) {
                    ws.send(JSON.stringify({ type: 'waiting_list', data: waitingUsers }));
                }
            }
          }

          // Init bệnh nhân (logged in)
          if (parsedMessage.type === 'init_patient') {
            const { patientId, token } = parsedMessage;
            
            // ⚠️ FIX: Kiểm tra token có tồn tại VÀ verify thành công
            let isLoggedIn = false;
            let decoded = null;
            
            if (token && token !== 'null' && token !== 'undefined') {
              decoded = verifyToken(token);
              isLoggedIn = !!decoded;  // Chỉ true nếu decoded thành công
            }
            
            userStates.set(patientId, { 
              logged_in: isLoggedIn,
              userData: decoded || null
            });
            patientClients.set(patientId, ws);
            console.log(`✅ Bệnh nhân ${patientId} đã kết nối (logged_in: ${isLoggedIn}, token valid: ${!!decoded})`);
          }

          // Init guest
          if (parsedMessage.type === 'init_guest') {
            const { guestId } = parsedMessage;
            userStates.set(guestId, { logged_in: false, userData: null });
            patientClients.set(guestId, ws);
            console.log(`👤 Guest ${guestId} đã kết nối (logged_in: false)`);
          }

          // ⚠️ MỚI: Xử lý yêu cầu Handoff
          if (parsedMessage.type === 'request_human_handoff') {
            const { userId, context } = parsedMessage;
            humanChatStates.set(userId, 'waiting'); // Trạng thái đang chờ
            
            const adminWs = clients.get('Admin');
            
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                // Gửi cho Admin
                adminWs.send(JSON.stringify({
                    type: 'new_support_request',
                    data: {
                        userId: userId,
                        // Gửi kèm lịch sử chat (context) nếu có
                        history: context || [{ text: 'Bệnh nhân yêu cầu hỗ trợ.' }]
                    }
                }));
                
                // Gửi cho Patient
                ws.send(JSON.stringify({
                    type: 'handoff_initiated',
                    text: 'Đã gửi yêu cầu đến hỗ trợ viên. Vui lòng đợi trong giây lát...'
                }));
                console.log(`[Handoff] Yêu cầu từ ${userId} đã gửi đến Admin.`);
            } else {
                // Gửi cho Patient
                ws.send(JSON.stringify({
                    type: 'handoff_initiated',
                    text: 'Hiện không có hỗ trợ viên nào trực tuyến. Vui lòng thử lại sau.'
                }));
                humanChatStates.set(userId, 'bot'); // Trả lại chế độ bot
                console.log(`[Handoff] Yêu cầu từ ${userId} thất bại, Admin offline.`);
            }
          }

          // ⚠️ MỚI: Xử lý tin nhắn chat trực tiếp (Human-to-Human)
          if (parsedMessage.type === 'human_chat_message') {
            const { sender, userId, text, recipientId } = parsedMessage;

            if (sender === 'Patient') {
                // Bệnh nhân gửi -> Chuyển cho Admin
                humanChatStates.set(userId, 'human'); // Đảm bảo trạng thái là 'human'
                const adminWs = clients.get('Admin');
                if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                    adminWs.send(JSON.stringify({
                        type: 'human_chat_message',
                        userId: userId, // Báo cho Admin biết tin nhắn này của ai
                        text: text
                    }));
                    console.log(`[Handoff] Patient ${userId} -> Admin`);
                }
            }
            
            if (sender === 'Admin') {
                // Admin gửi -> Chuyển cho Bệnh nhân
                const patientWs = patientClients.get(recipientId); // 'recipientId' là userId của bệnh nhân
                if (patientWs && patientWs.readyState === WebSocket.OPEN) {
                    humanChatStates.set(recipientId, 'human'); // Đảm bảo trạng thái là 'human'
                    patientWs.send(JSON.stringify({
                        type: 'human_chat_message',
                        sender: 'Admin',
                        text: text
                    }));
                    console.log(`[Handoff] Admin -> Patient ${recipientId}`);
                }
            }
          }

          // ⚠️ MỚI: Xử lý kết thúc Handoff
          if (parsedMessage.type === 'end_human_chat') {
            const { userId, initiatedBy } = parsedMessage; // initiatedBy có thể là 'Admin' hoặc 'Patient'
            humanChatStates.set(userId, 'bot'); // Chuyển về chế độ bot
            
            console.log(`[Handoff] Chat giữa Admin và ${userId} đã kết thúc.`);

            if (initiatedBy === 'Admin') {
                // Admin kết thúc, báo cho Patient
                const patientWs = patientClients.get(userId);
                if (patientWs && patientWs.readyState === WebSocket.OPEN) {
                    patientWs.send(JSON.stringify({
                        type: 'handoff_ended',
                        text: 'Hỗ trợ viên đã kết thúc trò chuyện. Bạn quay lại chat với Bot.'
                    }));
                }
            } else {
                // Patient kết thúc, báo cho Admin
                const adminWs = clients.get('Admin');
                if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                    adminWs.send(JSON.stringify({
                        type: 'handoff_ended',
                        userId: userId, // Báo cho Admin biết chat nào kết thúc
                        text: `Bệnh nhân ${userId} đã kết thúc trò chuyện.`
                    }));
                }
            }
          }


          // ⚠️ SỬA: Xử lý chat message với keyword filtering CHÍNH XÁC
          if (parsedMessage.type === 'chat_message') {
            const { userId, message } = parsedMessage;

            // ⚠️ SỬA LẠI ĐIỀU KIỆN KIỂM TRA
            const chatState = humanChatStates.get(userId);

            // Chỉ bỏ qua Rasa nếu user ĐANG CHỜ hoặc ĐANG CHAT VỚI NGƯỜI
            // Thay vì (chatState !== 'bot')
            if (chatState === 'human' || chatState === 'waiting') {
                console.log(`[Rasa] Bỏ qua tin nhắn (đang ở chế độ ${chatState}): ${message}`);
                
                // Gửi lại thông báo cho user biết họ đang ở đâu
                ws.send(JSON.stringify({
                    type: 'bot_response',
                    data: { messages: [{ text: 'Bạn đang trong cuộc trò chuyện với hỗ trợ viên. Để quay lại chat với bot, vui lòng "Kết thúc trò chuyện".' }] }
                }));
                return; // Dừng lại, không gửi cho Rasa
            }


            const rasaUrl = process.env.RASA_URL || 'http://localhost:5005';
            const state = userStates.get(userId);
            const isLoggedIn = state ? state.logged_in : false;
            
            // ⚠️ DEBUG: Log rõ ràng state
            console.log(`📩 Chat message from ${userId}:`);
            console.log(`   - Message: "${message}"`);
            console.log(`   - logged_in: ${isLoggedIn}`);
            console.log(`   - State:`, state);

            // ⚠️ SỬA: Danh sách keyword cần đăng nhập (sử dụng config)
            const restrictedKeywords = chatbotConfig.restrictedKeywords;
            
            const isRestrictedRequest = restrictedKeywords.some(keyword => 
              message.toLowerCase().includes(keyword.toLowerCase())
            );
            
            // Block nếu guest gửi request restricted
            if (!isLoggedIn && isRestrictedRequest) {
              console.log(`🚫 Block restricted request từ guest ${userId}: "${message}"`);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'bot_response',
                  data: { 
                    messages: [{ 
                      text: chatbotConfig.restrictedMessage  // ⚠️ Dùng message từ config
                    }], 
                    sessionId: chatSessions.get(userId) || null
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
              // Gọi Rasa với metadata (logged_in + patientId)
              const response = await axios.post(`${rasaUrl}/webhooks/rest/webhook`, {
                sender: sessionId,
                message: message,
                metadata: { 
                  patientId: isLoggedIn ? userId : null,  // Chỉ gửi patientId nếu logged in
                  logged_in: isLoggedIn,
                  user_data: state?.userData || null  // Gửi thêm user data nếu có
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
                console.log(`✅ Bot response cho ${userId} (${botResponse.length} messages)`);
              }
            } catch (error) {
              console.error('❌ Lỗi gọi Rasa:', error.message);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'bot_response',
                  data: { messages: [{ text: '⚠️ Lỗi kết nối bot. Vui lòng thử lại sau.' }] }
                }));
              }
            }
          }

          // ⚠️ MỚI: Handle login update từ frontend (khi user login/logout trong tab)
          if (parsedMessage.type === 'update_login_status') {
            const { userId, token } = parsedMessage;
            const decoded = verifyToken(token);
            const isLoggedIn = !!decoded;
            
            userStates.set(userId, { 
              logged_in: isLoggedIn,
              userData: decoded || null
            });
            humanChatStates.set(userId, 'bot');
            console.log(`🔄 Cập nhật login status cho ${userId}: ${isLoggedIn}`);
          }

          // Các handlers khác (appointment, patient, drug, etc.) - GIỮ NGUYÊN
          if (parsedMessage.type === 'new_appointment') {
            const appointment = parsedMessage.data;
            const doctorWs = clients.get(appointment.maBS);
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
                type: 'appointment_update',
                data: appointment,
              }));
              console.log(`Thông báo gửi đến bác sĩ ${appointment.maBS}`);
            }
            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'appointment_update',
                data: appointment,
              }));
            }
          }

          // Cancel appointment handler - GIỮ NGUYÊN
          if (parsedMessage.type === 'cancel_appointment' && parsedMessage.sender === 'Admin') {
            const appointment = parsedMessage.data;
            const patientWs = patientClients.get(appointment.maBN);
            if (patientWs && patientWs.readyState === WebSocket.OPEN) {
              patientWs.send(JSON.stringify({
                type: 'appointment_cancelled',
                data: appointment,
              }));
            }
            const doctorWs = clients.get(appointment.maBS);
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
                type: 'appointment_cancelled',
                data: appointment,
              }));
            }
          }

          // Examined appointment - GIỮ NGUYÊN
          if (parsedMessage.type === 'appointment_examined' && parsedMessage.sender === 'doctor') {
            const appointment = parsedMessage.data;
            const patientWs = patientClients.get(appointment.maBN);
            if (patientWs && patientWs.readyState === WebSocket.OPEN) {
              patientWs.send(JSON.stringify({
                type: 'appointment_examined',
                data: appointment,
              }));
            }
            const adminWs = clients.get('Admin');
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
              adminWs.send(JSON.stringify({
                type: 'appointment_examined',
                data: appointment,
              }));
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
        // Cleanup khi disconnect
        for (let [clientId, client] of clients) {
          if (client === ws) {
            clients.delete(clientId);
            console.log(`${clientId === 'Admin' ? 'Admin' : 'Bác sĩ'} ${clientId} đã ngắt kết nối`);
            break;
          }
        }
        for (let [userId, client] of patientClients) {
          if (client === ws) {
            patientClients.delete(userId);
            userStates.delete(userId);
            chatSessions.delete(userId);
            humanChatStates.delete(userId); // ⚠️ MỚI: Xóa trạng thái handoff
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