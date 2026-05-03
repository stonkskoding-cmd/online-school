import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  userId: mongoose.Types.ObjectId | any;
  text: string;
  isFromAdmin: boolean;
  createdAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    isFromAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ userId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
