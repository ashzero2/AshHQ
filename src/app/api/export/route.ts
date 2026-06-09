import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSessionToken } from "@/lib/services/auth";
import { exportAllData } from "@/lib/services/export";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashhq-session")?.value ?? "";
  if (!(await validateSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await exportAllData();
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ashhq-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
