
require('dotenv').config();
const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is missing in .env');
    process.exit(1);
}

const resend = new Resend(resendApiKey);

async function testEmail() {
    console.log('📧 Sending test email to ademboukabes1@gmail.com...');
    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'ademboukabes1@gmail.com',
            subject: 'Test Resend from Silence Team 1',
            html: '<h1>It works!</h1><p>This is a test email from the backend.</p>',
        });
        console.log('✅ Email sent successfully:', data);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

testEmail();
