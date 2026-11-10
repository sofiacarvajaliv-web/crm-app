const mongoose = require('mongoose');

const ID_TYPES = ['CC', 'CE', 'NIT', 'PAS', 'TI', 'OTRO'];
const CLIENT_TYPES = ['persona', 'empresa', 'prospecto'];
const CLIENT_STATUS = ['activo', 'inactivo', 'potencial'];

const clientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 120 },
    idType: { type: String, enum: ID_TYPES, required: true },
    idNumber: { type: String, required: [true, 'La identificación es obligatoria'], unique: true, trim: true },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo inválido'],
    },
    phone: { type: String, required: [true, 'El teléfono es obligatorio'], trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    clientType: { type: String, enum: CLIENT_TYPES, default: 'persona' },
    status: { type: String, enum: CLIENT_STATUS, default: 'potencial' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true, maxlength: 2000 },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

clientSchema.index({ status: 1, clientType: 1 });
clientSchema.index({ fullName: 1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ registeredAt: -1 });

module.exports = mongoose.model('Client', clientSchema, 'clients');
module.exports.ID_TYPES = ID_TYPES;
module.exports.CLIENT_TYPES = CLIENT_TYPES;
module.exports.CLIENT_STATUS = CLIENT_STATUS;
