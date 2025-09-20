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

    console.log("User message", userMessage);

    // Call FastAPI backend to get the response
    const apiUrl = 'https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/qna';
    const backendResponse = await fetch(`${apiUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMessage }),
    });

    console.log("Backend response", backendResponse);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend error details:", backendResponse.status, errorText);
      throw new Error(`Backend error: ${backendResponse.status} - ${errorText}`);
    }

    const backendData = await backendResponse.json();
    console.log("Backend data:", backendData);

    // Parse the body if it's a string
    let responseContent = "No response received";
    if (backendData.body) {
      try {
        const parsedBody = JSON.parse(backendData.body);
        responseContent = parsedBody.response || parsedBody.output || parsedBody.answer;
      } catch (parseError) {
        console.error("Error parsing backend body:", parseError);
        responseContent = backendData.body; // Use raw body if parsing fails
      }
    } else if (backendData.output || backendData.response || backendData.answer) {
      responseContent = backendData.output || backendData.response || backendData.answer;
    }

    // Return simple JSON response
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: responseContent,
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
