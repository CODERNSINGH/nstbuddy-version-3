import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database for NST Buddy 2.0...');

    // Create campuses
    const campuses = [
        {
            name: 'Delhi NCR',
            slug: 'delhi-ncr',
            description: 'Newton School of Technology - Delhi NCR Campus',
            imageUrl: '/nst-delhi.png',
            isActive: true
        },
        {
            name: 'Pune',
            slug: 'pune',
            description: 'Newton School of Technology - Pune Campus',
            imageUrl: '/nst-pune.png',
            isActive: true
        },
        {
            name: 'Bangalore',
            slug: 'bangalore',
            description: 'Newton School of Technology - Bangalore Campus',
            imageUrl: '/nst-bangalore.png',
            isActive: true
        }
    ];

    console.log('📍 Creating campuses...');
    for (const campus of campuses) {
        const created = await prisma.campus.upsert({
            where: { slug: campus.slug },
            update: campus,
            create: campus
        });
        console.log(`  ✅ ${created.name} (${created.slug})`);
    }

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log(`  - Campuses: ${campuses.length}`);
    console.log(`  - Each campus supports 8 semesters (1-8)`);
    console.log(`  - Ready for contributions!`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
