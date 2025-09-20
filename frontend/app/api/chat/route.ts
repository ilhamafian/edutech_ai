// import { openai } from "@ai-sdk/openai";
// import { streamText, UIMessage, convertToModelMessages } from "ai";

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();
//   const result = streamText({
//     model: openai("gpt-4o"),
//     messages: convertToModelMessages(messages),
//   });

//   return result.toUIMessageStreamResponse();
// }

//url to call api
// /api/orchestrator

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Extract user message from the messages array
    const lastMessage = messages[messages.length - 1];
    console.log("In last message", lastMessage);
    
    let userMessage = "";
    if (lastMessage && "parts" in lastMessage && Array.isArray(lastMessage.parts)) {
      const textPart = lastMessage.parts.find((part: any) => part.type === "text");
      userMessage = textPart?.text || "";
    } else if (lastMessage && "content" in lastMessage) {
      userMessage = (lastMessage as any).content || "";
    }

    // Call FastAPI backend to get the response
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const backendResponse = await fetch(`${apiUrl}/api/orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userMessage }),
    });

    if (!backendResponse.ok) {
      throw new Error("Backend error");
    }

    const backendData = await backendResponse.json();

    // Return simple JSON response
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: backendData.output,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("API error:", error);
    
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant", 
        content: "Sorry, I encountered an error while processing your request. Please try again.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
