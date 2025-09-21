import { NextRequest, NextResponse } from 'next/server';

interface QuizThread {
  id: string;
  title: string;
  createdAt: string;
}

// Mock data for quiz histories - replace with actual database calls
const mockQuizHistories: QuizThread[] = [
  {
    id: "437c8c58-a166-4d14-ad99-262db5c80971",
    title: "SPM Computer Science - Pengkomputeran Quiz",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
  },
  {
    id: "537c8c58-a166-4d14-ad99-262db5c80971", 
    title: "SPM Computer Science - Pangkalan Data Quiz",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: "637c8c58-a166-4d14-ad99-262db5c80971",
    title: "SPM Computer Science - WebChapter 3 Quiz", 
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');

    // If quiz_id is provided, return specific quiz data
    if (quizId) {
      const quiz = mockQuizHistories.find(q => q.id === quizId);
      if (quiz) {
        return NextResponse.json(quiz);
      } else {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }
    }

    // Return all quiz histories
    return NextResponse.json(mockQuizHistories);
  } catch (error) {
    console.error('Error in quiz API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, quizName, totalQuestions, difficulty } = body;

    // Create a new quiz session
    const newQuiz: QuizThread = {
      id: `quiz-${Date.now()}`,
      title: `${subject} - ${quizName} Quiz`,
      createdAt: new Date().toISOString()
    };

    // In a real app, you would save this to a database
    mockQuizHistories.unshift(newQuiz);

    return NextResponse.json(newQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
