const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
        socket.join(data.roomId);
        socket.to(data.roomId).emit('user_joined', { name: data.name, id: socket.id });
    });

    socket.on('chat_message', (data) => {
        io.to(data.roomId).emit('chat_message', { name: data.name, text: data.text });
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

server.listen(3000, () => console.log('الخادم يعمل على الرابط: http://localhost:3000'));