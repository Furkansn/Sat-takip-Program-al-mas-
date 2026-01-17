
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Canlı veritabanı kurulumu başlıyor...');

    // 1. Önce bir şirket oluştur
    const company = await prisma.company.create({
        data: {
            name: 'Demo Şirketi',
            isActive: true,
        },
    });
    console.log(`✅ Şirket oluşturuldu: ${company.name}`);

    // 2. Şifreleri şifrele
    const passwordAdmin = await hash('admin123', 12);
    const passwordUser = await hash('user123', 12);

    // 3. Admin Kullanıcısını oluştur
    const admin = await prisma.user.upsert({
        where: { email: 'admin@st.com' },
        update: {},
        create: {
            email: 'admin@st.com',
            fullName: 'Süper Admin',
            password: passwordAdmin,
            role: 'super_admin',
            companyId: company.id,
            isActive: true,
        },
    });
    console.log(`✅ Admin kullanıcısı oluşturuldu: ${admin.email} (Şifre: admin123)`);

    // 4. Normal Kullanıcıyı oluştur
    const user = await prisma.user.upsert({
        where: { email: 'user@st.com' },
        update: {},
        create: {
            email: 'user@st.com',
            fullName: 'Standart Kullanıcı',
            password: passwordUser,
            role: 'user',
            companyId: company.id,
            isActive: true,
        },
    });
    console.log(`✅ Normal kullanıcı oluşturuldu: ${user.email} (Şifre: user123)`);

    console.log('🚀 Kurulum tamamlandı! Şimdi siteye giriş yapabilirsiniz.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
