const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { verifyPayment } = require('../utils/paystack');
const sendEmail = require('../utils/email');

exports.createOrder = async (req, res) => {
  try {
    const { products, totalAmount, paidAmount, deliveryFee, paymentOption, shippingAddress, phone, reference } = req.body;

    // Verify payment with Paystack (skip if no reference or in test mode)
    let paymentData = null;
    if (reference && paidAmount) {
      try {
        paymentData = await verifyPayment(reference);
        if (paymentData.data.status !== 'success' || paymentData.data.amount !== paidAmount * 100) {
          return res.status(400).json({ message: 'Payment verification failed' });
        }
      } catch (payErr) {
        console.log('Payment verification skipped:', payErr.message);
      }
    }

    const order = new Order({
      user: req.user.id,
      products,
      totalAmount,
      paidAmount,
      deliveryFee,
      paymentOption,
      shippingAddress,
      phone,
      reference,
      paymentStatus: paymentOption === 'full' ? 'paid' : 'deposit'
    });

    await order.save();

    // Send emails (non-blocking, wrapped in try-catch to not fail order)
    try {
      const user = await User.findById(req.user.id);
      const admin = await User.findOne({ role: 'admin' });

      const orderDetails = products.map(p => `Product ID: ${p.product}, Qty: ${p.quantity}, Price: ${p.price}`).join('\n');

      // Email to User
      if (user) {
        await sendEmail({
          email: user.email,
          subject: 'Order Confirmation - Sweet Delights Bakery',
          html: `<h1>Thank you for your order, ${user.name}!</h1>
                 <p>Your order of KSh ${totalAmount} has been placed successfully.</p>
                 <p>Reference: ${reference}</p>
                 <p>Shipping to: ${shippingAddress}</p>
                 <p><strong>Order Summary:</strong></p>
                 <pre>${orderDetails}</pre>`
        });
      }

      // Email to Admin
      if (admin) {
        await sendEmail({
          email: admin.email,
          subject: 'New Order Received',
          html: `<h1>New order from ${user?.name || 'Unknown'}</h1>
                 <p>Total Amount: KSh ${totalAmount}</p>
                 <p>Reference: ${reference}</p>
                 <p>Phone: ${phone}</p>
                 <p>Address: ${shippingAddress}</p>
                 <p><strong>Order Summary:</strong></p>
                 <pre>${orderDetails}</pre>`
        });
      }
    } catch (emailErr) {
      console.log('Email sending failed (non-critical):', emailErr.message);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find();
    } else {
      orders = await Order.find({ user: req.user.id });
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access denied' });
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
