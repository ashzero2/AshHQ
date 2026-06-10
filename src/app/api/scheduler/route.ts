import { NextRequest, NextResponse } from "next/server";
import { runScheduler } from "@/lib/services/scheduler";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-scheduler-secret");
  if (secret !== process.env.SCHEDULER_SECRET && process.env.SCHEDULER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runScheduler();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
