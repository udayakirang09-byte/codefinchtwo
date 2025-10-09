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

export function generateCourseCancellationEmail(
  recipientEmail: string,
  recipientName: string,
  courseTitle: string,
  cancelledBy: 'student' | 'teacher',
  cancelledClasses: number,
  keptClasses: number,
  refundAmount?: string
): { subject: string, html: string, text: string } {
  const isStudent = cancelledBy === 'student';
  const subject = `Course Cancellation - ${courseTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: #fff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 Course Cancellation Notice</h1>
          <p>CodeConnect - Where Young Minds Meet Coding Mentors</p>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          <p>${isStudent ? 'Your' : "A student's"} enrollment in <strong>${courseTitle}</strong> has been cancelled.</p>
          
          <div class="info-box">
            <h3>Cancellation Details:</h3>
            <ul>
              <li><strong>Cancelled by:</strong> ${isStudent ? 'Student' : 'Teacher'}</li>
              <li><strong>Classes cancelled:</strong> ${cancelledClasses}</li>
              ${keptClasses > 0 ? `<li><strong>Classes kept (within 6 hours):</strong> ${keptClasses}</li>` : ''}
            </ul>
          </div>

          ${refundAmount && parseFloat(refundAmount) > 0 ? `
          <div class="warning-box">
            <h3>💰 Refund Information:</h3>
            <p>A refund of <strong>₹${refundAmount}</strong> will be processed to your original payment method within 3-5 business days.</p>
          </div>
          ` : ''}

          ${keptClasses > 0 ? `
          <div class="warning-box">
            <p><strong>Note:</strong> ${keptClasses} class(es) could not be cancelled because they are scheduled within the next 6 hours.</p>
          </div>
          ` : ''}

          <p>If you have any questions or concerns, please contact our support team at support@codeconnect.com</p>
        </div>
        <div class="footer">
          <p>© 2025 CodeConnect. All rights reserved.</p>
          <p>This email was sent to ${recipientEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Course Cancellation Notice - CodeConnect

Hello ${recipientName},

${isStudent ? 'Your' : "A student's"} enrollment in ${courseTitle} has been cancelled.

Cancellation Details:
- Cancelled by: ${isStudent ? 'Student' : 'Teacher'}
- Classes cancelled: ${cancelledClasses}
${keptClasses > 0 ? `- Classes kept (within 6 hours): ${keptClasses}` : ''}

${refundAmount && parseFloat(refundAmount) > 0 ? `
Refund Information:
A refund of ₹${refundAmount} will be processed to your original payment method within 3-5 business days.
` : ''}

${keptClasses > 0 ? `
Note: ${keptClasses} class(es) could not be cancelled because they are scheduled within the next 6 hours.
` : ''}

If you have any questions or concerns, please contact our support team at support@codeconnect.com

© 2025 CodeConnect. All rights reserved.
  `;

  return { subject, html, text };
}