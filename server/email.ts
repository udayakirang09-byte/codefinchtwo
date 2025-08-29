import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️ SendGrid not configured - email features disabled');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`📧 Email simulation: ${params.subject} to ${params.to}`);
    return true; // Simulate success for development
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from || 'noreply@codeconnect.com',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`📧 Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('📧 SendGrid email error:', error);
    console.log(`📧 Falling back to email simulation: ${params.subject} to ${params.to}`);
    // Fall back to simulation mode for demo purposes
    return true;
  }
}

export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateResetEmail(email: string, resetCode: string): { subject: string, html: string, text: string } {
  const subject = 'Password Reset Code - CodeConnect';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .reset-code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Password Reset Request</h1>
          <p>CodeConnect - Where Young Minds Meet Coding Mentors</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your CodeConnect account (${email}).</p>
          <p>Please use this 6-digit code to reset your password:</p>
          <div class="reset-code">${resetCode}</div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This code will expire in 15 minutes</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Never share this code with anyone</li>
          </ul>
          <p>Need help? Contact our support team at support@codeconnect.com</p>
        </div>
        <div class="footer">
          <p>© 2025 CodeConnect. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Code - CodeConnect

Hello,

We received a request to reset your password for your CodeConnect account (${email}).

Your 6-digit reset code is: ${resetCode}

Important:
- This code will expire in 15 minutes
- If you didn't request this reset, please ignore this email
- Never share this code with anyone

Need help? Contact our support team at support@codeconnect.com

© 2025 CodeConnect. All rights reserved.
  `;

  return { subject, html, text };
}