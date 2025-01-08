const mongoose = require('mongoose');

const verificationHistorySchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  verificationStatus: { 
    type: String, 
    enum: ['Success', 'Failed', 'Pending'],
    required: true 
  },
  source: { 
    type: String, 
    required: true 
  },
  trustScore: { 
    type: Number, 
    required: true 
  },
  notes: String,
  verificationData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('VerificationHistory', verificationHistorySchema); 