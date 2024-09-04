const WebSocket = require('ws');

// Xử lý khi nhận được tin nhắn từ client
function handleMessage(ws, message, wss) {
    const parsedMessage = JSON.parse(message);
    console.log('Received message:', parsedMessage); 

    switch (parsedMessage.type) {
        case 'subscribe':
            handleSubscribe(ws, parsedMessage,wss);
            break;
        case 'comment':
            handleComment(ws, parsedMessage, wss);
            break;
        case 'sendMessage':
            handleSendMessage(ws, parsedMessage, wss);
            handleMessageUserUpdate(ws, parsedMessage, wss);
            break;
        case 'getUserOnlines':
            handleGetUserOnlines(ws, parsedMessage, wss);
            break;
        case 'chatgroup': // Add case for chatgroup
            handleChatGroup(ws, parsedMessage, wss);
            break;
        case 'screenShare':
            handleScreenShare(ws, parsedMessage, wss);
            break;
        case 'screenShareStop':
            break;
        default:
            console.log('Unknown message type:', parsedMessage.type);
            break;
    }
}

// Xử lý đăng ký (subscribe)
function handleSubscribe(ws, parsedMessage, wss) {
    console.log('Subscribe:', parsedMessage);
    // Dành cho tin nhắn
    ws.user_to_chat = parsedMessage.user_to_chat;
    ws.user_from_chat = parsedMessage.user_from_chat;
    // Dành cho MessengerUser
    ws.user_from = parsedMessage.user_from;
    // Dành cho comment
    ws.post_ID = parsedMessage.post_ID;
    // Trạng thái hoạt động
    ws.user_online = parsedMessage.user_online;
    // Dành cho group chat
    ws.user_group_from = parsedMessage.user_group_from;
    ws.group_id = parsedMessage.group_id;
    ws.chat_group_from = parsedMessage.chat_group_from;
    // Thread
    ws.thread = parsedMessage.thread;
    // Dành cho thành viên đang tham gia Meeting
    ws.thread_user = parsedMessage.thread_user;
    ws.thread_meeting = parsedMessage.thread_meeting;
    if (parsedMessage.thread_user && parsedMessage.thread_meeting) {
        userMeeting(ws, parsedMessage, wss)
    }
    ws.thread_screen = parsedMessage.thread_screen;
    console.log("người dùng đăng ký thread_screen:", ws.thread_screen);
}

function handleScreenShare(ws, parsedMessage, wss) {

    // Kiểm tra và gửi dữ liệu video cho các client trong cùng một thread
    wss.clients.forEach(client => {
        // Kiểm tra xem client đã đăng ký thread và có sẵn kết nối WebSocket không
        if (client.readyState === WebSocket.OPEN && client.thread === parsedMessage.thread) {
            client.send(JSON.stringify(parsedMessage));
            console.log('Gửi dữ liệu đến client trong cùng thread:', parsedMessage.thread);
        }
    });
}

const threads = {}; // Object to store thread information

function userMeeting(ws, parsedMessage, wss) {
    const { thread_meeting, userInfo } = parsedMessage;

    // If the thread doesn't exist, create it and add the user to the array
    if (!threads[thread_meeting]) {
        threads[thread_meeting] = [];
    }

    // Add the user to the array if they don't already exist
    const userExists = threads[thread_meeting].some(user => user.userId === userInfo.userId);
    if (!userExists) {
        threads[thread_meeting].push(userInfo);
        console.log(`User ${userInfo.name} has joined thread ${thread_meeting}`);
    }

    // Assign the thread_meeting to the WebSocket connection for tracking
    ws.thread_meeting = thread_meeting;

    // Send the updated user list to all clients in the same thread
    const messageToSend = {
        type: 'userListUpdate',
        thread_meeting: thread_meeting,
        users: threads[thread_meeting]
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.thread_meeting === thread_meeting) {
            client.send(JSON.stringify(messageToSend));
            console.log('Sent user list to client in thread:', thread_meeting);
        }
    });

    // Handle the case where a user disconnects
    ws.on('close', () => {
    console.log(`User ${userInfo.name} has disconnected from thread ${thread_meeting}`);

    // Kiểm tra xem thread_meeting có tồn tại không
    if (threads[thread_meeting]) {
        // Remove the user from the thread_meeting array
        threads[thread_meeting] = threads[thread_meeting].filter(user => user.userId !== userInfo.userId);

        if (threads[thread_meeting].length === 0) {
            delete threads[thread_meeting];
        }

        // Broadcast the updated user list to all remaining clients in the thread
        const updatedMessage = {
            type: 'userListUpdate',
            thread_meeting: thread_meeting,
            users: threads[thread_meeting] || []
        };

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.thread_meeting === thread_meeting) {
                client.send(JSON.stringify(updatedMessage));
                console.log('Sent updated user list after disconnection in thread:', thread_meeting);
            }
        });
    }
});
}
// Xử lý tin nhắn comment
function handleComment(ws, parsedMessage, wss) {
    console.log('Received comment:', parsedMessage); // Log received comment
    wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN && client.post_ID === parsedMessage.post_ID) {
            client.send(JSON.stringify(parsedMessage)); // Đảm bảo gửi tin nhắn dưới dạng chuỗi JSON
        }
    });
}

// Xử lý tin nhắn gửi đi
function handleSendMessage(ws, parsedMessage, wss) {
    console.log('Received message to send:', parsedMessage); // Log received message to send
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && 
            ((client.user_to_chat === parsedMessage.user_to && client.user_from_chat === parsedMessage.user_from))) {
            client.send(JSON.stringify(parsedMessage)); 
        }
    });
}

// Xử lý tin nhắn gửi đi từ user_from
function handleMessageUserUpdate(ws, parsedMessage, wss) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && (client.user_from_chat === parsedMessage.user_from_chat
            ||
            client.user_to_chat === parsedMessage.user_from || client.user_from === parsedMessage.user_to
        )) {
            client.send(JSON.stringify(parsedMessage)); 
        }
    });
}

function handleGetUserOnlines(ws, parsedMessage, wss) {
    const onlineUsers = parsedMessage.onlineUsers;
    const result = [];
    console.log('Mảng nhận được:', onlineUsers);

    wss.clients.forEach(client => {
        const clientUserOnline = parseInt(client.user_online); // Chuyển đổi thành kiểu integer

        if (!isNaN(clientUserOnline) && onlineUsers.includes(clientUserOnline)) {
            result.push(clientUserOnline);
        }
    });

    console.log("Mảng sau khi kiểm tra:", result);

    ws.send(JSON.stringify({ type: 'getUserOnlines', onlineUsers: result }));
}

function handleChatGroup(ws, parsedMessage, wss) {
    console.log('Received chatgroup message:', parsedMessage);
    console.log('Của group:', parsedMessage.group_id);
    console.log('Mảng userIds:', parsedMessage.userIds); // Log received message

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.group_id === parsedMessage.group_id) {
            client.send(JSON.stringify(parsedMessage)); 
            console.log('Gửi thông báo cho client:', client.group_id, "và người dùng:", client.user_group_from);
        }
        
        // Kiểm tra xem ws.chat_group_from có nằm trong mảng userIds không
        if (parsedMessage.userIds.includes(parseInt(client.chat_group_from))) {
            client.send(JSON.stringify(parsedMessage));
            console.log('Gửi thông báo cho chatbox:', client.chat_group_from);
        }
    });
}

// Xử lý khi client đóng kết nối
function handleClientClose() {
    console.log('Client disconnected');
}

module.exports = {
    handleMessage,
};