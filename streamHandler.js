const { Writable } = require('stream');
const fs = require('fs');
const path = require('path');

// Đảm bảo thư mục tồn tại, nếu không thì tạo mới
const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
};

function handleStream(ws, data, wss) {
    // Giả định rằng phần thread được mã hóa thành 4 byte đầu tiên của dữ liệu
    const threadBuffer = data.slice(0, 4); // 4 byte cho số nguyên 32-bit
    const videoData = data.slice(4); // Phần còn lại là dữ liệu video

    // Giải mã thread thành số nguyên
    const thread = new DataView(threadBuffer.buffer).getUint32(0, true);
    console.log('Thread nhận được:', thread);

    // Gửi dữ liệu tới tất cả các client có thread tương ứng
    wss.clients.forEach((client) => {
        // Kiểm tra nếu client mở kết nối và có thuộc tính thread phù hợp
        if (client.readyState === ws.OPEN && client.thread_screen == thread) {
            client.send(videoData);
            console.log('Đang gửi dữ liệu cho client với thread:', client.thread_screen);
        }
    });
}

module.exports = {
    handleStream
};
