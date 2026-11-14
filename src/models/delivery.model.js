import mongoose from 'mongoose';
import { DELIVERY_STATUS, DELIVERY_PRIORITY, DOCUMENT_TYPES } from '../constants/index.js';

const fileMetadataSchema = new mongoose.Schema({
  name: { type: String },
  originalName: { type: String },
  filename: { type: String },
  reference: { type: String },
  path: { type: String },
  mimetype: { type: String },
  size: { type: Number },
  documentType: {
    type: String,
    enum: Object.values(DOCUMENT_TYPES),
    default: DOCUMENT_TYPES.DELIVERY_PROOF
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'El pedido es obligatorio']
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.PENDING
  },
  priority: {
    type: String,
    enum: Object.values(DELIVERY_PRIORITY),
    default: DELIVERY_PRIORITY.NORMAL
  },
  assignedAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  proof: {
    type: fileMetadataSchema,
    default: null
  },
  proofs: {
    type: [fileMetadataSchema],
    default: []
  }
}, {
  timestamps: true
});

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
