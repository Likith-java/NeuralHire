import { readFile } from 'fs/promises';
import { UploadPayload } from './types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const overlapScore = (left: string, right: string) => {
  const leftSet = new Set(tokenize(left));
  const rightTokens = tokenize(right);
  if (!leftSet.size || !rightTokens.length) return 0;
  const matches = rightTokens.filter((token) => leftSet.has(token));
  return clamp(Math.round((matches.length / Math.max(leftSet.size, rightTokens.length)) * 100));
};

const safeFetch = async <T>(path: string, body: Record<string, unknown>, fallback: T): Promise<T> => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
};

export const runResumeAnalysis = async (input: {
  resumeText: string;
  jobDescription: string;
  requiredSkills: string[];
}) => {
  const fallback = {
    name: null,
    skills: input.requiredSkills.filter((skill) =>
      input.resumeText.toLowerCase().includes(skill.toLowerCase()),
    ),
    ats_score: overlapScore(input.jobDescription, input.resumeText),
    matched_keywords: input.requiredSkills.filter((skill) =>
      input.resumeText.toLowerCase().includes(skill.toLowerCase()),
    ),
    model_version: 'resume-heuristic-v1',
  };

  return safeFetch('/resume/parse', input, fallback);
};

export const runSemanticAnalysis = async (input: { idealAnswer: string; candidateAnswer: string }) => {
  const fallbackScore = overlapScore(input.idealAnswer, input.candidateAnswer);
  const fallback = {
    semantic_score: Number((fallbackScore / 100).toFixed(3)),
    label: fallbackScore >= 80 ? 'strong match' : fallbackScore >= 60 ? 'good match' : fallbackScore >= 40 ? 'partial match' : 'poor match',
    model_version: 'semantic-heuristic-v1',
  };
  return safeFetch('/semantic/score', input, fallback);
};

export const runSpeechAnalysis = async (input: {
  transcript: string;
  audioArtifactPath?: string;
}) => {
  const fillers = ['um', 'uh', 'like', 'actually', 'basically'];
  const tokens = tokenize(input.transcript);
  const fillerCount = tokens.filter((token) => fillers.includes(token)).length;
  const hesitationScore = clamp(Math.round((fillerCount / Math.max(tokens.length, 1)) * 100 * 4));
  const confidenceScore = clamp(100 - hesitationScore - (tokens.length < 15 ? 15 : 0));
  const fallback = {
    transcript: input.transcript,
    hesitation_score: hesitationScore,
    confidence_score: confidenceScore,
    model_version: 'speech-heuristic-v1',
  };
  return safeFetch('/speech/analyze', input, fallback);
};

export const runGestureAnalysis = async (input: { landmarks: number[][] }) => {
  const fallback = {
    letter: 'A',
    confidence: 0.65,
    model_version: 'gesture-heuristic-v1',
  };
  return safeFetch('/sign/gesture', input, fallback);
};

export const runIntegrityAnalysis = async (input: {
  eventType?: string;
  events: Array<{ type: string }>;
}) => {
  const penalties = input.events.reduce((acc, event) => {
    if (event.type === 'multiple_faces') return acc + 12;
    if (event.type === 'audio_mismatch') return acc + 8;
    if (event.type === 'looking_away') return acc + 5;
    return acc + 3;
  }, 0);
  const fallback = {
    integrity_score: clamp(100 - penalties),
    events: input.events,
    model_version: 'integrity-heuristic-v1',
  };
  return safeFetch('/integrity/evaluate', input, fallback);
};

export const runTranscriptFallback = async (audioPath: string) => {
  try {
    const file = await readFile(audioPath);
    const pseudoTranscript = `Audio answer captured (${Math.round(file.byteLength / 1024)}kb).`;
    const result = await runSpeechAnalysis({ transcript: pseudoTranscript, audioArtifactPath: audioPath });
    return { transcript: result.transcript, hesitation_score: result.hesitation_score, confidence_score: result.confidence_score, model_version: result.model_version };
  } catch {
    return { transcript: '', hesitation_score: 35, confidence_score: 55, model_version: 'speech-heuristic-v1' };
  }
};
