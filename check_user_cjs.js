const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

// Define User schema if needed or import it
// Since importing might be tricky with TS/Paths, let's define a minimal one
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  uniqueId: String,
  loginPin: String
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUser() {
  console.log('Connecting to:', process.env.MONGODB_URI?.split('@')[1]); // Log host only for safety
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'kamaralamjdu@gmail.com' });
  if (user) {
    console.log('User found:');
    console.log('ID:', user._id);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('UniqueId:', user.uniqueId);
    console.log('HasPassword:', !!user.password);
    console.log('LoginPin:', user.loginPin);
  } else {
    console.log('User NOT found: kamaralamjdu@gmail.com');
  }
  process.exit();
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
