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
    return false;
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
  recipientRole: 'student' | 'mentor',
  courseTitle: string,
  cancelledBy: 'student' | 'mentor',
  cancelledClasses: number,
  keptClasses: number,
  refundAmount?: string
): { subject: string, html: string, text: string } {
  const subject = `Course Cancellation - ${courseTitle}`;
  
  // Determine message based on recipient role and who cancelled
  let mainMessage: string;
  if (recipientRole === 'student') {
    mainMessage = cancelledBy === 'student' 
      ? 'You have cancelled your enrollment in'
      : 'Your teacher has cancelled the course';
  } else {
    mainMessage = cancelledBy === 'student'
      ? 'A student has cancelled their enrollment in'
      : 'You have cancelled the course';
  }
  
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
          <p>${mainMessage} <strong>${courseTitle}</strong>.</p>
          
          <div class="info-box">
            <h3>Cancellation Details:</h3>
            <ul>
              <li><strong>Cancelled by:</strong> ${cancelledBy === 'student' ? 'Student' : 'Teacher'}</li>
              <li><strong>Classes cancelled:</strong> ${cancelledClasses}</li>
              ${keptClasses > 0 ? `<li><strong>Classes kept (within 6 hours):</strong> ${keptClasses}</li>` : ''}
            </ul>
          </div>

          ${refundAmount && parseFloat(refundAmount) > 0 ? `
          <div class="warning-box">
            <h3>💰 Refund Information:</h3>
            <p>A refund of <strong>₹${refundAmount}</strong> will be initiated within 48 hours and processed to your original payment method within 3-5 business days thereafter.</p>
            <p><strong>Note:</strong> Only classes cancelled at least 48 hours before their scheduled time are eligible for refund.</p>
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

${mainMessage} ${courseTitle}.

Cancellation Details:
- Cancelled by: ${cancelledBy === 'student' ? 'Student' : 'Teacher'}
- Classes cancelled: ${cancelledClasses}
${keptClasses > 0 ? `- Classes kept (within 6 hours): ${keptClasses}` : ''}

${refundAmount && parseFloat(refundAmount) > 0 ? `
Refund Information:
A refund of ₹${refundAmount} will be initiated within 48 hours and processed to your original payment method within 3-5 business days thereafter.

Note: Only classes cancelled at least 48 hours before their scheduled time are eligible for refund.
` : ''}

${keptClasses > 0 ? `
Note: ${keptClasses} class(es) could not be cancelled because they are scheduled within the next 6 hours.
` : ''}

If you have any questions or concerns, please contact our support team at support@codeconnect.com

© 2025 CodeConnect. All rights reserved.
  `;

  return { subject, html, text };
}

export function generateClassDeletionEmail(
  recipientEmail: string,
  recipientName: string,
  recipientRole: 'student' | 'mentor',
  classDate: string,
  mentorName?: string,
  refundAmount?: string
): { subject: string, html: string, text: string } {
  const subject = `Class Deleted - ${classDate}`;
  
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
          <h1>🗑️ Class Deleted</h1>
          <p>CodeConnect - Where Young Minds Meet Coding Mentors</p>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          <p>${recipientRole === 'mentor' ? 'You have' : 'Your teacher has'} deleted a scheduled class.</p>
          
          <div class="info-box">
            <h3>Deleted Class Details:</h3>
            <ul>
              <li><strong>Date & Time:</strong> ${classDate}</li>
              ${mentorName ? `<li><strong>Teacher:</strong> ${mentorName}</li>` : ''}
            </ul>
          </div>

          ${refundAmount && parseFloat(refundAmount) > 0 ? `
          <div class="warning-box">
            <h3>💰 Refund Information:</h3>
            <p>A refund of <strong>₹${refundAmount}</strong> will be initiated within 48 hours and processed to your original payment method within 3-5 business days thereafter.</p>
            <p>**Important:</strong> The refund will be initiated only for classes deleted at least 48 hours before the scheduled time.</p>
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
Class Deleted - CodeConnect

Hello ${recipientName},

${recipientRole === 'mentor' ? 'You have' : 'Your teacher has'} deleted a scheduled class.

Deleted Class Details:
- Date & Time: ${classDate}
${mentorName ? `- Teacher: ${mentorName}` : ''}

${refundAmount && parseFloat(refundAmount) > 0 ? `
Refund Information:
A refund of ₹${refundAmount} will be initiated within 48 hours and processed to your original payment method within 3-5 business days thereafter.

Important: The refund will be initiated only for classes deleted at least 48 hours before the scheduled time.
` : ''}

If you have any questions or concerns, please contact our support team at support@codeconnect.com

© 2025 CodeConnect. All rights reserved.
  `;

  return { subject, html, text };
}

export function generateAbusiveLanguageAlertEmail(
  adminEmail: string,
  incident: {
    userName: string;
    userRole: string;
    messageText: string;
    detectedWords: string[];
    severity: string;
    bookingId: string;
    detectedAt: Date;
  }
): { subject: string, html: string, text: string } {
  const subject = `🚨 Abusive Language Alert - ${incident.severity.toUpperCase()} Severity`;
  
  const severityColor = incident.severity === 'high' ? '#ef4444' : 
                       incident.severity === 'medium' ? '#f97316' : '#eab308';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fff; border-left: 4px solid ${severityColor}; padding: 15px; margin: 20px 0; }
        .severity-badge { display: inline-block; padding: 5px 15px; background: ${severityColor}; color: white; border-radius: 4px; font-weight: bold; }
        .word-badge { display: inline-block; padding: 3px 10px; background: #fca5a5; color: #7f1d1d; border-radius: 4px; margin: 2px; font-family: monospace; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Abusive Language Detected</h1>
          <p>CodeConnect Admin Alert System</p>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>An abusive language incident has been detected in a video session chat.</p>
          
          <div class="alert-box">
            <h3>Incident Details:</h3>
            <ul>
              <li><strong>User:</strong> ${incident.userName} (${incident.userRole})</li>
              <li><strong>Severity:</strong> <span class="severity-badge">${incident.severity.toUpperCase()}</span></li>
              <li><strong>Time:</strong> ${incident.detectedAt.toLocaleString()}</li>
              <li><strong>Booking ID:</strong> ${incident.bookingId}</li>
            </ul>
          </div>

          <div class="alert-box">
            <h3>Message:</h3>
            <p style="background: #fee; padding: 10px; border-radius: 4px; font-style: italic;">${incident.messageText}</p>
          </div>

          <div class="alert-box">
            <h3>Detected Abusive Words:</h3>
            <p>${incident.detectedWords.map(word => `<span class="word-badge">${word}</span>`).join(' ')}</p>
          </div>

          <p><strong>Action Required:</strong> Please review this incident and take appropriate action if necessary. You can view all incidents in the admin dashboard.</p>
          <p><a href="${process.env.REPLIT_DEV_DOMAIN || 'https://codeconnect.com'}/admin/abusive-incidents" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Incidents Dashboard</a></p>
        </div>
        <div class="footer">
          <p>© 2025 CodeConnect. All rights reserved.</p>
          <p>This alert was sent to ${adminEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🚨 Abusive Language Alert - CodeConnect

An abusive language incident has been detected in a video session chat.

Incident Details:
- User: ${incident.userName} (${incident.userRole})
- Severity: ${incident.severity.toUpperCase()}
- Time: ${incident.detectedAt.toLocaleString()}
- Booking ID: ${incident.bookingId}

Message:
"${incident.messageText}"

Detected Abusive Words: ${incident.detectedWords.join(', ')}

Action Required: Please review this incident and take appropriate action if necessary.
View all incidents at: ${process.env.REPLIT_DEV_DOMAIN || 'https://codeconnect.com'}/admin/abusive-incidents

© 2025 CodeConnect. All rights reserved.
  `;

  return { subject, html, text };
}