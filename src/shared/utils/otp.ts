import bcrypt from "bcrypt";
import crypto from "crypto";
import { OTP_DIGITS } from "../constants/otp";

export function generateNumericOtp(): string {
  const min = 10 ** (OTP_DIGITS - 1);
  const max = 10 ** OTP_DIGITS - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 12);
}

export async function compareOtp(plainOtp: string, otpHash: string): Promise<boolean> {
  return bcrypt.compare(plainOtp, otpHash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateParticipationRef(): string {
  return `part_${crypto.randomBytes(24).toString("hex")}`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return "***";
  }

  if (name.length <= 2) {
    return `${name[0] ?? "*"}***@${domain}`;
  }

  return `${name[0]}${"*".repeat(Math.max(name.length - 2, 1))}${name[name.length - 1]}@${domain}`;
}
