import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCampusImages() {
    console.log('🔄 Updating campus images...');

    // Update Delhi NCR
    await prisma.campus.update({
        where: { slug: 'delhi-ncr' },
        data: { imageUrl: '/nst-delhi.png' }
    });
    console.log('✅ Updated Delhi NCR image');

    // Update Pune
    await prisma.campus.update({
        where: { slug: 'pune' },
        data: { imageUrl: '/nst-pune.png' }
    });
    console.log('✅ Updated Pune image');

    // Update Bangalore
    await prisma.campus.update({
        where: { slug: 'bangalore' },
        data: { imageUrl: '/nst-bangalore.png' }
    });
    console.log('✅ Updated Bangalore image');

    console.log('\n✨ All campus images updated successfully!');
}

updateCampusImages()
    .catch((e) => {
        console.error('❌ Update failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
