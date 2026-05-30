"use strict";

const STORAGE_KEYS = {
  library: "bzgtt_library_v1",
  blocked: "bzgtt_blocked_v1",
  style: "bzgtt_style_v1",
  history: "bzgtt_history_v1",
  aiUsage: "bzgtt_ai_usage_v1"
};

const DEFAULT_BLOCKED = [
  "你家孩子又没写作业",
  "家长必须重视起来",
  "这个问题很严重",
  "请家长好好管一下"
];

const DEFAULT_STYLE = {
  defaultTeacherRole: "班主任",
  defaultTone: "温和",
  opening: "家长您好",
  ending: "感谢配合",
  avoidStyles: ["指责家长", "羞辱学生", "夸大问题", "制造焦虑"]
};

const SCENE_TEMPLATES = {
  "催作业": {
    observation: "作业目前还没有看到完成或提交记录",
    softReason: "可能是孩子忘记整理，也可能是完成后还没有及时提交",
    action: "今晚方便时一起确认作业完成情况，并提醒孩子按时整理提交",
    brief: "想提醒一下，{context}。麻烦您方便时帮忙确认一下，避免孩子后续订正和学习跟进受到影响。",
    warm: "想和您简单同步一下，{context}。我们先不急着批评孩子，可以先帮孩子把今天需要完成的内容理清楚，再一起提醒按时提交。",
    formal: "现就{context}与您沟通。建议今晚核对作业完成情况，并提醒孩子按要求提交，以便后续课堂反馈和订正能够衔接。",
    advice: "适合在作业临近截止、老师需要提醒但不想制造压力时使用。重点放在事实和下一步，不评价家长，也不直接给孩子贴标签。"
  },
  "多次未交作业": {
    observation: "近期出现了几次作业未按时提交的情况",
    softReason: "背后可能有时间安排、作业理解或习惯稳定性方面的原因",
    action: "先和孩子一起梳理原因，再约定一个固定检查和提交时间",
    brief: "{context}，想和您一起关注一下。我们可以先了解原因，再帮孩子建立一个更稳定的完成节奏。",
    warm: "想和您沟通一下，{context}。我这边会继续提醒孩子，也建议家里先和孩子平静聊聊原因，找到一个能坚持的小办法。",
    formal: "现反馈{context}。为保证学习任务能够持续跟进，建议家校共同帮助孩子明确完成要求、提交时间和必要的检查方式。",
    advice: "适合连续多次未交作业时使用。语气可以比普通提醒更明确，但仍然围绕原因、规则和可执行安排，不使用责备式表达。"
  },
  "上课讲话走神": {
    observation: "课堂专注度近期不够稳定",
    softReason: "有时会出现讲话、走神或跟不上课堂节奏的情况",
    action: "先从课前提醒、课堂目标和课后简短复盘做起",
    brief: "想反馈一下，{context}。我会在课堂上继续提醒，也麻烦您在家里帮孩子一起巩固专注听讲的习惯。",
    warm: "想和您简单说一下，{context}。孩子不是没有优点，我们先把注意力放在一个小目标上，比如一节课先做到认真听重点、及时记录。",
    formal: "现就{context}与您沟通。建议家校共同引导孩子明确课堂规则，减少无关交流，提高课堂参与和听讲效率。",
    advice: "适合课堂纪律和注意力沟通。建议先讲观察到的行为，再讲帮助方法，避免把孩子概括成“不认真”或“不听话”。"
  },
  "成绩退步": {
    observation: "近期学习结果出现了一些波动",
    softReason: "可能和知识点掌握、复习节奏或考试状态有关",
    action: "先找出薄弱点，再安排小范围、可完成的复习目标",
    brief: "想和您反馈一下，{context}。这次我们先不急着下结论，重点看看薄弱点在哪里，再一起帮助孩子调整。",
    warm: "想和您聊聊，{context}。一次结果不能代表全部，我们可以把它当作一次提醒，先找到孩子最需要补上的部分。",
    formal: "现就{context}与您沟通。建议结合近期作业、课堂表现和检测情况分析原因，再制定阶段性巩固计划。",
    advice: "适合考试后或阶段反馈。表达上要稳定，少用“下滑严重”等词，多用“波动”“薄弱点”“下一步计划”。"
  },
  "表扬进步": {
    observation: "孩子近期有比较明显的积极变化",
    softReason: "这些变化值得及时肯定，也能帮助孩子建立信心",
    action: "继续肯定具体行为，并把好的做法稳定下来",
    brief: "想和您分享一个好消息，{context}。孩子这段时间的努力值得肯定，也希望我们继续一起鼓励。",
    warm: "想和您分享一下，{context}。我能看到孩子在慢慢调整，这份进步很珍贵，家里也可以具体表扬孩子做得好的地方。",
    formal: "现反馈{context}。建议继续关注并巩固孩子已经形成的积极表现，帮助其保持稳定的学习和行为习惯。",
    advice: "适合正向反馈。尽量表扬具体行为，而不是只说“真棒”，这样家长和孩子都更知道接下来该坚持什么。"
  },
  "情绪低落": {
    observation: "孩子近期情绪状态比平时低落",
    softReason: "可能需要更多倾听、陪伴和稳定的支持",
    action: "先温和了解原因，减少追问压力，并持续观察变化",
    brief: "想和您轻轻反馈一下，{context}。我会在学校多留意，也建议家里先多倾听，给孩子一点缓冲空间。",
    warm: "想和您沟通一个需要关注的小情况，{context}。我们可以先不急着追问原因，尽量让孩子感到被理解，再慢慢了解发生了什么。",
    formal: "现就{context}与您沟通。建议家校共同保持观察，以平稳、支持性的方式了解孩子近期状态，必要时及时进一步沟通。",
    advice: "适合情绪和心理状态初步沟通。表达要谨慎，不做诊断，不夸大问题，强调观察、陪伴和后续跟进。"
  },
  "同学冲突": {
    observation: "孩子和同学之间出现了一些矛盾或摩擦",
    softReason: "同伴相处中难免会有情绪和理解上的偏差",
    action: "先还原事实，再引导孩子表达感受、承担该承担的部分",
    brief: "想和您同步一下，{context}。我会先了解双方情况，也希望家里先安抚孩子情绪，再一起引导孩子理性处理。",
    warm: "想和您沟通一下，{context}。我们会尽量把事实了解清楚，也会保护孩子的感受，引导孩子学会更合适地表达和解决问题。",
    formal: "现就{context}与您沟通。学校将进一步了解事件经过，并根据实际情况引导学生进行沟通、反思和改进。",
    advice: "适合同伴矛盾。建议避免提前定性谁对谁错，先讲“了解情况”和“共同引导”，给后续处理留出空间。"
  },
  "班级活动通知": {
    observation: "班级活动有相关安排需要同步",
    softReason: "提前准备能帮助孩子更从容地参与",
    action: "按通知时间准备物品、确认参与安排，并及时反馈特殊情况",
    brief: "想提醒一下，{context}。请您留意活动时间和所需准备，如有特殊情况可以提前和我沟通。",
    warm: "和大家同步一下，{context}。为了让孩子们活动当天更顺利，麻烦各位家长提前帮孩子确认所需物品和时间安排。",
    formal: "现通知{context}。请家长按照活动要求协助孩子做好准备，如有特殊情况，请提前与老师联系。",
    advice: "适合发班级群。内容要清楚、短句、分清时间和准备事项，语气礼貌但安排明确。"
  },
  "家长会通知": {
    observation: "家长会相关安排需要提前告知",
    softReason: "提前确认时间能方便家校沟通更充分",
    action: "确认参会时间和方式，如无法参加请提前联系",
    brief: "想通知一下，{context}。请您提前安排好时间参加，如有特殊情况可以提前和我说明。",
    warm: "想和各位家长同步，{context}。这次家长会主要是交流孩子们近期情况和后续安排，期待和大家一起把支持做得更细。",
    formal: "现通知{context}。请各位家长按时参加会议，确有特殊情况无法参加的，请提前与班主任联系。",
    advice: "适合正式通知。建议明确时间、地点或方式、参会要求和请假方式，保持礼貌、简洁、可执行。"
  },
  "安全提醒": {
    observation: "有一项安全事项需要共同提醒孩子",
    softReason: "安全习惯需要学校和家庭持续保持一致",
    action: "结合实际场景提醒孩子遵守规则，遇到问题及时告诉老师或家长",
    brief: "想提醒一下，{context}。安全问题需要我们一起多叮嘱，帮助孩子把规则记在心里、落实在行动上。",
    warm: "想和您同步一个安全提醒，{context}。我会在学校继续强调，也麻烦家里结合日常场景再和孩子温和地说一说。",
    formal: "现就{context}进行提醒。请家长配合学校加强安全教育，引导孩子遵守相关要求，遇到异常情况及时告知老师或家长。",
    advice: "适合班级群或个人提醒。安全沟通可以明确要求，但不要制造恐慌，重点是规则、预防和反馈渠道。"
  }
};

