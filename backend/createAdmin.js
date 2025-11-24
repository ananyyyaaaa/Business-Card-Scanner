import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2] || 'admin@bizcard.com';
    const password = process.argv[3] || 'admin123';

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      console.log('Admin already exists with this email');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      email,
      password: hashedPassword,
    });

    console.log('Admin created successfully:');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

