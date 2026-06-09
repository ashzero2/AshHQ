import { NextResponse } from "next/server";
import { exportAllData } from "@/lib/services/export";

export async function GET() {
  const data = await exportAllData();
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ashhq-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
