import crypto from 'crypto';

export const SIGNED_URL_SECRET = process.env.SIGNED_URL_SECRET ?? crypto.randomBytes(32).toString('hex');
