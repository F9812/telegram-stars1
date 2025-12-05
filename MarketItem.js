const mongoose = require('mongoose');

const MarketItemSchema = new mongoose.Schema({
  itemType: { 
    type: String, 
    enum: ['energy_cluster', 'blueprint', 'boost', 'artifact'], 
    required: true 
  },
  itemId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  price: { type: Number, required: true, min: 1 },
  currency: { type: String, enum: ['energy', 'quantum'], default: 'energy' },
  
  // Дополнительные данные предмета
  itemData: mongoose.Schema.Types.Mixed,
  
  // Статус аукциона
  status: { 
    type: String, 
    enum: ['active', 'sold', 'expired', 'cancelled'], 
    default: 'active' 
  },
  
  // Время для аукциона
  listedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 24 * 3600 * 1000 }, // 24 часа в миллисекундах
  expiresAt: Date,
  
  // Покупатель (если продан)
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  soldAt: Date,
  soldPrice: Number,
  
  createdAt: { type: Date, default: Date.now }
});

// Автоматическое установление expiresAt
MarketItemSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(this.listedAt.getTime() + this.duration);
  }
  next();
});

module.exports = mongoose.model('MarketItem', MarketItemSchema);
