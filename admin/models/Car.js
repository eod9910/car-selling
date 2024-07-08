const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String
});

const carSchema = new mongoose.Schema({
  vin: { type: String, required: true },
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
  images: [imageSchema] // Array of image objects
});

module.exports = mongoose.model('Car', carSchema);