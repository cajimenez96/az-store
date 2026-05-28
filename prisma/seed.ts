import { prisma } from '@/db/prisma';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

async function main() {
  console.log('\n🌱 Seeding test users...\n');

  try {
    for (const userData of testUsers) {
      const hashedPassword = await hash(userData.password, 10);
      await prisma.user.upsert({
        where: { email: userData.email },
        update: { password: hashedPassword },
        create: {
          id: uuidv4(),
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
        },
      });
      console.log(`✓ ${userData.role.toUpperCase()} created: ${userData.email}`);
    }

    console.log('\n✅ Seeding completed!\n');
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
