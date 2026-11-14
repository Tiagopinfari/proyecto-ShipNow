import mongoose from 'mongoose';
import { ORDER_STATUS, DELIVERY_PRIORITY, DOCUMENT_TYPES } from '../constants/index.js';

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del item es obligatorio']
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad mínima es 1']
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  }
}, { _id: false });

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

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es obligatorio']
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'El pedido debe tener al menos un item'
    }
  },
  deliveryAddress: {
    type: String,
    required: [true, 'La dirección de entrega es obligatoria']
  },
  total: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  declaredValue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.CREATED
  },
  priority: {
    type: String,
    enum: Object.values(DELIVERY_PRIORITY),
    default: DELIVERY_PRIORITY.NORMAL
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
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

const Order = mongoose.model('Order', orderSchema);

export default Order;
