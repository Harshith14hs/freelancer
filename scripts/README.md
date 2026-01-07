# Database Migration Scripts

## Overview
This folder contains database migration scripts for the hiring platform.

---

## Available Scripts

### 1. `migrate-student-to-freelancer.js`

**Purpose:** Migrates all existing users with 'student' role to 'freelancer' role.

**When to use:** 
- After deploying the student → freelancer transformation
- When you have existing data in the database with 'student' role
- **Run this ONCE only**

**Prerequisites:**
- MongoDB connection string in `.env` file
- Backup your database before running (recommended)

**How to run:**

```bash
# Navigate to backend folder
cd backend

# Run the migration script
node scripts/migrate-student-to-freelancer.js
```

**Expected Output:**
```
🚀 Starting migration: Student → Freelancer

✅ Connected to MongoDB
📊 Found 15 users with 'student' role
✅ Migration completed successfully!
   - Documents matched: 15
   - Documents modified: 15

📊 Post-migration statistics:
   - Remaining students: 0
   - Total freelancers: 15
   - Total recruiters: 8

✅ Migration verified - all students converted to freelancers

🔌 Database connection closed
```

**What it does:**
1. Connects to your MongoDB database
2. Finds all users with `role: 'student'`
3. Updates them to `role: 'freelancer'`
4. Verifies the migration was successful
5. Displays statistics

**Safety Features:**
- Shows count before migration
- Verifies count after migration
- Displays detailed statistics
- Graceful error handling

---

## Before Running Migrations

### 1. Backup Your Database

**Using MongoDB Compass:**
- Export your collections to JSON/CSV

**Using mongodump:**
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

**Using MongoDB Atlas:**
- Use the built-in backup feature

### 2. Test in Development First

```bash
# Use a development/test database first
# Update .env to point to test database
MONGO_URI=mongodb://localhost:27017/hiring_test

# Run migration
node scripts/migrate-student-to-freelancer.js

# Verify results
# Then run on production
```

### 3. Verify Environment Variables

Ensure your `.env` file has:
```
MONGO_URI=your_mongodb_connection_string
```

---

## After Running Migrations

### 1. Verify Data

**Check user roles:**
```javascript
// In MongoDB shell or Compass
db.users.find({ role: 'student' }).count()  // Should be 0
db.users.find({ role: 'freelancer' }).count()  // Should show migrated count
```

**Check applications:**
```javascript
// Verify applications still reference correct users
db.applications.find().populate('applicant')
```

**Check jobs:**
```javascript
// Verify jobs still reference correct users
db.jobs.find().populate('postedBy')
```

### 2. Test Application

- [ ] Login as migrated freelancer
- [ ] Verify profile loads correctly
- [ ] Verify posted jobs are visible
- [ ] Verify applications work
- [ ] Test all freelancer features

### 3. Monitor for Issues

- Check application logs
- Monitor error reports
- Verify user feedback

---

## Rollback (If Needed)

If you need to rollback the migration:

### Option 1: Restore from Backup
```bash
# Using mongorestore
mongorestore --uri="your_mongodb_uri" ./backup
```

### Option 2: Manual Rollback Script

Create `rollback-freelancer-to-student.js`:
```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

dotenv.config();

const rollback = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    const result = await User.updateMany(
        { role: 'freelancer' },
        { $set: { role: 'student' } }
    );
    
    console.log(`Rolled back ${result.modifiedCount} users`);
    await mongoose.connection.close();
};

rollback();
```

**⚠️ Warning:** Only rollback if absolutely necessary and you understand the implications.

---

## Creating New Migration Scripts

### Template:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrationName = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Your migration logic here
        
        console.log('✅ Migration completed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

migrationName();
```

### Best Practices:

1. **Always backup first**
2. **Test in development**
3. **Log everything**
4. **Verify results**
5. **Handle errors gracefully**
6. **Document the migration**
7. **Make it idempotent** (safe to run multiple times)

---

## Troubleshooting

### Error: "Cannot connect to MongoDB"
- Check your `MONGO_URI` in `.env`
- Verify network connection
- Check MongoDB server is running

### Error: "Module not found"
- Ensure you're in the `backend` folder
- Check `package.json` has `"type": "module"`
- Verify all imports are correct

### Migration runs but no changes
- Check if users with 'student' role exist
- Verify the query matches your data
- Check MongoDB permissions

### Partial migration
- Check error logs
- Verify database connection stability
- May need to re-run (script is idempotent)

---

## Support

For issues or questions:
1. Check `TRANSFORMATION_SUMMARY.md` in project root
2. Review `DEVELOPER_GUIDE.md` for platform details
3. Check application logs
4. Review MongoDB logs

---

**Remember:** Always backup before running any migration! 🔒