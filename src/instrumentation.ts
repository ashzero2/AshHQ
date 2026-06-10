export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = (await import("node-cron")).default;
    const { runScheduler } = await import("@/lib/services/scheduler");

    // Run every hour
    cron.schedule("0 * * * *", async () => {
      try {
        await runScheduler();
      } catch (err) {
        console.error("[scheduler] error:", err);
      }
    });
  }
}
