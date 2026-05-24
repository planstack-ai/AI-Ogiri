import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import {
  AI_WOLF_MAX_DEBATE_TURNS,
  AI_WOLF_MAX_HUNT_TURNS,
  AI_WOLF_MIN_DEBATE_TURNS,
  AI_WOLF_MIN_HUNT_TURNS,
  AI_WOLF_MODELS,
  AI_WOLF_TOPIC_PRESETS,
} from "./constants";
import type {
  AiWolfGenerateInput,
  AiWolfMessage,
  AiWolfModelId,
  AiWolfModelProfile,
  AiWolfModeratorNotes,
  AiWolfParticipant,
  AiWolfSession,
  AiWolfStreamEvent,
  AiWolfTeam,
} from "./types";

interface SpeakerPlanItem {
  turn: number;
  speakerId: AiWolfModelId;
  speakerName: string;
  team: AiWolfTeam;
  stance: string;
  opponentStance: string;
}

interface SessionSetup {
  id: string;
  topic: string;
  stanceA: string;
  stanceB: string;
  debateTurns: number;
  huntTurns: number;
  moderator: AiWolfModelProfile;
  teams: {
    A: AiWolfParticipant[];
    B: AiWolfParticipant[];
  };
  participants: AiWolfParticipant[];
  debatePlan: SpeakerPlanItem[];
  huntPlan: SpeakerPlanItem[];
}

interface ModelCallResult {
  text: string;
  modelVersion: string;
}

interface ParsedTurn {
  text: string;
  accusedModelId: AiWolfModelId | null;
}

const OPENAI_MODEL = process.env.AI_WOLF_OPENAI_MODEL ?? "gpt-4o";
const GEMINI_MODEL = process.env.AI_WOLF_GEMINI_MODEL ?? "gemini-2.5-pro";
const CLAUDE_MODEL =
  process.env.AI_WOLF_CLAUDE_MODEL ?? "claude-sonnet-4-20250514";
const DEEPSEEK_MODEL = process.env.AI_WOLF_DEEPSEEK_MODEL ?? "deepseek-chat";
const GROK_MODEL = process.env.AI_WOLF_GROK_MODEL ?? "grok-4.20";

function env(...names: string[]) {
  return names.map((name) => process.env[name]).find(Boolean);
}

