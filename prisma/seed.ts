import prisma from '../src/prisma';

async function main() {
  console.log('Seeding database...');

  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@test.com', password_hash: 'password123', role: 'Admin' }
  });

  for (let i = 1; i <= 2; i++) {
    await prisma.user.create({
      data: { name: `Agent ${i}`, email: `agent${i}@test.com`, password_hash: 'password123', role: 'Agent' }
    });
  }

  const cities = ['Austin', 'Miami'];
  const createdProperties = [];

  for (let i = 0; i < 10; i++) {
    const prop = await prisma.property.create({
      data: {
        title: `Property ${i + 1}`,
        address: `${i + 1}00 Main St`,
        city: cities[i % 2],
        price: 300000 + (i * 50000), 
        bedrooms: (i % 4) + 2, 
        status: i % 4 === 0 ? 'Booked' : 'Available', 
      }
    });
    createdProperties.push(prop);
  }

  const statuses = ['New', 'Contacted', 'Visited', 'Booked', 'Lost'] as const;
  const priorities = ['Hot', 'Warm', 'Cold'] as const;
  const leadsData = [];

  for (let i = 0; i < 15; i++) {
    leadsData.push({
      buyer_name: `Buyer ${i + 1}`,
      phone: `555000${i.toString().padStart(4, '0')}`, 
      email: `buyer${i + 1}@test.com`,
      property_id: createdProperties[i % 10].id, 
      status: statuses[i % statuses.length],     
      priority: priorities[i % priorities.length], 
    });
  }

  await prisma.lead.createMany({ data: leadsData });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });