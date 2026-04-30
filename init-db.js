const { pool, query } = require('./utils/db');
const Product = require('./models/Product');

const products = require('./data/products');


const initDb = async () => {
  try {
    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50),
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to products table if they don't exist
    try {
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50)`);
    } catch (e) {
      // Columns might already exist
    }

    // Create Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        products JSONB NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2),
        payment_option VARCHAR(20) DEFAULT 'full' CHECK (payment_option IN ('full', 'deposit')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
        shipping_address TEXT,
        phone VARCHAR(20),
        reference VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to orders table if they don't exist (for existing databases)
    try {
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS products JSONB`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2)`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2)`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_option VARCHAR(20) DEFAULT 'full'`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference VARCHAR(100)`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'`);
    } catch (e) {
      // Columns might already exist
    }

    // Fix: Rename old columns if they exist (for schema migrations)
    try {
      await pool.query(`ALTER TABLE orders RENAME COLUMN userid TO user_id`);
    } catch (e) {
      // Column might not exist or already renamed
    }

    // Add phone and address columns to users table if they don't exist
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
    } catch (e) {
      // Columns might already exist
    }

    // Seed products - intelligent sync
    console.log('Syncing products...');
    const existingProducts = await Product.find();
    
    for (const p of products) {
      const existing = existingProducts.find(ep => ep.name === p.name);
      if (existing) {
        // Update existing product to match seed data (e.g., if image changed)
        await Product.findByIdAndUpdate(existing.id, p);
      } else {
        // Create new product
        const product = new Product(p);
        await product.save();
      }
    }
    console.log('Products synced successfully');

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

if (require.main === module) {
  initDb().then(() => process.exit());
}

module.exports = initDb;
