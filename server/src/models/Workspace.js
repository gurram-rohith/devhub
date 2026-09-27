import mongoose from 'mongoose';
import crypto from 'crypto';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false } // members don't need their own separate _id
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Workspace name is required'], trim: true },
    description: { type: String, trim: true, default: '' },
    inviteCode: { type: String, unique: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

// Generate a unique 6-char invite code before saving, if not already set
// Generate a unique 6-char invite code before saving, if not already set
workspaceSchema.pre('validate', function () {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  }
});

export default mongoose.model('Workspace', workspaceSchema);