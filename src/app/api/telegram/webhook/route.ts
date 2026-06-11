import { NextRequest, NextResponse } from "next/server";

// This route is superseded by /api/channels/[channelId]/webhook.
// It is kept only for backwards compatibility with old webhook registrations.
// Telegram now registers /api/channels/telegram/webhook which includes
// signature verification — this stub just rejects all traffic.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: "Endpoint deprecated" }, { status: 410 });
}
