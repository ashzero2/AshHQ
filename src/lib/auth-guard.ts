"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionToken } from "@/lib/services/auth";

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashhq-session")?.value ?? "";
  if (!(await validateSessionToken(token))) {
    redirect("/login");
  }
}
