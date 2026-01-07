/**
 * Migration Script: Student to Freelancer Role
 * 
 * This script updates all existing users with 'student' role to 'freelancer' role
 * Run this script ONCE after deploying the transformation changes
 * 
 * Usage: node scripts/migrate-student-to-freelancer.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

const migrateStudentToFreelancer = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all users with 'student' role
        const studentsCount = await User.countDocuments({ role: 'student' });
        console.log(`📊 Found ${studentsCount} users with 'student' role`);

        if (studentsCount === 0) {
            console.log('✅ No migration needed - no students found');
            process.exit(0);
        }

        // Update all 'student' roles to 'freelancer'
        const result = await User.updateMany(
            { role: 'student' },
            { $set: { role: 'freelancer' } }
        );

        console.log(`✅ Migration completed successfully!`);
        console.log(`   - Documents matched: ${result.matchedCount}`);
        console.log(`   - Documents modified: ${result.modifiedCount}`);

        // Verify migration
        const remainingStudents = await User.countDocuments({ role: 'student' });
        const freelancersCount = await User.countDocuments({ role: 'freelancer' });

        console.log('\n📊 Post-migration statistics:');
        console.log(`   - Remaining students: ${remainingStudents}`);
        console.log(`   - Total freelancers: ${freelancersCount}`);
        console.log(`   - Total recruiters: ${await User.countDocuments({ role: 'recruiter' })}`);

        if (remainingStudents === 0) {
            console.log('\n✅ Migration verified - all students converted to freelancers');
        } else {
            console.log('\n⚠️  Warning: Some students still exist in database');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

// Run migration
console.log('🚀 Starting migration: Student → Freelancer\n');
migrateStudentToFreelancer();