const path = require('path');
const fs = require('fs');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const envPath = path.resolve(__dirname, '../.env');
console.log('Attempting to load .env from:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env file exists');
    require('dotenv').config({ path: envPath });
} else {
    console.log('.env file does not exist at the specified path');
}

console.log('Environment variables:', process.env);
console.log('MongoDB URI:', process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in the .env file');
    process.exit(1);
}

const mongoose = require('mongoose');
const Car = require('../public/css-styles_test/Car');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  const duplicates = await Car.aggregate([
    { $group: { 
      _id: "$vin", 
      count: { $sum: 1 }, 
      docs: { $push: { _id: "$_id", createdAt: "$createdAt" } } 
    }},
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`Found ${duplicates.length} VINs with duplicates`);

  for (let dup of duplicates) {
    console.log(`Processing duplicates for VIN: ${dup._id}`);
    dup.docs.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp());
    const [keep, ...remove] = dup.docs;
    
    console.log(`Keeping document with ID: ${keep._id}`);
    console.log(`Removing ${remove.length} duplicate(s)`);

    const removeIds = remove.map(doc => doc._id);
    await Car.deleteMany({ _id: { $in: removeIds } });
    
    console.log(`Removed ${remove.length} duplicates for VIN ${dup._id}`);
  }

  console.log('Duplicate removal complete');
  mongoose.connection.close();
})
.catch(err => {
  console.error('Error:', err);
  mongoose.connection.close();
});

console.log('Script completed');