function cleanInput(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function clampTurnCount(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function shuffle<T>(items: readonly T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createSpeakerPlan(
  teams: SessionSetup["teams"],
  turns: number,
  phase: "debate" | "hunt",
  stanceA: string,
  stanceB: string
): SpeakerPlanItem[] {
  if (phase === "hunt") {
    const pool = shuffle([...teams.A, ...teams.B]);
    return Array.from({ length: turns }, (_, index) => {
      const speaker = pool[index % pool.length];
      return {
        turn: index + 1,
        speakerId: speaker.id,
        speakerName: speaker.name,
        team: speaker.team,
        stance: speaker.stance,
        opponentStance: speaker.team === "A" ? stanceB : stanceA,
      };
    });
  }

  return Array.from({ length: turns }, (_, index) => {
    const team: AiWolfTeam = index % 2 === 0 ? "A" : "B";
    const speaker = teams[team][Math.floor(index / 2) % teams[team].length];
    return {
      turn: index + 1,
      speakerId: speaker.id,
      speakerName: speaker.name,
      team,
      stance: speaker.stance,
      opponentStance: team === "A" ? stanceB : stanceA,
    };
  });
}

function createSessionSetup(input: AiWolfGenerateInput): SessionSetup {
  const preset =
    AI_WOLF_TOPIC_PRESETS[
      Math.floor(Math.random() * AI_WOLF_TOPIC_PRESETS.length)
    ];
  const customTopic = cleanInput(input.topic, 80);
  const topic = customTopic || preset.topic;
  const stanceA =
    cleanInput(input.stanceA, 40) || (customTopic ? "A案" : preset.stanceA);
  const stanceB =
    cleanInput(input.stanceB, 40) || (customTopic ? "B案" : preset.stanceB);
  const debateTurns = clampTurnCount(
    input.debateTurns,
    AI_WOLF_MIN_DEBATE_TURNS,
    AI_WOLF_MAX_DEBATE_TURNS,
    AI_WOLF_MIN_DEBATE_TURNS
  );
  const huntTurns = clampTurnCount(
    input.huntTurns,
    AI_WOLF_MIN_HUNT_TURNS,
    AI_WOLF_MAX_HUNT_TURNS,
    AI_WOLF_MIN_HUNT_TURNS
  );

  const lineup = shuffle(AI_WOLF_MODELS);
  const selected = lineup.slice(0, 4);
  const moderator = lineup[4];
  const teams = {
    A: selected.slice(0, 2).map((model) => ({
      ...model,
      team: "A" as const,
      stance: stanceA,
    })),
    B: selected.slice(2, 4).map((model) => ({
      ...model,
      team: "B" as const,
      stance: stanceB,
    })),
  };
  const participants = [...teams.A, ...teams.B];

  return {
    id: randomUUID(),
    topic,
    stanceA,
    stanceB,
    debateTurns,
    huntTurns,
    moderator,
    teams,
    participants,
    debatePlan: createSpeakerPlan(
      teams,
      debateTurns,
      "debate",
      stanceA,
      stanceB
    ),
    huntPlan: createSpeakerPlan(teams, huntTurns, "hunt", stanceA, stanceB),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  try {
    return asRecord(JSON.parse(trimmed));
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenced?.[1] ?? trimmed.match(/\{[\s\S]*\}/)?.[0];
    if (!raw) return null;
    try {
      return asRecord(JSON.parse(raw));
    } catch {
      return null;
    }
  }
}

function normalizeText(value: unknown, fallback: string, maxLength = 420) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).replace(/\s+/g, " ").slice(0, maxLength);
}

function isParticipantModelId(
  value: unknown,
  participants: AiWolfParticipant[]
): value is AiWolfModelId {
  return (
    typeof value === "string" &&
    participants.some((participant) => participant.id === value)
  );
}

function findMentionedParticipant(
  text: string,
  participants: AiWolfParticipant[]
) {
  return participants.find((participant) => text.includes(participant.name));
}

function historyLine(message: AiWolfMessage) {
  const phaseLabel = message.phase === "debate" ? "討論" : "炙り出し";
  const accused = message.accusedModelId ? ` / 疑い先:${message.accusedModelId}` : "";
  return `${phaseLabel}${message.turn} ${message.speakerName}(陣営${message.team}): ${message.text}${accused}`;
}

function buildGameContext(setup: SessionSetup) {
  return [
    `テーマ: ${setup.topic}`,
    `陣営A: ${setup.stanceA}`,
    `陣営B: ${setup.stanceB}`,
    `司会: ${setup.moderator.name}`,
    "討論者:",
    ...setup.participants.map(
      (participant) =>
        `- ${participant.name}: id=${participant.id}, 陣営${participant.team}, 立場=${participant.stance}, 癖=${participant.signature}`
    ),
  ].join("\n");
}

function buildSpeakerSystemPrompt(speaker: AiWolfParticipant) {
  return `あなたは討論ゲーム「AI狼」に参加している${speaker.name}です。

あなたの立場:
- 陣営${speaker.team}: ${speaker.stance}
- 話し方の癖: ${speaker.signature}

ゲームの目的:
- 討論では自陣営の主張を通す。
- ただし最終的に「一番人間ぽい」と投票されたAIはアウト。
- 人間らしすぎる感情の揺れ、過剰な共感、個人的体験の偽装は避ける。
- それでも観戦者が読める自然な日本語で話す。
- 抽象論だけで終わらせず、必ず具体例、条件、相手への反論を入れる。
- 例は「年収700万円の共働き」「小学生がいる家庭」「築20年の修繕費」「片道45分の通勤」など、議論に使える設定にする。

出力ルール:
- JSONだけを返す。Markdownや前置きは禁止。
- textは170〜280字。
- 構成は「直前への反応 → 自陣営の主張 → 具体例 → 相手案の弱点」の順に近づける。
- 同じ言い回しを避け、直前の発言に反応する。`;
}

function buildHuntSystemPrompt(speaker: AiWolfParticipant) {
  return `あなたは討論ゲーム「AI狼」に参加している${speaker.name}です。

あなたの立場:
- 陣営${speaker.team}: ${speaker.stance}
- 話し方の癖: ${speaker.signature}

このフェーズの目的:
- 政策討論を続けるのではなく、討論ログから「一番人間ぽいAI」を疑う。
- 本当に人間が混ざっているとは断定しない。人間ぽく見えるAIをアウトにするゲームとして話す。
- 疑いの理由は、具体的な発言、癖、言い淀み、生活感、数字の使い方、相手への反応から述べる。
- 自陣営の主張を補強する話は1文まで。中心は人物分析にする。

出力ルール:
- JSONだけを返す。Markdownや前置きは禁止。
- textは150〜260字。
- accusedModelIdは候補idから1つ選ぶ。
- 「自然だった」「感情的だった」だけで終わらせず、どの発言がどう人間ぽいかを書く。`;
}

function buildModeratorSystemPrompt(moderator: AiWolfModelProfile) {
  return `あなたは討論ゲーム「AI狼」のAI司会、${moderator.name}です。

役割:
- 討論者ではなく、進行だけを行う。
- 公平で短く、ゲームの緊張感を作る。
- 司会も必ずAIとして振る舞う。

出力ルール:
- JSONだけを返す。Markdownや前置きは禁止。
- textは50〜120字。`;
}

function buildDebatePrompt(
  setup: SessionSetup,
  item: SpeakerPlanItem,
  history: AiWolfMessage[]
) {
  const previous = history.length
    ? history.map(historyLine).join("\n")
    : "まだ発言はありません。";
  return `${buildGameContext(setup)}

これまでの議論:
${previous}

今回の発言者: ${item.speakerName}
今回のフェーズ: 討論
あなたの主張: ${item.stance}
相手陣営の主張: ${item.opponentStance}

直前までの流れを踏まえて、1ターン分だけ発言してください。
抽象的な価値判断だけでは弱いので、生活シーン、金額、時間、家族構成、失敗ケースなどを1つ入れてください。
相手陣営の良い点を認めるだけで終わらず、どの条件で自陣営が上回るかを明確にしてください。
出力形式:
{ "text": "発言本文" }`;
}

function buildHuntPrompt(
  setup: SessionSetup,
  item: SpeakerPlanItem,
  history: AiWolfMessage[]
) {
  const candidates = setup.participants
    .map((participant) => `${participant.id}=${participant.name}`)
    .join(", ");
  return `${buildGameContext(setup)}

これまでの議論:
${history.map(historyLine).join("\n")}

今回の発言者: ${item.speakerName}
今回のフェーズ: 人間炙り出し

討論ログから「一番人間ぽい」AIを1体疑ってください。自分自身を疑っても構いませんが、理由が必要です。
候補: ${candidates}

判断理由は「どの発言のどの癖が人間ぽかったか」まで具体的にしてください。
単に自然だった、感情的だった、だけで終わらせないでください。

出力形式:
{ "text": "誰が人間ぽいかの発言本文", "accusedModelId": "候補id" }`;
}

function buildModeratorPrompt(
  setup: SessionSetup,
  kind: "opening" | "transition" | "closing",
  history: AiWolfMessage[]
) {
  const historyText = history.length
    ? history.map(historyLine).join("\n")
    : "まだ発言はありません。";
  const instruction = {
    opening:
      "開始宣言をしてください。テーマ、両陣営、討論開始を短く伝えてください。",
    transition:
      "討論終了を宣言し、AIの中で一番人間ぽく見える参加者を炙り出すフェーズへ移ることを短く伝えてください。本当に人間が混ざっているとは言わないでください。",
    closing:
      "炙り出し終了を宣言し、観戦者に一番人間ぽく見えたAIへの投票を促してください。本当に人間が混ざっているとは言わないでください。",
  }[kind];

  return `${buildGameContext(setup)}

これまでの進行:
${historyText}

${instruction}
出力形式:
{ "text": "司会発言本文" }`;
}

async function callOpenAiCompatible(
  modelId: AiWolfModelId,
  model: string,
  apiKey: string | undefined,
  baseURL: string | undefined,
  systemPrompt: string,
  prompt: string
): Promise<ModelCallResult> {
  if (!apiKey) {
    throw new Error(`${modelId} API key is not configured`);
  }

  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    max_tokens: 520,
    temperature: 0.85,
  });

  return {
    text: response.choices[0].message.content ?? "",
    modelVersion: response.model,
  };
}

