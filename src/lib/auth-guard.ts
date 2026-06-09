"use server";

import { cookies } from "next/headers";
import { validateSessionToken } from "@/lib/services/auth";

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashhq-session")?.value ?? "";
  if (!(await validateSessionToken(token))) {
    throw new Error("Unauthorized");
  }
}
