import bcrypt from "bcryptjs";
import { createHmac, randomUUID } from "crypto";

const BCRYPT_ROUNDS = 12;
const LEGACY_SECRET = process.env.SESSION_SECRET || "ashhq-default-secret-change-me";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

// Supports both bcrypt hashes and legacy HMAC-SHA256 hashes for migration
export async function comparePin(pin: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(pin, storedHash);
  }
  const legacy = createHmac("sha256", LEGACY_SECRET).update(pin).digest("hex");
  return legacy === storedHash;
}

export function generateSessionToken(): string {
  return randomUUID();
}
