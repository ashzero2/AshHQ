"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPin, comparePin, generateSessionToken } from "@/lib/server-utils";

const SESSION_COOKIE = "ashhq-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// In-memory rate limiter: ip → { count, resetAt }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

// Purge expired entries every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now > entry.resetAt) loginAttempts.delete(ip);
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSecs: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfterSecs: 0 };
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function verifyPin(pin: string, ip = "unknown"): Promise<{ success: boolean; error?: string; retryAfterSecs?: number }> {
  const { allowed, retryAfterSecs } = checkRateLimit(ip);
  if (!allowed) {
    return { success: false, error: `Too many attempts. Try again in ${retryAfterSecs}s.`, retryAfterSecs };
  }

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) return { success: false, error: "Not configured" };

  const valid = await comparePin(pin, settings.pin);
  if (!valid) {
    return { success: false, error: "Incorrect PIN" };
  }

  clearRateLimit(ip);

  // Migrate legacy HMAC hash to bcrypt on first successful login
  if (!settings.pin.startsWith("$2")) {
    const newHash = await hashPin(pin);
    await prisma.settings.update({ where: { id: "singleton" }, data: { pin: newHash } }).catch(() => {});
  }

  // Create secure session token in DB
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await prisma.session.create({ data: { token, expiresAt } });

  // Clean up expired sessions (fire-and-forget)
  prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  await setSessionCookie(token);
  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (session?.value) {
    await prisma.session.deleteMany({ where: { token: session.value } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) return false;

  const valid = await comparePin(currentPin, settings.pin);
  if (!valid) return false;

  const hashedNew = await hashPin(newPin);
  await prisma.settings.update({ where: { id: "singleton" }, data: { pin: hashedNew } });

  // Invalidate all sessions on PIN change
  await prisma.session.deleteMany({});

  // Issue a fresh session
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await prisma.session.create({ data: { token, expiresAt } });
  await setSessionCookie(token);

  return true;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;

  const record = await prisma.session.findUnique({ where: { token: session.value } });
  if (!record) return false;

  if (record.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token: session.value } }).catch(() => {});
    return false;
  }

  return true;
}

export async function validateSessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const record = await prisma.session.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return false;
  return true;
}
