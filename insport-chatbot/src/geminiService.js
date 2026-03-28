import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI Integration for insport Chatbot
 * Supported Models: gemini-1.5-flash (fast), gemini-1.5-pro (capable)
 */

export const analyzeMessageWithGemini = async (apiKey, message, history = []) => {
  if (!apiKey) throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    }
  });

  const chat = model.startChat({
    history: history.length > 0 ? history : [
      {
        role: "user",
        parts: [{ text: `당신은 스포츠/헬스케어 브랜드 'insport(안티그래비티)'의 프리미엄 고객 응대 AI입니다.
반드시 아래의 가이드라인과 과거 CS 이력을 숙지하고 답변하세요.

[톤앤매너 및 기본 정책]
- 당신과 대화하는 사용자의 호칭은 무조건 '대장님'으로 통일합니다.
- 답변은 전문적이고 친절해야 하며 프리미엄 브랜드 이미지를 유지하세요.
- 기본 택배사는 '롯데택배'입니다.
- 단순 변심 반품의 경우 왕복 배송비가 크게 발생할 수 있습니다 (예: 매트 18세트 반품 시 108,000원).

[핵심 상품 CS 지식]
1. 모티버 홈짐 헬스 매트:
   - 안마의자용으로는 25T 제품이 진동 완화에 더 좋습니다.
   - 처음 개봉 시 냄새가 날 수 있으나 2~3일 환기하면 자연 감소합니다. 보일러 온도 21~22도에서도 변형되지 않습니다.
   - 현재 블록 연결용 '고정핀'은 기본 동봉되지 않으며 쿠팡에서 별도 지불 후 구매해야 합니다.
2. 제로메디컬 무지외반 교정기:
   - 처음에는 30분~1시간 착용하고 적응되면 하루 1~2시간 간헐적 사용을 권장합니다. (통증 시 중단)
   - 좌우 세트(양쪽 1쌍)로 출고됩니다.
3. 아보하 현관문 방음재:
   - 문 안쪽에 붙여도 소음 완화 효과가 있습니다. 천장에 붙이면 진동 소음을 완전히 막긴 어려우나 울림 완화에는 도움을 줍니다.
   - 일반 현관문(90x210cm) 기준 약 21장이 필요합니다.

대장님의 질문에 위 지식을 바탕으로 자연스럽고 명확하게 안내해 주세요.` }],
      },
      {
        role: "model",
        parts: [{ text: "반갑습니다 대장님! 인스포트(insport) 프리미엄 AI 어시스턴트입니다. 학습된 CS 데이터를 바탕으로 무엇이든 정확하게 도와드리겠습니다." }],
      },
    ],
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
};

export const analyzeImageWithGemini = async (apiKey, imageBase64) => {
  if (!apiKey) throw new Error("API Key is missing for Vision task.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const prompt = `
    당신은 안티그래비티 쇼핑몰(insport)의 CS 담당자입니다.
    고객이 보낸 사진을 분석해 아래 JSON 형식으로만 응답하세요.
    - type: "defect"(불량), "wrong_item"(오배송), "size_inquiry"(사이즈), "usage_inquiry"(사용법), "unclear"(판심불가)
    - severity: "minor", "major", "none"
    - summary: 사진에 대한 한 줄 요약
    - auto_reply: 고객에게 전송할 친절한 인스포트 브랜드 말투의 답변 메시지 (대장님 호칭 사용 금지, 고객님 호칭 사용)
    - admin_alert: 관리자(Slack)에게 전달할 기술적 요약
  `;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg"
    }
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();
  
  // Clean up the JSON output (in case Gemini adds markdown backticks)
  try {
    const jsonStr = text.match(/\{[\s\S]*\}/)[0];
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text);
    return {
      type: "unclear",
      severity: "none",
      summary: "분석에 실패했습니다.",
      auto_reply: "죄송합니다, 사진 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      admin_alert: "Gemini Vision Error: Invalid JSON response."
    };
  }
};
