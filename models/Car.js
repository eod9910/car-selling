const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true }, // Added vin field
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  images: [String],
  specifications: {
    engine: String,
    transmission: String,
    fuelType: String,
    mileage: String,
    exteriorColor: String
  },
  features: [String],
  history: String,
  dmvBackFees: { type: Number, default: 0 },
  listingDate: { type: Date, default: Date.now },
  lot: { 
    type: String, 
    required: true,
    enum: ['Lot All', 'Lot Willows', 'Lot Oroville', 'Lot Yuba']
  }
});

module.exports = mongoose.models.Car || mongoose.model('Car', carSchema);
