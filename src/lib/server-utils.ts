import { createHmac, randomUUID } from "crypto";

const SECRET = process.env.SESSION_SECRET || "ashhq-default-secret-change-me";

export function hashPin(pin: string): string {
  return createHmac("sha256", SECRET).update(pin).digest("hex");
}

export function generateSessionToken(): string {
  return randomUUID();
}
