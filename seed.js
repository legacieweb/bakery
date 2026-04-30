require('dotenv').config();
const { pool, query } = require('./utils/db');
const Product = require('./models/Product');

const products = require('./data/products');


const seed = async () => {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL');
    
    console.log('Syncing products...');
    const existingProducts = await Product.find();
    
    for (const p of products) {
      const existing = existingProducts.find(ep => ep.name === p.name);
      if (existing) {
        await Product.findByIdAndUpdate(existing.id, p);
      } else {
        const product = new Product(p);
        await product.save();
      }
    }
    
    console.log('Products synced');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
