const axios = require('axios');

const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    return response.data;
  } catch (err) {
    throw new Error('Payment verification failed');
  }
};

module.exports = { verifyPayment };
