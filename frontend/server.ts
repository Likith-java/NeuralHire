import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBearerToken } from './server-lib/auth';
import { readDb, upsertReportNote, writeDb } from './server-lib/db';
import {
  candidateLogin,
  createCandidate,
  createInterviewSession,
  detectGestureLetter,
  finalizeReport,
  getRecruiterSessions,
  getReportView,
  getSessionState,
  getUserByToken,
  recordIntegrityEvent,
  recruiterLogin,
  submitInterviewAnswer,
} from './server-lib/orchestrator';
import { saveBase64Upload } from './server-lib/uploads';
import { UploadPayload } from './server-lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const requireRecruiter = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = getBearerToken(req.headers.authorization);
  const user = await getUserByToken(token);
  if (!user || user.role !== 'recruiter') {
    res.status(401).json({ error: 'Recruiter authorization required.' });
    return;
  }
  (req as express.Request & { user: typeof user }).user = user;
  next();
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/auth/recruiter/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = await recruiterLogin(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid recruiter credentials.' });
      return;
    }
    res.json({
      token: user.token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  });

  app.post('/api/auth/candidate/login', async (req, res) => {
    const { name, email } = req.body || {};
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required.' });
      return;
    }
    const user = await candidateLogin(name, email);
    res.json({
      token: user.token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  });

  app.post('/api/uploads/resume', async (req, res) => {
    const payload = req.body as UploadPayload;
    if (!payload?.filename || !payload?.contentBase64) {
      res.status(400).json({ error: 'Resume upload payload is required.' });
      return;
    }
    const artifact = await saveBase64Upload('resume', payload);
    res.json({
      artifact_id: artifact.id,
      filename: artifact.filename,
      mime_type: artifact.mimeType,
      path: artifact.path,
    });
  });

  app.post('/api/uploads/audio', async (req, res) => {
    const payload = req.body as UploadPayload;
    if (!payload?.filename || !payload?.contentBase64) {
      res.status(400).json({ error: 'Audio upload payload is required.' });
      return;
    }
    const artifact = await saveBase64Upload('audio', payload);
    res.json({
      artifact_id: artifact.id,
      filename: artifact.filename,
      mime_type: artifact.mimeType,
      path: artifact.path,
    });
  });

  app.post('/api/uploads/image', async (req, res) => {
    const payload = req.body as UploadPayload;
    if (!payload?.filename || !payload?.contentBase64) {
      res.status(400).json({ error: 'Image upload payload is required.' });
      return;
    }
    const artifact = await saveBase64Upload('image', payload);
    res.json({
      artifact_id: artifact.id,
      filename: artifact.filename,
      mime_type: artifact.mimeType,
      public_url: `/uploads/${path.basename(artifact.path)}`,
      path: artifact.path,
    });
  });

  app.post('/api/candidates', async (req, res) => {
    const {
      name,
      email,
      resume_text,
      job_role,
      required_skills,
      resume_upload,
      candidate_image_upload,
    } = req.body || {};

    if (!name || !email || !resume_text) {
      res.status(400).json({ error: 'Candidate name, email, and resume_text are required.' });
      return;
    }

    const candidateUser = await candidateLogin(name, email);
    const resumeArtifact = resume_upload?.contentBase64
      ? await saveBase64Upload('resume', resume_upload)
      : undefined;
    const imageArtifact = candidate_image_upload?.contentBase64
      ? await saveBase64Upload('image', candidate_image_upload)
      : undefined;
    const { candidate, jobRole } = await createCandidate({
      name,
      email,
      resumeText: resume_text,
      jobRole: job_role || 'Senior React Developer',
      requiredSkills: required_skills || [],
      resumeArtifact,
      candidateImageArtifact: imageArtifact,
      userId: candidateUser.id,
    });

    res.json({
      candidate_id: candidate.id,
      ats_score: candidate.atsScore,
      matched_keywords: candidate.matchedKeywords,
      candidate_token: candidateUser.token,
      job_role_id: jobRole.id,
    });
  });

  app.post('/api/interviews', async (req, res) => {
    const { candidate_id, job_role_id } = req.body || {};
    if (!candidate_id || !job_role_id) {
      res.status(400).json({ error: 'candidate_id and job_role_id are required.' });
      return;
    }
    const { session, firstQuestion } = await createInterviewSession({
      candidateId: candidate_id,
      jobRoleId: job_role_id,
    });
    res.json({
      session_id: session.id,
      candidate_token: session.candidateToken,
      first_question: firstQuestion.prompt,
      question_number: firstQuestion.questionNumber,
      total_questions: session.totalQuestions,
    });
  });

  app.get('/api/interviews/:sessionId', async (req, res) => {
    const state = await getSessionState(req.params.sessionId);
    if (!state) {
      res.status(404).json({ error: 'Interview session not found.' });
      return;
    }
    const currentQuestion = state.questions.find(
      (question) => question.questionNumber === state.session.currentQuestionNumber,
    );
    res.json({
      session_id: state.session.id,
      status: state.session.status,
      candidate: state.candidate,
      current_question_number: state.session.currentQuestionNumber,
      total_questions: state.session.totalQuestions,
      current_question: currentQuestion?.prompt || null,
      answers_count: state.answers.length,
    });
  });

  app.post('/api/interviews/:sessionId/answers', async (req, res) => {
    const { answer, input_mode, audio_upload } = req.body || {};
    if (!input_mode) {
      res.status(400).json({ error: 'input_mode is required.' });
      return;
    }
    const audioArtifact = audio_upload?.contentBase64
      ? await saveBase64Upload('audio', audio_upload)
      : undefined;
    const response = await submitInterviewAnswer({
      sessionId: req.params.sessionId,
      answer: answer || '',
      inputMode: input_mode,
      audioArtifact,
    });
    if (!response) {
      res.status(404).json({ error: 'Interview session not found.' });
      return;
    }
    res.json(response);
  });

  app.post('/api/interviews/:sessionId/integrity-events', async (req, res) => {
    const { event_type, detail, payload } = req.body || {};
    if (!event_type || !detail) {
      res.status(400).json({ error: 'event_type and detail are required.' });
      return;
    }
    const event = await recordIntegrityEvent(req.params.sessionId, event_type, detail, payload);
    res.json({ event_id: event.id, created_at: event.createdAt });
  });

  app.post('/api/interviews/:sessionId/complete', async (req, res) => {
    const report = await finalizeReport(req.params.sessionId);
    if (!report) {
      res.status(404).json({ error: 'Unable to finalize report for this session.' });
      return;
    }
    res.json({ report_id: report.id, overall_score: report.overallScore, recommendation: report.recommendation });
  });

  app.post('/api/transcribe', async (req, res) => {
    const payload = req.body as UploadPayload;
    if (!payload?.contentBase64) {
      res.status(400).json({ error: 'Audio upload payload is required.' });
      return;
    }
    const artifact = await saveBase64Upload('audio', payload);
    res.json({ transcript: `Audio response captured from ${artifact.filename}.` });
  });

  app.post('/api/gesture', async (req, res) => {
    const landmarks = req.body?.landmarks;
    if (!landmarks) {
      res.status(400).json({ error: 'landmarks are required.' });
      return;
    }
    const result = await detectGestureLetter(landmarks);
    res.json(result);
  });

  app.get('/api/report/:sessionId', async (req, res) => {
    const report = await getReportView(req.params.sessionId);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    res.json(report);
  });

  app.post('/api/report/:sessionId/notes', requireRecruiter, async (req, res) => {
    const { notes } = req.body || {};
    const db = await readDb();
    upsertReportNote(db, req.params.sessionId, (req as express.Request & { user: { id: string } }).user.id, notes || '');
    await writeDb(db);
    res.json({ status: 'success' });
  });

  app.get('/api/recruiter/sessions', requireRecruiter, async (_req, res) => {
    const sessions = await getRecruiterSessions();
    res.json(sessions);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
