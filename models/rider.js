const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const riderSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  assignedOrders: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  ],
  completedOrders: {
    type: Number,
    required: true,
    default: 0
  }
});

module.exports = mongoose.model('Rider', riderSchema);
