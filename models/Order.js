const { query } = require('../utils/db');

class Order {
  static async find(queryObj = {}) {
    let sql = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id';
    const params = [];
    
    if (queryObj.user) {
      sql += ' WHERE o.user_id = $1';
      params.push(queryObj.user);
    }
    
    sql += ' ORDER BY o.created_at DESC';
    const res = await query(sql, params);
    return res.rows.map(row => {
      const order = this.format(row);
      // Simple populate simulation for user
      if (row.user_name) {
        order.user = { id: row.user_id, name: row.user_name, email: row.user_email };
      }
      return order;
    });
  }

  static async findByIdAndUpdate(id, updateData) {
    const order = await this.findById(id);
    if (!order) return null;
    
    const status = updateData.orderStatus || order.orderStatus;
    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    return { ...order, orderStatus: status };
  }

  static async findById(id) {
    const res = await query('SELECT * FROM orders WHERE id = $1', [id]);
    return res.rows[0] ? this.format(res.rows[0]) : null;
  }

  static async findOne(queryObj) {
    if (queryObj.reference) {
      const res = await query('SELECT * FROM orders WHERE reference = $1', [queryObj.reference]);
      return res.rows[0] ? this.format(res.rows[0]) : null;
    }
    return null;
  }

  static format(order) {
    if (!order) return null;
    return {
      _id: order.id,
      id: order.id,
      user: order.user_id,
      products: order.products,
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      deliveryFee: order.delivery_fee,
      paymentOption: order.payment_option,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
      reference: order.reference,
      shippingAddress: order.shipping_address,
      phone: order.phone,
      createdAt: order.created_at
    };
  }

  constructor({ user, products, totalAmount, paidAmount, deliveryFee, paymentOption, shippingAddress, phone, reference }) {
    this.user = user;
    this.products = products;
    this.totalAmount = totalAmount;
    this.paidAmount = paidAmount;
    this.deliveryFee = deliveryFee;
    this.paymentOption = paymentOption;
    this.shippingAddress = shippingAddress;
    this.phone = phone;
    this.reference = reference;
  }

  async save() {
    if (this.id) {
      await query(
        'UPDATE orders SET user_id = $1, products = $2, total_amount = $3, paid_amount = $4, delivery_fee = $5, payment_option = $6, shipping_address = $7, phone = $8, reference = $9, status = $10, payment_status = $11 WHERE id = $12',
        [this.user, JSON.stringify(this.products), this.totalAmount, this.paidAmount, this.deliveryFee || 0, this.paymentOption, this.shippingAddress, this.phone, this.reference, this.orderStatus || 'pending', this.paymentStatus || 'pending', this.id]
      );
      return this;
    } else {
      const res = await query(
        'INSERT INTO orders (user_id, products, total_amount, paid_amount, delivery_fee, payment_option, shipping_address, phone, reference, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [this.user, JSON.stringify(this.products), this.totalAmount, this.paidAmount, this.deliveryFee || 0, this.paymentOption, this.shippingAddress, this.phone, this.reference, this.paymentStatus || 'pending']
      );
      const savedOrder = res.rows[0];
      this.id = savedOrder.id;
      this._id = savedOrder.id;
      return this;
    }
  }
}

module.exports = Order;
