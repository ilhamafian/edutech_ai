import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body to Lambda:", body);

    // Call your AWS Lambda through API Gateway
    const response = await fetch(
      "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/qna",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    console.log("Lambda response data:", data);
    console.log("Lambda response status:", response.status);
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Error proxying chat:", error);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    // If session_id is provided, fetch messages for that session
    if (session_id) {
      return await getMessagesForSession(session_id);
    }

    // Otherwise, get all chat histories for user
    return await getChatHistories();
  } catch (err: unknown) {
    console.error("Error in /api/chat GET:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

async function getChatHistories() {
  // Hardcoded user_id for simplicity
  const user_id = "1";

  // Call your chat memory retrieval Lambda through API Gateway
  const lambdaUrl =
    "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/qna";

  console.log(`Calling Lambda URL: ${lambdaUrl}?user_id=${user_id}`);

  try {
    const response = await fetch(`${lambdaUrl}?user_id=${user_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Lambda response status:", response.status);
    console.log(
      "Lambda response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lambda error response:", errorText);
      throw new Error(`Lambda error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Lambda response data:", data);

    return NextResponse.json(data);
  } catch (lambdaError) {
    console.error(
      "Lambda call failed, returning mock data for testing:",
      lambdaError,
    );

    // Return empty array if Lambda fails - this will show "No chat history yet" in UI
    console.log("Lambda call failed, returning empty array");
    return NextResponse.json([]);
  }
}

async function getMessagesForSession(session_id: string) {
  console.log(`Fetching messages for session: ${session_id}`);

  try {
    // Call your Lambda function to get the specific chat with messages
    const lambdaUrl =
      "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/qna/get";

    console.log(
      `Calling Lambda for session messages: ${lambdaUrl}?user_id=1&session_id=${session_id}`,
    );

    const response = await fetch(
      `${lambdaUrl}?id=${session_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Lambda error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Lambda response for session messages:", data);

    // Handle the case where Lambda returns an array or single object
    let chatData: {
      id?: string;
      session_id?: string;
      messages?: Array<{
        role: string;
        content: string;
        timestamp: string;
      }>;
    };

    if (Array.isArray(data)) {
      // If it's an array, find the matching session
      chatData = data.find(
        (item: {
          id?: string;
          session_id?: string;
          messages?: Array<unknown>;
        }) => item.id === session_id || item.session_id === session_id,
      );
    } else {
      // If it's a single object
      chatData = data;
    }

    if (!chatData || !chatData.messages) {
      console.log("No chat data or messages found for session:", session_id);
      return NextResponse.json([]);
    }

    // Extract messages and convert role "agent" to "assistant"
    const messages = chatData.messages.map(
      (
        msg: {
          role: string;
          content: string;
          timestamp: string;
        },
        index: number,
      ) => ({
        id: `${session_id}-msg-${index}`,
        role: msg.role === "agent" ? "assistant" : msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }),
    );

    console.log("Extracted messages for session:", session_id, messages);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages from Lambda:", error);

    // Return empty array instead of mock data to show real empty state
    console.log("Returning empty messages due to error");
    return NextResponse.json([]);
  }
}
