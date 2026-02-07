const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT_EMAIL = 'tkthoussam@gmail.com'

async function sendTest() {
  console.log('Using API Key:', process.env.RESEND_API_KEY);
  const key = process.env.RESEND_API_KEY || '';
  console.log('Key length:', key.length);
  console.log('Key preview:', key.substring(0, 5) + '...');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ Error: RESEND_API_KEY is missing in .env');
    process.exit(1);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Smart Port <onboarding@resend.dev>',
      to: [RECIPIENT_EMAIL],
      subject: 'Test Email from Smart Port APCS',
      html: `
                <h1>📧 Test de Notification</h1>
                <p>Ceci est un test d'intégration pour le service <strong>Resend</strong>.</p>
                <p>Si vous recevez cet email, cela signifie que le backend est correctement configuré pour envoyer des notifications aux chauffeurs.</p>
                <br/>
                <p><strong>Détails du test :</strong></p>
                <ul>
                    <li><strong>Service :</strong> Resend</li>
                    <li><strong>Statut :</strong> Opérationnel</li>
                    <li><strong>Horodatage :</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <br/>
                <p>Cordialement,<br/>L'équipe Smart Port</p>
            `,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('ID:', data.id);
    }
  } catch (err) {
    console.error('💥 Unexpected Error:', err.message);
  }
}

sendTest();
