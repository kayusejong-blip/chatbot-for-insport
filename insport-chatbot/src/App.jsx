import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Package, Truck, RotateCcw, Image, Bell, Settings, X, MoreVertical, Search, LogOut, CheckCircle2, AlertTriangle, Cpu, Key } from 'lucide-react';
import { analyzeMessageWithGemini, analyzeImageWithGemini } from './geminiService';

const AVATAR_BOT = "https://ui-avatars.com/api/?name=INS&background=00f2fe&color=000";
const AVATAR_USER = "https://ui-avatars.com/api/?name=%EB%8C%80%EC%9E%A5&background=4facfe&color=fff";

const App = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || "");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "반갑습니다 대장님! 인스포트(insport) AI 어시스턴트(Gemini v1.5 Flash)입니다. \n\n무엇을 도와드릴까요? 아래 리스트에서 문의 유형을 선택하시거나, 사진을 업로드해 분석을 맡겨보세요.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      menu: true
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!import.meta.env.VITE_GEMINI_API_KEY);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      addMessage('bot', "상담을 위해 사진을 업로드해 주세요 (최대 3장).\n\n📸 Gemini AI가 사진을 분석하여 불량 판독 또는 사이즈를 추천해 드립니다.");
      setTimeout(() => fileInputRef.current?.click(), 800);
      return;
    }

    if (!apiKey) {
      setTimeout(() => {
        addMessage('bot', "대장님! 실사용을 위해서는 Gemini API 키가 필요합니다. 설정을 눌러 키를 입력해 주세요. (현재는 시뮬레이션 모드)");
      }, 600);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeMessageWithGemini(apiKey, menuItem);
      setIsAnalyzing(false);
      addMessage('bot', response);
    } catch (error) {
      setIsAnalyzing(false);
      addMessage('bot', "API 호출 중 오류가 발생했습니다: " + error.message);
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
        addMessage('bot', `대장님, 현재 시뮬레이션 모드입니다. '${userText}'에 대해 잘 이해했습니다. 실사용을 위해 API 키를 설정해 주세요!`);
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
      addMessage('bot', "죄송합니다, 대장님. 응답을 처리할 수 없습니다: " + error.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      addMessage('user', "📷 [이미지 업로드됨]");
      
      if (!apiKey) {
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          addMessage('bot', "제미나이 시뮬레이션 결과: '사진에서 로고를 발견했습니다.'\n(실제 Vision 분석을 위해서는 API 키가 필요합니다)");
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

        // Escalation Alert
        if (result.severity !== 'none') {
          setSlackAlerts(prev => [{
            id: Date.now(),
            title: `[긴급] ${result.type} 알림`,
            desc: result.admin_alert || result.summary,
            time: "방금 전",
            severity: result.severity
          }, ...prev]);
        }
      } catch (error) {
        setIsAnalyzing(false);
        addMessage('bot', "이미지 분석 실패: " + error.message);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-transparent p-4 lg:p-10 font-inter">
      <aside className="hidden lg:flex flex-col w-64 glass-morphism p-6 mr-6 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg">
            <Cpu size={24} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">insport <span className="text-cyan-400">Gemini</span></span>
        </div>

        <nav className="flex flex-col gap-2 mt-8">
          <button className="flex items-center gap-3 p-3 rounded-xl bg-white/10 text-white font-medium border border-white/5">
            <MessageCircle size={18} /> 실시간 채팅
          </button>
          <button onClick={() => setShowKeyInput(!showKeyInput)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${apiKey ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:bg-white/5'}`}>
            <Key size={18} /> {apiKey ? 'API 키 등록됨' : 'API 키 설정'}
          </button>
          <button onClick={() => setIsDashboardOpen(!isDashboardOpen)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-400 transition-all relative">
            <Bell size={18} /> 알림 보관함 {slackAlerts.length > 0 && <span className="absolute left-7 top-2 px-1.5 py-0.5 bg-red-500 rounded-full text-[8px] text-white animate-pulse">{slackAlerts.length}</span>}
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className={`status-indicator ${apiKey ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs text-gray-400 font-medium">{apiKey ? 'Gemini v1.5 Online' : 'Simulation Mode'}</span>
          </div>
          <p className="text-[10px] text-gray-500">v1.1 Gemini Edition — 2026</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col glass-morphism relative overflow-hidden">
        {/* Header */}
        <div className="kakao-header justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={AVATAR_BOT} alt="Bot" className="w-10 h-10 rounded-full ring-2 ring-cyan-500/20" />
              <div className={`absolute right-0 bottom-0 w-3 h-3 ${apiKey ? 'bg-green-500' : 'bg-yellow-500'} rounded-full border-2 border-slate-900 shadow-[0_0_5px_#22c55e]`}></div>
            </div>
            <div>
              <h3 className="text-sm font-bold">insport AI Assistant <span className="ml-1 text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full font-mono">Gemini</span></h3>
              <p className="text-[10px] text-gray-400">Powered by Google AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Search size={18} className="cursor-pointer hover:text-white" />
            <Settings size={18} className="cursor-pointer hover:text-white" onClick={() => setShowKeyInput(true)} />
            <MoreVertical size={18} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* API Key Modal Overlay */}
        <AnimatePresence>
          {showKeyInput && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#151921] border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Key size={32} className="text-cyan-400" />
                </div>
                <h2 className="text-xl mb-2">Gemini API Key</h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">보다 똑똑한 AI 응대를 위해 구글 AI 스튜디오에서 발급받은 API 키를 입력해 주세요.</p>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-...."
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-all mb-4 text-center tracking-widest"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowKeyInput(false)} className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm">다음에</button>
                  <button onClick={() => setShowKeyInput(false)} className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-black font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all text-sm">연결하기</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="msg-container flex-1 scrollbar-hide" ref={scrollRef}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 mb-2 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <img src={m.sender === 'bot' ? AVATAR_BOT : AVATAR_USER} className="w-8 h-8 rounded-full mt-1 hidden sm:block" alt="Avatar" />
              <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">
                <div className={`msg ${m.sender === 'user' ? 'msg-user' : 'msg-bot shadow-lg shadow-cyan-900/10'}`}>
                  {m.text && <p className="whitespace-pre-line leading-relaxed">{m.text}</p>}
                  
                  {m.visionUi && (
                    <div className="mt-3 bg-black/40 p-4 rounded-2xl border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu className="text-cyan-400" size={14} />
                        <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider">AI Vision Intelligence</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-cyan-400/5 p-2 rounded-lg">
                          <span className="text-[10px] text-gray-500 font-bold">REPORT TYPE</span>
                          <span className="text-xs font-black text-red-500 flex items-center gap-1">
                             {m.visionData.type} ({m.visionData.severity})
                          </span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed border-b border-white/5 pb-2">" {m.visionData.summary} "</p>
                        <div className="flex justify-end"><span className="text-[9px] text-gray-500 font-mono">INS-GEMINI-SYSTEM-V1.1</span></div>
                      </div>
                    </div>
                  )}

                  {m.menu && (
                    <div className="btn-menu">
                      {['주문·배송 조회', '교환·반품 신청', '상품 문의', '사진으로 문의'].map(item => (
                        <button key={item} onClick={() => handleMenuClick(item)} className="menu-item border-cyan-500/30 hover:bg-cyan-500/20 active:scale-95">
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[9px] mt-1 text-gray-500 px-1 font-mono ${m.sender === 'user' ? 'text-right' : ''}`}>{m.timestamp}</span>
              </div>
            </motion.div>
          ))}
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="msg-bot msg border border-cyan-500/10 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
                </div>
                <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest">Gemini Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Tray */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30">
              <Image size={22} />
            </button>
            <div className="flex-1 bg-white/5 rounded-full border border-white/10 flex items-center px-5 focus-within:border-cyan-500/50 shadow-inner group transition-all">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="인스포트 AI에게 무엇이든 물어보세요..." 
                className="flex-1 bg-transparent py-4 text-sm focus:outline-none placeholder:text-gray-600 font-medium"
              />
              <button onClick={handleSend} disabled={!inputText.trim()} className={`p-2 rounded-full transition-all ${inputText.trim() ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-700'}`}>
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="flex gap-6 justify-center">
            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500" /> GEMINI HYPER-AI ACTIVE</span>
            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5"><Bell size={12} className="text-cyan-500" /> SLACK ESCALATION ON</span>
          </div>
        </div>

        {/* Dash Slide (Slack) */}
        <AnimatePresence>
          {isDashboardOpen && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute top-0 right-0 h-full w-full sm:w-80 bg-[#0a0c10] border-l border-white/10 z-[60] p-6 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center"><Bell size={18} className="text-white" /></div>
                  <h2 className="text-lg font-black tracking-tight">ALERT FEED</h2>
                </div>
                <X size={20} className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setIsDashboardOpen(false)} />
              </div>
              <div className="flex-1 overflow-y-auto space-y-4">
                {slackAlerts.map(alert => (
                  <motion.div key={alert.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.severity === 'major' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${alert.severity === 'major' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{alert.severity}</span>
                      <span className="text-[9px] text-gray-600 font-mono italic">{alert.time}</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 mb-2">{alert.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{alert.desc}</p>
                    <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-cyan-400 tracking-widest uppercase transition-all">Go to Kakao Admin</button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
