# 🚀 Project insport AI Chatbot - 버전 관리 로그

| 버전 | 날짜 | 업데이트 요약 | 작업자 |
| :--- | :--- | :--- | :--- |
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
