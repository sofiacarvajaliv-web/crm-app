const mongoose = require('mongoose');

const TASK_STATUS = ['pendiente', 'en_progreso', 'completada'];
const TASK_PRIORITY = ['baja', 'media', 'alta'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    dueDate: { type: Date, required: [true, 'La fecha límite es obligatoria'] },
    priority: { type: String, enum: TASK_PRIORITY, default: 'media' },
    status: { type: String, enum: TASK_STATUS, default: 'pendiente' },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ client: 1 });

module.exports = mongoose.model('Task', taskSchema, 'tasks');
module.exports.TASK_STATUS = TASK_STATUS;
module.exports.TASK_PRIORITY = TASK_PRIORITY;
