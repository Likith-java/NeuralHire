export type UserRole = 'recruiter' | 'candidate';
export type InterviewStatus = 'pending' | 'active' | 'completed';
export type AnswerMode = 'text' | 'voice' | 'sign';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  token?: string;
  createdAt: string;
}

export interface CandidateRecord {
  id: string;
  userId?: string;
  name: string;
  email: string;
  candidateImagePath?: string;
  resumeArtifactId?: string;
  resumeText?: string;
  atsScore: number;
  matchedKeywords: string[];
  createdAt: string;
}

export interface JobRoleRecord {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  idealAnswers: string[];
  createdAt: string;
}

export interface InterviewQuestionRecord {
  id: string;
  sessionId: string;
  questionNumber: number;
  prompt: string;
  idealAnswer: string;
  category: string;
}

export interface SessionEventRecord {
  id: string;
  sessionId: string;
  type: string;
  detail: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface SessionScoreRecord {
  id: string;
  sessionId: string;
  questionNumber: number;
  semanticScore: number;
  hesitationScore: number;
  confidenceScore: number;
  integrityScore: number;
  overallScore: number;
  scores: {
    problem_solving: number;
    system_design: number;
    communication: number;
    code_quality: number;
    technical_depth: number;
    adaptability: number;
  };
  modelVersions: Record<string, string>;
  createdAt: string;
}

export interface InterviewAnswerRecord {
  id: string;
  sessionId: string;
  questionNumber: number;
  answer: string;
  transcript: string;
  inputMode: AnswerMode;
  artifactIds: string[];
  scoreId: string;
  createdAt: string;
}

export interface InterviewSessionRecord {
  id: string;
  candidateId: string;
  candidateToken: string;
  jobRoleId: string;
  status: InterviewStatus;
  currentQuestionNumber: number;
  totalQuestions: number;
  createdAt: string;
  completedAt?: string;
}

export interface ReportRecord {
  id: string;
  sessionId: string;
  candidateId: string;
  overallScore: number;
  recommendation: 'STRONG HIRE' | 'MAYBE' | 'NO HIRE';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
}

export interface ReportNoteRecord {
  id: string;
  sessionId: string;
  recruiterUserId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactRecord {
  id: string;
  type: 'resume' | 'audio' | 'image';
  filename: string;
  mimeType: string;
  path: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  candidates: CandidateRecord[];
  job_roles: JobRoleRecord[];
  interview_sessions: InterviewSessionRecord[];
  interview_questions: InterviewQuestionRecord[];
  interview_answers: InterviewAnswerRecord[];
  session_events: SessionEventRecord[];
  session_scores: SessionScoreRecord[];
  reports: ReportRecord[];
  report_notes: ReportNoteRecord[];
  artifacts: ArtifactRecord[];
}

export interface UploadPayload {
  filename: string;
  mimeType: string;
  contentBase64: string;
}
