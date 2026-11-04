import fs from 'node:fs';
import path from 'node:path';
import { GhostContentClient } from './client.js';

export * from './types.js';
export * from './client.js';

function getEnv(key: string): string {
  // 1. Process environment (SSR / runtime)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]!;
  }
  // 2. Vite import.meta.env (Client / bundled)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  // 3. Fallback: parse .env.local on filesystem if in Node.js
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Ignore in non-Node environments
  }
  return '';
}

const url = getEnv('GHOST_CONTENT_API_URL') || getEnv('GHOST_API_URL');
const key = getEnv('GHOST_CONTENT_API_KEY') || getEnv('GHOST_API_KEY');

export const ghost = new GhostContentClient({ url, key });
