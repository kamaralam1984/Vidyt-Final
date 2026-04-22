const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function createSuperAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const email = 'kamaralamjdu@gmail.com';
  const password = 'Admin@1234'; // Temporary password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Define User schema
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: String,
    role: String,
    uniqueId: String,
    loginPin: String,
    subscription: String,
    emailVerified: { type: Boolean, default: true }
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model('User', userSchema);

  let user = await User.findOne({ email });

  if (user) {
    console.log('User exists, updating to Super Admin...');
    user.role = 'super-admin';
    user.password = hashedPassword;
    user.subscription = 'owner';
    if (!user.uniqueId) user.uniqueId = '795752';
    if (!user.loginPin) user.loginPin = '198400';
    await user.save();
    console.log('User updated successfully.');
  } else {
    console.log('User does not exist, creating new Super Admin...');
    user = new User({
      email,
      password: hashedPassword,
      name: 'Kamar',
      role: 'super-admin',
      uniqueId: '795752',
      loginPin: '198400',
      subscription: 'owner',
      emailVerified: true
    });
    await user.save();
    console.log('User created successfully.');
  }

  console.log('Credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Unique ID:', user.uniqueId);
  console.log('PIN:', user.loginPin);

  process.exit();
}

createSuperAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
