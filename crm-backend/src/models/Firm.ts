import { Schema, model } from 'mongoose';

const firmSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: false,
  },
  contactNumber: {
    type: String,
    required: false,
  },
  createdBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const Firm = model('Firm', firmSchema);

export default Firm;