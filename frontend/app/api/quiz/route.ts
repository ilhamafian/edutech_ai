import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Quiz request body:", body);

    // Validate required fields
    if (!body.subject) {
      return NextResponse.json(
        { error: "'subject' is required in the request body." },
        { status: 400 },
      );
    }

    // Call the quiz generation Lambda function
    const response = await fetch(
      "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/exam", // Correct endpoint for quiz generation
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lambda error response:", errorText);
      throw new Error(`Lambda error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Quiz Lambda response:", data);

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate quiz",
      },
      { status: 500 },
    );
  }
}
