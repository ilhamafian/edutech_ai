import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("user_id");

        if (!userId) {
            return NextResponse.json(
                { error: "user_id parameter is required" },
                { status: 400 }
            );
        }

        try {
            const lambdaUrl = "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/analytics";
  
            console.log("Fetching analytics from Lambda:", userId);
            console.log("Lambda URL:", lambdaUrl);
  
            // Call Lambda to get analytics data
            const lambdaResponse = await fetch(`${lambdaUrl}?user_id=${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!lambdaResponse.ok) {
                console.error("Lambda GET error:", lambdaResponse.status);
                return NextResponse.json(
                    { error: "Failed to fetch analytics from Lambda" },
                    { status: 500 }
                );
            }

            const lambdaData = await lambdaResponse.json();
            console.log("Retrieved analytics from Lambda:", lambdaData);

            return NextResponse.json(lambdaData);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            return NextResponse.json(
                { error: "Internal server error while fetching analytics" },
                { status: 500 }
            );
        }
        
    } catch (error) {
        console.error("Error processing analytics request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}