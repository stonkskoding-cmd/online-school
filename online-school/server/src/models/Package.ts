import mongoose from 'mongoose';

export interface IMaterial {
  type: 'video' | 'text' | 'image' | 'file';
  title: string;
  r2Key?: string;
  url?: string;
  content?: string;
}

export interface IPackage extends mongoose.Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  category: 'OGE-IST' | 'EGE-IST' | 'EGE-SOC' | string;
  materials: IMaterial[];
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new mongoose.Schema<IMaterial>(
  {
    type: {
      type: String,
      enum: ['video', 'text', 'image', 'file'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    r2Key: String,
    url: String,
    content: String,
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema<IPackage>(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['OGE-IST', 'EGE-IST', 'EGE-SOC'],
    },
    materials: {
      type: [materialSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Package = mongoose.model<IPackage>('Package', packageSchema);
