import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: [true, 'Event title is required'], trim: true },
    description: { type: String, trim: true, default: '' },
    startTime: { type: Date, required: [true, 'Start time is required'] },
    endTime: { type: Date, required: [true, 'End time is required'] },
    location: { type: String, trim: true, default: '' },
    meetingUrl: { type: String, trim: true, default: '' },
    maxCapacity: { type: Number, required: [true, 'Capacity is required'], min: [1, 'Capacity must be at least 1'] },
    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

eventSchema.pre('validate', function () {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'End time must be after start time');
  }
});

eventSchema.index({ workspace: 1, startTime: 1 });

export default mongoose.model('Event', eventSchema);