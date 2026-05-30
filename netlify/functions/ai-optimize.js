const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-nano";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}

function clampText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeArray(value, itemMaxLength, maxItems) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clampText(item, itemMaxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function extractOutputText(response) {
  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }
  if (!Array.isArray(response.output)) return "";
  return response.output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}

function buildPrompt(input) {
  const disliked = input.dislikedExpressions.length
    ? input.dislikedExpressions.map((item) => `- ${item}`).join("\n")
    : "无";
  const examples = input.phraseExamples.length
    ? input.phraseExamples.map((item) => `- ${item}`).join("\n")
    : "无";

  return [
    "请基于以下信息优化一段家校沟通话术。",
    "",
    `学段：${input.stage}`,
    `沟通对象：${input.target}`,
    `沟通场景：${input.scenario}`,
    `语气风格：${input.tone}`,
    `具体情况：${input.detail}`,
    "",
    `当前模板话术：${input.templateText}`,
    "",
    `用户常用开头：${input.preferredOpening || "无"}`,
    `用户常用结尾：${input.preferredEnding || "无"}`,
    "",
    "用户不喜欢的表达：",
    disliked,
    "",
    "用户话术库示例：",
    examples
  ].join("\n");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "只支持 POST 请求。" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: "AI功能暂未配置，请先在 Netlify 后台配置 OPENAI_API_KEY。"
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return json(400, { error: "请求格式不正确。" });
  }

  const input = {
    stage: clampText(body.stage, 20),
    target: clampText(body.target, 30),
    scenario: clampText(body.scenario, 40),
    tone: clampText(body.tone, 40),
    detail: clampText(body.detail, 700),
    templateText: clampText(body.templateText, 2800),
    preferredOpening: clampText(body.preferredOpening, 160),
    preferredEnding: clampText(body.preferredEnding, 160),
    dislikedExpressions: normalizeArray(body.dislikedExpressions, 80, 30),
    phraseExamples: normalizeArray(body.phraseExamples, 280, 5)
  };

  if (!input.detail || !input.templateText) {
    return json(400, { error: "请先生成模板话术，再使用 AI 优化。" });
  }

  const systemPrompt = [
    "你是一名有经验的中国中小学班主任，熟悉真实家校沟通场景，擅长把容易引起误会的话说得温和、清楚、有边界感。",
    "优化要求：语言自然，像真实老师会发给家长的微信消息；温和、专业、有边界感；不指责家长；不羞辱学生；不使用“总是、从来、必须、严重、太差、你家孩子又……”等容易引发对立的表达；不制造焦虑，不夸大问题；不编造学生姓名、家庭情况、成绩数据；尽量使用用户设置的常用开头和常用结尾；尽量避开用户不喜欢的表达；如果用户提供了自己的话术库示例，要参考其表达风格，但不要机械复制。",
    "输出控制在 120 到 220 字。只输出优化后的话术正文，不要输出解释、标题、分析过程或项目符号。"
  ].join("\n");

  try {
    const openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions: systemPrompt,
        input: buildPrompt(input),
        max_output_tokens: 360
      })
    });

    const data = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      console.error("OpenAI request failed", {
        status: openaiResponse.status,
        message: data.error && data.error.message
      });
      return json(502, { error: "AI优化暂时不可用，请稍后再试。" });
    }

    const optimizedText = extractOutputText(data);
    if (!optimizedText) {
      return json(502, { error: "AI没有返回有效内容，请稍后重试。" });
    }

    return json(200, { optimizedText });
  } catch (error) {
    console.error("AI optimize function failed", error && error.message);
    return json(502, { error: "AI优化暂时不可用，请稍后再试。" });
  }
};
