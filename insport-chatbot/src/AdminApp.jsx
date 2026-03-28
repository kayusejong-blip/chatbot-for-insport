import React, { useState, useEffect } from 'react';
import { LayoutDashboard, AlertTriangle, Settings, LogOut, Activity, Image, Cpu, CheckCircle2 } from 'lucide-react';
import './AdminApp.css'; 

const AdminApp = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || "");
  const [alerts, setAlerts] = useState([]);

  // Admin용 body 클래스 적용
  useEffect(() => {
    document.body.className = 'admin-body';
    
    const loadAlerts = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/logs');
            const data = await res.json();
            setAlerts(data);
        } catch (e) {
            console.error("백엔드와 통신할 수 없습니다.");
            const saved = JSON.parse(localStorage.getItem('insport_alerts') || '[]');
            setAlerts(saved.reverse());
        }
    };
    
    loadAlerts();
    // 5초에 한 번씩 새로고침 (간단한 동기화)
    const interval = setInterval(loadAlerts, 5000);

    return () => { 
        document.body.className = ''; 
        clearInterval(interval);
    };
  }, []);

  const handleSaveConfig = () => {
    alert("API Key 및 시스템 설정이 저장되었습니다.");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Cpu size={28} color="#00f2fe" />
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
            className={`admin-nav-item ${activeMenu === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveMenu('alerts')}
          >
            <AlertTriangle size={20} /> Vision AI 판독 기록
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={20} /> 시스템 및 API 설정
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '24px 16px', borderTop: '1px solid #1e293b' }}>
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
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>대장님 (Admin)</span>
            <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '50%', border: '2px solid #00f2fe' }}>
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
                    <h4>금일 AI 응대 건수</h4>
                    <p>842</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green"><Image size={28} /></div>
                  <div className="stat-info">
                    <h4>Vision 이미지 분석</h4>
                    <p>{alerts.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange"><AlertTriangle size={28} /></div>
                  <div className="stat-info">
                    <h4>긴급 에스컬레이션</h4>
                    <p>{alerts.filter(a => a.severity === 'major').length}</p>
                  </div>
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-title">
                  <AlertTriangle size={20} color="#f59e0b" /> 실시간 불량 판독 모니터링
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
                        <td style={{ color: '#94a3b8', fontSize:'0.85rem' }}>{alert.time}</td>
                        <td style={{ fontWeight: 600 }}>{alert.type}</td>
                        <td>
                          <span className={`badge ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                        </td>
                        <td style={{ color: '#e2e8f0' }}>"{alert.summary}"</td>
                        <td><button style={{ background: 'transparent', border: '1px solid #1e293b', color: '#00f2fe', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>상세보기</button></td>
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

          {activeMenu === 'alerts' && (
             <div className="admin-panel">
               <div className="admin-panel-title">
                  <Image size={20} color="#00f2fe" /> 전체 판독 기록
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
                        <td style={{ color: '#94a3b8', fontSize:'0.85rem' }}>{alert.time}</td>
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
              <p style={{ color: '#94a3b8', marginBottom: '32px', lineHeight: 1.6 }}>
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
