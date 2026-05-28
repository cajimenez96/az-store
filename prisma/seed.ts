import { prisma } from '@/db/prisma';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('\n🌱 Seeding QA database with test users...\n');

  try {
    // Define test users for each role
    const testUsers = [
      {
        email: 'admin@qa.example.com',
        password: 'Admin@QA2026',
        name: 'Admin User',
        role: 'admin' as const,
      },
      {
        email: 'seller@qa.example.com',
        password: 'Seller@QA2026',
        name: 'Seller User',
        role: 'seller' as const,
      },
      {
        email: 'user@qa.example.com',
        password: 'User@QA2026',
        name: 'Regular User',
        role: 'user' as const,
      },
    ];

    // Create users
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
        },
        create: {
          id: uuidv4(),
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
        },
      });

      console.log(`✓ ${userData.role.toUpperCase()} user created: ${userData.email}`);
    }

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📝 Test Users:');
    console.log('─────────────────────────────────────────────');
    testUsers.forEach((user) => {
      console.log(`Role: ${user.role.toUpperCase()}`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
