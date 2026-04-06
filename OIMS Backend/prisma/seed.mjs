import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default Admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { employeeNo: 'ADMIN001' },
    update: {},
    create: {
      employeeNo: 'ADMIN001',
      nicNo: '000000000V',
      email: 'admin@office.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      dateJoined: new Date(),
      employeeType: 'Permanent',
      department: 'Computer',
      jobCategory: 'Technical',
      jobTitle: 'Technical_Officer',
      qualification: 'Degree',
      systemRole: 'Admin'
    },
  });

  console.log('Default Admin created or already exists!');
  console.log('--- LOGIN CREDENTIALS ---');
  console.log('Employee No / Email: ADMIN001 (or admin@office.com)');
  console.log('Password: admin123');
  console.log('---------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
