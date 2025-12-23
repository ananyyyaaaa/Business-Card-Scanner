import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';

dotenv.config();

const resetAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Delete all existing admins
        await Admin.deleteMany({});
        console.log('Existing admins removed.');

        const salt = await bcrypt.genSalt(10);

        // Create Admin
        const adminPassword = await bcrypt.hash('admin123', salt);
        await Admin.create({
            name: 'Admin',
            email: 'admin@bizcard.com',
            password: adminPassword
        });
        console.log('Admin created: admin@bizcard.com / admin123');

        // Create Super Admin
        const superAdminPassword = await bcrypt.hash('superadmin123', salt);
        await Admin.create({
            name: 'Super Admin',
            email: 'superadmin@bizcard.com',
            password: superAdminPassword
        });
        console.log('Super Admin created: superadmin@bizcard.com / superadmin123');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmins();
