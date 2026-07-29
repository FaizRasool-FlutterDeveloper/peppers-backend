require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin.model');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ email: 'admin@peppers.pk' });
    if (existing) {
      console.log('✅ Admin already exists: admin@peppers.pk');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('Peppers@2024!', 12);
    await Admin.create({
      email:        'admin@peppers.pk',
      passwordHash,
      name:         'Peppers Admin',
      role:         'superadmin',
      isActive:     true,
    });

    console.log('');
    console.log('✅ Admin account created successfully!');
    console.log('   Email:    admin@peppers.pk');
    console.log('   Password: Peppers@2024!');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