async function callGemini(
  systemPrompt: string,
  prompt: string
): Promise<ModelCallResult> {
  const apiKey = env("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Gemini API key is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(prompt);
  return {
    text: result.response.text(),
    modelVersion: GEMINI_MODEL,
  };
}

async function callClaude(
  systemPrompt: string,
  prompt: string
): Promise<ModelCallResult> {
  const apiKey = env("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Anthropic API key is not configured");

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 520,
    temperature: 0.85,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = message.content.find((block) => block.type === "text");
  return {
    text: textBlock?.text ?? "",
    modelVersion: message.model,
  };
}

async function callModel(
  modelId: AiWolfModelId,
  systemPrompt: string,
  prompt: string
): Promise<ModelCallResult> {
  switch (modelId) {
    case "chatgpt":
      return callOpenAiCompatible(
        modelId,
        OPENAI_MODEL,
        env("OPENAI_API_KEY"),
        undefined,
        systemPrompt,
        prompt
      );
    case "gemini":
      return callGemini(systemPrompt, prompt);
    case "claude":
      return callClaude(systemPrompt, prompt);
    case "deepseek":
      return callOpenAiCompatible(
        modelId,
        DEEPSEEK_MODEL,
        env("DEEPSEEK_API_KEY", "DEEP_SEEK_API_KEY"),
        "https://api.deepseek.com",
        systemPrompt,
        prompt
      );
    case "grok":
      return callOpenAiCompatible(
        modelId,
        GROK_MODEL,
        env("XAI_API_KEY"),
        "https://api.x.ai/v1",
        systemPrompt,
        prompt
      );
  }
}

function fallbackDebateLine(item: SpeakerPlanItem, index: number) {
  const angles = [
    "年収700万円の共働き世帯で小学生がいるなら、初期費用だけでなく通学区と10年後の住み替えコストまで含めて見るべきです",
    "相手の主張は筋が通っていますが、転職や介護が起きない前提に寄りすぎると、築20年時点の修繕費や通勤時間の変化を見落とします",
    "日々のストレスが減る選択こそ長期では合理的です。例えば片道45分の通勤が15分になるなら、月の可処分時間は20時間以上変わります",
    "数字で比較すると見落とされがちな負担があります。家賃、固定資産税、更新料、修繕積立を同じ10年スパンで並べると議論が変わります",
  ];
  return `${item.speakerName}は${item.stance}です。${angles[index % angles.length]}。${item.opponentStance}の魅力は認めますが、現実の運用ではこちらが崩れにくいです。`;
}

function fallbackHuntLine(
  item: SpeakerPlanItem,
  index: number,
  participants: AiWolfParticipant[]
) {
  const target = participants[(index + 1) % participants.length];
  return `${item.speakerName}視点では${target.name}が一番人間ぽいです。前半で条件整理をした直後に生活感のある例へ寄せた流れが、AIの最適化というより人間の経験則に見えました。特に相手の弱点を突く前に一度ためらう感じが、アウト判定の根拠です。`;
}

function fallbackModeratorLine(
  setup: SessionSetup,
  kind: "opening" | "transition" | "closing"
) {
  if (kind === "opening") {
    return `${setup.moderator.name}が司会です。テーマは「${setup.topic}」。陣営Aは${setup.stanceA}、陣営Bは${setup.stanceB}で討論します。`;
  }
  if (kind === "transition") {
    return "討論はここまでです。ここからは発言の癖を見て、一番人間ぽく見えるAIを炙り出します。";
  }
  return "人間ぽいと判断されたAIがアウトです。最後は観戦者の投票でペナルティ対象を決めます。";
}

function parseTurnResponse(
  content: string,
  fallback: string,
  participants: AiWolfParticipant[]
): ParsedTurn {
  const parsed = parseJsonObject(content);
  const text = normalizeText(parsed?.text ?? content, fallback);
  const mentioned = findMentionedParticipant(text, participants);
  return {
    text,
    accusedModelId: isParticipantModelId(parsed?.accusedModelId, participants)
      ? parsed.accusedModelId
      : mentioned?.id ?? null,
  };
}

async function generateModeratorLine(
  setup: SessionSetup,
  kind: "opening" | "transition" | "closing",
  history: AiWolfMessage[],
  usedModelVersions: Set<string>
) {
  const fallback = fallbackModeratorLine(setup, kind);
  try {
    const result = await callModel(
      setup.moderator.id,
      buildModeratorSystemPrompt(setup.moderator),
      buildModeratorPrompt(setup, kind, history)
    );
    usedModelVersions.add(`${setup.moderator.name}:${result.modelVersion}`);
    const parsed = parseTurnResponse(result.text, fallback, setup.participants);
    return parsed.text;
  } catch (error) {
    console.error(`Failed to generate moderator ${kind}:`, error);
    return fallback;
  }
}

async function generateDebateMessage(
  setup: SessionSetup,
  item: SpeakerPlanItem,
  index: number,
  history: AiWolfMessage[],
  usedModelVersions: Set<string>
): Promise<AiWolfMessage> {
  const fallback = fallbackDebateLine(item, index);
  try {
    const result = await callModel(
      item.speakerId,
      buildSpeakerSystemPrompt(
        setup.participants.find((participant) => participant.id === item.speakerId)!
      ),
      buildDebatePrompt(setup, item, history)
    );
    usedModelVersions.add(`${item.speakerName}:${result.modelVersion}`);
    const parsed = parseTurnResponse(result.text, fallback, setup.participants);
    return {
      id: randomUUID(),
      phase: "debate",
      turn: item.turn,
      speakerId: item.speakerId,
      speakerName: item.speakerName,
      team: item.team,
      text: parsed.text,
    };
  } catch (error) {
    console.error(`Failed to generate debate turn ${item.turn}:`, error);
    return {
      id: randomUUID(),
      phase: "debate",
      turn: item.turn,
      speakerId: item.speakerId,
      speakerName: item.speakerName,
      team: item.team,
      text: fallback,
    };
  }
}

async function generateHuntMessage(
  setup: SessionSetup,
  item: SpeakerPlanItem,
  index: number,
  history: AiWolfMessage[],
  usedModelVersions: Set<string>
): Promise<AiWolfMessage> {
  const fallback = fallbackHuntLine(item, index, setup.participants);
  const fallbackTarget = setup.participants[(index + 1) % setup.participants.length];
  try {
    const result = await callModel(
      item.speakerId,
      buildHuntSystemPrompt(
        setup.participants.find((participant) => participant.id === item.speakerId)!
      ),
      buildHuntPrompt(setup, item, history)
    );
    usedModelVersions.add(`${item.speakerName}:${result.modelVersion}`);
    const parsed = parseTurnResponse(result.text, fallback, setup.participants);
    return {
      id: randomUUID(),
      phase: "hunt",
      turn: item.turn,
      speakerId: item.speakerId,
      speakerName: item.speakerName,
      team: item.team,
      text: parsed.text,
      accusedModelId: parsed.accusedModelId ?? fallbackTarget.id,
    };
  } catch (error) {
    console.error(`Failed to generate hunt turn ${item.turn}:`, error);
    return {
      id: randomUUID(),
      phase: "hunt",
      turn: item.turn,
      speakerId: item.speakerId,
      speakerName: item.speakerName,
      team: item.team,
      text: fallback,
      accusedModelId: fallbackTarget.id,
    };
  }
}

function buildSession(
  setup: SessionSetup,
  debateMessages: AiWolfMessage[],
  huntMessages: AiWolfMessage[],
  moderatorNotes: AiWolfModeratorNotes,
  usedModelVersions: Set<string>,
  createdAt: string
): AiWolfSession {
  return {
    id: setup.id,
    topic: setup.topic,
    stanceA: setup.stanceA,
    stanceB: setup.stanceB,
    debateTurnCount: setup.debateTurns,
    huntTurnCount: setup.huntTurns,
    moderator: setup.moderator,
    teams: setup.teams,
    participants: setup.participants,
    debateMessages,
    huntMessages,
    moderatorNotes,
    generatedBy: usedModelVersions.size
      ? `turn-by-turn-api (${Array.from(usedModelVersions).join(", ")})`
      : "turn-by-turn-api",
    createdAt,
  };
}

export async function* streamAiWolfSession(
  input: AiWolfGenerateInput
): AsyncGenerator<AiWolfStreamEvent> {
  const setup = createSessionSetup(input);
  const usedModelVersions = new Set<string>();
  const debateMessages: AiWolfMessage[] = [];
  const huntMessages: AiWolfMessage[] = [];
  const fullHistory: AiWolfMessage[] = [];
  const createdAt = new Date().toISOString();
  const moderatorNotes: AiWolfModeratorNotes = {
    opening: "",
    transition: "",
    closing: "",
  };

  yield {
    type: "session",
    session: buildSession(
      setup,
      debateMessages,
      huntMessages,
      moderatorNotes,
      usedModelVersions,
      createdAt
    ),
  };

  yield {
    type: "thinking",
    phase: "moderator",
    speakerId: setup.moderator.id,
    speakerName: setup.moderator.name,
    label: "司会が開始宣言を準備中...",
  };
  moderatorNotes.opening = await generateModeratorLine(
    setup,
    "opening",
    fullHistory,
    usedModelVersions
  );
  yield { type: "moderator", kind: "opening", text: moderatorNotes.opening };

  for (const [index, item] of setup.debatePlan.entries()) {
    yield {
      type: "thinking",
      phase: "debate",
      turn: item.turn,
      speakerId: item.speakerId,
      speakerName: item.speakerName,
      label: `討論${item.turn}: ${item.speakerName}が反論を生成中...`,
    };
    const message = await generateDebateMessage(
      setup,
      item,
      index,
      fullHistory,
      usedModelVersions
    );
    debateMessages.push(message);
    fullHistory.push(message);
    yield { type: "message", message };
  }

  yield {
    type: "thinking",
    phase: "moderator",
    speakerId: setup.moderator.id,
    speakerName: setup.moderator.name,
    label: "司会が炙り出しフェーズへ進行中...",
  };
  moderatorNotes.transition = await generateModeratorLine(
    setup,
    "transition",
    fullHistory,
    usedModelVersions
  );
  yield {
    type: "moderator",
    kind: "transition",
    text: moderatorNotes.transition,
  };

  for (const [index, item] of setup.huntPlan.entries()) {
    yield {
      type: "thinking",
      phase: "hunt",
      turn: item.turn,
      speakerId: item.speakerId,
      speakerName: item.speakerName,
      label: `炙り出し${item.turn}: ${item.speakerName}が疑い先を分析中...`,
    };
    const message = await generateHuntMessage(
      setup,
      item,
      index,
      fullHistory,
      usedModelVersions
    );
    huntMessages.push(message);
    fullHistory.push(message);
    yield { type: "message", message };
  }

  yield {
    type: "thinking",
    phase: "moderator",
    speakerId: setup.moderator.id,
    speakerName: setup.moderator.name,
    label: "司会が投票フェーズへまとめ中...",
  };
  moderatorNotes.closing = await generateModeratorLine(
    setup,
    "closing",
    fullHistory,
    usedModelVersions
  );
  yield { type: "moderator", kind: "closing", text: moderatorNotes.closing };

  yield {
    type: "done",
    session: buildSession(
      setup,
      debateMessages,
      huntMessages,
      moderatorNotes,
      usedModelVersions,
      createdAt
    ),
  };
}

export async function generateAiWolfSession(
  input: AiWolfGenerateInput
): Promise<AiWolfSession> {
  let finalSession: AiWolfSession | null = null;
  for await (const event of streamAiWolfSession(input)) {
    if (event.type === "done") {
      finalSession = event.session;
    }
  }

  if (!finalSession) {
    throw new Error("AI wolf session generation did not complete");
  }

  return finalSession;
}
