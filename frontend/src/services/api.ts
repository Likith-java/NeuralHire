import api from './axios';

export interface CandidateAuthResponse {
  token: string;
  role: 'candidate' | 'recruiter';
  name: string;
  email: string;
}

export interface RecruiterAuthParams {
  email: string;
  password: string;
}

export interface CandidateProfileParams {
  name: string;
  email: string;
  resumeText: string;
  jobRole: string;
  requiredSkills: string[];
  resumeFile?: File | null;
  candidateImageFile?: File | null;
}

export interface StartSessionParams {
  jobRole: string;
  requiredSkills: string[];
  difficulty?: string;
  inputMode?: string;
  candidateName?: string;
  recruiterId?: number;
}

export interface StartSessionResponse {
  session_id: string;
  first_question: string;
  question_number: number;
  question_id: number;
}

export interface SubmitAnswerParams {
  sessionId: string;
  answer: string;
  inputMode: 'text' | 'voice' | 'sign';
  questionId: number;
  audioBlob?: Blob;
}

export interface SubmitAnswerResponse {
  scores: Record<string, number>;
  confidence_score: number;
  clarity_score: number;
  depth_score: number;
  hesitation_score: number;
  overall_score: number;
  semantic_score: number;
  next_question: string | null;
  next_question_id: number | null;
  question_number: number;
  is_followup: boolean;
  interview_complete: boolean;
  aria_feedback: string;
  skill_scores: Record<string, number>;
}

const fileToBase64 = async (file: File | Blob) => {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const serializeUpload = async (file?: File | Blob | null, defaultName = 'upload.bin') => {
  if (!file) return undefined;
  return {
    filename: file instanceof File ? file.name : defaultName,
    mimeType: file.type || 'application/octet-stream',
    contentBase64: await fileToBase64(file),
  };
};

const interviewService = {
  // Recruiter Auth
  async loginRecruiter(params: RecruiterAuthParams) {
    const response = await api.post('/api/recruiter/login', params);
    return response.data;
  },

  async signupRecruiter(data: { full_name: string; email: string; company_name: string; company_size?: string }) {
    const response = await api.post('/api/recruiter/signup', data);
    return response.data;
  },

  async logoutRecruiter() {
    const response = await api.post('/api/recruiter/logout');
    return response.data;
  },

  // Candidate - Request interview key
  async requestInterviewKey(email: string) {
    const response = await api.post('/request-key', { email });
    return response.data;
  },

  // Candidate - Verify interview key
  async verifyInterviewKey(email: string, key: string) {
    const response = await api.post('/verify-key', { email, key });
    return response.data;
  },

  // Start Interview Session
  async startSession(params: StartSessionParams): Promise<StartSessionResponse> {
    const response = await api.post('/api/session/start', {
      job_role: params.jobRole,
      required_skills: params.requiredSkills,
      difficulty: params.difficulty || 'deep_dive',
      input_mode: params.inputMode || 'text',
      candidate_name: params.candidateName,
    });
    return response.data;
  },

  // Submit Answer
  async submitAnswer(params: SubmitAnswerParams): Promise<SubmitAnswerResponse> {
    const response = await api.post('/api/session/answer', {
      session_id: params.sessionId,
      answer: params.answer,
      input_mode: params.inputMode,
      question_id: params.questionId,
    });
    return response.data;
  },

  // Get Session
  async getSession(sessionId: string) {
    const response = await api.get(`/api/session/${sessionId}`);
    return response.data;
  },

  // Finish session early
  async finishSession(sessionId: string) {
    const response = await api.post(`/api/session/finish?session_id=${sessionId}`);
    return response.data;
  },

  // Get Report
  async getReport(sessionId: string) {
    const response = await api.get(`/api/report/${sessionId}`);
    return response.data;
  },

  // Get PDF Report
  async getReportPdf(sessionId: string) {
    const response = await api.get(`/api/report/${sessionId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get Candidates (Recruiter Dashboard)
  async getCandidates() {
    const response = await api.get('/api/recruiter/candidates');
    return response.data;
  },

  // Get Candidate Details
  async getCandidateDetails(sessionId: string) {
    const response = await api.get(`/api/recruiter/candidates/${sessionId}`);
    return response.data;
  },

  // Get Recruiter Stats
  async getRecruiterStats() {
    const response = await api.get('/api/recruiter/stats');
    return response.data;
  },

  // Get Word Suggestions
  async getWordSuggestions(prefix: string) {
    const response = await api.get('/api/words', { params: { prefix } });
    return response.data;
  },

  // Detect Gesture
  async detectGesture(landmarks: number[]) {
    const response = await api.post('/api/gesture', { landmarks });
    return response.data;
  },

  // Transcribe Audio
  async transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    const response = await api.post('/api/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Parse Resume
  async parseResume(resumeFile: File) {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    const response = await api.post('/api/resume/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Integrity Events
  async sendIntegrityEvent(sessionId: string, eventType: string, details?: string) {
    const response = await api.post(`/api/integrity/${sessionId}`, {
      event_type: eventType,
      details,
    });
    return response.data;
  },

  async getIntegritySummary(sessionId: string) {
    const response = await api.get(`/api/integrity/${sessionId}/summary`);
    return response.data;
  },

  // TTS
  async playTTS(text: string) {
    const response = await api.post('/api/tts', { text }, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Load Demo Data
  async loadDemoData() {
    const response = await api.post('/api/demo/load');
    return response.data;
  },
};

export default interviewService;
