import { QUESTION_BANK } from './questions';
import { generateId, generateToken, hashPassword } from './auth';
import { readDb, writeDb } from './db';
import {
  AnswerMode,
  ArtifactRecord,
  CandidateRecord,
  InterviewQuestionRecord,
  ReportRecord,
  SessionEventRecord,
  SessionScoreRecord,
  UserRecord,
} from './types';
import {
  runGestureAnalysis,
  runIntegrityAnalysis,
  runResumeAnalysis,
  runSemanticAnalysis,
  runSpeechAnalysis,
  runTranscriptFallback,
} from './ml';

const scoreBand = (value: number) => Math.max(1, Math.min(10, Math.round(value / 10)));

const recommendationForScore = (score: number) => {
  if (score >= 75) return 'STRONG HIRE' as const;
  if (score >= 50) return 'MAYBE' as const;
  return 'NO HIRE' as const;
};

const summaryForScore = (score: number, candidateName: string) => {
  if (score >= 75) return `${candidateName} showed strong alignment across technical depth, clarity, and delivery confidence.`;
  if (score >= 50) return `${candidateName} showed partial alignment, with enough signal to justify recruiter review.`;
  return `${candidateName} needs improvement across core answer quality and interview confidence.`;
};

const buildQuestionRecords = (sessionId: string): InterviewQuestionRecord[] =>
  QUESTION_BANK.map((question, index) => ({
    id: generateId('question'),
    sessionId,
    questionNumber: index + 1,
    prompt: question.prompt,
    idealAnswer: question.idealAnswer,
    category: question.category,
  }));

export const recruiterLogin = async (email: string, password: string) => {
  const db = await readDb();
  const user = db.users.find((entry) => entry.email === email && entry.role === 'recruiter');
  if (!user || user.passwordHash !== hashPassword(password)) {
    return null;
  }

  user.token = generateToken('recruiter');
  await writeDb(db);
  return user;
};

