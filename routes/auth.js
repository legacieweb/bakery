const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { signup, login, getMe, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/signup', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], signup);

router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], login);

router.get('/me', auth, getMe);

router.put('/profile', auth, updateProfile);

module.exports = router;
