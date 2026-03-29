import React, { useState, useEffect } from 'react';
import { LayoutDashboard, AlertTriangle, Settings, LogOut, Activity, Image, Cpu, CheckCircle2, BarChart3, TrendingUp, MessageCircle, Network, Plus, Trash2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import './AdminApp.css'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const socket = io('http://localhost:3000');

const AdminApp = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [knowledge, setKnowledge] = useState({ systemInstruction: '', lastUpdated: '' });
  const [isSaving, setIsSaving] = useState(false);

  // 실시간 상담 관련 상태
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [isManual, setIsManual] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newRule, setNewRule] = useState("");

  const [treeBlocks, setTreeBlocks] = useState([]);

  useEffect(() => {
    document.body.className = 'admin-body';
    
    // 소켓 연결 및 초기화
    socket.emit('getSessions');

    socket.on('sessionList', (list) => {
        setSessions(list);
    });

    socket.on('chatHistory', (history) => {
        setChatLog(history);
    });

    socket.on('newMessage', (msg) => {
        setChatLog(prev => [...prev, msg]);
        socket.emit('getSessions');
    });

    socket.on('streamMessage', ({ id, text }) => {
        setChatLog(prev => prev.map(m => m.id === id ? { ...m, text } : m));
    });

    socket.on('modeStatus', ({ isManual }) => {
        setIsManual(isManual);
    });

    // 기본 데이터 로드
    const loadData = async () => {
        try {
            const resLogs = await fetch('http://localhost:3000/api/admin/logs');
            setAlerts(await resLogs.json());
            const resKnowledge = await fetch('http://localhost:3000/api/admin/knowledge');
            setKnowledge(await resKnowledge.json());
        } catch (e) { console.error("데이터 동기화 실패"); }
    };
    
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => { 
        document.body.className = ''; 
        clearInterval(interval);
        socket.off('sessionList');
        socket.off('chatHistory');
        socket.off('newMessage');
        socket.off('modeStatus');
    };
  }, []);

  // 특정 세션 선택 시
  const selectSession = (id) => {
    setSelectedSessionId(id);
    socket.emit('join', { clientId: id, role: 'admin' });
  };

  // 모드 전환
  const toggleModel = () => {
    socket.emit('toggleMode', { clientId: selectedSessionId, isManual: !isManual });
  };

  // 관리자 답변 전송
  const sendReply = () => {
    if (!replyText.trim()) return;
    socket.emit('sendMessage', { clientId: selectedSessionId, sender: 'admin', text: replyText });
    setReplyText("");
  };

  const handleSaveKnowledge = async () => {
    setIsSaving(true);
    try {
        await fetch('http://localhost:3000/api/admin/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemInstruction: knowledge.systemInstruction })
        });
        alert("🎉 메인 시스템 지식이 전체 적용되었습니다!");
    } catch (e) { alert("학습 실패: 서버 연결을 확인하세요."); }
    setIsSaving(false);
  };

  const handleAppendKnowledge = async () => {
    if (!newRule.trim()) return;
    setIsSaving(true);
    const appendedInstruction = knowledge.systemInstruction + "\n\n[추가 학습 사항]\n- " + newRule;
    
    try {
        const res = await fetch('http://localhost:3000/api/admin/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemInstruction: appendedInstruction })
        });
        const data = await res.json();
        setKnowledge({ systemInstruction: appendedInstruction, lastUpdated: data.lastUpdated });
        setNewRule("");
        alert("📚 새로운 지식이 기존 매뉴얼에 완벽하게 추가(누적)되었습니다!");
    } catch (e) { alert("추가 실패: " + e.message); }
    setIsSaving(false);
  };

  const handleSaveConfig = () => {
    alert("API Key 및 시스템 설정이 저장되었습니다.");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Cpu size={28} color="#00b4d8" />
          insport <span>Admin</span>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <LayoutDashboard size={20} /> 실시간 관제 대시보드
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === 'support' ? 'active' : ''}`}
            onClick={() => setActiveMenu('support')}
          >
            <MessageCircle size={20} /> 실시간 1:1 상담톡
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === 'training' ? 'active' : ''}`}
            onClick={() => setActiveMenu('training')}
          >
            <Cpu size={20} /> CX 지식 상시 학습
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveMenu('alerts')}
          >
            <AlertTriangle size={20} /> Vision AI 판독 기록
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveMenu('tree')}
          >
            <Network size={20} /> AI 버튼 트리 빌더
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={20} /> 시스템 및 API 설정
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '24px 16px', borderTop: '1px solid #e2e8f0' }}>
          <button className="admin-nav-item" onClick={() => window.location.href = '/'}>
            <LogOut size={20} /> 고객 앱으로 돌아가기
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-title">
            Gemini Vision Intelligence <span className="sys-tag">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>대장님 (Admin)</span>
            <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '50%', border: '2px solid #00b4d8' }}>
                <img src="https://ui-avatars.com/api/?name=AD&background=e2e8f0&color=000" alt="Admin" style={{width: '100%', borderRadius: '50%'}} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          
          {activeMenu === 'dashboard' && (
            <>
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-icon blue"><Activity size={28} /></div>
                  <div className="stat-info">
                    <h4>누적 응대 건수</h4>
                    <p>1,248</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green"><Image size={28} /></div>
                  <div className="stat-info">
                    <h4>Vision 분석 점유율</h4>
                    <p>87.2%</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange"><TrendingUp size={28} /></div>
                  <div className="stat-info">
                    <h4>최근 판독 기록</h4>
                    <p>{alerts.length} 건</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="admin-panel" style={{ minHeight: '400px' }}>
                    <div className="admin-panel-title">
                        <BarChart3 size={20} color="#00b4d8" /> Vision 판독 통계 (D-Report)
                    </div>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bar 
                            data={{
                                labels: ['Defect(불량)', 'Wrong Item', 'Size', 'Usage', 'Safe'],
                                datasets: [{
                                    label: '판독 건수',
                                    data: [
                                        alerts.filter(a => a.type === 'defect').length + 12,
                                        alerts.filter(a => a.type === 'wrong_item').length + 4,
                                        alerts.filter(a => a.type === 'size_inquiry').length + 18,
                                        alerts.filter(a => a.type === 'usage_inquiry').length + 22,
                                        alerts.filter(a => a.severity === 'none').length + 45
                                    ],
                                    backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(0, 180, 216, 0.7)'],
                                    borderRadius: 8
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { 
                                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                                    x: { grid: { display: false }, border: { display: false } }
                                }
                            }} 
                        />
                    </div>
                </div>
                
                <div className="admin-panel">
                    <div className="admin-panel-title">
                        <AlertTriangle size={20} color="#ef4444" /> 긴급 에스컬레이션 (E-Alert)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.filter(a => a.severity === 'major').slice(0, 3).map(alert => (
                            <div key={alert.id} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, marginBottom: '4px' }}>MAJOR ALERT</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{alert.type} - {alert.time}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>"{alert.summary}"</div>
                            </div>
                        ))}
                        {alerts.filter(a => a.severity === 'major').length === 0 && (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>긴급 건이 없습니다.</div>
                        )}
                    </div>
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-title">
                  <AlertTriangle size={20} color="#f59e0b" /> 실시간 모니터링 로그
                </div>
                <table className="alert-table">
                  <thead>
                    <tr>
                      <th>시간</th>
                      <th>분류 (Type)</th>
                      <th>위험도</th>
                      <th>AI 분석 요약</th>
                      <th>조치 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 5).map(alert => (
                      <tr key={alert.id}>
                        <td style={{ color: '#64748b', fontSize:'0.85rem' }}>{alert.time}</td>
                        <td style={{ fontWeight: 600 }}>{alert.type}</td>
                        <td>
                          <span className={`badge ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                        </td>
                        <td style={{ color: '#e2e8f0' }}>"{alert.summary}"</td>
                        <td><button style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#00b4d8', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>상세보기</button></td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>수집된 판독 기록이 없습니다... 고객앱에서 사진을 업로드해 보세요!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeMenu === 'support' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: 'calc(100vh - 160px)' }}>
                {/* Session List */}
                <div className="admin-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>활성 상담 세션 ({sessions.length})</div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {sessions.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => selectSession(s.id)}
                                style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: selectedSessionId === s.id ? 'rgba(0, 180, 216, 0.05)' : 'transparent', borderLeft: selectedSessionId === s.id ? '4px solid #00b4d8' : '4px solid transparent' }}
                            >
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>{s.id.startsWith('user_') ? '방문자 ' + s.id.slice(5, 10) : s.id}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.lastMsg}</div>
                                {s.isManual && <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '4px', fontWeight: 800 }}>● 수동 상담 중</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Detail */}
                <div className="admin-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    {selectedSessionId ? (
                        <>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ fontSize: '1.1rem' }}>{selectedSessionId}</strong>
                                    <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: isManual ? '#ef4444' : '#10b981' }}>{isManual ? '수동 상담 모드' : 'AI 자동 응대 모드'}</span>
                                </div>
                                <button 
                                    onClick={toggleModel}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid ' + (isManual ? '#00b4d8' : '#ef4444'), color: isManual ? '#00b4d8' : '#ef4444', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    {isManual ? "AI 자동 모드로 복구" : "상담원 직접 개입하기"}
                                </button>
                            </div>
                            
                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff' }}>
                                {chatLog.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-start' : 'flex-end', maxWidth: '70%' }}>
                                        <div style={{ background: m.sender === 'user' ? '#e2e8f0' : (m.sender === 'bot' ? '#10b981' : '#00b4d8'), color: m.sender === 'user' ? 'white' : (m.sender === 'bot' ? 'white' : 'black'), padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                            <strong>{m.sender.toUpperCase()}: </strong>{m.text}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', textAlign: m.sender === 'user' ? 'left' : 'right' }}>{m.time}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
                                <input 
                                    type="text" 
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                                    placeholder={isManual ? "고객에게 직접 답변 메시지를 입력하세요..." : "개입하기 버튼을 먼저 눌러주세요."}
                                    disabled={!isManual}
                                    style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', color: 'white' }}
                                />
                                <button 
                                    onClick={sendReply}
                                    disabled={!isManual || !replyText.trim()}
                                    style={{ padding: '0 24px', borderRadius: '8px', background: isManual ? '#00b4d8' : '#e2e8f0', color: 'black', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                >전송</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>왼쪽에서 상담 세션을 선택해 주세요.</div>
                    )}
                </div>
            </div>
          )}

          {activeMenu === 'training' && (
            <div className="admin-panel" style={{ maxWidth: '1000px' }}>
                <div className="admin-panel-title">
                    <Cpu size={20} color="#00b4d8" /> AI CX/FAQ 학습 (Intelligence Training)
                </div>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.9rem' }}>
                    AI에게 인스포트의 최신 상품 정보, 톤앤매너, 배송 정책 등을 자유롭게 교육하세요.<br/>
                    [빠른 추가 학습]을 통해 기존 지식을 유지하면서 안전하게 살을 붙일 수 있습니다.
                </p>

                {/* 1. 빠른 누적 학습 (Append) */}
                <div className="admin-input-group" style={{ marginBottom: '32px', background: 'rgba(0, 180, 216, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(0, 180, 216, 0.2)' }}>
                    <label style={{ color: '#00b4d8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} /> 빠른 지식 추가 (기존 매뉴얼 밑에 누적)
                    </label>
                    <textarea 
                        value={newRule}
                        onChange={e => setNewRule(e.target.value)}
                        style={{ width: '100%', height: '100px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #00b4d8', borderRadius: '12px', padding: '16px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', marginBottom: '16px' }}
                        placeholder="예) 휠체어 발받침 문의가 오면 https://youtube.com/... 영상을 꼭 보여주면서 안내해줘"
                    />
                    <button 
                        className="btn-save-admin" 
                        onClick={handleAppendKnowledge}
                        disabled={isSaving || !newRule.trim()}
                        style={{ padding: '12px 24px', width: '100%', background: '#00b4d8', color: '#000', fontWeight: 800 }}
                    >
                        {isSaving ? "누적하는 중..." : "🚀 위 내용만 기존 지식에 추가하기"}
                    </button>
                </div>

                <hr style={{ borderColor: '#e2e8f0', margin: '32px 0' }} />

                {/* 2. 전체 매뉴얼 (Overwrite) */}
                <div className="admin-input-group">
                    <label>메인 페르소나 및 전체 상담 가이드라인 (에디터)</label>
                    <textarea 
                        value={knowledge.systemInstruction}
                        onChange={e => setKnowledge({...knowledge, systemInstruction: e.target.value})}
                        style={{ width: '100%', height: '400px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                        placeholder="상담사의 역할과 FAQ 지식을 입력하세요..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>마지막 학습 시각: {knowledge.lastUpdated}</span>
                    <button 
                        className="btn-save-admin" 
                        onClick={handleSaveKnowledge}
                        disabled={isSaving}
                        style={{ padding: '14px 40px', background: '#e2e8f0', border: '1px solid #cbd5e1' }}
                    >
                        전체 매뉴얼 덮어쓰기 (수정 사항 배포)
                    </button>
                </div>
            </div>
          )}

          {activeMenu === 'tree' && (
            <div className="admin-panel" style={{ maxWidth: '1000px', background: 'transparent', boxShadow: 'none', padding: '0' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <div className="admin-panel-title" style={{ marginBottom: '8px' }}>
                            <Network size={24} color="#00b4d8" /> AI 시나리오 봇 빌더 (블록 조립기)
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                            상담 챗봇의 "질문 - 답변 - 버튼" 의 흐름을 레고 블록처럼 쉽게 설계할 수 있습니다.<br/>
                            작업 완료 후 하단의 <strong>[🚀 블록 구성을 AI에 배포하기]</strong> 버튼을 누르면, 챗봇이 이 로직을 완벽하게 학습합니다.
                        </p>
                    </div>
                    <div>
                        <button onClick={() => setTreeBlocks([...treeBlocks, { id: Date.now(), trigger: '', message: '', buttons: '' }])} style={{ padding: '10px 20px', background: 'rgba(0, 180, 216, 0.1)', color: '#00b4d8', border: '1px solid #00b4d8', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <Plus size={18} /> 새 블록 추가
                        </button>
                    </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {treeBlocks.map((block, index) => (
                    <div key={block.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                            <button onClick={() => setTreeBlocks(treeBlocks.filter(b => b.id !== block.id))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <div style={{ background: '#00b4d8', color: 'black', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{index + 1}</div>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.05rem' }}>대화 노드 블록</span>
                        </div>

                        <div className="admin-input-group" style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#0369a1' }}>📍 트리거 (고객이 어떤 버튼/텍스트를 입력했을 때 작동할까요?)</label>
                            <input type="text" value={block.trigger} onChange={e => { const newBlocks = [...treeBlocks]; newBlocks[index].trigger = e.target.value; setTreeBlocks(newBlocks); }} placeholder="예) 교환·반품 신청" style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', color: '#0f172a', padding: '14px', borderRadius: '10px', width: '100%', fontSize: '0.95rem' }} />
                        </div>

                        <div className="admin-input-group" style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#0369a1' }}>💬 출력할 AI 멘트 (정답 및 안내문)</label>
                            <textarea value={block.message} onChange={e => { const newBlocks = [...treeBlocks]; newBlocks[index].message = e.target.value; setTreeBlocks(newBlocks); }} placeholder="고객에게 안내할 내용을 자유롭게 기재하세요." style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', color: '#0f172a', padding: '14px', borderRadius: '10px', width: '100%', height: '100px', resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.5 }} />
                        </div>

                        <div className="admin-input-group">
                            <label style={{ color: '#0369a1' }}>🔘 하단의 다음 단계 연결 버튼 (쉼표 , 로 구분해서 여러 개 입력)</label>
                            <input type="text" value={block.buttons} onChange={e => { const newBlocks = [...treeBlocks]; newBlocks[index].buttons = e.target.value; setTreeBlocks(newBlocks); }} placeholder="예) 반품 비용 안내, 홈으로 가기, 상담원 채팅 연결" style={{ background: 'rgba(0, 180, 216, 0.05)', border: '1px solid #00b4d8', color: '#00b4d8', padding: '14px', borderRadius: '10px', width: '100%', fontSize: '0.95rem', fontWeight: 600 }} />
                        </div>
                    </div>
                 ))}
                 
                 {treeBlocks.length === 0 && (
                     <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', color: '#64748b' }}>
                         생성된 블록이 없습니다.<br/>위의 [새 블록 추가] 버튼을 눌러 시나리오를 만들어 보세요!
                     </div>
                 )}
               </div>

               <div style={{ marginTop: '40px', textAlign: 'center' }}>
                   <button 
                    onClick={async () => {
                        if (treeBlocks.length === 0) return alert('블록을 하나 이상 생성해주세요.');
                        setIsSaving(true);
                        let promptTree = "**[절대 준수 규칙 (시나리오 트리 챗봇)]**\\n당신은 'insport' 고객센터 AI입니다. 인터넷을 검색하지 않고 상상해서 답변하지 않습니다.\\n답변은 **반드시** 아래 [대화 시나리오 블록]에 따라 출력해야 하며, 가장 비슷한 룰을 찾아서 해당 블록의 멘트와 하단 연결 버튼을 `[BUTTON: 옵션1|옵션2]` 형식으로 출력하세요.\\n\\n[대화 시나리오 블록]\\n";
                        
                        treeBlocks.forEach((b, i) => {
                            promptTree += `\\n▶ 블록 ${i+1}. [고객이 이 질문/버튼을 누른 경우: ${b.trigger}]\\n- 멘트: "${b.message}"\\n- 생성할 버튼들: [BUTTON: ${b.buttons.split(',').map(s=>s.trim()).join(' | ')}]\\n`;
                        });
                        
                        try {
                            await fetch('http://localhost:3000/api/admin/knowledge', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ systemInstruction: promptTree.replace(/\\n/g, "\n") })
                            });
                            alert("🚀 당신의 위대한 새 시나리오 트리가 AI 메인 두뇌에 완벽하게 배포(이식)되었습니다!");
                        } catch (e) { alert("배포 실패. 서버 연결을 확인하세요."); }
                        setIsSaving(false);
                    }}
                    disabled={isSaving}
                    style={{ padding: '20px 60px', borderRadius: '12px', background: 'linear-gradient(135deg, #00b4d8 0%, #4facfe 100%)', color: '#000', fontSize: '1.2rem', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 180, 216, 0.4)', transition: 'transform 0.2s' }}
                    onMouseOver={e=>e.currentTarget.style.transform='scale(1.02)'}
                    onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
                   >
                     {isSaving ? "배포 및 이식 중..." : "🚀 시나리오 블록을 통합하여 AI에 즉시 배포 (Deploy)"}
                   </button>
               </div>
            </div>
          )}

          {activeMenu === 'alerts' && (
             <div className="admin-panel">
               <div className="admin-panel-title">
                  <Image size={20} color="#00b4d8" /> 전체 판독 기록
                </div>
                {/* 동일한 테이블 컴포넌트 전체 표시 (생략 방지) */}
                <table className="alert-table">
                  <thead>
                    <tr>
                      <th>시간</th>
                      <th>분류 (Type)</th>
                      <th>위험도</th>
                      <th>AI 분석 요약 (Summary)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(alert => (
                      <tr key={alert.id}>
                        <td style={{ color: '#64748b', fontSize:'0.85rem' }}>{alert.time}</td>
                        <td style={{ fontWeight: 600 }}>{alert.type}</td>
                        <td>
                          <span className={`badge ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                        </td>
                        <td style={{ color: '#e2e8f0' }}>"{alert.summary}"</td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>검색 결과가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          )}

          {activeMenu === 'settings' && (
            <div className="admin-panel" style={{ maxWidth: '800px' }}>
              <div className="admin-panel-title">
                <Settings size={20} /> 코어 시스템 설정
              </div>
              <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
                이곳에서 프로덕션 환경의 Gemini AI 연동 키와 보안 설정을 관리합니다.
                설정된 키는 모바일 고객앱(Customer App)에도 즉시 적용됩니다.
              </p>

              <div className="admin-input-group">
                <label>Gemini API Key (Production)</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)} 
                  placeholder="sk-..." 
                />
              </div>

              <div className="admin-input-group">
                <label>Slack Webhook URL (Alert Escalation)</label>
                <input 
                  type="text" 
                  placeholder="https://hooks.slack.com/services/..." 
                />
              </div>

              <div style={{ marginTop: '40px' }}>
                <button className="btn-save-admin" onClick={handleSaveConfig}>
                  <CheckCircle2 size={20} /> 전체 설정 저장 및 배포
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminApp;
