import { NextRequest, NextResponse } from "next/server";
import { NotificationManager } from "@/lib/channels/notification-manager";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const data = await req.json();
    await NotificationManager.handleIncoming(channelId, data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
