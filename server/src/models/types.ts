export type UserRole = 'user' | 'admin';

export type PackageCategory = 'OGE-IST' | 'EGE-IST' | 'EGE-SOC';

export type MaterialType = 'video' | 'text' | 'image' | 'file';

export interface PackageMaterial {
  type: MaterialType;
  title: string;
  /** Текст урока (type === 'text') */
  content?: string;
  /** URL файла или внешняя ссылка (image | video | file) */
  url?: string;
  order: number;
}
