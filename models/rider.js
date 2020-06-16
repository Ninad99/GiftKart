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
  completedOrders: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  ]
});

module.exports = mongoose.model('Rider', riderSchema);
