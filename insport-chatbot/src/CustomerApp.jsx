import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Image, Settings, Home, Clock, Smile, Cpu } from 'lucide-react';
import { analyzeMessageWithGemini, analyzeImageWithGemini } from './geminiService';

const CustomerApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || "");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "반갑습니다! 인스포트(insport) AI 어시스턴트입니다.\n무엇을 도와드릴까요?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      menu: true
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Body 스타일 분리 (고객앱 전용)
  useEffect(() => {
    document.body.className = 'customer-body';
    return () => { document.body.className = ''; };
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, isAnalyzing]);

  const addMessage = (sender, text, extra = {}) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extra
    }]);
  };

  const handleMenuClick = async (menuItem) => {
    addMessage('user', menuItem);
    
    if (menuItem === '사진으로 문의') {
      addMessage('bot', "상담을 위해 사진을 업로드해 주세요 (최대 3장).\n📸 Gemini AI가 사진을 분석하여 불량 판독 또는 사이즈를 추천해 드립니다.");
      setTimeout(() => fileInputRef.current?.click(), 800);
      return;
    }

    if (!apiKey) {
        addMessage('bot', "현재 시뮬레이션 모드입니다. 정상적인 답변을 위해 어드민 패널에서 API 키를 설정해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeMessageWithGemini(apiKey, menuItem);
      setIsAnalyzing(false);
      addMessage('bot', response);
    } catch (error) {
      setIsAnalyzing(false);
      addMessage('bot', "오류가 발생했습니다: " + error.message);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    addMessage('user', userText);
    setInputText("");
    
    if (!apiKey) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        addMessage('bot', `현재 시뮬레이션 모드입니다. '${userText}'에 대해 확인했습니다. API 키를 설정해 주세요!`);
      }, 1000);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeMessageWithGemini(apiKey, userText);
      setIsAnalyzing(false);
      addMessage('bot', response);
    } catch (error) {
      setIsAnalyzing(false);
      addMessage('bot', "응답을 처리할 수 없습니다: " + error.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      addMessage('user', "📷 [이미지 전송됨]");
      
      if (!apiKey) {
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          addMessage('bot', "제미나이 시뮬레이션: '사진에서 로고를 발견했습니다.'\n(실제 Vision 분석을 위해서는 API 키가 필요합니다)");
        }, 1500);
        return;
      }

      setIsAnalyzing(true);
      try {
        const result = await analyzeImageWithGemini(apiKey, base64);
        setIsAnalyzing(false);
        addMessage('bot', result.auto_reply, {
          visionData: result,
          visionUi: true
        });
        
        // [Sync] 실제 백엔드 서버(3000번)로 판독 데이터를 실시간 전송 (상용화 로직)
        try {
            await fetch('http://localhost:3000/api/admin/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: result.type || '분석 완료',
                    summary: result.summary,
                    severity: result.severity,
                    client: '모바일-고객앱V1.5'
                })
            });
        } catch (e) {
            console.warn("백엔드 동기화 실패 (서버가 꺼져있을 수 있습니다)");
            // 폴백: 로컬 스토리지에 유지
            const alerts = JSON.parse(localStorage.getItem('insport_alerts') || '[]');
            alerts.push({ id: Date.now(), type: result.type, summary: result.summary, severity: result.severity, time: new Date().toLocaleTimeString() });
            localStorage.setItem('insport_alerts', JSON.stringify(alerts));
        }

      } catch (error) {
        setIsAnalyzing(false);
        addMessage('bot', "이미지 분석 실패: " + error.message);
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
                    {m.text}
                    
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
