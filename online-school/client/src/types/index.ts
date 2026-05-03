export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
}

export interface Material {
  type: 'video' | 'text' | 'image' | 'file';
  title: string;
  r2Key?: string;
  url?: string;
  content?: string;
}

export interface Package {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category: 'OGE-IST' | 'EGE-IST' | 'EGE-SOC';
  materials: Material[];
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  userId: string;
  packageId: string | Package;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  userId: string;
  text: string;
  isFromAdmin: boolean;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  lastMessage: Message;
  messageCount: number;
}
