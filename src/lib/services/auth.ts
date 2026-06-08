"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPin } from "@/lib/utils";

const SESSION_COOKIE = "ashhq-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function verifyPin(pin: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) return false;

  const hashedInput = hashPin(pin);
  if (hashedInput !== settings.pin) return false;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, hashedInput, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return true;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function changePin(
  currentPin: string,
  newPin: string
): Promise<boolean> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) return false;

  const hashedCurrent = hashPin(currentPin);
  if (hashedCurrent !== settings.pin) return false;

  const hashedNew = hashPin(newPin);
  await prisma.settings.update({
    where: { id: "singleton" },
    data: { pin: hashedNew },
  });

  // Update session cookie with new hash
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, hashedNew, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return true;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  if (!session?.value) return false;

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) return false;

  return session.value === settings.pin;
}
