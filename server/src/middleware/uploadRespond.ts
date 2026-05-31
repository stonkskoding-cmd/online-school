import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

type UploadedFile = Express.Multer.File;

export function uploadRespond(req: Request, res: Response): void {
  const file = (req as Request & { file?: UploadedFile }).file;
  if (!file) {
    res.status(400).json({ message: 'Файл не получен (form-data, поле: file)', error: 'No file' });
    return;
  }
  const base = (env.BACKEND_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '');
  const url = `${base}/uploads/${file.filename}`;
  console.log('[upload] saved', file.filename, '→', url);
  res.status(201).json({ url });
}

export function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!err) {
    next();
    return;
  }
  console.error('[upload] multer error:', err.message);
  res.status(400).json({ error: err.message, message: err.message });
}
