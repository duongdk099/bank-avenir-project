/**
 * Script simple pour tester l'envoi d'emails
 * Lance: npx ts-node test-email-simple.ts
 */

import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';

// Charger les variables d'environnement
dotenv.config();

async function testEmailSending() {
  console.log('\n🔧 TEST DU SERVICE EMAIL - BANQUE AVENIR\n');
  console.log('==========================================\n');

  // Configuration du transporteur
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log(`📧 Configuration:`);
  console.log(`   - SMTP Host: smtp.gmail.com`);
  console.log(`   - SMTP User: ${process.env.SMTP_USER}`);
  console.log(`   - SMTP Pass: ${process.env.SMTP_PASS ? '✅ Configuré' : '❌ Non configuré'}\n`);

  try {
    // Test 1: Vérification de la connexion
    console.log('Test 1: Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP établie avec succès\n');

    // Test 2: Envoi d'un email de test
    console.log('Test 2: Envoi d\'un email de test...');

    const testEmail = process.env.SMTP_USER; // Envoyer à soi-même

    const mailOptions = {
      from: {
        name: 'Banque AVENIR - Test',
        address: process.env.SMTP_USER || 'noreply@avenir-bank.fr',
      },
      to: testEmail,
      subject: '🧪 Test Email Service - Banque AVENIR',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Service Email Opérationnel</h1>
              <p>Banque AVENIR</p>
            </div>
            <div class="content">
              <div class="success">
                <strong>Félicitations !</strong> Le service d'envoi d'emails fonctionne parfaitement.
              </div>

              <h3>📊 Informations du test :</h3>
              <div class="info-box">
                <p><strong>📧 Destinataire :</strong> ${testEmail}</p>
                <p><strong>📅 Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                <p><strong>🔧 Service :</strong> NodeMailer + Gmail SMTP</p>
                <p><strong>⚙️ Configuration :</strong> ${process.env.SMTP_USER}</p>
              </div>

              <h3>✨ Fonctionnalités disponibles :</h3>
              <ul>
                <li>📧 <strong>Confirmation d'inscription</strong> - Envoi automatique lors de l'inscription</li>
                <li>🔐 <strong>Réinitialisation mot de passe</strong> - Lien sécurisé par token</li>
                <li>💰 <strong>Notification changement taux épargne</strong> - Alertes aux clients</li>
                <li>💳 <strong>Approbation de crédit</strong> - Confirmation d'octroi</li>
                <li>📊 <strong>Exécution d'ordres actions</strong> - Notifications de trading</li>
                <li>📢 <strong>Notifications génériques</strong> - Messages personnalisés</li>
              </ul>

              <h3>🎯 Prochaines étapes :</h3>
              <ol>
                <li>Vérifier que vous avez bien reçu cet email</li>
                <li>Vérifier aussi le dossier SPAM si nécessaire</li>
                <li>Le service est maintenant prêt pour l'application</li>
              </ol>

              <div class="info-box" style="border-left-color: #28a745; margin-top: 30px;">
                <p><strong>🚀 Le service email est opérationnel et prêt à l'emploi !</strong></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
TEST EMAIL SERVICE - BANQUE AVENIR

Félicitations ! Le service d'envoi d'emails fonctionne parfaitement.

Informations du test :
- Destinataire : ${testEmail}
- Date : ${new Date().toLocaleString('fr-FR')}
- Service : NodeMailer + Gmail SMTP
- Configuration : ${process.env.SMTP_USER}

Fonctionnalités disponibles :
✓ Confirmation d'inscription
✓ Réinitialisation mot de passe
✓ Notification changement taux épargne
✓ Approbation de crédit
✓ Exécution d'ordres actions
✓ Notifications génériques

Le service email est opérationnel et prêt à l'emploi !
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email envoyé avec succès !');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Destinataire: ${testEmail}\n`);

    // Test 3: Envoi d'un email de confirmation d'inscription
    console.log('Test 3: Envoi d\'un email de confirmation d\'inscription...');

    const confirmationEmail = {
      from: {
        name: 'Banque AVENIR',
        address: process.env.SMTP_USER || 'noreply@avenir-bank.fr',
      },
      to: testEmail,
      subject: '✨ Confirmez votre inscription - Banque AVENIR',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏦 Banque AVENIR</h1>
              <p>Alliance de Valeurs Économiques et Nationales Investies Responsablement</p>
            </div>
            <div class="content">
              <h2>Bienvenue !</h2>
              <p>Merci de vous être inscrit à la Banque AVENIR. Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.</p>

              <p style="text-align: center;">
                <a href="http://localhost:3000/api/auth/confirm/test-token-12345" class="button">
                  Confirmer mon inscription
                </a>
              </p>

              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="background: white; padding: 10px; border-left: 4px solid #667eea; word-break: break-all;">
                http://localhost:3000/api/auth/confirm/test-token-12345
              </p>

              <div class="warning">
                <p><strong>⏱️ Ce lien expire dans 24 heures.</strong></p>
                <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
              </div>

              <p>Cordialement,<br>L'équipe Banque AVENIR</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info2 = await transporter.sendMail(confirmationEmail);
    console.log('✅ Email de confirmation envoyé !');
    console.log(`   Message ID: ${info2.messageId}\n`);

    // Résumé
    console.log('==========================================');
    console.log('✅ TOUS LES TESTS RÉUSSIS !');
    console.log('==========================================\n');
    console.log(`📧 Vérifiez votre boîte mail: ${testEmail}`);
    console.log('   Vous devriez avoir reçu 2 emails :');
    console.log('   1. Email de test général');
    console.log('   2. Email de confirmation d\'inscription\n');
    console.log('💡 Astuces :');
    console.log('   - Vérifiez aussi le dossier SPAM');
    console.log('   - Les emails arrivent généralement en < 5 secondes');
    console.log('   - Templates HTML optimisés pour mobile et desktop\n');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test :\n', error);

    if (error.code === 'EAUTH') {
      console.error('\n🔐 ERREUR D\'AUTHENTIFICATION');
      console.error('   Votre mot de passe Gmail est incorrect.\n');
      console.error('   ⚠️  N\'utilisez PAS votre mot de passe Gmail normal !');
      console.error('   ✅ Utilisez un "App Password" (Mot de passe d\'application)\n');
      console.error('   Comment générer un App Password :');
      console.error('   1. Allez sur https://myaccount.google.com/security');
      console.error('   2. Activez la validation en 2 étapes (obligatoire)');
      console.error('   3. Cherchez "Mots de passe des applications"');
      console.error('   4. Créez un nouveau mot de passe pour "Mail"');
      console.error('   5. Copiez le code à 16 caractères dans SMTP_PASS du .env\n');
    }

    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n🌐 ERREUR DE CONNEXION');
      console.error('   Impossible de se connecter au serveur SMTP Gmail.');
      console.error('   Vérifiez votre connexion Internet.\n');
    }

    process.exit(1);
  }
}

// Exécution
testEmailSending().catch(console.error);
