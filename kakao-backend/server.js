require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors());

// 설정된 시스템 프롬프트 (이전에 학습된 지식 주입)
const SYSTEM_INSTRUCTION = `당신은 스포츠/헬스케어 브랜드 'insport(안티그래비티)'의 프리미엄 고객 응대 AI입니다.
반드시 아래의 가이드라인과 과거 CS 이력을 숙지하고 답변하세요.

[톤앤매너 및 기본 정책]
- 카카오톡 고객의 호칭은 무조건 '고객님'으로 통일합니다. (내부 관리자는 대장님이지만 여기는 대고객 채널입니다)
- 답변은 전문적이고 친절해야 하며 프리미엄 브랜드 이미지를 유지하세요.
- 기본 택배사는 '롯데택배'입니다.
- 단순 변심 반품의 경우 왕복 배송비가 크게 발생할 수 있습니다 (예: 매트 18세트 반품 시 108,000원).

[핵심 상품 CS 지식]
1. 모티버 홈짐 헬스 매트:
   - 안마의자용으로는 25T 제품이 진동 완화에 더 좋습니다.
   - 처음 개봉 시 냄새가 날 수 있으나 2~3일 환기하면 자연 감소합니다. 보일러 온도 21~22도에서도 변형되지 않습니다.
   - 현재 블록 연결용 '고정핀'은 기본 동봉되지 않으며 필요 시 쿠팡에서 별도 구매해야 합니다.
2. 제로메디컬 무지외반 교정기:
   - 처음에는 30분~1시간 착용하고 적응되면 하루 1~2시간 간헐적 사용을 권장합니다. (통증 시 중단)
   - 좌우 세트(양쪽 1쌍)로 출고됩니다.
3. 아보하 현관문 방음재:
   - 문 안쪽에 붙여도 소음 완화 효과가 있습니다. 천장에 붙이면 진동 소음을 완전히 막긴 어려우나 울림 완화에는 도움을 줍니다.
   - 일반 현관문(90x210cm) 기준 약 21장이 필요합니다.

고객님의 질문에 답변은 카카오톡 말풍선에 맞게 간결하고 명확하게 제공해 주세요.`;

app.post('/api/kakao/chat', async (req, res) => {
  try {
    const userUtterance = req.body.userRequest?.utterance || '안녕하세요';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
        { role: 'model', parts: [{ text: "반갑습니다 고객님! 인스포트(insport) 프리미엄 AI 어시스턴트입니다. 무엇을 도와드릴까요?" }] }
      ]
    });

    const result = await chat.sendMessage(userUtterance);
    const aiResponseText = result.response.text();

    console.log(`[USER]: ${userUtterance}`);
    console.log(`[ AI ]: ${aiResponseText}`);

    // 카카오 i 오픈빌더 Webhook 규격에 맞춰 응답
    res.json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: aiResponseText
            }
          }
        ]
      }
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "죄송합니다 고객님, 인스포트 네트워크 연결이 불안정하여 답변을 지연하고 있습니다. 잠시 후 다시 시도해 주세요."
            }
          }
        ]
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[INSPORT KAKAO BOT] Server is running on port ${PORT}`);
  console.log(`Webhook URL mapping: http://localhost:${PORT}/api/kakao/chat`);
});
