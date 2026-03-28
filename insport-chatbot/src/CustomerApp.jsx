import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Image, Settings, Home, Clock, Smile, Cpu } from 'lucide-react';
import { io } from 'socket.io-client';
import { analyzeImageWithGemini } from './geminiService';

// 소켓 서버 주소
const socket = io('http://localhost:3000');

// 사용자 고유 ID 생성 (익명 방문자 구분용)
const getClientId = () => {
  let id = localStorage.getItem('insport_client_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('insport_client_id', id);
  }
  return id;
};

const CustomerApp = () => {
  const clientId = getClientId();
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.body.className = 'customer-body';
    
    // 소켓 이벤트 등록
    socket.emit('join', { clientId, role: 'client' });

    socket.on('chatHistory', (history) => {
        if (history.length > 0) setMessages(history);
        else {
            setMessages([{
                id: 1, sender: 'bot', text: "반갑습니다! 인스포트(insport) AI 어시스턴트입니다.\n무엇을 도와드릴까요?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                menu: true
            }]);
        }
    });

    socket.on('newMessage', (msg) => {
        setMessages(prev => [...prev, msg]);
        setIsAnalyzing(false);
    });

    socket.on('streamMessage', ({ id, text }) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m));
    });

    socket.on('modeStatus', ({ isManual }) => {
        setIsManualMode(isManual);
    });

    return () => { 
        document.body.className = ''; 
        socket.off('newMessage');
        socket.off('chatHistory');
        socket.off('modeStatus');
    };
  }, [clientId]);

  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, isAnalyzing]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    
    // 소켓을 통해 메시지 전송 (서버에서 AI 답변 여부 결정)
    socket.emit('sendMessage', { clientId, sender: 'user', text });
    if (!isManualMode) setIsAnalyzing(true);
  };

  const handleMenuClick = (menuItem) => {
    if (menuItem === '사진으로 문의') {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: "상담을 위해 사진을 업로드해 주세요.\n📸 Gemini AI가 실시간 분석해 드립니다." }]);
        setTimeout(() => fileInputRef.current?.click(), 800);
        return;
    }
    socket.emit('sendMessage', { clientId, sender: 'user', text: menuItem });
    if (!isManualMode) setIsAnalyzing(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      socket.emit('sendMessage', { clientId, sender: 'user', text: "📷 [이미지 전송됨]" });
      
      setIsAnalyzing(true);
      try {
        const result = await analyzeImageWithGemini(null, base64);
        setIsAnalyzing(false);
        socket.emit('sendMessage', { clientId, sender: 'bot', text: result.auto_reply });
        
        // [Sync] 백엔드 시스템 로그 전송
        try {
            await fetch('http://localhost:3000/api/admin/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: result.type || '분석 완료',
                    summary: result.summary,
                    severity: result.severity,
                    client: clientId
                })
            });
        } catch (e) { console.warn("로그 동기화 실패"); }

      } catch (error) {
        setIsAnalyzing(false);
        socket.emit('sendMessage', { clientId, sender: 'bot', text: "이미지 분석 실패: " + error.message });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mobile-wrapper">
      
      {/* 1. 홈(Home) 탭 */}
      {activeTab === 'home' && (
        <div className="main-content">
          <div className="header-banner">
            <div className="brand-title-overlay">insport</div>
          </div>
          
          <div className="info-card">
            <div className="brand-header">
              <div className="brand-logo"><Cpu size={18} /></div>
              <div className="brand-name">insport AI</div>
            </div>
            <div className="brand-desc">
              <span>모든 헬스케어 제품 고민,</span>
              <span>insport AI가 똑똑하게 도와드릴게요.</span>
            </div>
            
            <ul className="info-list">
              <li>우리 집 홈짐 세팅 추천 📦</li>
              <li>지금 [<span>제품 사이즈 및 불량 판독</span>] 봇에서<br/>확인해 보세요!</li>
            </ul>

            <button className="btn-primary" onClick={() => setActiveTab('chat')}>
              문의하기 <Send size={16} />
            </button>
          </div>

          <div className="op-time">
            <Clock size={14} /> 평일 오전 10:00부터 운영해요
          </div>
          
          <div className="watermark">
            <Smile size={12} fill="#adb5bd" color="#fff" /> insport 채널톡 이용중
          </div>
        </div>
      )}

      {/* 2. 대화(Chat) 탭 */}
      {activeTab === 'chat' && (
        <div className="chat-view">
          <div className="chat-topbar">
            insport AI
          </div>
          
          <div className="chat-scroll-area" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.sender === 'user' ? 'user-row' : ''}`}>
                {m.sender === 'bot' && (
                  <div className="bot-avatar"><Cpu size={16} /></div>
                )}
                
                <div className="bubble-wrap" style={{ alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className={`chat-bubble ${m.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                    
                    {/* 동적 버튼 렌더링 적용 (AI가 [BUTTON: 메뉴1 | 메뉴2] 형식으로 주면 버튼으로 치환됨) */}
                    {(() => {
                        let textToRender = m.text || '';
                        const btnRegex = /\[BUTTON:(.*?)]/g;
                        const buttons = [];
                        const urls = [];
                        
                        let cleanText = textToRender.replace(btnRegex, (match, p1) => {
                            p1.split('|').forEach(opt => buttons.push(opt.trim()));
                            return "";
                        });

                        const urlRegex = /(https?:\/\/[^\s\])]+)/g;
                        cleanText = cleanText.replace(urlRegex, (match) => {
                            urls.push(match);
                            return "";
                        }).replace(/\[\]|\(\)/g, "").trim();

                        return (
                            <>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{cleanText}</div>
                                
                                {urls.length > 0 && m.sender === 'bot' && (
                                    <div className="dynamic-link-menu" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {urls.map((url, idx) => (
                                            <button 
                                                key={`url-${idx}`} 
                                                onClick={() => window.open(url, '_blank')}
                                                style={{
                                                    background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 14px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 'bold'
                                                }}
                                            >
                                                🔗 상세 링크 확인하기
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {buttons.length > 0 && m.sender === 'bot' && (
                                    <div className="chat-quick-menu" style={{ marginTop: '12px' }}>
                                        {buttons.filter(b=>b).map((btn, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => handleMenuClick(btn)}
                                                className="quick-btn"
                                            >
                                                {btn}
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => handleMenuClick("초기 메뉴로 돌아가기")}
                                            className="quick-btn"
                                            style={{ border: '1px solid #475569', color: '#94a3b8' }}
                                        >
                                            🏠 처음으로
                                        </button>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                    
                    {/* Vision 결과 UI */}
                    {m.visionUi && (
                      <div className="vision-table">
                        <div className="v-row">
                          <span className="v-label">판독 결과</span>
                          <span className={`v-val ${m.visionData.severity === 'none' ? 'safe' : 'danger'}`}>
                            {m.visionData.type}
                          </span>
                        </div>
                        <div className="v-desc">"{m.visionData.summary}"</div>
                      </div>
                    )}

                    {/* 메뉴 버튼 UI */}
                    {m.menu && (
                      <div className="chat-quick-menu">
                        {['주문·배송 조회', '교환·반품 신청', '사진으로 문의'].map(item => (
                          <button key={item} className="quick-btn" onClick={() => handleMenuClick(item)}>{item}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="time-stamp">{m.timestamp}</span>
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="chat-row">
                <div className="bot-avatar"><Cpu size={16} /></div>
                <div className="bubble-wrap">
                  <div className="chat-bubble bot-bubble" style={{display:'flex', alignItems:'center', gap: '4px', height: '40px', padding: '0 16px', justifyContent: 'center'}}>
                    <div className="typing-dot" style={{animationDelay: '0s'}}></div>
                    <div className="typing-dot" style={{animationDelay: '0.2s'}}></div>
                    <div className="typing-dot" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-composer">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
            <button className="action-btn" onClick={() => fileInputRef.current?.click()}><Image size={18} /></button>
            <input 
              type="text"
              className="input-box"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력해주세요..."
            />
            <button className="send-btn" disabled={!inputText.trim()} onClick={handleSend}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 3. 설정(Settings) 탭 (고객용 환경설정 모사) */}
      {activeTab === 'settings' && (
        <div className="settings-view">
          <h2 className="settings-title">정보</h2>
          <div className="settings-card">
            <p style={{fontSize: '0.9rem', color: '#717680', lineHeight: 1.6, marginBottom: '20px'}}>
              인스포트(insport) 프리미엄 고객센터 어시스턴트 애플리케이션입니다. 
              API 설정 및 관리는 어드민 대시보드(/admin)에서 접근 가능합니다.
            </p>
            <button className="btn-save" onClick={() => window.location.href = '/admin'}>
              어드민 대시보드 바로가기
            </button>
          </div>
        </div>
      )}

      {/* 공통 Bottom Navigation */}
      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} />
          <span className="nav-label">홈</span>
        </div>
        <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={22} />
          <span className="nav-label">대화</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} />
          <span className="nav-label">설정</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerApp;
