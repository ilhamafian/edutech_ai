import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

//url to call api
// /api/orchestrator

// import { streamText, UIMessage, convertToModelMessages } from "ai";

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();

//   // Take the last user message only
//   const userMessage = messages[messages.length - 1]?.content ?? "";

//   // Call FastAPI backend
//   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orchestrator`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ query: userMessage }),
//   });

//   if (!response.ok) {
//     return new Response(JSON.stringify({ error: "Backend error" }), { status: 500 });
//   }

//   const data = await response.json();

//   return new Response(
//     JSON.stringify({
//       id: Date.now().toString(),
//       role: "assistant",
//       content: data.output, // comes from FastAPI agent
//     }),
//     { status: 200 }
//   );
// }
