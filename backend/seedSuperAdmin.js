
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bizcard');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedSuperAdmin = async () => {
    await connectDB();

    const email = 'admin@gmail.com';
    const password = 'adminbizcard23';
    const name = 'Super Admin';

    try {
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            console.log('Super Admin already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            existingAdmin.password = await bcrypt.hash(password, salt);
            await existingAdmin.save();
            console.log('Super Admin password updated.');
        } else {
            console.log('Creating Super Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await Admin.create({
                name,
                email,
                password: hashedPassword
            });
            console.log('Super Admin created.');
        }
    } catch (error) {
        console.error('Error seeding super admin:', error);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
};

seedSuperAdmin();
