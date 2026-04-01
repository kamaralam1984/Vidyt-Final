const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function checkAbuseLogs() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Define AbuseLog schema
  const abuseLogSchema = new mongoose.Schema({
    ipAddress: String,
    endpoint: String,
    method: String,
    violationType: String,
    severity: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
  });

  const AbuseLog = mongoose.models.AbuseLog || mongoose.model('AbuseLog', abuseLogSchema);

  const logs = await AbuseLog.find({ 
    createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
  }).sort({ createdAt: -1 }).limit(10);

  console.log('Recent Abuse Logs:');
  logs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] ${log.ipAddress} - ${log.violationType} - ${log.description}`);
  });

  process.exit();
}

checkAbuseLogs().catch(err => {
  console.error(err);
  process.exit(1);
});
