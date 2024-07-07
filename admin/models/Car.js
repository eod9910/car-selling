const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true },  // Only VIN is unique
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  engine: String,
  transmission: String,
  fuelType: String,
  mileage: { 
    type: mongoose.Schema.Types.Mixed,
    set: v => {
      if (v === '' || v === null || (typeof v === 'string' && v.toLowerCase() === 'n/a')) {
        return null;
      }
      const num = Number(v);
      return isNaN(num) ? v : num;
    }
  },
  exteriorColor: String,
  features: String,
  history: String,
  dmvBackFees: Number,
  lot: String,
  images: [String] // Array of image paths
});

// Add this line to create an explicit index for the VIN field
carSchema.index({ vin: 1 }, { unique: true });

module.exports = mongoose.model('Car', carSchema);
