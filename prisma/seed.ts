import { PrismaClient } from "@prisma/client";
import { createHmac } from "crypto";

const prisma = new PrismaClient();

const SECRET = process.env.SESSION_SECRET || "ashhq-default-secret-change-me";

function hashPin(pin: string): string {
  return createHmac("sha256", SECRET).update(pin).digest("hex");
}

const DEFAULT_LAYOUT = JSON.stringify({
  columns: 12,
  widgets: [
    { id: "greeting", type: "GREETING", title: "Greeting", x: 0, y: 0, w: 8, h: 2, visible: true, settings: {} },
    { id: "clock", type: "CLOCK", title: "Clock", x: 8, y: 0, w: 4, h: 2, visible: true, settings: {} },
    { id: "weather", type: "WEATHER", title: "Weather", x: 0, y: 2, w: 4, h: 3, visible: true, settings: {} },
    { id: "tasks", type: "TASKS", title: "Tasks", x: 4, y: 2, w: 4, h: 3, visible: true, settings: {} },
    { id: "calendar", type: "CALENDAR", title: "Calendar", x: 8, y: 2, w: 4, h: 3, visible: true, settings: {} },
    { id: "habits", type: "HABITS", title: "Habits", x: 0, y: 5, w: 4, h: 3, visible: true, settings: {} },
    { id: "finance", type: "FINANCE", title: "Finance", x: 4, y: 5, w: 4, h: 3, visible: true, settings: {} },
    { id: "notes", type: "NOTES", title: "Notes", x: 8, y: 5, w: 4, h: 3, visible: true, settings: {} },
    { id: "quick-links", type: "QUICK_LINKS", title: "Quick Links", x: 0, y: 8, w: 6, h: 2, visible: true, settings: {} },
    { id: "ai-chat", type: "AI_CHAT", title: "AI Chat", x: 6, y: 8, w: 6, h: 2, visible: true, settings: {} },
  ],
});

async function main() {
  const hashedPin = hashPin("1234");

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { pin: hashedPin },
    create: {
      id: "singleton",
      pin: hashedPin,
      dashboardLayout: DEFAULT_LAYOUT,
    },
  });

  console.log("✅ Seed complete — default PIN is 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
