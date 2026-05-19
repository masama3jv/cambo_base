import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

async function initializeTransporter() {
  // For development, use Ethereal (fake SMTP service)
  // For production, use your actual SMTP settings
  
  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    const info = await transporter!.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@campobase.es',
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    console.log('✓ Email sent:', info.messageId);
    
    // For development, log preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendInvitationEmail(
  toEmail: string,
  teamName: string,
  invitationToken: string,
  inviterName: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const invitationLink = `${frontendUrl}/register?token=${invitationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f1efe8; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #2c2c2a; }
          .content { color: #5f5e5a; line-height: 1.6; }
          .button { 
            display: inline-block; 
            background-color: #d85a30; 
            color: white; 
            padding: 12px 30px; 
            border-radius: 6px; 
            text-decoration: none; 
            margin-top: 20px;
            font-weight: bold;
          }
          .button:hover { background-color: #c04820; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚽ Campo Base</div>
          </div>
          
          <div class="content">
            <p>¡Hola!</p>
            
            <p><strong>${inviterName}</strong> te ha invitado a unirte al equipo <strong>${teamName}</strong> en <strong>Campo Base</strong>.</p>
            
            <p>Campo Base es la plataforma definitiva para gestionar torneos deportivos de forma fácil y eficiente.</p>
            
            <p>Para aceptar la invitación y registrarte, haz clic en el siguiente botón:</p>
            
            <a href="${invitationLink}" class="button">Aceptar Invitación</a>
            
            <p style="margin-top: 30px; font-size: 13px; color: #999;">
              O copia este enlace en tu navegador:<br>
              <code>${invitationLink}</code>
            </p>
            
            <p>Este enlace es válido durante 48 horas.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Campo Base. Todos los derechos reservados.</p>
            <p>Si no esperabas este correo, puedes ignorarlo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `T'han convidat a unir-te al equip ${teamName} - Campo Base`,
    html
  });
}
