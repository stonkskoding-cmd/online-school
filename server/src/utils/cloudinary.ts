import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { env } from '../config/env';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

export const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

const uploadsDir = path.join(process.cwd(), 'uploads');

const localDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

/** Папка в Cloudinary; params — функция, чтобы обойти узкий тип Params в multer-storage-cloudinary */
const cloudStorage = cloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async () => ({
        folder: 'dinastia-uploads',
      }),
    })
  : localDiskStorage;

export const adminUploadMulter = multer({
  storage: cloudStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

type UploadedFile = Express.Multer.File & { path?: string };

export function adminUploadRespond(req: Request, res: Response): void {
  const file = (req as Request & { file?: UploadedFile }).file;
  if (!file) {
    res.status(400).json({ message: 'Файл не получен (form-data, поле: file)' });
    return;
  }
  if (file.path && /^https?:\/\//i.test(String(file.path))) {
    res.status(201).json({ url: file.path });
    return;
  }
  if (file.filename) {
    const base = (env.BACKEND_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '');
    res.status(201).json({ url: `${base}/uploads/${file.filename}` });
    return;
  }
  res.status(400).json({ message: 'Не удалось определить URL файла' });
}
