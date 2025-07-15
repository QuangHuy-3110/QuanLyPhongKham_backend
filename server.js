// const app = require('./app');

// require('dotenv').config(); // Tải biến môi trường trước
// const config = require('./app/config');
// const pool = require('./app/utils/db.util');

// async function startServer() {
//     try {
//         await pool.execute('SELECT 1'); // Truy vấn thử để kiểm tra kết nối Không cần kiểm tra kết nối vì db.util.js đã làm
//         const port = config.app.port || 3000; // Giá trị cổng mặc định
//         app.listen(port, () => {
//             console.log(`Server chạy trên cổng ${port}`);
//         });
//     } catch (error) {
//         console.error('Lỗi khi khởi động server:', error);
//         process.exit(1);
//     }
// }

// startServer();

// ==================================================================================================
const app = require('./app');
const { Server: WebSocketServer } = require('ws');
require('dotenv').config();
const config = require('./app/config');
const pool = require('./app/utils/db.util');

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

    wss.on('connection', (ws) => {
      console.log('Client đã kết nối!');

      ws.on('message', async (message) => {
        try {
          const parsedMessage = JSON.parse(message);

          // Lưu client bác sĩ hoặc admin
          if (parsedMessage.type === 'init' && parsedMessage.doctorId) {
            clients.set(parsedMessage.doctorId, ws);
            console.log(`${parsedMessage.doctorId === 'Admin' ? 'Admin' : 'Bác sĩ'} ${parsedMessage.doctorId} đã kết nối`);
          }

          // Lưu client bệnh nhân
          if (parsedMessage.type === 'init_patient' && parsedMessage.patientId) {
            patientClients.set(parsedMessage.patientId, ws);
            console.log(`Bệnh nhân ${parsedMessage.patientId} đã kết nối`);
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

            // Gửi thông báo đến bác sĩ (tùy chọn)
            const doctorWs = clients.get('Admin');
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
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

            const doctorWs = clients.get('Admin');
            if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
              doctorWs.send(JSON.stringify({
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
              if ( ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'drug_update',
                  data: drug,
                }));
                console.log(`Thông báo cập nhật số lượng thuốc gửi đến bác sĩ ${clientId}`);
              }
            });
          }
          
        } catch (error) {
          console.error('Lỗi khi xử lý tin nhắn:', error);
        }
      });

      ws.on('close', () => {
        // Xóa client bác sĩ hoặc admin
        for (let [clientId, client] of clients) {
          if (client === ws) {
            clients.delete(clientId);
            console.log(`${clientId === 'Admin' ? 'Admin' : 'Bác sĩ'} ${clientId} đã ngắt kết nối`);
            break;
          }
        }

        // Xóa client bệnh nhân
        for (let [patientId, client] of patientClients) {
          if (client === ws) {
            patientClients.delete(patientId);
            console.log(`Bệnh nhân ${patientId} đã ngắt kết nối`);
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