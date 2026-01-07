import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Vérification de la connexion à la base de données...\n');

  try {
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à PostgreSQL réussie !');

    // Vérifier les tables
    const userCount = await prisma.user.count();
    const accountCount = await prisma.bankAccount.count();
    const securityCount = await prisma.security.count();

    console.log('\n📊 État de la base de données :');
    console.log(`   - Utilisateurs : ${userCount}`);
    console.log(`   - Comptes bancaires : ${accountCount}`);
    console.log(`   - Actions : ${securityCount}`);

    if (userCount === 0) {
      console.log('\n⚠️  Aucun utilisateur trouvé. Vous devrez créer un compte via POST /auth/register');
    }

    console.log('\n✅ Base de données opérationnelle !');
  } catch (error) {
    console.error('\n❌ Erreur de connexion à la base de données :');
    console.error(error.message);
    console.error('\n💡 Vérifications à faire :');
    console.error('   1. PostgreSQL est-il démarré ?');
    console.error('   2. Les credentials dans .env sont-ils corrects ?');
    console.error('   3. La base de données "avenir_bank" existe-t-elle ?');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