export const candidateLogin = async (name: string, email: string) => {
  const db = await readDb();
  let user = db.users.find((entry) => entry.email === email && entry.role === 'candidate');
  if (!user) {
    user = {
      id: generateId('user'),
      email,
      passwordHash: '',
      role: 'candidate',
      name,
      token: generateToken('candidate'),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  } else {
    user.name = name;
    user.token = generateToken('candidate');
  }

  await writeDb(db);
  return user;
};

export const getUserByToken = async (token?: string | null): Promise<UserRecord | null> => {
  if (!token) return null;
  const db = await readDb();
  return db.users.find((user) => user.token === token) || null;
};

export const createCandidate = async (input: {
  name: string;
  email: string;
  resumeText: string;
  jobRole: string;
  requiredSkills: string[];
  resumeArtifact?: ArtifactRecord;
  candidateImageArtifact?: ArtifactRecord;
  userId?: string;
}) => {
  const db = await readDb();
  const jobRole =
    db.job_roles.find((job) => job.title === input.jobRole) ||
    db.job_roles[0];

  const resume = await runResumeAnalysis({
    resumeText: input.resumeText,
    jobDescription: jobRole.description,
    requiredSkills: input.requiredSkills.length ? input.requiredSkills : jobRole.requiredSkills,
  });

  const candidate: CandidateRecord = {
    id: generateId('candidate'),
    userId: input.userId,
    name: input.name,
    email: input.email,
    candidateImagePath: input.candidateImageArtifact?.path,
    resumeArtifactId: input.resumeArtifact?.id,
    resumeText: input.resumeText,
    atsScore: resume.ats_score,
    matchedKeywords: resume.matched_keywords || [],
    createdAt: new Date().toISOString(),
  };

  db.candidates.push(candidate);
  if (input.resumeArtifact) db.artifacts.push(input.resumeArtifact);
  if (input.candidateImageArtifact) db.artifacts.push(input.candidateImageArtifact);
  await writeDb(db);
  return { candidate, jobRole };
};

export const createInterviewSession = async (input: {
  candidateId: string;
  jobRoleId: string;
}) => {
  const db = await readDb();
  const sessionId = generateId('session');
  const questions = buildQuestionRecords(sessionId);
  const session = {
    id: sessionId,
    candidateId: input.candidateId,
    candidateToken: generateToken('session'),
    jobRoleId: input.jobRoleId,
    status: 'active' as const,
    currentQuestionNumber: 1,
    totalQuestions: questions.length,
    createdAt: new Date().toISOString(),
  };

  db.interview_sessions.push(session);
  db.interview_questions.push(...questions);
  db.session_events.push({
    id: generateId('event'),
    sessionId,
    type: 'session_started',
    detail: 'Interview session created.',
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);

  return {
    session,
    firstQuestion: questions[0],
  };
};

export const getSessionState = async (sessionId: string) => {
  const db = await readDb();
  const session = db.interview_sessions.find((entry) => entry.id === sessionId);
  if (!session) return null;
  const candidate = db.candidates.find((entry) => entry.id === session.candidateId);
  const questions = db.interview_questions.filter((entry) => entry.sessionId === sessionId);
  const answers = db.interview_answers.filter((entry) => entry.sessionId === sessionId);
  return { session, candidate, questions, answers };
};

export const recordIntegrityEvent = async (sessionId: string, eventType: string, detail: string, payload?: Record<string, unknown>) => {
  const db = await readDb();
  const event: SessionEventRecord = {
    id: generateId('event'),
    sessionId,
    type: eventType,
    detail,
    payload,
    createdAt: new Date().toISOString(),
  };
  db.session_events.push(event);
  await writeDb(db);
  return event;
};

export const submitInterviewAnswer = async (input: {
  sessionId: string;
  answer: string;
  inputMode: AnswerMode;
  audioArtifact?: ArtifactRecord;
}) => {
  const db = await readDb();
  const session = db.interview_sessions.find((entry) => entry.id === input.sessionId);
  if (!session) return null;

  const question = db.interview_questions.find(
    (entry) => entry.sessionId === input.sessionId && entry.questionNumber === session.currentQuestionNumber,
  );
  const candidate = db.candidates.find((entry) => entry.id === session.candidateId);
  if (!question || !candidate) return null;

  let transcript = input.answer;
  let speechAnalysis = await runSpeechAnalysis({ transcript: input.answer });
  if (input.audioArtifact) {
    db.artifacts.push(input.audioArtifact);
    if (!transcript.trim()) {
      speechAnalysis = await runTranscriptFallback(input.audioArtifact.path);
      transcript = speechAnalysis.transcript;
    } else {
      speechAnalysis = await runSpeechAnalysis({ transcript, audioArtifactPath: input.audioArtifact.path });
    }
  }

  const semantic = await runSemanticAnalysis({
    idealAnswer: question.idealAnswer,
    candidateAnswer: transcript,
  });

  const recentEvents = db.session_events
    .filter((entry) => entry.sessionId === input.sessionId)
    .slice(-10)
    .map((entry) => ({ type: entry.type }));
  const integrity = await runIntegrityAnalysis({ events: recentEvents });

  const semanticPercent = Math.round((semantic.semantic_score || 0) * 100);
  const questionOverall = Math.round(
    semanticPercent * 0.45 +
      speechAnalysis.confidence_score * 0.25 +
      integrity.integrity_score * 0.15 +
      (100 - speechAnalysis.hesitation_score) * 0.15,
  );

  const scoreRecord: SessionScoreRecord = {
    id: generateId('score'),
    sessionId: input.sessionId,
    questionNumber: question.questionNumber,
    semanticScore: semanticPercent,
    hesitationScore: speechAnalysis.hesitation_score,
    confidenceScore: speechAnalysis.confidence_score,
    integrityScore: integrity.integrity_score,
    overallScore: questionOverall,
    scores: {
      problem_solving: scoreBand(questionOverall),
      system_design: scoreBand(questionOverall - 5),
      communication: scoreBand((semanticPercent + speechAnalysis.confidence_score) / 2),
      code_quality: scoreBand(semanticPercent),
      technical_depth: scoreBand(questionOverall - 3),
      adaptability: scoreBand((questionOverall + integrity.integrity_score) / 2),
    },
    modelVersions: {
      semantic: semantic.model_version,
      speech: speechAnalysis.model_version,
      integrity: integrity.model_version,
    },
    createdAt: new Date().toISOString(),
  };
  db.session_scores.push(scoreRecord);

  const answerRecord = {
    id: generateId('answer'),
    sessionId: input.sessionId,
    questionNumber: question.questionNumber,
    answer: input.answer,
    transcript,
    inputMode: input.inputMode,
    artifactIds: input.audioArtifact ? [input.audioArtifact.id] : [],
    scoreId: scoreRecord.id,
    createdAt: new Date().toISOString(),
  };
  db.interview_answers.push(answerRecord);

  const timelineEvent = {
    id: generateId('event'),
    sessionId: input.sessionId,
    type: 'answer_submitted',
    detail: `Question ${question.questionNumber} answered via ${input.inputMode}.`,
    payload: { questionNumber: question.questionNumber, inputMode: input.inputMode },
    createdAt: new Date().toISOString(),
  };
  db.session_events.push(timelineEvent);

  const isComplete = session.currentQuestionNumber >= session.totalQuestions;
  const nextQuestion = db.interview_questions.find(
    (entry) => entry.sessionId === input.sessionId && entry.questionNumber === session.currentQuestionNumber + 1,
  );

  if (isComplete) {
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
  } else {
    session.currentQuestionNumber += 1;
  }

  await writeDb(db);

  return {
    session_id: input.sessionId,
    question_number: question.questionNumber,
    question: question.prompt,
    transcript,
    scores: scoreRecord.scores,
    semantic_score: scoreRecord.semanticScore,
    hesitation_score: scoreRecord.hesitationScore,
    confidence_score: scoreRecord.confidenceScore,
    integrity_score: scoreRecord.integrityScore,
    overall_score: scoreRecord.overallScore,
    next_question: nextQuestion?.prompt || 'The interview is now complete. Thank you for your time.',
    interview_complete: isComplete,
    timeline_event_id: timelineEvent.id,
  };
};

export const finalizeReport = async (sessionId: string): Promise<ReportRecord | null> => {
  const db = await readDb();
  const existing = db.reports.find((report) => report.sessionId === sessionId);
  if (existing) return existing;

  const session = db.interview_sessions.find((entry) => entry.id === sessionId);
  if (!session) return null;
  const candidate = db.candidates.find((entry) => entry.id === session.candidateId);
  const scores = db.session_scores.filter((entry) => entry.sessionId === sessionId);
  if (!candidate || !scores.length) return null;

  const overall = Math.round(scores.reduce((acc, score) => acc + score.overallScore, 0) / scores.length);
  const report: ReportRecord = {
    id: generateId('report'),
    sessionId,
    candidateId: candidate.id,
    overallScore: overall,
    recommendation: recommendationForScore(overall),
    summary: summaryForScore(overall, candidate.name),
    strengths: overall >= 75 ? ['Technical depth', 'Communication', 'Delivery confidence'] : ['Resume alignment', 'Participation'],
    weaknesses: overall >= 75 ? ['None critical in this session'] : ['Answer depth', 'Confidence consistency'],
    createdAt: new Date().toISOString(),
  };
  db.reports.push(report);
  await writeDb(db);
  return report;
};

export const getReportView = async (sessionId: string) => {
  const db = await readDb();
  const session = db.interview_sessions.find((entry) => entry.id === sessionId);
  if (!session) return null;
  const candidate = db.candidates.find((entry) => entry.id === session.candidateId);
  if (!candidate) return null;
  const report = (await finalizeReport(sessionId)) || db.reports.find((entry) => entry.sessionId === sessionId);
  if (!report) return null;

  const answers = db.interview_answers.filter((entry) => entry.sessionId === sessionId);
  const scores = db.session_scores.filter((entry) => entry.sessionId === sessionId);
  const note = db.report_notes.find((entry) => entry.sessionId === sessionId);
  const questions = db.interview_questions.filter((entry) => entry.sessionId === sessionId);
  const events = db.session_events.filter((entry) => entry.sessionId === sessionId);
  const avgHesitation = scores.length
    ? Number((scores.reduce((acc, entry) => acc + entry.hesitationScore, 0) / scores.length).toFixed(1))
    : 0;
  const avgConfidence = scores.length
    ? Number((scores.reduce((acc, entry) => acc + entry.confidenceScore, 0) / scores.length).toFixed(1))
    : 0;

  return {
    session_id: sessionId,
    overall_score: report.overallScore,
    candidate_name: candidate.name,
    candidate_image: candidate.candidateImagePath ? `/uploads/${candidate.candidateImagePath.split('/').pop()}` : '',
    job_role: db.job_roles.find((entry) => entry.id === session.jobRoleId)?.title || 'Software Engineer',
    timestamp: report.createdAt,
    recruiter_notes: note?.notes || '',
    summary: report.summary,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    recommendation: report.recommendation,
    ats_score: candidate.atsScore,
    matched_keywords: candidate.matchedKeywords,
    scores: scores.length
      ? {
          problem_solving: Number((scores.reduce((acc, entry) => acc + entry.scores.problem_solving, 0) / scores.length).toFixed(1)),
          system_design: Number((scores.reduce((acc, entry) => acc + entry.scores.system_design, 0) / scores.length).toFixed(1)),
          communication: Number((scores.reduce((acc, entry) => acc + entry.scores.communication, 0) / scores.length).toFixed(1)),
          code_quality: Number((scores.reduce((acc, entry) => acc + entry.scores.code_quality, 0) / scores.length).toFixed(1)),
          technical_depth: Number((scores.reduce((acc, entry) => acc + entry.scores.technical_depth, 0) / scores.length).toFixed(1)),
          adaptability: Number((scores.reduce((acc, entry) => acc + entry.scores.adaptability, 0) / scores.length).toFixed(1)),
        }
      : null,
    avg_score: scores.length ? Number((scores.reduce((acc, entry) => acc + entry.overallScore, 0) / scores.length / 10).toFixed(1)) : 0,
    avg_hesitation: avgHesitation,
    avg_confidence: avgConfidence,
    semantic_match: scores.length ? Math.round(scores.reduce((acc, entry) => acc + entry.semanticScore, 0) / scores.length) : 0,
    hesitation_level: avgHesitation < 25 ? 'Low' : avgHesitation < 50 ? 'Medium' : 'High',
    questions: answers.map((answer) => {
      const score = scores.find((entry) => entry.id === answer.scoreId);
      const question = questions.find((entry) => entry.questionNumber === answer.questionNumber);
      return {
        id: answer.id,
        question_number: answer.questionNumber,
        question: question?.prompt || '',
        answer: answer.transcript,
        score: Math.round((score?.overallScore || 0) / 10),
        semantic: score?.semanticScore || 0,
        hesitation: score?.hesitationScore || 0,
        note: `Answered via ${answer.inputMode}.`,
        feedback: `Models: ${Object.values(score?.modelVersions || {}).join(', ') || 'n/a'}`,
      };
    }),
    timeline: scores.map((score) => ({
      question: `Q${score.questionNumber}`,
      confidence: score.confidenceScore,
      hesitation: score.hesitationScore,
      semantic: score.semanticScore,
      overall: score.overallScore,
    })),
    mode_counts: answers.reduce(
      (acc, answer) => {
        acc[answer.inputMode] += 1;
        return acc;
      },
      { text: 0, voice: 0, sign: 0 },
    ),
    integrity_events: events.filter((entry) => entry.type !== 'answer_submitted' && entry.type !== 'session_started'),
  };
};

export const getRecruiterSessions = async () => {
  const db = await readDb();
  return db.interview_sessions.map((session) => {
    const candidate = db.candidates.find((entry) => entry.id === session.candidateId);
    const report = db.reports.find((entry) => entry.sessionId === session.id);
    return {
      id: session.id,
      candidate_id: candidate?.id,
      name: candidate?.name || 'Unknown Candidate',
      email: candidate?.email || '',
      role: db.job_roles.find((entry) => entry.id === session.jobRoleId)?.title || 'Software Engineer',
      status: session.status === 'completed' ? 'Complete' : 'In Progress',
      score: report?.overallScore ?? null,
      timestamp: session.createdAt,
      ats_score: candidate?.atsScore ?? 0,
      candidate_image: candidate?.candidateImagePath ? `/uploads/${candidate.candidateImagePath.split('/').pop()}` : '',
    };
  });
};

export const detectGestureLetter = async (landmarks: number[][]) => runGestureAnalysis({ landmarks });
