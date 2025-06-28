const prisma = require('../middlewares/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['ADMIN', 'DOCTOR', 'NURSE'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    const createdAt_thai = new Date(user.createdAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const updatedAt_thai = new Date(user.updatedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    res.status(201).json({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt, createdAt_thai, updatedAt_thai });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Could not create user' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('loginUser called:', { email, password: '***' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const createdAt_thai = new Date(user.createdAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      const updatedAt_thai = new Date(user.updatedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      console.log('user from db:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: createdAt_thai,
        updatedAt: updatedAt_thai
      });
    } else {
      console.log('user from db: null');
    }
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('isPasswordValid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password not valid for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const createdAt_thai = new Date(user.createdAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const updatedAt_thai = new Date(user.updatedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt, createdAt_thai, updatedAt_thai } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}; 