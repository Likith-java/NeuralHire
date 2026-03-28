import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSchema, JobRoleRecord } from './types';
import { generateId, hashPassword } from './auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const defaultJobRole = (): JobRoleRecord => ({
  id: 'job_role_frontend_ai',
  title: 'Senior React Developer',
  description: 'Senior React Developer with experience in AI integration, Tailwind CSS, and state management.',
  requiredSkills: ['React', 'TypeScript', 'Tailwind', 'AI', 'State Management', 'Testing'],
  idealAnswers: [],
  createdAt: new Date().toISOString(),
});

const createDefaultDb = (): DatabaseSchema => ({
  users: [
    {
      id: 'user_recruiter_admin',
      email: 'recruiter@neuralhire.local',
      passwordHash: hashPassword('admin123'),
      role: 'recruiter',
      name: 'NeuralHire Recruiter',
      createdAt: new Date().toISOString(),
    },
  ],
  candidates: [],
  job_roles: [defaultJobRole()],
  interview_sessions: [],
  interview_questions: [],
  interview_answers: [],
  session_events: [],
  session_scores: [],
  reports: [],
  report_notes: [],
  artifacts: [],
});

const ensureDb = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(createDefaultDb(), null, 2), 'utf-8');
  }
};

export const readDb = async (): Promise<DatabaseSchema> => {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as DatabaseSchema;
  if (!parsed.job_roles?.length) {
    parsed.job_roles = [defaultJobRole()];
  }
  return parsed;
};

export const writeDb = async (db: DatabaseSchema) => {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
};

export const upsertReportNote = (
  db: DatabaseSchema,
  sessionId: string,
  recruiterUserId: string,
  notes: string,
) => {
  const existing = db.report_notes.find((note) => note.sessionId === sessionId);
  const timestamp = new Date().toISOString();
  if (existing) {
    existing.notes = notes;
    existing.updatedAt = timestamp;
    return existing;
  }

  const created = {
    id: generateId('note'),
    sessionId,
    recruiterUserId,
    notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.report_notes.push(created);
  return created;
};
