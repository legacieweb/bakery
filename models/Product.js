const { query } = require('../utils/db');

class Product {
  static async find(queryObj = {}) {
    try {
      const res = await query('SELECT * FROM products ORDER BY created_at DESC');
      return res.rows.map(row => this.format(row));
    } catch (err) {
      console.error('Error in Product.find:', err);
      return [];
    }
  }

  static async findById(id) {
    try {
      const res = await query('SELECT * FROM products WHERE id = $1', [id]);
      return res.rows[0] ? this.format(res.rows[0]) : null;
    } catch (err) {
      console.error('Error in Product.findById:', err);
      return null;
    }
  }

  static async findByIdAndUpdate(id, updateData) {
    const product = await this.findById(id);
    if (!product) return null;
    
    const updated = { ...product, ...updateData };
    await query(
      'UPDATE products SET name = $1, description = $2, price = $3, image = $4, category = $5 WHERE id = $6',
      [updated.name, updated.description, updated.price, updated.image, updated.category, id]
    );
    return updated;
  }

  static async findByIdAndDelete(id) {
    await query('DELETE FROM products WHERE id = $1', [id]);
  }

  static format(product) {
    if (!product) return null;
    return {
      _id: product.id,
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      createdAt: product.created_at
    };
  }

  constructor({ name, description, price, image, category }) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.image = image;
    this.category = category;
  }

  async save() {
    if (this.id) {
      await query(
        'UPDATE products SET name = $1, description = $2, price = $3, image = $4, category = $5 WHERE id = $6',
        [this.name, this.description, this.price, this.image, this.category, this.id]
      );
      return this;
    } else {
      const res = await query(
        'INSERT INTO products (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [this.name, this.description, this.price, this.image, this.category]
      );
      const savedProduct = res.rows[0];
      this.id = savedProduct.id;
      this._id = savedProduct.id;
      return this;
    }
  }
}

module.exports = Product;
