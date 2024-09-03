const WSClient = require('ws');
const https = require('https');

// Tạo một agent để bỏ qua chứng chỉ SSL
const agent = new https.Agent({ rejectUnauthorized: false });

// Kết nối đến WebSocket server với agent
const socketClient = new WSClient('wss://bwdjourney.id.vn:8080', { agent });

// Khi kết nối được mở
socketClient.on('open', function open() {
  console.log('Connected to WebSocket server');
  // Gửi tin nhắn với định dạng yêu cầu cụ thể
  const message = { type: 'subscribe', user_online: 16 };
  socketClient.send(JSON.stringify(message));
});

// Khi nhận được tin nhắn từ server
socketClient.on('message', function incoming(data) {
  console.log('Received:', data);
});

// Khi xảy ra lỗi
socketClient.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

// Khi kết nối bị đóng
socketClient.on('close', function close() {
  console.log('WebSocket connection closed');
});
