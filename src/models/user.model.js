import mongoose from 'mongoose';
import { USER_ROLES, DOCUMENT_TYPES } from '../constants/index.js';

const userDocumentSchema = new mongoose.Schema({
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
    default: DOCUMENT_TYPES.USER_DOCUMENT
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CUSTOMER
  },
  documents: {
    type: [userDocumentSchema],
    default: []
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
