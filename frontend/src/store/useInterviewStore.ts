import { create } from 'zustand';

export type Role = 'aria' | 'candidate';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
  isNew?: boolean;
}

export interface Scores {
  problemSolving: number;
  systemDesign: number;
  communication: number;
  codeQuality: number;
  technicalDepth: number;
  adaptability: number;
}

export type InterviewStatus = 'idle' | 'active' | 'complete';
export type InputMode = 'text' | 'voice' | 'sign';
export type Difficulty = 'surface' | 'deep-dive' | 'stress-test';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface InterviewState {
  sessionId: string | null;
  candidateName: string;
  jobRole: string;
  requiredSkills: string[];
  difficulty: Difficulty;
  messages: Message[];
  currentQuestion: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  scores: Scores;
  confidenceScore: number;
  clarityScore: number;
  depthScore: number;
  hesitationScore: number;
  semanticMatch: number;
  overallScore: number;
  interviewStatus: InterviewStatus;
  inputMode: InputMode;
  logs: LogEntry[];
  isDemoMode: boolean;
  isSpeaking: boolean;
  isCandidateSpeaking: boolean;

  // Actions
  setSessionId: (id: string | null) => void;
  setCandidateName: (name: string) => void;
  setJobRole: (role: string) => void;
  setRequiredSkills: (skills: string[]) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  addMessage: (message: Message) => void;
  setCurrentQuestion: (question: string) => void;
  setQuestionProgress: (current: number, total: number) => void;
  updateScores: (scores: Partial<Scores>) => void;
  updateConfidence: (confidence: number) => void;
  updateClarity: (clarity: number) => void;
  updateDepth: (depth: number) => void;
  updateHesitation: (hesitation: number) => void;
  updateSemanticMatch: (match: number) => void;
  updateOverallScore: (score: number) => void;
  setStatus: (status: InterviewStatus) => void;
  setInputMode: (mode: InputMode) => void;
  addLog: (log: Omit<LogEntry, 'timestamp'>) => void;
  setDemoMode: (isDemo: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setIsCandidateSpeaking: (isSpeaking: boolean) => void;
  reset: () => void;
}

const initialScores: Scores = {
  problemSolving: 0,
  systemDesign: 0,
  communication: 0,
  codeQuality: 0,
  technicalDepth: 0,
  adaptability: 0,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: null,
  candidateName: '',
  jobRole: '',
  requiredSkills: [],
  difficulty: 'surface',
  messages: [],
  currentQuestion: '',
  currentQuestionIndex: 1,
  totalQuestions: 8,
  scores: initialScores,
  confidenceScore: 0,
  clarityScore: 0,
  depthScore: 0,
  hesitationScore: 0,
  semanticMatch: 0,
  overallScore: 0,
  interviewStatus: 'idle',
  inputMode: 'text',
  logs: [],
  isDemoMode: false,
  isSpeaking: false,
  isCandidateSpeaking: false,

  setSessionId: (id) => set({ sessionId: id }),
  setCandidateName: (name) => set({ candidateName: name }),
  setJobRole: (role) => set({ jobRole: role }),
  setRequiredSkills: (skills) => set({ requiredSkills: skills }),
  setDifficulty: (difficulty) => set({ difficulty }),
  addMessage: (message) => set((state) => {
    if (state.messages.some(m => m.id === message.id)) return state;
    return { messages: [...state.messages, message] };
  }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setQuestionProgress: (current, total) => set({ currentQuestionIndex: current, totalQuestions: total }),
  updateScores: (newScores) => set((state) => ({ scores: { ...state.scores, ...newScores } })),
  updateConfidence: (confidence) => set({ confidenceScore: confidence }),
  updateClarity: (clarity) => set({ clarityScore: clarity }),
  updateDepth: (depth) => set({ depthScore: depth }),
  updateHesitation: (hesitation) => set({ hesitationScore: hesitation }),
  updateSemanticMatch: (match) => set({ semanticMatch: match }),
  updateOverallScore: (score) => set({ overallScore: score }),
  setStatus: (status) => set({ interviewStatus: status }),
  setInputMode: (mode) => set({ inputMode: mode }),
  addLog: (log) => set((state) => ({
    logs: [{ ...log, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...state.logs].slice(0, 50)
  })),
  setDemoMode: (isDemo) => set({ isDemoMode: isDemo }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsCandidateSpeaking: (isSpeaking) => set({ isCandidateSpeaking: isSpeaking }),
  reset: () => set((state) => ({
    sessionId: null,
    candidateName: '',
    jobRole: '',
    requiredSkills: [],
    difficulty: 'surface',
    messages: [],
    currentQuestion: '',
    currentQuestionIndex: 1,
    totalQuestions: 8,
    scores: initialScores,
    confidenceScore: 0,
    clarityScore: 0,
    depthScore: 0,
    hesitationScore: 0,
    semanticMatch: 0,
    overallScore: 0,
    interviewStatus: 'idle',
    inputMode: 'text',
    logs: [],
    isDemoMode: state.isDemoMode, // Keep demo mode state on reset
    isSpeaking: false,
    isCandidateSpeaking: false,
  })),
}));
