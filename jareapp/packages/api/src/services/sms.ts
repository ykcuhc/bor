import twilio from 'twilio';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error('TWILIO_PHONE_NUMBER is not configured');
  }

  // In development, just log the OTP instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV SMS] To: ${phone}, OTP: ${code}`);
    return;
  }

  const client = getClient();
  const messageBody = `Your JareApp verification code is: ${code}. Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes. Do not share this code.`;

  await client.messages.create({
    body: messageBody,
    from: fromNumber,
    to: phone,
  });
}

export function generateOtpCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export async function sendWelcomeSms(phone: string, firstName: string): Promise<void> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) return;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV SMS] Welcome SMS to ${phone} for ${firstName}`);
    return;
  }

  const client = getClient();
  await client.messages.create({
    body: `Welcome to JareApp, ${firstName}! Connect with your neighbors and stay updated on your community.`,
    from: fromNumber,
    to: phone,
  });
}
