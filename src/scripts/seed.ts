/**
 * PMN ERP Platform - Database Seed Script
 * 
 * Creates the default admin user and sample data.
 * Run with: npx tsx src/scripts/seed.ts
 */

import { db } from '../db';
import { users } from '../db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'admin@pmn.edu.in';
const ADMIN_PASSWORD = 'PMN@Admin123!';
const ADMIN_NAME = 'System Administrator';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Check if admin user exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
    } else {
      // Create admin user
      const passwordHash = await hash(ADMIN_PASSWORD, 12);
      
      await db.insert(users).values({
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        roles: ['admin'],
        permissions: ['*'],
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Admin user created:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log('   ⚠️  Please change the password after first login!\n');
    }

    // Create sample counsellor users
    const sampleUsers = [
      { email: 'counsellor1@pmn.edu.in', name: 'Amit Kumar', role: 'counsellor' },
      { email: 'counsellor2@pmn.edu.in', name: 'Priya Verma', role: 'counsellor' },
      { email: 'manager@pmn.edu.in', name: 'Rajesh Singh', role: 'manager' },
    ];

    for (const userData of sampleUsers) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        const passwordHash = await hash('Password123!', 12);
        
        await db.insert(users).values({
          email: userData.email,
          name: userData.name,
          passwordHash,
          roles: [userData.role],
          permissions: [],
          department: 'CRM',
          isActive: true,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      }
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📝 Default credentials:');
    console.log('   Admin: admin@pmn.edu.in / PMN@Admin123!');
    console.log('   Others: [email] / Password123!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
