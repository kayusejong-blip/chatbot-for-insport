import React from 'react';
import CustomerApp from './CustomerApp';
import AdminApp from './AdminApp';

const App = () => {
  // 간단한 라우팅 로직: URL이 '/admin'이면 어드민 페이지, 그 외에는 모바일 고객앱
  const path = window.location.pathname;
  
  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }
  
  return <CustomerApp />;
};

export default App;
