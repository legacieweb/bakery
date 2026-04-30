const { query } = require('../utils/db');
const bcrypt = require('bcryptjs');

class User {
  static async findOne({ email }) {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] ? this.format(res.rows[0]) : null;
  }

  static async findById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] ? this.format(res.rows[0]) : null;
  }

  static async findByIdAndUpdate(id, updateData) {
    const user = await this.findById(id);
    if (!user) return null;
    
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updateData.phone);
    }
    if (updateData.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updateData.address);
    }
    if (updateData.password !== undefined) {
      fields.push(`password = $${paramCount++}`);
      const hashedPassword = updateData.password.startsWith('$2a$') ? updateData.password : await bcrypt.hash(updateData.password, 10);
      values.push(hashedPassword);
    }
    
    if (fields.length === 0) return user;
    
    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`, values);
    return await this.findById(id);
  }

  static format(user) {
    if (!user) return null;
    return {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      address: user.address,
      role: user.role,
      comparePassword: async (candidatePassword) => {
        return await bcrypt.compare(candidatePassword, user.password);
      }
    };
  }

  constructor({ name, email, password, phone, address, role }) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.phone = phone || '';
    this.address = address || '';
    this.role = role || 'user';
  }

  async save() {
    if (this.password && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.id) {
      await query(
        'UPDATE users SET name = $1, email = $2, password = $3, phone = $4, address = $5, role = $6 WHERE id = $7',
        [this.name, this.email, this.password, this.phone || '', this.address || '', this.role, this.id]
      );
      return this;
    } else {
      const res = await query(
        'INSERT INTO users (name, email, password, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [this.name, this.email, this.password, this.phone || '', this.address || '', this.role]
      );
      const savedUser = res.rows[0];
      this.id = savedUser.id;
      this._id = savedUser.id;
      return this;
    }
  }
}

module.exports = User;
