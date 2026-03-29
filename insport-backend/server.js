require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

// [SESSION DATA] 실시간 상담 세션 데이터
let chatSessions = {}; // { clientId: { messages: [], isManual: false } }

// [초기 설정] 기본 지식 베이스 로딩
const KNOWLEDGE_PATH = './knowledge.json';
const DEFAULT_INSTRUCTION = `당신은 'insport' 고객센터 AI입니다.
당신은 백지상태의 상담원이며, 관리자가 새로운 룰을 입력할 때까지 임의의 대화를 진행합니다.`;

let currentKnowledge = {
    systemInstruction: DEFAULT_INSTRUCTION,
    lastUpdated: new Date().toLocaleString()
};

// 지식 파일 로드
if (fs.existsSync(KNOWLEDGE_PATH)) {
    try {
        currentKnowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
    } catch (e) { console.error("지식 로딩 실패, 기본값 사용"); }
}

// Socket.io 통신 엔진
io.on('connection', (socket) => {
    console.log(`[Socket] New Connection: ${socket.id}`);

    // 클라이언트나 어드민이 특정 채널 참여
    socket.on('join', ({ clientId, role }) => {
        socket.join(clientId);
        if (!chatSessions[clientId]) {
            chatSessions[clientId] = { messages: [], isManual: false, lastActive: new Date() };
        }
        console.log(`[Socket] ${role} joined channel: ${clientId}`);
        
        // 기존 이력 전송
        socket.emit('chatHistory', chatSessions[clientId].messages);
        socket.emit('modeStatus', { isManual: chatSessions[clientId].isManual });
    });

    // 메시지 수신 및 중계
    socket.on('sendMessage', async ({ clientId, sender, text }) => {
        if (!chatSessions[clientId]) return;
        
        const msgObj = { id: Date.now(), sender, text, time: new Date().toLocaleTimeString() };
        chatSessions[clientId].messages.push(msgObj);
        
        // 해당 채널의 모든 소켓(Client + Admin)에 메시지 동기화
        io.to(clientId).emit('newMessage', msgObj);

        // [AI AUTO-REPLY] 매뉴얼 모드가 아닐 때만 AI 답변 발동
        if (sender === 'user' && !chatSessions[clientId].isManual) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ 
                    model: 'gemini-2.5-flash',
                    systemInstruction: currentKnowledge.systemInstruction
                });

                const chat = model.startChat({ history: [] });
                const result = await chat.sendMessageStream(text);
                
                const msgId = Date.now() + 1;
                let fullText = '';
                
                const aiMsg = { id: msgId, sender: 'bot', text: '', time: new Date().toLocaleTimeString() };
                chatSessions[clientId].messages.push(aiMsg);
                io.to(clientId).emit('newMessage', aiMsg);

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    io.to(clientId).emit('streamMessage', { id: msgId, text: fullText });
                }
                
                const msgIndex = chatSessions[clientId].messages.findIndex(m => m.id === msgId);
                if(msgIndex !== -1) chatSessions[clientId].messages[msgIndex].text = fullText;
            } catch (e) { 
                console.error("AI Auto-reply Error:", e); 
                io.to(clientId).emit('newMessage', { 
                    id: Date.now() + 1, 
                    sender: 'bot', 
                    text: "죄송합니다, AI 연동 오류가 발생했습니다: " + e.message, 
                    time: new Date().toLocaleTimeString() 
                });
            }
        }
    });

    // [ADMIN] 모드 전환 제어 (AI <-> Human)
    socket.on('toggleMode', ({ clientId, isManual }) => {
        if (chatSessions[clientId]) {
            chatSessions[clientId].isManual = isManual;
            io.to(clientId).emit('modeStatus', { isManual });
            console.log(`[System] Mode switch for ${clientId}: ${isManual ? 'MANUAL' : 'AI'}`);
        }
    });

    // [ADMIN] 전체 세션 목록 조회 요정 (어드민 초기화용)
    socket.on('getSessions', () => {
        socket.emit('sessionList', Object.keys(chatSessions).map(id => ({
            id,
            lastMsg: chatSessions[id].messages.slice(-1)[0]?.text || '대화 없음',
            isManual: chatSessions[id].isManual
        })));
    });
});

// Removed Kakao webhook endpoint as this is now an independent chatbot system
app.get('/api/admin/knowledge', (req, res) => {
    res.json(currentKnowledge);
});

app.post('/api/admin/knowledge', (req, res) => {
    const { systemInstruction } = req.body;
    currentKnowledge = {
        systemInstruction,
        lastUpdated: new Date().toLocaleString()
    };
    fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(currentKnowledge, null, 2));
    console.log("🚀 [SYSTEM] 지식 베이스가 업데이트 및 실시간 배포되었습니다.");
    res.json({ success: true, lastUpdated: currentKnowledge.lastUpdated });
});

let appLogs = [];
app.post('/api/admin/log', (req, res) => {
    const logData = { id: Date.now(), ...req.body, time: new Date().toLocaleTimeString() };
    appLogs.unshift(logData);
    if (appLogs.length > 50) appLogs.pop();
    res.json({ success: true, log: logData });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: currentKnowledge.systemInstruction
        });

        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(message);
        res.json({ text: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vision', async (req, res) => {
    try {
        const { imageBase64, prompt } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const imagePart = { inlineData: { data: imageBase64, mimeType: "image/jpeg" } };
        const result = await model.generateContent([prompt, imagePart]);
        res.json({ text: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[INSPORT REAL-TIME SERVER] Port: ${PORT}`);
  console.log(`[SOCKET.IO] WebSocket Engine is Ready.`);
});