const state = {
  library: [],
  blocked: [],
  style: { ...DEFAULT_STYLE },
  history: [],
  lastGeneration: null
};

const AI_DAILY_LIMIT = 5;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function multiline(value) {
  return String(value || "").trim().replace(/\n{3,}/g, "\n\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFormData() {
  return {
    stage: $("#stage").value,
    teacherRole: $("#teacher-role").value,
    audience: $("#audience").value,
    scenario: $("#scenario").value,
    tone: $("#tone").value,
    details: multiline($("#details").value)
  };
}

function getTeacherMeta(role) {
  const value = role || state.style.defaultTeacherRole || DEFAULT_STYLE.defaultTeacherRole;
  const subjectMap = {
    "语文老师": "语文",
    "数学老师": "数学",
    "英语老师": "英语",
    "科学老师": "科学",
    "道德与法治老师": "道德与法治",
    "历史老师": "历史",
    "地理老师": "地理",
    "物理老师": "物理",
    "化学老师": "化学",
    "生物老师": "生物",
    "体育老师": "体育",
    "音乐老师": "音乐",
    "美术老师": "美术",
    "信息科技老师": "信息科技",
    "心理老师": "心理"
  };
  const subject = subjectMap[value] || "";
  const isHomeroom = value === "班主任";
  const isKindergarten = value === "幼儿园老师";
  const isSubjectTeacher = Boolean(subject) || value === "其他任课老师";
  let scope = "班级整体情况";
  if (isKindergarten) scope = "在园表现和一日活动";
  if (subject) scope = `${subject}学习情况`;
  if (value === "其他任课老师") scope = "任教学科表现";
  return {
    role: value,
    subject,
    scope,
    isHomeroom,
    isSubjectTeacher,
    teacherSide: isHomeroom ? "我这边" : `${value}这边`
  };
}

function teacherRoleLine(data) {
  const meta = getTeacherMeta(data.teacherRole);
  if (meta.isHomeroom) return "";
  if (data.audience === "学生本人") {
    return `作为${meta.role}，我会继续关注你在${meta.scope}中的具体表现。`;
  }
  if (data.audience === "班级群") {
    return `我主要从${meta.scope}的角度同步，涉及班级整体安排会和班主任保持一致。`;
  }
  return `我主要从${meta.scope}的角度和您沟通，涉及班级整体情况也会和班主任保持同步。`;
}

function getAudienceWords(audience, stage) {
  if (audience === "学生本人") {
    return {
      subject: stage === "幼儿园" ? "你" : "你",
      helper: "老师",
      partner: "我们",
      suffix: "老师会继续陪你一起调整"
    };
  }
  if (audience === "班级群") {
    return {
      subject: stage === "幼儿园" ? "孩子们" : "同学们",
      helper: "各位家长",
      partner: "家校",
      suffix: state.style.ending || DEFAULT_STYLE.ending
    };
  }
  return {
    subject: stage === "幼儿园" || stage === "小学" ? "孩子" : "孩子",
    helper: "您",
    partner: "我们",
    suffix: state.style.ending || DEFAULT_STYLE.ending
  };
}

function resolveOpening(audience) {
  const opening = state.style.opening || DEFAULT_STYLE.opening;
  if (audience === "班级群" && opening === "家长您好") return "各位家长好";
  if (audience === "学生本人" && opening.includes("家长")) return "想和你简单聊一聊";
  if (audience === "学生本人" && opening.includes("您")) return opening.replaceAll("您", "你");
  return opening;
}

function resolveEnding(audience) {
  const ending = state.style.ending || DEFAULT_STYLE.ending;
  if (audience === "学生本人") {
    if (ending.includes("配合")) return "老师会继续陪你一起调整";
    return ending.replaceAll("您", "你");
  }
  return ending;
}

function contextText(data, template) {
  const safeDetails = data.details ? sanitizeText(data.details) : "";
  if (safeDetails) return safeDetails.replace(/[。！？!?；;，,]+$/g, "");
  return template.observation;
}

function toneLine(tone, audience, teacherRole) {
  const student = audience === "学生本人";
  const meta = getTeacherMeta(teacherRole);
  const lines = {
    "温和": student ? "我们先不急着否定自己，先找到下一步能做的小调整。" : "我们先不急着下结论，重点放在接下来怎么帮助孩子。",
    "正式": student ? "接下来请你按约定完成，并及时和老师反馈。" : "如有特殊情况，也请您及时和我沟通。",
    "委婉": student ? "如果最近确实有困难，可以找一个合适的时间和老师说。" : "如果近期有特殊情况，也欢迎您方便时和我说一声。",
    "坚定": student ? "规则和时间节点需要认真遵守，老师也会继续提醒你。" : "也希望我们先把今天能落实的步骤定下来，帮助孩子形成稳定习惯。",
    "鼓励": student ? "只要开始做出一点改变，老师都会看见并及时肯定。" : "看到一点变化就及时肯定，孩子会更容易继续坚持。",
    "有边界感": student ? "老师能做的是观察、提醒和支持，你也需要为自己的行动做出调整。" : `${meta.teacherSide}会继续观察和提醒，家庭部分还需要结合实际情况共同配合。`
  };
  return lines[tone] || lines[state.style.defaultTone] || lines["温和"];
}

function avoidStyleLine(audience) {
  const avoids = state.style.avoidStyles || [];
  if (!avoids.length) return "";
  if (audience === "学生本人") {
    return "这里不评价你这个人，只讨论这件事和接下来可以怎么做。";
  }
  if (avoids.includes("指责家长") || avoids.includes("制造焦虑")) {
    return "这不是为了给家长增加压力，而是希望我们把情况看清楚，把支持落到具体步骤上。";
  }
  return "我们尽量只谈观察到的事实和可执行的办法。";
}

function findReferencePhrase(scenario, tone) {
  if (!state.library.length) return "";
  const normalizedScenario = normalizeText(scenario);
  const normalizedTone = normalizeText(tone);
  const matched = state.library.find((item) => {
    const itemScenario = normalizeText(item.scenario);
    const itemTone = normalizeText(item.tone);
    return (
      itemScenario.includes(normalizedScenario) ||
      normalizedScenario.includes(itemScenario) ||
      itemTone.includes(normalizedTone) ||
      normalizedTone.includes(itemTone)
    );
  });
  return matched ? sanitizeText(matched.content).slice(0, 120) : "";
}

function fillTemplate(text, data, template) {
  return text.replaceAll("{context}", contextText(data, template));
}

function adaptAudienceText(text, audience) {
  let result = String(text || "");
  if (audience === "学生本人") {
    result = result
      .replaceAll("家校", "老师和你")
      .replaceAll("家庭部分", "你自己能调整的部分")
      .replaceAll("家长", "你")
      .replaceAll("孩子们", "大家")
      .replaceAll("孩子", "你")
      .replaceAll("您", "你")
      .replaceAll("家里", "课后")
      .replaceAll("麻烦你", "也请你")
      .replaceAll("与你沟通", "和你聊一聊");
  }
  if (audience === "班级群") {
    result = result
      .replaceAll("麻烦您", "麻烦各位家长")
      .replaceAll("请您", "请各位家长")
      .replaceAll("和您", "和各位家长")
      .replaceAll("您", "各位家长");
  }
  return result;
}

function adaptTeacherRoleText(text, data) {
  const meta = getTeacherMeta(data.teacherRole);
  let result = String(text || "");
  if (!meta.isHomeroom) {
    result = result
      .replaceAll("我这边会继续提醒", `${meta.teacherSide}会继续提醒`)
      .replaceAll("我会在课堂上", meta.subject ? `我会在${meta.subject}课堂上` : "我会在课堂上")
      .replaceAll("学校这边", meta.teacherSide)
      .replaceAll("学校将进一步了解", `${meta.role}会进一步了解`)
      .replaceAll("请提前与班主任联系", "请提前与班主任或相关老师联系");
  }
  return result;
}

function buildVersion(data, type) {
  const template = SCENE_TEMPLATES[data.scenario];
  const opening = resolveOpening(data.audience);
  const ending = resolveEnding(data.audience);
  const words = getAudienceWords(data.audience, data.stage);
  const reference = findReferencePhrase(data.scenario, data.tone);
  const toneText = toneLine(data.tone, data.audience, data.teacherRole);
  const avoidText = avoidStyleLine(data.audience);
  const roleText = teacherRoleLine(data);
  const personalLine = reference
    ? `\n\n也可以参考你话术库里的表达：${reference}`
    : "";
  const stageLine = data.audience === "学生本人"
    ? `我看到的是${words.subject}最近的具体表现，不是给你下结论。`
    : `${data.stage}阶段的沟通可以先关注具体表现，再一起看支持办法。`;

  let body = "";
  if (type === "brief") {
    body = `${opening}，${fillTemplate(template.brief, data, template)} ${roleText} ${toneText} ${ending}。`;
  }
  if (type === "warm") {
    body = `${opening}，${fillTemplate(template.warm, data, template)} ${stageLine} ${roleText} ${toneText} ${avoidText} ${ending}。${personalLine}`;
  }
  if (type === "formal") {
    body = `${opening}，${fillTemplate(template.formal, data, template)} 下一步建议：${template.action}。${roleText} ${toneText} ${ending}。`;
  }

  const compact = body.replace(/\s+/g, " ").replace(/\n /g, "\n").trim();
  const adapted = adaptTeacherRoleText(adaptAudienceText(compact, data.audience), data);
  return sanitizeText(adapted);
}

function buildAdvice(data) {
  const template = SCENE_TEMPLATES[data.scenario];
  const meta = getTeacherMeta(data.teacherRole);
  const libraryHint = findReferencePhrase(data.scenario, data.tone)
    ? "已参考你的个人话术库，可根据实际关系再删减一句。"
    : "如果你有更常用的表达，可以先添加到话术库，后续生成会自动参考。";
  const boundaryHint = data.tone === "有边界感"
    ? `当前选择了有边界感语气，建议只承诺${meta.isHomeroom ? "学校或班级" : meta.role}能持续观察、提醒和反馈的部分。`
    : "建议保持事实先行、建议跟上、语气稳定。";
  const roleHint = meta.isHomeroom
    ? "当前是班主任视角，可以覆盖班级整体管理、学生状态和家校协同。"
    : `当前是${meta.role}视角，建议重点说${meta.scope}，涉及班级整体事务可提示与班主任同步。`;
  return sanitizeText(`${template.advice}\n\n${roleHint}\n\n${boundaryHint}\n\n${libraryHint}`);
}

function sanitizeText(text) {
  let result = String(text || "");
  const replacements = [
    ["你家孩子又没写作业", "孩子这次作业还没有看到提交记录"],
    ["家长必须重视起来", "我们可以一起关注起来"],
    ["这个问题很严重", "这个情况需要及时关注"],
    ["请家长好好管一下", "也请您在家里协助提醒一下"]
  ];

  replacements.forEach(([bad, good]) => {
    result = result.replaceAll(bad, good);
  });

  state.blocked.forEach((item) => {
    const phrase = normalizeText(typeof item === "string" ? item : item.content);
    if (!phrase) return;
    result = result.split(phrase).join("需要进一步关注");
  });

  return result.replace(/\s+。/g, "。").replace(/。{2,}/g, "。").trim();
}

function generateTalk(data) {
  return {
    brief: buildVersion(data, "brief"),
    warm: buildVersion(data, "warm"),
    formal: buildVersion(data, "formal"),
    advice: buildAdvice(data)
  };
}

function renderAIOptimizeCard() {
  return `
    <article class="result-card ai-action-card" id="ai-action-card">
      <h2>AI优化话术</h2>
      <p class="result-body">AI会在模板话术基础上，优化成更自然、更适合发送给家长的版本。</p>
      <div class="privacy-note ai-privacy-note">
        <strong>使用前提醒</strong>
        <span>请勿输入学生真实姓名、手机号、家庭住址、身份证号、照片、健康情况等敏感信息。AI内容仅供参考，请老师结合实际情况修改后使用。</span>
      </div>
      <div class="card-actions">
        <button class="primary-action" type="button" id="ai-optimize-button">AI优化话术</button>
      </div>
      <p class="ai-status" id="ai-status" role="status" aria-live="polite"></p>
    </article>
  `;
}

function renderResults(results) {
  const labels = [
    ["brief", "简短版"],
    ["warm", "温和版"],
    ["formal", "正式版"],
    ["advice", "推荐使用建议"]
  ];

  $("#results").innerHTML = labels.map(([key, label]) => `
    <article class="result-card ${key === "advice" ? "advice-card" : ""}">
      <h2>${label}</h2>
      <p class="result-body">${escapeHtml(results[key])}</p>
      <div class="card-actions">
        <button class="tool-button" type="button" data-copy="${escapeHtml(results[key])}">复制</button>
      </div>
    </article>
  `).join("") + renderAIOptimizeCard();
}

function renderAIResult(text) {
  const existing = $("#ai-result-card");
  if (existing) existing.remove();
  $("#results").insertAdjacentHTML("beforeend", `
    <article class="result-card ai-result-card" id="ai-result-card">
      <h2>AI优化版</h2>
      <p class="result-body">${escapeHtml(text)}</p>
      <div class="card-actions">
        <button class="tool-button" type="button" data-copy="${escapeHtml(text)}">复制</button>
      </div>
    </article>
  `);
}

function setAIStatus(message, type = "info") {
  const status = $("#ai-status");
  if (!status) return;
  status.textContent = message || "";
  status.dataset.type = type;
}

function setAILoading(isLoading) {
  const button = $("#ai-optimize-button");
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? "AI正在优化，请稍候……" : "AI优化话术";
}

function addHistory(data, results) {
  const item = {
    id: uid(),
    time: new Date().toISOString(),
    teacherRole: data.teacherRole,
    scenario: data.scenario,
    details: data.details || "未填写具体情况",
    results
  };
  state.history = [item, ...state.history].slice(0, 20);
  saveJson(STORAGE_KEYS.history, state.history);
  renderHistory();
  updateStats();
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function copyText(text) {
  const value = String(text || "");
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast("已复制到剪贴板");
  } catch (error) {
    showToast("复制失败，请手动选择文本复制");
  }
}

let toastTimer = 0;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function switchPage(page) {
  $$(".page").forEach((section) => {
    section.classList.toggle("active", section.dataset.page === page);
  });
  $$(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  $(".main-nav").classList.remove("open");
  $(".nav-toggle").setAttribute("aria-expanded", "false");
  if (location.hash.slice(1) !== page) {
    history.replaceState(null, "", `#${page}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderLibrary() {
  const query = normalizeText($("#library-search").value).toLowerCase();
  const items = state.library.filter((item) => {
    const text = `${item.content} ${item.scenario} ${item.tone}`.toLowerCase();
    return text.includes(query);
  });

  if (!state.library.length && !query) {
    $("#library-list").innerHTML = `
      <div class="library-empty">
        <p>你可以把自己平时常用、家长也容易接受的话术保存下来，后续生成时作为参考。</p>
        <ul class="library-empty-list">
          <li>“家长您好，想和您简单反馈一下孩子最近的情况。”</li>
          <li>“我们先不着急下结论，可以一起看看孩子最近遇到了哪些困难。”</li>
          <li>“后续我也会在学校继续关注，我们一起帮助孩子慢慢调整。”</li>
        </ul>
      </div>
    `;
    return;
  }

  $("#library-list").innerHTML = items.length ? items.map((item) => `
    <article class="item-card">
      <h3>${escapeHtml(item.scenario || "未设置场景")}</h3>
      <div class="tag-row">
        <span class="tag">${escapeHtml(item.scenario || "通用")}</span>
        <span class="tag alt">${escapeHtml(item.tone || "未设置语气")}</span>
      </div>
      <p>${escapeHtml(item.content)}</p>
      <div class="card-actions">
        <button class="tool-button" type="button" data-library-edit="${item.id}">编辑</button>
        <button class="tool-button" type="button" data-copy="${escapeHtml(item.content)}">复制</button>
        <button class="tool-button danger" type="button" data-library-delete="${item.id}">删除</button>
      </div>
    </article>
  `).join("") : `<div class="empty-state">还没有匹配的话术。可以先添加一条你常用的温和表达。</div>`;
}

function resetLibraryForm() {
  $("#library-id").value = "";
  $("#library-content").value = "";
  $("#library-scenario").value = "";
  $("#library-tone").value = "";
  $("#library-submit").textContent = "新增话术";
  $("#cancel-library-edit").classList.add("hidden");
}

function renderBlocked() {
  const query = normalizeText($("#blocked-search").value).toLowerCase();
  const items = state.blocked.filter((item) => item.content.toLowerCase().includes(query));
  $("#blocked-list").innerHTML = items.length ? items.map((item) => `
    <article class="item-card">
      <h3>避免表达</h3>
      <div class="tag-row">
        <span class="tag warn">生成时过滤</span>
      </div>
      <p>${escapeHtml(item.content)}</p>
      <div class="card-actions">
        <button class="tool-button" type="button" data-copy="${escapeHtml(item.content)}">复制</button>
        <button class="tool-button danger" type="button" data-blocked-delete="${item.id}">删除</button>
      </div>
    </article>
  `).join("") : `<div class="empty-state">暂无匹配表达。你可以添加希望系统避开的说法。</div>`;
}

function renderHistory() {
  const query = normalizeText($("#history-search").value).toLowerCase();
  const items = state.history.filter((item) => {
    const text = `${item.teacherRole || ""} ${item.scenario} ${item.details} ${Object.values(item.results).join(" ")}`.toLowerCase();
    return text.includes(query);
  });

  $("#history-list").innerHTML = items.length ? items.map((item) => {
    const teacherRole = item.teacherRole || "班主任";
    const allText = [
      `教师身份：${teacherRole}`,
      `场景：${item.scenario}`,
      `具体情况：${item.details}`,
      "",
      `简短版：${item.results.brief}`,
      "",
      `温和版：${item.results.warm}`,
      "",
      `正式版：${item.results.formal}`,
      "",
      `推荐使用建议：${item.results.advice}`
    ].join("\n");
    return `
      <article class="item-card" data-history-card="${item.id}">
        <h3>${escapeHtml(item.scenario)}</h3>
        <div class="tag-row">
          <span class="tag warn">${escapeHtml(teacherRole)}</span>
          <span class="tag">${formatTime(item.time)}</span>
          <span class="tag alt">${escapeHtml(item.details.slice(0, 28))}${item.details.length > 28 ? "..." : ""}</span>
        </div>
        <div class="card-actions">
          <button class="tool-button" type="button" data-history-view="${item.id}">查看</button>
          <button class="tool-button" type="button" data-copy="${escapeHtml(allText)}">复制</button>
          <button class="tool-button danger" type="button" data-history-delete="${item.id}">删除</button>
        </div>
        <div class="history-content">
          <p><strong>教师身份：</strong>${escapeHtml(teacherRole)}</p>
          <p><strong>具体情况：</strong>${escapeHtml(item.details)}</p>
          <p><strong>简短版：</strong>${escapeHtml(item.results.brief)}</p>
          <p><strong>温和版：</strong>${escapeHtml(item.results.warm)}</p>
          <p><strong>正式版：</strong>${escapeHtml(item.results.formal)}</p>
          <p><strong>推荐使用建议：</strong>${escapeHtml(item.results.advice)}</p>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">还没有生成记录。生成一次话术后，这里会自动保存最近 20 条。</div>`;
}

function renderStyleForm() {
  $("#style-teacher-role").value = state.style.defaultTeacherRole || DEFAULT_STYLE.defaultTeacherRole;
  $("#style-default-tone").value = state.style.defaultTone || DEFAULT_STYLE.defaultTone;
  $("#style-opening").value = state.style.opening || DEFAULT_STYLE.opening;
  $("#style-ending").value = state.style.ending || DEFAULT_STYLE.ending;
  $$("input[name='avoidStyle']").forEach((checkbox) => {
    checkbox.checked = (state.style.avoidStyles || []).includes(checkbox.value);
  });
  const generatorTone = $("#tone");
  const defaultTone = state.style.defaultTone || DEFAULT_STYLE.defaultTone;
  if ([...generatorTone.options].some((option) => option.value === defaultTone)) {
    generatorTone.value = defaultTone;
  }
  const generatorRole = $("#teacher-role");
  const defaultTeacherRole = state.style.defaultTeacherRole || DEFAULT_STYLE.defaultTeacherRole;
  if ([...generatorRole.options].some((option) => option.value === defaultTeacherRole)) {
    generatorRole.value = defaultTeacherRole;
  }
}

function updateStats() {
  $("#stat-library").textContent = state.library.length;
  $("#stat-blocked").textContent = state.blocked.length;
  $("#stat-history").textContent = state.history.length;
}

function detectPrivacyRisk(value) {
  const text = String(value || "");
  const compact = text.replace(/[\s-]/g, "");
  const hasMobile = /(?:\+?86)?1[3-9]\d{9}/.test(compact);
  const hasIdNumber = /\d{17}[\dXx]/.test(compact);
  const hasLongNumber = /\d{6,}/.test(compact);
  return hasMobile || hasIdNumber || hasLongNumber;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAIUsage() {
  const saved = loadJson(STORAGE_KEYS.aiUsage, null);
  const today = todayKey();
  if (!saved || saved.date !== today) {
    return { date: today, count: 0 };
  }
  return { date: today, count: Number(saved.count) || 0 };
}

function incrementAIUsage() {
  const usage = getAIUsage();
  const next = { date: usage.date, count: usage.count + 1 };
  saveJson(STORAGE_KEYS.aiUsage, next);
  return next;
}

function getDislikedExpressions() {
  return state.blocked
    .map((item) => normalizeText(typeof item === "string" ? item : item.content))
    .filter(Boolean)
    .slice(0, 30);
}

function getPhraseExamples(scenario, tone) {
  const normalizedScenario = normalizeText(scenario);
  const normalizedTone = normalizeText(tone);
  const scored = state.library.map((item, index) => {
    const itemScenario = normalizeText(item.scenario);
    const itemTone = normalizeText(item.tone);
    let score = 0;
    if (itemScenario && (itemScenario.includes(normalizedScenario) || normalizedScenario.includes(itemScenario))) score += 3;
    if (itemTone && (itemTone.includes(normalizedTone) || normalizedTone.includes(itemTone))) score += 2;
    return { item, score, index };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 5)
    .map(({ item }) => multiline(item.content))
    .filter(Boolean);
}

function buildAIRequestPayload() {
  if (!state.lastGeneration) return null;
  const { data, results } = state.lastGeneration;
  return {
    stage: data.stage,
    target: data.audience,
    scenario: data.scenario,
    tone: data.tone,
    detail: data.details,
    templateText: [
      `简短版：${results.brief}`,
      `温和版：${results.warm}`,
      `正式版：${results.formal}`
    ].join("\n"),
    preferredOpening: state.style.opening || DEFAULT_STYLE.opening,
    preferredEnding: state.style.ending || DEFAULT_STYLE.ending,
    dislikedExpressions: getDislikedExpressions(),
    phraseExamples: getPhraseExamples(data.scenario, data.tone)
  };
}

async function handleAIOptimize() {
  if (!state.lastGeneration) {
    setAIStatus("请先生成模板话术，再使用 AI优化。", "error");
    showToast("请先生成模板话术");
    return;
  }

  if (detectPrivacyRisk(state.lastGeneration.data.details)) {
    $("#privacy-warning").classList.remove("hidden");
    setAIStatus("检测到疑似手机号、身份证号或其他敏感信息，请先删除或匿名化后再使用 AI 优化。", "error");
    return;
  }

  const usage = getAIUsage();
  if (usage.count >= AI_DAILY_LIMIT) {
    setAIStatus("今日 AI优化次数已用完，你仍然可以继续使用模板版话术。", "error");
    return;
  }

  const payload = buildAIRequestPayload();
  if (!payload || !payload.templateText || !payload.detail) {
    setAIStatus("请先生成模板话术，再使用 AI优化。", "error");
    return;
  }

  setAILoading(true);
  setAIStatus("AI正在优化，请稍候……", "info");

  try {
    const response = await fetch("/.netlify/functions/ai-optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let result = {};
    try {
      result = await response.json();
    } catch (error) {
      result = {};
    }

    if (!response.ok) {
      if (result.error && result.error.includes("OPENAI_API_KEY")) {
        setAIStatus("AI功能暂未配置，你仍然可以使用模板版话术。", "error");
        return;
      }
      if (result.error && result.error.includes("暂未配置")) {
        setAIStatus("AI功能暂未配置，你仍然可以使用模板版话术。", "error");
        return;
      }
      setAIStatus("AI优化暂时不可用，请稍后再试。", "error");
      return;
    }

    const optimizedText = multiline(result.optimizedText);
    if (!optimizedText) {
      setAIStatus("AI没有返回有效内容，请稍后重试。", "error");
      return;
    }

    incrementAIUsage();
    renderAIResult(optimizedText);
    setAIStatus("AI优化完成，可以复制后再按实际情况修改。", "success");
  } catch (error) {
    setAIStatus("AI优化暂时不可用，请稍后再试。", "error");
  } finally {
    setAILoading(false);
  }
}

function seedDefaults() {
  const blockedRaw = localStorage.getItem(STORAGE_KEYS.blocked);
  if (!blockedRaw) {
    state.blocked = DEFAULT_BLOCKED.map((content) => ({ id: uid(), content }));
    saveJson(STORAGE_KEYS.blocked, state.blocked);
  }
}

function loadState() {
  state.library = loadJson(STORAGE_KEYS.library, []);
  state.style = { ...DEFAULT_STYLE, ...loadJson(STORAGE_KEYS.style, DEFAULT_STYLE) };
  state.history = loadJson(STORAGE_KEYS.history, []);
  seedDefaults();
  state.blocked = loadJson(STORAGE_KEYS.blocked, []);
}

function bindEvents() {
  $$(".nav-link").forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.page));
  });

  $$("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.jump));
  });

  $$("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = $(`#${button.dataset.scroll}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $(".nav-toggle").addEventListener("click", () => {
    const nav = $(".main-nav");
    const isOpen = nav.classList.toggle("open");
    $(".nav-toggle").setAttribute("aria-expanded", String(isOpen));
  });

  window.addEventListener("hashchange", () => {
    const page = location.hash.slice(1) || "home";
    if ($(`#page-${page}`)) switchPage(page);
  });

  document.addEventListener("click", (event) => {
    const aiButton = event.target.closest("#ai-optimize-button");
    if (aiButton) {
      handleAIOptimize();
      return;
    }

    const exampleButton = event.target.closest("[data-fill-example]");
    if (exampleButton) {
      const details = $("#details");
      details.value = exampleButton.dataset.fillExample;
      if (exampleButton.dataset.exampleScenario) {
        $("#scenario").value = exampleButton.dataset.exampleScenario;
      }
      details.dispatchEvent(new Event("input", { bubbles: true }));
      details.focus();
      showToast("已填入示例");
    }

    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) copyText(copyButton.dataset.copy);

    const libraryEdit = event.target.closest("[data-library-edit]");
    if (libraryEdit) {
      const item = state.library.find((entry) => entry.id === libraryEdit.dataset.libraryEdit);
      if (!item) return;
      $("#library-id").value = item.id;
      $("#library-content").value = item.content;
      $("#library-scenario").value = item.scenario;
      $("#library-tone").value = item.tone;
      $("#library-submit").textContent = "保存修改";
      $("#cancel-library-edit").classList.remove("hidden");
      $("#library-content").focus();
    }

    const libraryDelete = event.target.closest("[data-library-delete]");
    if (libraryDelete) {
      state.library = state.library.filter((entry) => entry.id !== libraryDelete.dataset.libraryDelete);
      saveJson(STORAGE_KEYS.library, state.library);
      renderLibrary();
      updateStats();
      showToast("已删除话术");
    }

    const blockedDelete = event.target.closest("[data-blocked-delete]");
    if (blockedDelete) {
      state.blocked = state.blocked.filter((entry) => entry.id !== blockedDelete.dataset.blockedDelete);
      saveJson(STORAGE_KEYS.blocked, state.blocked);
      renderBlocked();
      updateStats();
      showToast("已删除表达");
    }

    const historyView = event.target.closest("[data-history-view]");
    if (historyView) {
      const card = $(`[data-history-card="${historyView.dataset.historyView}"]`);
      if (card) card.classList.toggle("expanded");
      historyView.textContent = card && card.classList.contains("expanded") ? "收起" : "查看";
    }

    const historyDelete = event.target.closest("[data-history-delete]");
    if (historyDelete) {
      state.history = state.history.filter((entry) => entry.id !== historyDelete.dataset.historyDelete);
      saveJson(STORAGE_KEYS.history, state.history);
      renderHistory();
      updateStats();
      showToast("已删除历史记录");
    }
  });

  $("#generator-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = getFormData();
    const results = generateTalk(data);
    state.lastGeneration = { data, results };
    renderResults(results);
    addHistory(data, results);
    showToast("话术已生成");
  });

  $("#details").addEventListener("input", (event) => {
    $("#privacy-warning").classList.toggle("hidden", !detectPrivacyRisk(event.target.value));
  });

  $("#clear-generator").addEventListener("click", () => {
    $("#details").value = "";
    $("#privacy-warning").classList.add("hidden");
    state.lastGeneration = null;
    $("#results").innerHTML = renderAIOptimizeCard();
    showToast("已清空输入和结果");
  });

  $("#library-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#library-id").value || uid();
    const item = {
      id,
      content: multiline($("#library-content").value),
      scenario: normalizeText($("#library-scenario").value),
      tone: normalizeText($("#library-tone").value)
    };
    const index = state.library.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      state.library[index] = item;
      showToast("已保存修改");
    } else {
      state.library.unshift(item);
      showToast("已新增话术");
    }
    saveJson(STORAGE_KEYS.library, state.library);
    resetLibraryForm();
    renderLibrary();
    updateStats();
  });

  $("#cancel-library-edit").addEventListener("click", resetLibraryForm);
  $("#library-search").addEventListener("input", renderLibrary);

  $("#blocked-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const content = multiline($("#blocked-content").value);
    if (!content) return;
    const exists = state.blocked.some((entry) => normalizeText(entry.content) === normalizeText(content));
    if (exists) {
      showToast("这条表达已经存在");
      return;
    }
    state.blocked.unshift({ id: uid(), content });
    saveJson(STORAGE_KEYS.blocked, state.blocked);
    $("#blocked-content").value = "";
    renderBlocked();
    updateStats();
    showToast("已添加避免表达");
  });
  $("#blocked-search").addEventListener("input", renderBlocked);

  $("#style-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.style = {
      defaultTeacherRole: $("#style-teacher-role").value,
      defaultTone: $("#style-default-tone").value,
      opening: $("#style-opening").value,
      ending: $("#style-ending").value,
      avoidStyles: $$("input[name='avoidStyle']:checked").map((input) => input.value)
    };
    saveJson(STORAGE_KEYS.style, state.style);
    renderStyleForm();
    showToast("风格已保存");
  });

  $("#reset-style").addEventListener("click", () => {
    state.style = { ...DEFAULT_STYLE };
    saveJson(STORAGE_KEYS.style, state.style);
    renderStyleForm();
    showToast("已恢复默认风格");
  });

  $("#history-search").addEventListener("input", renderHistory);
  $("#clear-history").addEventListener("click", () => {
    state.history = [];
    saveJson(STORAGE_KEYS.history, state.history);
    renderHistory();
    updateStats();
    showToast("已清空历史记录");
  });
}

function init() {
  loadState();
  bindEvents();
  renderStyleForm();
  renderLibrary();
  renderBlocked();
  renderHistory();
  $("#results").innerHTML = renderAIOptimizeCard();
  updateStats();
  const page = location.hash.slice(1) || "home";
  switchPage($(`#page-${page}`) ? page : "home");
}

document.addEventListener("DOMContentLoaded", init);
