# 🚀 Project insport AI Chatbot - 버전 관리 로그

| 버전 | 날짜 | 업데이트 요약 | 작업자 |
| :--- | :--- | :--- | :--- |
| **v1.8** | 2026-03-28 | **자체 챗봇 독립화** - 기존 카카오톡 Webhook 연동 로직 삭제 및 `insport-backend`로 프로젝트 명칭 변경 | Antigravity |
| **v1.7** | 2026-03-28 | **실시간 상담 협업** - Socket.io 도입, 관리자 대화 가로채기(Human Takeover) 및 라이브 채팅 기능 구축 | Antigravity |
| **v1.6** | 2026-03-28 | **데이터 시각화 도입** - 어드민 대시보드 내 실시간 판독 통계 차트(Chart.js) 및 긴급 알림 패널 구축 | Antigravity |
| **v1.5** | 2026-03-28 | **보안 및 상용화** - API 키 보안 프록시(Proxy) 도입, 모델 1.5-Flash-8B 교체, 지식 학습 UI 구축 | Antigravity |
| **v1.4** | 2026-03-28 | **배포 대중화** - GitHub Pages 전용 빌드/배포 환경(gh-pages) 및 모바일 UI 전면 도입 | Antigravity |
| **v1.2** | 2026-03-28 | **테스트 런처 도입** - 원클릭 실행 배치 파일(`v1.2_QuickStart.bat`) 생성 및 포트 9000 고정 | Antigravity |
| **v1.1** | 2026-03-27 | **Gemini AI 정식 통합** - Claude에서 Gemini로 엔진 전환 및 실제 API 연동 환경 구축 | Antigravity |
| **v1.0** | 2026-03-27 | 최초 기본 버전 수립 - 카카오톡 스타일 UI 및 시뮬레이션 로직 구현 | Antigravity |

---

## [v1.1] - 2026-03-27
### 📋 주요 변경 사항
- **엔진 전환:** Anthropic Claude에서 **Google Gemini 1.5 Flash**로 AI 엔진 전환.
- **실제 연동:** `@google/generative-ai` SDK 통합 및 실제 API 호출 로직 구현.
- **Vision 고도화:** Gemini 1.5의 초고속 Vision 능력을 활용한 불량 판별 로직 최적화.
- **보안:** `.env` 파일을 통한 API Key 관리 체계 도입.

## [v1.0] - 2026-03-27
### 📋 주요 변경 사항
- **UI/UX:** 프리미엄 다크 모드 및 글래스모피즘 디자인 적용.
- **기능:** 
  - 카카오 i 오픈빌더 기반 버튼 메뉴 시뮬레이션.
  - Claude Vision API 기반 이미지 분석 로직 시뮬레이션.
  - n8n 워크플로우를 통한 Slack 에스컬레이션 모드 구현.
- **기타:** `antigravity_chatbot_guide.docx` 내용 완벽 반영.
