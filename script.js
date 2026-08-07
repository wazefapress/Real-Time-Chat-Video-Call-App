// ==========================================
// 1. إعدادات السيرفر (Render) والاتصال
// ==========================================
const SERVER_URL = "https://real-time-chat-video-call-app.onrender.com"; 
let socket;
//const socket = io();
let currentRoom = "";
let myName = "";
let localStream;
let peerConnection;

const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom() {
    myName = document.getElementById('username').value.trim();
    if (!myName) return alert("أدخل اسمك أولاً!");
    currentRoom = generateRoomCode();
    initRoom();
}

function joinRoom() {
    myName = document.getElementById('username').value.trim();
    currentRoom = document.getElementById('roomIdInput').value.trim().toUpperCase();
    if (!myName || !currentRoom) return alert("أدخل الاسم وكود الغرفة!");
    initRoom();
}

function initRoom() {
    document.getElementById('landing-area').classList.add('d-none');
    document.getElementById('landing-area').classList.remove('d-flex');
    document.getElementById('chat-area').classList.remove('d-none');
    document.getElementById('chat-area').classList.add('d-flex');
    document.getElementById('displayRoomId').textContent = currentRoom;
    socket.emit('join_room', { roomId: currentRoom, name: myName });
}

function copyCode() {
    navigator.clipboard.writeText(currentRoom);
    alert("تم نسخ كود الغرفة بنجاح!");
}

function leaveRoom() {
    location.reload();
}

// المراسلة النصية
function sendMessage() {
    const text = document.getElementById('messageInput').value.trim();
    if (text) {
        socket.emit('chat_message', { roomId: currentRoom, name: myName, text });
        document.getElementById('messageInput').value = '';
        document.getElementById('emoji-picker').classList.add('d-none'); // إخفاء الإيموجي بعد الإرسال
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

socket.on('chat_message', (data) => {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'mb-2 p-2 rounded bg-white border shadow-sm';
    div.innerHTML = `<strong>${data.name}:</strong> ${data.text}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// مكالمات الصوت والفيديو باستخدام WebRTC
async function startCall(videoEnabled) {
    document.getElementById('video-container').classList.remove('d-none');
    document.getElementById('endCall').classList.remove('d-none');
    document.getElementById('startAudioCall').classList.add('d-none');
    document.getElementById('startVideoCall').classList.add('d-none');

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: true });
        document.getElementById('localVideo').srcObject = localStream;

        setupPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { roomId: currentRoom, offer });
    } catch (error) {
        console.error('خطأ في تشغيل الوسائط:', error);
        alert('تعذر الوصول إلى الكاميرا أو الميكروفون.');
        endCall();
    }
}

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice_candidate', { roomId: currentRoom, candidate: event.candidate });
        }
    };
}

socket.on('user_joined', async (data) => {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'text-center text-success my-2 small';
    div.innerHTML = `انضم المستخدم: <strong>${data.name}</strong>`;
    chatMessages.appendChild(div);
});

socket.on('offer', async (data) => {
    document.getElementById('video-container').classList.remove('d-none');
    document.getElementById('endCall').classList.remove('d-none');
    document.getElementById('startAudioCall').classList.add('d-none');
    document.getElementById('startVideoCall').classList.add('d-none');

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;

        setupPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { roomId: currentRoom, answer });
    } catch (error) {
        console.error('خطأ عند استقبال العرض:', error);
    }
});

socket.on('answer', async (data) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('ice_candidate', async (data) => {
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
            console.error('خطأ في إضافة ICE Candidate', e);
        }
    }
});

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('video-container').classList.add('d-none');
    document.getElementById('endCall').classList.add('d-none');
    document.getElementById('startAudioCall').classList.remove('d-none');
    document.getElementById('startVideoCall').classList.remove('d-none');
}

/* =========================================
   إضافات التحديث الجديد: الإيموجي والمشاركة والتثبيت
   ========================================= */

// 1. نظام الـ Emojis (إضافة 10 إيموجيز)
const emojisList = ['😀', '😂', '😍', '🙏', '👍', '🔥', '🎉', '💡', '💻', '🚀'];
const emojiPicker = document.getElementById('emoji-picker');
const messageInput = document.getElementById('messageInput');
const emojiToggle = document.getElementById('emojiToggle');

// توليد الإيموجيز
emojisList.forEach(emoji => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.className = 'emoji-item';
    span.onclick = () => {
        messageInput.value += emoji;
        messageInput.focus();
    };
    emojiPicker.appendChild(span);
});

// إظهار/إخفاء صندوق الإيموجيز
emojiToggle.onclick = () => {
    emojiPicker.classList.toggle('d-none');
};

// 2. ميزة مشاركة التطبيق (Web Share API)
const shareBtn = document.getElementById('shareBtn');

if (navigator.share) {
    shareBtn.classList.remove('d-none'); // إظهار الزر إذا كانت الميزة مدعومة
}

async function shareApp() {
    try {
        await navigator.share({
            title: 'منصة المحادثة الفورية',
            text: 'انضم إلي في هذه المنصة للتواصل الصوتي والمرئي والنصي!',
            url: window.location.href
        });
    } catch (error) {
        console.log('تم إلغاء المشاركة أو حدث خطأ:', error);
    }
}

// 3. ميزة تثبيت التطبيق (PWA Install)
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

// اعتراض حدث طلب التثبيت
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('d-none'); // إظهار الزر
});

installBtn.onclick = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('تم تثبيت التطبيق بنجاح');
        }
        deferredPrompt = null;
        installBtn.classList.add('d-none');
    }
};

// تسجيل Service Worker ليعمل التطبيق كـ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Failed', err));
    });
}