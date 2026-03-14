/**
 * One-time script: set a user's role to super-admin by email.
 * Run: node scripts/set-super-admin.js <email>
 * Example: node scripts/set-super-admin.js testjduwork@gmail.com
 */
try {
  require('dotenv').config({ path: '.env.local' });
} catch (_) {}
const mongoose = require('mongoose');

const email = process.argv[2];
if (!email || !email.trim()) {
  console.error('Usage: node scripts/set-super-admin.js <email>');
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

  await users.updateOne(
    { _id: user._id },
    { $set: { role: 'super-admin' } }
  );
  console.log('Role set to super-admin for:', user.email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
