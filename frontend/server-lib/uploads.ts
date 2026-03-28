import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateId } from './auth';
import { UploadPayload } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

export const saveBase64Upload = async (
  type: 'resume' | 'audio' | 'image',
  payload: UploadPayload,
) => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const artifactId = generateId(type);
  const safeName = payload.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${artifactId}_${safeName}`;
  const absolutePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(payload.contentBase64, 'base64');
  await fs.writeFile(absolutePath, buffer);
  return {
    id: artifactId,
    type,
    filename: payload.filename,
    mimeType: payload.mimeType,
    path: absolutePath,
    createdAt: new Date().toISOString(),
  };
};
