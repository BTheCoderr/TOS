const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  registrationNumber: { type: String, unique: true, required: true },
  status: { type: String, enum: ['Verified', 'Pending', 'Rejected'], default: 'Pending' },
  trustScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema); 