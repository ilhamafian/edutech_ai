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
