const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// إضافة إعدادات CORS لتجنب حظر الاتصال بين الواجهة والسيرفر
const io = new Server(server, {
    cors: {
        origin: "*", // يسمح بالاتصال من أي رابط
        methods: ["GET", "POST"]
    }
});

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
        socket.join(data.roomId);
        socket.to(data.roomId).emit('user_joined', { name: data.name, id: socket.id });
    });

    // استلام وإرسال الرسائل النصية
    socket.on('chat_message', (data) => {
        // استخدام socket.to لإرسال الرسالة إلى الطرف الآخر في الغرفة فقط (باستثناء المرسل)
        socket.to(data.roomId).emit('chat_message', { name: data.name, text: data.text });
    });

    // إشارات WebRTC للاتصال المرئي والصوتي
    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', { offer: data.offer, sender: socket.id });
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', { answer: data.answer, sender: socket.id });
    });

    socket.on('ice_candidate', (data) => {
        socket.to(data.roomId).emit('ice_candidate', { candidate: data.candidate });
    });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ: ${PORT}`);
});