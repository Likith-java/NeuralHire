import crypto from 'crypto';

export const hashPassword = (password: string) =>
  crypto.createHash('sha256').update(password).digest('hex');

export const generateId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

export const generateToken = (prefix: string) =>
  `${prefix}_${crypto.randomBytes(24).toString('hex')}`;

export const getBearerToken = (header?: string) => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};
