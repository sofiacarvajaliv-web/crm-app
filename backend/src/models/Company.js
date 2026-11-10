const mongoose = require('mongoose');

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre comercial es obligatorio'], trim: true, maxlength: 120 },
    taxId: { type: String, required: [true, 'El NIT es obligatorio'], unique: true, trim: true },
    sector: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, match: [emailRx, 'Correo inválido'] },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

companySchema.index({ name: 1 });

module.exports = mongoose.model('Company', companySchema, 'companies');
