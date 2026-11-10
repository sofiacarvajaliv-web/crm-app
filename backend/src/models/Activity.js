const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['llamada', 'correo', 'reunion', 'visita', 'seguimiento', 'otra'];

const activitySchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'El cliente es obligatorio'] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: [true, 'El tipo es obligatorio'] },
    description: { type: String, required: [true, 'La descripción es obligatoria'], trim: true, maxlength: 2000 },
    date: { type: Date, required: [true, 'La fecha es obligatoria'], default: Date.now },
    result: { type: String, trim: true, maxlength: 1000 },
    nextFollowUp: {
      type: Date,
      validate: {
        validator(v) {
          return !v || !this.date || v >= this.date;
        },
        message: 'El próximo seguimiento no puede ser anterior a la fecha de la actividad',
      },
    },
  },
  { timestamps: true }
);

activitySchema.index({ client: 1, date: -1 });
activitySchema.index({ owner: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema, 'activities');
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
