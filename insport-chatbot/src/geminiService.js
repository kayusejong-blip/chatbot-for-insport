/**
 * [SECURITY UPDATED] Professional AI Service Proxy
 * 프론트엔드에서는 어떠한 API Key도 사용하지 않으며, 
 * 모든 요청은 안전한 백엔드 서버(Port 3000)를 거쳐 처리됩니다.
 */

const API_SERVER = "http://localhost:3000";

export const analyzeMessageWithGemini = async (notUsedKey, message, history = []) => {
  try {
    const res = await fetch(`${API_SERVER}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  } catch (e) {
    console.error("Chat Error:", e);
    throw new Error("서버와 통신할 수 없습니다. (백엔드 실행 확인 요망)");
  }
};

export const analyzeImageWithGemini = async (notUsedKey, imageBase64) => {
  const prompt = `
    당신은 안티그래비티 쇼핑몰(insport)의 CS 담당자입니다.
    고객이 보낸 사진을 분석해 아래 JSON 형식으로만 응답하세요.
    - type: "defect"(불량), "wrong_item"(오배송), "size_inquiry"(사이즈), "usage_inquiry"(사용법), "unclear"(판심불가)
    - severity: "minor", "major", "none"
    - summary: 사진에 대한 한 줄 요약
    - auto_reply: 고객에게 전송할 친절한 인스포트 브랜드 말투의 답변 메시지 (고객님 호칭 사용)
    - admin_alert: 관리자에게 전달할 기술적 요약
  `;

  try {
    const res = await fetch(`${API_SERVER}/api/vision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, prompt })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const text = data.text;
    const jsonStr = text.match(/\{[\s\S]*\}/)[0];
    return JSON.parse(jsonStr);

  } catch (e) {
    console.error("Vision Error:", e);
    return {
      type: "unclear",
      severity: "none",
      summary: "분석에 실패했습니다.",
      auto_reply: "이미지 분석 중 오류가 발생했습니다. 잠시 후 시도해 주세요.",
      admin_alert: "Backend Vision Error: " + e.message
    };
  }
};
