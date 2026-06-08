import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const settings = await prisma.settings.findFirst();

  const provider = settings?.aiProvider || "OPENAI";

  let model;
  if (provider === "OLLAMA") {
    const ollama = createOpenAICompatible({
      name: "ollama",
      baseURL: (settings?.ollamaBaseUrl || "http://localhost:11434") + "/v1",
    });
    model = ollama(settings?.ollamaModel || "llama3");
  } else {
    const openai = createOpenAI({
      apiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY || "",
    });
    model = openai(settings?.openaiModel || "gpt-4o-mini");
  }

  const result = await streamText({
    model,
    system: "You are AshHQ AI assistant — a helpful, concise personal assistant. Keep responses short and actionable. Use markdown for formatting when helpful.",
    messages,
  });

  return result.toTextStreamResponse();
}
