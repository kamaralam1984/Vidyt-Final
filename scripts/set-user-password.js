/**
 * One-time script: set password for a user by email.
 * Run: node scripts/set-user-password.js <email> <newPassword>
 * Example: node scripts/set-user-password.js testjduwork@gmail.com MyNewPass123
 */
try {
  require('dotenv').config({ path: '.env.local' });
} catch (_) {}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/set-user-password.js <email> <newPassword>');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/viralboost';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const emailNorm = email.trim();
  let user = await users.findOne({ email: emailNorm });
  if (!user) {
    user = await users.findOne({ email: new RegExp(`^${emailNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  }
  if (!user) {
    console.error('User not found with email:', email);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await users.updateOne(
    { _id: user._id },
    { $set: { password: hashed } }
  );
  console.log('Password updated for:', email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
