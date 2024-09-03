const WebSocket = require('ws');

// Thay thế URL bằng địa chỉ IP và cổng của bạn
const ws = new WebSocket('ws://localhost:8866');

// Khi kết nối WebSocket mở
ws.on('open', () => {
    console.log('Connected');
    
    // Tạo đối tượng dữ liệu
    const message = {
        type: 'subscribe',
        user_online: 16
    };
    
    // Gửi đối tượng dưới dạng chuỗi JSON
    ws.send(JSON.stringify(message));
});

// Xử lý các tin nhắn đến
ws.on('message', (data) => {
    console.log('Message from server:', data);
});

// Xử lý khi kết nối đóng
ws.on('close', () => {
    console.log('Disconnected');
});

// Xử lý lỗi kết nối
ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
});
