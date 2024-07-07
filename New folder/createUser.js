require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createUser(username, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log(`User ${username} created successfully`);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Replace 'admin' and 'password123' with your desired username and password
createUser('admin', 'password123');