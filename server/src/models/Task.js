import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: [true, 'Task title is required'], trim: true },
    description: { type: String, trim: true, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    dueDate: { type: Date },
    status: { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, assignedTo: 1 });

export default mongoose.model('Task', taskSchema);