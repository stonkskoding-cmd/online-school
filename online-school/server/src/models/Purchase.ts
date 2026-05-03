import mongoose from 'mongoose';

export interface IPurchase extends mongoose.Document {
  userId: mongoose.Types.ObjectId | any;
  packageId: mongoose.Types.ObjectId | any;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new mongoose.Schema<IPurchase>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ userId: 1, status: 1 });
purchaseSchema.index({ paymentId: 1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);
