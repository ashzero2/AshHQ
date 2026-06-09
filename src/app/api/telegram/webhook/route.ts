import { NextRequest, NextResponse } from "next/server";
import { processWebhookUpdate } from "@/lib/services/telegram";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    await processWebhookUpdate(update);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
