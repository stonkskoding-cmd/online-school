import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(root, 'node_modules', '.prisma', 'client', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('[prisma-verify] Missing generated client:', schemaPath);
  process.exit(1);
}

const content = fs.readFileSync(schemaPath, 'utf8');
const senderMatch = content.match(/senderId\s+(\w+)/);
const senderType = senderMatch?.[1];

if (senderType !== 'String') {
  console.error('[prisma-verify] Message.senderId must be String, got:', senderType ?? 'missing');
  process.exit(1);
}

if (/senderId\s+Int\b/.test(content)) {
  console.error('[prisma-verify] Message.senderId must not be Int');
  process.exit(1);
}

console.log('[prisma-verify] Message.senderId is String — OK');
