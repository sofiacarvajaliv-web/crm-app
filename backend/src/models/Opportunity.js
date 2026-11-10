const mongoose = require('mongoose');

const OPP_STATUS = ['nueva', 'en_contacto', 'en_negociacion', 'ganada', 'perdida'];
const OPEN_STATUS = ['nueva', 'en_contacto', 'en_negociacion'];

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 140 },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'El cliente es obligatorio'] },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    estimatedValue: { type: Number, min: [0, 'El valor no puede ser negativo'], default: 0 },
    expectedCloseDate: { type: Date },
    status: { type: String, enum: OPP_STATUS, default: 'nueva' },
    description: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

opportunitySchema.index({ status: 1 });
opportunitySchema.index({ owner: 1, status: 1 });
opportunitySchema.index({ client: 1 });
opportunitySchema.index({ company: 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema, 'opportunities');
module.exports.OPP_STATUS = OPP_STATUS;
module.exports.OPEN_STATUS = OPEN_STATUS;
