import { NextRequest, NextResponse } from "next/server";

interface QuizThread {
  id: string;
  title: string;
  createdAt: string;
}

interface LambdaQuestion {
  question: string;
  options: { [key: string]: string };
  answer: string;
  explanation?: string;
}

// Mock data for quiz histories - replace with actual database calls
const mockQuizHistories: QuizThread[] = [
  {
    id: "437c8c58-a166-4d14-ad99-262db5c80971",
    title: "SPM Computer Science - Pengkomputeran Quiz",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  },
  {
    id: "537c8c58-a166-4d14-ad99-262db5c80971",
    title: "SPM Computer Science - Pangkalan Data Quiz",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "637c8c58-a166-4d14-ad99-262db5c80971",
    title: "SPM Computer Science - WebChapter 3 Quiz",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quiz_id");

    // If quiz_id is provided, fetch specific quiz data from Lambda/DynamoDB
    if (quizId) {
      try {
        const lambdaUrl =
          process.env.LAMBDA_QUIZ_ENDPOINT ||
          "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/exam";

        console.log("Fetching quiz from Lambda:", quizId);

        // Call Lambda to get quiz data
        const lambdaResponse = await fetch(`${lambdaUrl}?quiz_id=${quizId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!lambdaResponse.ok) {
          console.error("Lambda GET error:", lambdaResponse.status);
          // Fallback to mock data if Lambda fails
          const quiz = mockQuizHistories.find((q) => q.id === quizId);
          if (quiz) {
            return NextResponse.json(quiz);
          } else {
            return NextResponse.json(
              { error: "Quiz not found" },
              { status: 404 },
            );
          }
        }

        const lambdaData = await lambdaResponse.json();
        console.log("Retrieved quiz from Lambda:", lambdaData);

        // Transform the quiz data to frontend format
        let questions = [];
        if (lambdaData.quiz_content && lambdaData.quiz_content.quiz) {
          questions = lambdaData.quiz_content.quiz.map((q: LambdaQuestion) => {
            const optionsArray = [];
            const optionsObj = q.options || {};

            for (const [key, value] of Object.entries(optionsObj)) {
              optionsArray.push(`${key}) ${value}`);
            }

            const correctKey = q.answer || "";
            const correctText = optionsObj[correctKey] || "";
            const correct_answer = correctKey
              ? `${correctKey}) ${correctText}`
              : "";

            return {
              question: q.question || "",
              options: optionsArray,
              correct_answer: correct_answer,
              explanation: q.explanation || "",
            };
          });
        }

        const transformedQuiz = {
          quiz_id: lambdaData.id || quizId,
          id: lambdaData.id || quizId,
          questions: questions,
          subject: lambdaData.subject || "",
          chapter: lambdaData.chapter || "",
          difficulty: lambdaData.difficulty || "",
          title: `${lambdaData.subject || "Quiz"} - ${lambdaData.chapter || "Unknown"} Quiz`,
          created_at: lambdaData.created_at || new Date().toISOString(),
          status: lambdaData.status || "completed",
        };

        return NextResponse.json(transformedQuiz);
      } catch (error) {
        console.error("Error fetching quiz from Lambda:", error);
        // Fallback to mock data
        const quiz = mockQuizHistories.find((q) => q.id === quizId);
        if (quiz) {
          return NextResponse.json(quiz);
        } else {
          return NextResponse.json(
            { error: "Quiz not found" },
            { status: 404 },
          );
        }
      }
    }

    // Return all quiz histories
    return NextResponse.json(mockQuizHistories);
  } catch (error) {
    console.error("Error in quiz API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(
      "Received POST request with body:",
      JSON.stringify(body, null, 2),
    );

    // Check if this is a quiz submission (has quiz_id) or generation request
    if (body.quiz_id) {
      console.log("Processing quiz submission for quiz_id:", body.quiz_id);
      // This is a quiz submission
      return await handleQuizSubmission(body);
    } else {
      console.log("Processing quiz generation");
      // This is a quiz generation request
      return await handleQuizGeneration(body);
    }
  } catch (error) {
    console.error("Error in quiz API route:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : String(error),
    );
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}

async function handleQuizGeneration(body: {
  subject: string;
  chapter: string;
  difficulty: string;
  user_id: string;
}) {
  try {
    const { subject, chapter, difficulty, user_id } = body;

    // Validate required fields
    if (!subject || !chapter || !difficulty || !user_id) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: subject, chapter, difficulty, user_id",
        },
        { status: 400 },
      );
    }

    // Call Lambda function to generate quiz
    const lambdaUrl =
      process.env.LAMBDA_QUIZ_ENDPOINT ||
      "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/exam";

    console.log("Using Lambda URL:", lambdaUrl);

    console.log("Calling Lambda function with:", {
      user_id,
      subject,
      chapter,
      difficulty,
    });

    const lambdaResponse = await fetch(lambdaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        subject,
        chapter,
        difficulty,
      }),
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error("Lambda function error:", lambdaResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate quiz from Lambda function" },
        { status: 500 },
      );
    }

    const lambdaData = await lambdaResponse.json();
    console.log("Lambda response:", lambdaData);

    // Generate a unique quiz ID if not provided by Lambda
    const quizId = lambdaData.quiz_id || lambdaData.id || `quiz-${Date.now()}`;

    // Transform quiz content from Lambda format to frontend format
    let questions = [];
    if (lambdaData.quiz_content && lambdaData.quiz_content.quiz) {
      questions = lambdaData.quiz_content.quiz.map((q: LambdaQuestion) => {
        // Transform options from object {"A": "text", "B": "text"} to array ["A) text", "B) text"]
        const optionsArray = [];
        const optionsObj = q.options || {};

        for (const [key, value] of Object.entries(optionsObj)) {
          optionsArray.push(`${key}) ${value}`);
        }

        // Find correct answer text
        const correctKey = q.answer || "";
        const correctText = optionsObj[correctKey] || "";
        const correct_answer = correctKey
          ? `${correctKey}) ${correctText}`
          : "";

        return {
          question: q.question || "",
          options: optionsArray,
          correct_answer: correct_answer,
          explanation: q.explanation || "",
        };
      });
    }

    // Ensure the response has the proper structure for the frontend
    const quizResponse = {
      quiz_id: quizId,
      id: quizId, // Fallback for compatibility
      questions: questions,
      subject: subject,
      chapter: chapter,
      difficulty: difficulty,
      title: `${subject} - ${chapter} Quiz`,
      created_at: lambdaData.created_at || new Date().toISOString(),
      status: lambdaData.status || "completed",
    };

    // Create quiz thread entry for history tracking
    const newQuizThread: QuizThread = {
      id: quizId,
      title: quizResponse.title,
      createdAt: new Date().toISOString(),
    };

    // Add to mock histories for now (replace with actual database storage)
    mockQuizHistories.unshift(newQuizThread);

    return NextResponse.json(quizResponse);
  } catch (error) {
    console.error("Error in quiz generation:", error);
    return NextResponse.json(
      { error: "Internal server error during quiz generation" },
      { status: 500 },
    );
  }
}

async function handleQuizSubmission(body: {
  quiz_id: string;
  user_answers: Array<{ question_number: number; selected_answer: string }>;
  total_duration: number;
}) {
  try {
    console.log(
      "handleQuizSubmission called with:",
      JSON.stringify(body, null, 2),
    );
    const { quiz_id, user_answers, total_duration } = body;

    // Validate required fields
    if (!quiz_id) {
      console.log("Error: quiz_id is missing");
      return NextResponse.json(
        { error: "'quiz_id' is required." },
        { status: 400 },
      );
    }
    if (!user_answers) {
      console.log("Error: user_answers is missing");
      return NextResponse.json(
        { error: "'user_answers' is required." },
        { status: 400 },
      );
    }

    console.log("Validation passed, calling Lambda...");

    // Call Lambda function to submit quiz (same endpoint as generation)
    const lambdaUrl =
      process.env.LAMBDA_QUIZ_ENDPOINT ||
      "https://ywcdy4t13i.execute-api.us-east-1.amazonaws.com/dev/exam";

    console.log("Submitting quiz to Lambda:", lambdaUrl);
    console.log("Submission data:", { quiz_id, user_answers, total_duration });

    const lambdaResponse = await fetch(lambdaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quiz_id,
        user_answers,
        total_duration,
      }),
    });

    console.log("Lambda response status:", lambdaResponse.status);
    console.log(
      "Lambda response headers:",
      Object.fromEntries(lambdaResponse.headers.entries()),
    );

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error("Lambda submit error:", lambdaResponse.status, errorText);
      console.error("Full Lambda response:", {
        status: lambdaResponse.status,
        statusText: lambdaResponse.statusText,
        headers: Object.fromEntries(lambdaResponse.headers.entries()),
        body: errorText,
      });
      // Try to parse error as JSON to get more details
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error || errorJson.message || errorText;
      } catch {
        // errorText is not JSON, use as is
      }

      return NextResponse.json(
        {
          error: `Failed to submit quiz to Lambda function: ${lambdaResponse.status} - ${errorDetails}`,
        },
        { status: 500 },
      );
    }

    const lambdaData = await lambdaResponse.json();
    console.log("Lambda submit response:", lambdaData);
    console.log("Lambda response structure:", {
      hasScore: "score" in lambdaData,
      hasDuration: "duration" in lambdaData,
      hasAnswers: "answers" in lambdaData,
      hasQuizContent: "quiz_content" in lambdaData,
      scoreValue: lambdaData.score,
      durationValue: lambdaData.duration,
      answersLength: lambdaData.answers?.length,
      quizContentKeys: lambdaData.quiz_content
        ? Object.keys(lambdaData.quiz_content)
        : [],
    });

    // Transform the submitted quiz data to frontend format
    let questions = [];

    // Handle new Lambda response structure
    if (lambdaData.quiz_content && lambdaData.quiz_content.quiz) {
      // Get the answers array for status information
      const answersMap = new Map();
      if (lambdaData.answers && Array.isArray(lambdaData.answers)) {
        console.log("Processing answers array:", lambdaData.answers);
        lambdaData.answers.forEach(
          (
            answer: { question_id?: string; status: boolean },
            index: number,
          ) => {
            // Use index as fallback if question_id is not available
            const key = answer.question_id || index.toString();
            console.log(
              `Answer ${index}: question_id=${answer.question_id}, status=${answer.status}, key=${key}`,
            );
            answersMap.set(key, answer.status);
          },
        );
        console.log("Answers map:", Object.fromEntries(answersMap));
      }

      questions = lambdaData.quiz_content.quiz.map(
        (
          q: LambdaQuestion & {
            user_selected?: string;
            status?: boolean;
            number?: number;
            question_id?: string;
          },
          index: number,
        ) => {
          // Transform options from object {"A": "text", "B": "text"} to array ["A) text", "B) text"]
          const optionsArray = [];
          const optionsObj = q.options || {};

          for (const [key, value] of Object.entries(optionsObj)) {
            optionsArray.push(`${key}) ${value}`);
          }

          // Find correct answer text
          const correctKey = q.answer || "";
          const correctText = optionsObj[correctKey] || "";
          const correct_answer = correctKey
            ? `${correctKey}) ${correctText}`
            : "";

          // Find user selected answer text
          const userSelectedKey = q.user_selected || "";
          const userSelectedText = optionsObj[userSelectedKey] || "";
          const user_selected = userSelectedKey
            ? `${userSelectedKey}) ${userSelectedText}`
            : "";

          // Get status from answers array or fallback to question status
          const questionKey =
            q.question_id || q.number?.toString() || index.toString();
          const questionStatus = answersMap.get(questionKey) ?? q.status;
          console.log(
            `Question ${index + 1} mapping: key=${questionKey}, status=${questionStatus}, answerStatus=${answersMap.get(questionKey)}, questionStatus=${q.status}`,
          );

          return {
            number: q.number || index + 1,
            question: q.question || "",
            options: optionsArray,
            correct_answer: correct_answer,
            user_selected: user_selected,
            status: questionStatus,
            explanation: q.explanation || "",
          };
        },
      );
    }

    const transformedResponse = {
      quiz_id: lambdaData.quiz_id || lambdaData.id,
      user_id: lambdaData.user_id,
      subject: lambdaData.subject,
      chapter: lambdaData.chapter,
      difficulty: lambdaData.difficulty,
      questions: questions,
      // Score and duration are now at root level, not in quiz_content
      score: lambdaData.score || lambdaData.quiz_content?.score || 0,
      duration:
        lambdaData.duration ||
        lambdaData.quiz_content?.duration ||
        total_duration,
      feedback: lambdaData.quiz_content?.feedback || "",
      status: lambdaData.status,
      created_at: lambdaData.created_at,
      completed_at: lambdaData.completed_at,
      title: `${lambdaData.subject || "Quiz"} - ${lambdaData.chapter || "Unknown"} Quiz`,
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error("Error in quiz submission:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : String(error),
    );
    return NextResponse.json(
      {
        error: `Internal server error during quiz submission: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
