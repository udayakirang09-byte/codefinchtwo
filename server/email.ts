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
      from: params.from || 'noreply@techlearnorbit.com',
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

export function generateEmailOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateEmailOTPVerificationEmail(email: string, otp: string, purpose: string = 'signup'): { subject: string, html: string, text: string } {
  const purposeText = purpose === 'signup' ? 'Sign Up' : purpose === 'login' ? 'Login' : 'Account Verification';
  const subject = `${otp} is your TechLearnOrbit verification code`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-code { background: #fff; border: 3px solid #667eea; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 8px; font-family: monospace; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .info-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Email Verification</h1>
          <p>TechLearnOrbit - Where Learners Meet Expert Mentors</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your verification code for <strong>${purposeText}</strong> is:</p>
          <div class="otp-code">${otp}</div>
          <div class="info-box">
            <p><strong>⚠️ Important Security Information:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This code will expire in <strong>10 minutes</strong></li>
              <li>This is part 1 of 2-step verification (Next: Authenticator App)</li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          <p>After verifying your email, you'll be prompted to set up your Authenticator App (Microsoft Authenticator or Google Authenticator) for enhanced security.</p>
          <p style="margin-top: 30px;">Need help? Contact our support team at support@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Email Verification Code - TechLearnOrbit

Hello,

Your verification code for ${purposeText} is: ${otp}

Important Security Information:
- This code will expire in 10 minutes
- This is part 1 of 2-step verification (Next: Authenticator App)
- Never share this code with anyone
- If you didn't request this code, please ignore this email

After verifying your email, you'll be prompted to set up your Authenticator App (Microsoft Authenticator or Google Authenticator) for enhanced security.

Need help? Contact our support team at support@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
  `;

  return { subject, html, text };
}

export function generateResetEmail(email: string, resetCode: string): { subject: string, html: string, text: string } {
  const subject = 'Password Reset Code - TechLearnOrbit';
  
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
          <p>TechLearnOrbit - Where Learners Meet Expert Mentors</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your TechLearnOrbit account (${email}).</p>
          <p>Please use this 6-digit code to reset your password:</p>
          <div class="reset-code">${resetCode}</div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This code will expire in 15 minutes</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Never share this code with anyone</li>
          </ul>
          <p>Need help? Contact our support team at support@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Code - TechLearnOrbit

Hello,

We received a request to reset your password for your TechLearnOrbit account (${email}).

Your 6-digit reset code is: ${resetCode}

Important:
- This code will expire in 15 minutes
- If you didn't request this reset, please ignore this email
- Never share this code with anyone

Need help? Contact our support team at support@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
  `;

  return { subject, html, text };
}

export function generateStudentWelcomeEmail(email: string, firstName: string): { subject: string, html: string, text: string } {
  const subject = 'Welcome to TechLearnOrbit - Your Learning Journey Begins!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to TechLearnOrbit!</h1>
          <p>Where Learners Meet Expert Mentors</p>
        </div>
        <div class="content">
          <p>Hello ${firstName}!</p>
          <p>Thank you for registering with TechLearnOrbit. Your account has been successfully created, and you can now explore our platform and start your learning journey!</p>
          
          <div class="info-box">
            <h3>Get Started:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Browse expert teachers across different subjects</li>
              <li>Book personalized 1-on-1 sessions</li>
              <li>Track your learning progress</li>
              <li>Connect with mentors who match your learning goals</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="https://techlearnorbit.com/login" class="cta-button">Login to Your Dashboard</a>
          </div>
          
          <p style="margin-top: 30px;">Have questions? Our support team is here to help at support@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to TechLearnOrbit!

Hello ${firstName}!

Thank you for registering with TechLearnOrbit. Your account has been successfully created, and you can now explore our platform and start your learning journey!

Get Started:
- Browse expert teachers across different subjects
- Book personalized 1-on-1 sessions
- Track your learning progress
- Connect with mentors who match your learning goals

Login at: https://techlearnorbit.com/login

Have questions? Our support team is here to help at support@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
This email was sent to ${email}
  `;

  return { subject, html, text };
}

export function generateTeacherWelcomeEmail(email: string): { subject: string, html: string, text: string } {
  const subject = 'Welcome to TechLearnOrbit - Your Account is Approved!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to TechLearnOrbit!</h1>
          <p>Where Learners Meet Expert Mentors</p>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p>Great news! Your teacher account has been approved and you can now login to TechLearnOrbit.</p>
          
          <div class="info-box">
            <h3>Next Steps:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Login to your teacher dashboard</li>
              <li>Complete your profile if you haven't already</li>
              <li>Set your available time slots for classes</li>
              <li>Start connecting with students!</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="https://techlearnorbit.com/login" class="cta-button">Login to Your Dashboard</a>
          </div>
          
          <p style="margin-top: 30px;">Need help getting started? Check out our teacher resources or contact our support team at support@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to TechLearnOrbit!

Hello!

Great news! Your teacher account has been approved and you can now login to TechLearnOrbit.

Next Steps:
- Login to your teacher dashboard
- Complete your profile if you haven't already
- Set your available time slots for classes
- Start connecting with students!

Login at: https://techlearnorbit.com/login

Need help getting started? Check out our teacher resources or contact our support team at support@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
This email was sent to ${email}
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
          <p>TechLearnOrbit - Where Learners Meet Expert Mentors</p>
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

          <p>If you have any questions or concerns, please contact our support team at support@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
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

If you have any questions or concerns, please contact our support team at support@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
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
          <p>TechLearnOrbit - Where Learners Meet Expert Mentors</p>
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

          <p>If you have any questions or concerns, please contact our support team at support@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
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

If you have any questions or concerns, please contact our support team at support@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
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
          <p><a href="${process.env.REPLIT_DEV_DOMAIN || 'https://techlearnorbit.com'}/admin/abusive-incidents" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Incidents Dashboard</a></p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
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
View all incidents at: ${process.env.REPLIT_DEV_DOMAIN || 'https://techlearnorbit.com'}/admin/abusive-incidents

© 2025 TechLearnOrbit. All rights reserved.
  `;

  return { subject, html, text };
}

export function generateTeacherRestrictionEmail(
  teacherEmail: string,
  teacherName: string,
  restrictionType: 'warned' | 'suspended' | 'banned',
  violationCount: number,
  restrictionReason?: string
): { subject: string, html: string, text: string } {
  const restrictionTitles = {
    warned: '⚠️ Account Warning',
    suspended: '🚫 Account Suspended',
    banned: '❌ Account Permanently Banned'
  };
  
  const restrictionColors = {
    warned: '#ffc107',
    suspended: '#f97316',
    banned: '#ef4444'
  };

  const restrictionMessages = {
    warned: {
      title: 'Your Account Has Been Warned',
      description: 'Our AI moderation system has detected violations of our community guidelines during your teaching sessions.',
      impact: 'You can continue using your account, but please be aware that additional violations may lead to suspension or permanent ban.',
      nextThreshold: 5,
      nextAction: 'account suspension'
    },
    suspended: {
      title: 'Your Account Has Been Suspended',
      description: 'Due to repeated violations of our community guidelines, your teaching account has been temporarily suspended.',
      impact: 'You are unable to conduct sessions or access student materials. This suspension will be reviewed by our moderation team.',
      nextThreshold: 10,
      nextAction: 'permanent ban'
    },
    banned: {
      title: 'Your Account Has Been Permanently Banned',
      description: 'Your teaching account has been permanently banned due to severe or repeated violations of our community guidelines.',
      impact: 'You will no longer be able to access the platform, conduct sessions, or interact with students.',
      nextThreshold: null,
      nextAction: null
    }
  };

  const info = restrictionMessages[restrictionType];
  const subject = `${restrictionTitles[restrictionType]} - CodeConnect`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${restrictionColors[restrictionType]} 0%, ${restrictionColors[restrictionType]}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fff; border-left: 4px solid ${restrictionColors[restrictionType]}; padding: 15px; margin: 20px 0; }
        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .info-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${restrictionTitles[restrictionType]}</h1>
          <p>CodeConnect Moderation Team</p>
        </div>
        <div class="content">
          <p>Dear ${teacherName},</p>
          <p>${info.description}</p>
          
          <div class="alert-box">
            <h3>Restriction Details:</h3>
            <ul>
              <li><strong>Status:</strong> ${restrictionType.charAt(0).toUpperCase() + restrictionType.slice(1)}</li>
              <li><strong>Total Violations:</strong> ${violationCount}</li>
              ${restrictionReason ? `<li><strong>Reason:</strong> ${restrictionReason}</li>` : ''}
            </ul>
          </div>

          <div class="warning-box">
            <h3>Impact on Your Account:</h3>
            <p>${info.impact}</p>
          </div>

          ${info.nextThreshold ? `
          <div class="info-box">
            <h3>⚠️ Important Warning:</h3>
            <p>If your violation count reaches <strong>${info.nextThreshold}</strong>, your account will be subject to <strong>${info.nextAction}</strong>.</p>
            <p>Please review our community guidelines and ensure all future sessions comply with our safety standards.</p>
          </div>
          ` : ''}

          ${restrictionType !== 'banned' ? `
          <div class="info-box">
            <h3>📋 What You Can Do:</h3>
            <ul>
              <li>Review your moderation status in the teacher dashboard</li>
              <li>View detailed violation history and AI moderation logs</li>
              ${restrictionType === 'suspended' ? '<li>Submit an appeal if you believe this decision was made in error</li>' : ''}
              <li>Read our community guidelines and safety policies</li>
            </ul>
            <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://techlearnorbit.com'}/teacher/moderation-status" class="button">View Moderation Status</a>
          </div>
          ` : ''}

          <p style="margin-top: 30px;">If you have questions or believe this decision was made in error, please contact our moderation team at moderation@techlearnorbit.com</p>
        </div>
        <div class="footer">
          <p>© 2025 TechLearnOrbit. All rights reserved.</p>
          <p>This email was sent to ${teacherEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${restrictionTitles[restrictionType]} - CodeConnect

Dear ${teacherName},

${info.description}

Restriction Details:
- Status: ${restrictionType.charAt(0).toUpperCase() + restrictionType.slice(1)}
- Total Violations: ${violationCount}
${restrictionReason ? `- Reason: ${restrictionReason}` : ''}

Impact on Your Account:
${info.impact}

${info.nextThreshold ? `
⚠️ Important Warning:
If your violation count reaches ${info.nextThreshold}, your account will be subject to ${info.nextAction}.
Please review our community guidelines and ensure all future sessions comply with our safety standards.
` : ''}

${restrictionType !== 'banned' ? `
What You Can Do:
- Review your moderation status in the teacher dashboard
- View detailed violation history and AI moderation logs
${restrictionType === 'suspended' ? '- Submit an appeal if you believe this decision was made in error' : ''}
- Read our community guidelines and safety policies

View your moderation status: ${process.env.REPLIT_DEV_DOMAIN || 'https://techlearnorbit.com'}/teacher/moderation-status
` : ''}

If you have questions or believe this decision was made in error, please contact our moderation team at moderation@techlearnorbit.com

© 2025 TechLearnOrbit. All rights reserved.
  `;

  return { subject, html, text };
}