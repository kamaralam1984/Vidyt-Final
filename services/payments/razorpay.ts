import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_51Gz8P3G8J8J8J',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret',
});
