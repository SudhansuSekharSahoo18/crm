import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'SUBMITTER', 'APPROVER', 'DATA_ENTRY', 'DATA_APPROVER', 'VERIFIER'],
    default: 'SUBMITTER',
  },
}, {
  timestamps: true,
});

const User = model('User', userSchema);

export default User;