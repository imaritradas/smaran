/**
 * SMS abstraction — defaults to console-log mode (zero cost, no signup required).
 *
 * To enable a real provider (e.g., MSG91), set the SMS_PROVIDER_API_KEY env var
 * to a real key. The pluggable branch is left as a TODO placeholder.
 */

const PLACEHOLDER = "YOUR_SMS_PROVIDER_API_KEY_HERE_OR_LEAVE_FOR_LOG_MODE";

export async function sendSms(phone: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_PROVIDER_API_KEY;

  if (apiKey && apiKey !== PLACEHOLDER && apiKey.trim() !== "") {
    // Pluggable: integrate a real SMS provider here (MSG91, Twilio, etc.)
    // For now, this branch logs and returns — replace with actual HTTP call
    // when a provider is chosen and funded.
    console.log(`[SMS REAL MODE - NOT IMPLEMENTED] To: ${phone}, Message: ${message}`);
    console.log("  → To integrate a real SMS provider, implement the HTTP call in lib/sms.ts");
    return;
  }

  // Default: log mode — no cost, no signup, always works
  console.log(`[SMS LOG MODE] To: ${phone}, Message: ${message}`);
}
