"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, Clock, BookOpen, Check, X } from "lucide-react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavigationSidebar } from "@/components/ui/navigation-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Question {
  number?: number;
  question: string;
  options: string[];
  correct_answer: string;
  user_selected?: string;
  status?: boolean;
  explanation?: string;
}

interface QuizData {
  quiz_id?: string;
  questions?: Question[];
  title?: string;
  subject?: string;
  chapter?: string;
  difficulty?: string;
  score?: number;
  duration?: number;
  feedback?: string;
  status?: string;
  created_at?: string;
  completed_at?: string;
  // Handle case where the response might be a string
  [key: string]: unknown;
}

interface QuizThread {
  id: string;
  title: string;
  chapter?: string;
  score?: number;
  createdAt: Date | string;
}

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get quiz ID from params
  const quizId = params.id as string;

  // State for sidebar functionality
  const [quizzes, setQuizzes] = useState<QuizThread[]>([]);

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  // Function to fetch quiz data from GET lambda function
  const fetchQuizFromAPI = async (id: string): Promise<QuizData | null> => {
    try {
      console.log("Fetching quiz data from Lambda memories for ID:", id);
      const response = await fetch(`/api/quiz?quiz_id=${id}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch quiz: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch quiz: ${response.status}`);
      }

      const quizData = await response.json();
      console.log("Fetched quiz data from Lambda memories:", quizData);

      // Ensure the quiz data has the expected structure
      if (!quizData || (!quizData.questions && !quizData.quiz_content)) {
        console.error("Invalid quiz data structure:", quizData);
        return null;
      }

      // Return the quiz data from the Lambda memories function
      return quizData;
    } catch (error) {
      console.error("Error fetching quiz from Lambda memories:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadQuizData = async () => {
      setIsLoading(true);

      // First try to load from sessionStorage
      const storedQuiz = sessionStorage.getItem(`quiz-${quizId}`);

      if (storedQuiz) {
        try {
          let parsedQuiz = JSON.parse(storedQuiz);

          // Handle case where the response might be a string that needs parsing
          if (typeof parsedQuiz === "string") {
            parsedQuiz = JSON.parse(parsedQuiz);
          }

          console.log("Loaded quiz data from sessionStorage:", parsedQuiz);

          // Debug the first question to understand data structure
          if (parsedQuiz.questions && parsedQuiz.questions[0]) {
            console.log("First question structure:", {
              question:
                parsedQuiz.questions[0].question?.substring(0, 50) + "...",
              user_selected: parsedQuiz.questions[0].user_selected,
              correct_answer: parsedQuiz.questions[0].correct_answer,
              options: parsedQuiz.questions[0].options,
              status: parsedQuiz.questions[0].status,
            });
          }

          setQuizData(parsedQuiz);

          // Check if quiz is completed (has status = "completed") and show results
          if (parsedQuiz.status === "completed") {
            console.log("Quiz is completed, showing results");
            setShowResults(true);
            // Set selected answers from completed quiz data
            if (parsedQuiz.questions && Array.isArray(parsedQuiz.questions)) {
              const completedAnswers = parsedQuiz.questions.map(
                (q: Question, index: number) => {
                  let userAnswer = q.user_selected || "";

                  console.log(`Question ${index + 1} processing:`, {
                    original_user_selected: q.user_selected,
                    userAnswer_before: userAnswer,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    status: q.status,
                  });

                  // If user_selected is completely missing/undefined, we can't recover it
                  if (
                    q.user_selected === undefined ||
                    q.user_selected === null
                  ) {
                    console.warn(
                      `Question ${index + 1}: user_selected is undefined/null - completed quiz data may be incomplete`,
                    );
                  }

                  // Handle different formats of user_selected from Lambda memories
                  if (userAnswer && q.options) {
                    // Case 1: user_selected is already in full format (e.g., "A) Answer text")
                    const directMatch = q.options.find(
                      (option) => option === userAnswer,
                    );
                    if (directMatch) {
                      console.log(`Question ${index + 1}: Direct match found`);
                    }
                    // Case 2: user_selected is just a key (e.g., "A")
                    else if (!userAnswer.includes(")")) {
                      const matchingOption = q.options.find((option) =>
                        option.startsWith(userAnswer + ")"),
                      );
                      if (matchingOption) {
                        console.log(
                          `Question ${index + 1}: Converted "${userAnswer}" to "${matchingOption}"`,
                        );
                        userAnswer = matchingOption;
                      } else {
                        console.log(
                          `Question ${index + 1}: No matching option found for key "${userAnswer}"`,
                        );
                        // Try case-insensitive search
                        const caseInsensitiveMatch = q.options.find((option) =>
                          option
                            .toLowerCase()
                            .startsWith(userAnswer.toLowerCase() + ")"),
                        );
                        if (caseInsensitiveMatch) {
                          console.log(
                            `Question ${index + 1}: Case-insensitive match found: "${caseInsensitiveMatch}"`,
                          );
                          userAnswer = caseInsensitiveMatch;
                        }
                      }
                    }
                    // Case 3: user_selected might be partial text - try to find best match
                    else {
                      const partialMatch = q.options.find(
                        (option) =>
                          option.includes(userAnswer) ||
                          userAnswer.includes(option),
                      );
                      if (partialMatch) {
                        console.log(
                          `Question ${index + 1}: Partial match found: "${partialMatch}"`,
                        );
                        userAnswer = partialMatch;
                      }
                    }
                  }

                  console.log(
                    `Question ${index + 1} final userAnswer:`,
                    userAnswer,
                  );
                  return userAnswer;
                },
              );
              setSelectedAnswers(completedAnswers);
              console.log(
                "Final selectedAnswers for completed quiz from Lambda memories:",
                completedAnswers,
              );
            }
          } else {
            // Initialize selected answers array for new quiz
            if (parsedQuiz.questions && Array.isArray(parsedQuiz.questions)) {
              setSelectedAnswers(
                new Array(parsedQuiz.questions.length).fill(""),
              );
            }
          }

          setIsLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing quiz data from sessionStorage:", error);
        }
      }

      // Fallback: try to fetch from API
      console.log("Quiz not found in sessionStorage, attempting API fetch...");
      const apiQuizData = await fetchQuizFromAPI(quizId);

      if (apiQuizData && apiQuizData.questions) {
        setQuizData(apiQuizData);

        // Check if quiz is completed (has status = "completed") and show results
        if (apiQuizData.status === "completed") {
          console.log("API Quiz from Lambda memories is completed, showing results");
          setShowResults(true);
          // Set selected answers from completed quiz data
          if (Array.isArray(apiQuizData.questions)) {
            const completedAnswers = apiQuizData.questions.map(
              (q: Question, index: number) => {
                let userAnswer = q.user_selected || "";

                console.log(`API Question ${index + 1} processing:`, {
                  original_user_selected: q.user_selected,
                  userAnswer_before: userAnswer,
                  options: q.options,
                  correct_answer: q.correct_answer,
                  status: q.status,
                });

                // If user_selected is completely missing/undefined, we can't recover it
                if (q.user_selected === undefined || q.user_selected === null) {
                  console.warn(
                    `API Question ${index + 1}: user_selected is undefined/null - completed quiz data may be incomplete`,
                  );
                }

                // Handle different formats of user_selected from Lambda memories
                if (userAnswer && q.options) {
                  // Case 1: user_selected is already in full format (e.g., "A) Answer text")
                  const directMatch = q.options.find(
                    (option) => option === userAnswer,
                  );
                  if (directMatch) {
                    console.log(
                      `API Question ${index + 1}: Direct match found`,
                    );
                  }
                  // Case 2: user_selected is just a key (e.g., "A")
                  else if (!userAnswer.includes(")")) {
                    const matchingOption = q.options.find((option) =>
                      option.startsWith(userAnswer + ")"),
                    );
                    if (matchingOption) {
                      console.log(
                        `API Question ${index + 1}: Converted "${userAnswer}" to "${matchingOption}"`,
                      );
                      userAnswer = matchingOption;
                    } else {
                      console.log(
                        `API Question ${index + 1}: No matching option found for key "${userAnswer}"`,
                      );
                      // Try case-insensitive search
                      const caseInsensitiveMatch = q.options.find((option) =>
                        option
                          .toLowerCase()
                          .startsWith(userAnswer.toLowerCase() + ")"),
                      );
                      if (caseInsensitiveMatch) {
                        console.log(
                          `API Question ${index + 1}: Case-insensitive match found: "${caseInsensitiveMatch}"`,
                        );
                        userAnswer = caseInsensitiveMatch;
                      }
                    }
                  }
                  // Case 3: user_selected might be partial text - try to find best match
                  else {
                    const partialMatch = q.options.find(
                      (option) =>
                        option.includes(userAnswer) ||
                        userAnswer.includes(option),
                    );
                    if (partialMatch) {
                      console.log(
                        `API Question ${index + 1}: Partial match found: "${partialMatch}"`,
                      );
                      userAnswer = partialMatch;
                    }
                  }
                }

                console.log(
                  `API Question ${index + 1} final userAnswer:`,
                  userAnswer,
                );
                return userAnswer;
              },
            );
            setSelectedAnswers(completedAnswers);
            console.log(
              "Final selectedAnswers for completed API quiz from Lambda memories:",
              completedAnswers,
            );
          }
        } else {
          // Initialize selected answers array for new quiz
          if (Array.isArray(apiQuizData.questions)) {
            setSelectedAnswers(
              new Array(apiQuizData.questions.length).fill(""),
            );
          }
        }
      } else {
        // Show user-friendly error message
        console.error("Quiz not found in sessionStorage or API");
        setQuizData(null);
      }

      setIsLoading(false);
    };

    loadQuizData();
  }, [quizId, router]);

  useEffect(() => {
    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (answer: string) => {
    // Don't allow answer selection for completed quizzes
    if (showResults || isQuizCompleted) {
      return;
    }
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (
      quizData?.questions &&
      currentQuestion < quizData.questions.length - 1
    ) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    console.log("Current quizData:", quizData);
    console.log("Quiz ID from params:", quizId);
    console.log("sessionStorage key:", `quiz-${quizId}`);
    console.log(
      "sessionStorage value:",
      sessionStorage.getItem(`quiz-${quizId}`),
    );

    if (!quizData?.questions || !quizData.quiz_id) {
      console.log("Missing quiz data or quiz_id:", {
        hasQuestions: !!quizData?.questions,
        hasQuizId: !!quizData?.quiz_id,
        quizId: quizData?.quiz_id,
        questionsLength: quizData?.questions?.length,
      });
      alert("Quiz data is not available for submission.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Selected answers before transformation:", selectedAnswers);

      // Transform selected answers to the format expected by Lambda
      const userAnswers = selectedAnswers.map((answer, index) => {
        // Extract just the key (A, B, C, D) from the selected answer "A) text"
        const selectedKey = answer ? answer.split(")")[0] : "";
        console.log(
          `Question ${index + 1}: "${answer}" -> key: "${selectedKey}"`,
        );
        return {
          question_number: index + 1,
          selected_answer: selectedKey,
        };
      });

      console.log("Transformed user answers:", userAnswers);
      console.log("Submitting quiz:", {
        quiz_id: quizData.quiz_id,
        user_answers: userAnswers,
        total_duration: timeElapsed,
      });

      // Call the submission API
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz_id: quizData.quiz_id,
          user_answers: userAnswers,
          total_duration: timeElapsed,
        }),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        console.error("Parsed error data:", errorData);
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${errorText}`,
        );
      }

      const submissionResult = await response.json();
      console.log("Submission result:", submissionResult);
      console.log("Submission result questions:", submissionResult.questions);

      // Debug the questions data structure
      if (submissionResult.questions) {
        submissionResult.questions.forEach((q: Question, i: number) => {
          console.log(`Question ${i + 1}:`, {
            question: q.question,
            user_selected: q.user_selected,
            correct_answer: q.correct_answer,
            status: q.status,
          });
        });
      }

      // Update quiz data with submission results
      // Fix: Ensure user_selected field is populated from our local selectedAnswers
      if (
        submissionResult.questions &&
        Array.isArray(submissionResult.questions)
      ) {
        submissionResult.questions.forEach(
          (question: Question, index: number) => {
            if (!question.user_selected && selectedAnswers[index]) {
              question.user_selected = selectedAnswers[index];
              console.log(
                `Fixed missing user_selected for question ${index + 1}: "${selectedAnswers[index]}"`,
              );
            }
          },
        );
      }

      setQuizData(submissionResult);

      // Save the completed quiz with user_selected data to sessionStorage
      sessionStorage.setItem(
        `quiz-${quizId}`,
        JSON.stringify(submissionResult),
      );
      console.log(
        "Saved completed quiz to sessionStorage with user_selected data",
      );

      setShowResults(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    // If we have a score from the submission, use that
    if (quizData?.score !== undefined) {
      return quizData.score;
    }

    // Otherwise calculate locally
    if (!quizData?.questions) return 0;

    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });

    return (correct / quizData.questions.length) * 100;
  };

  // Check if quiz is completed (has status = "completed")
  const isQuizCompleted = quizData?.status === "completed";

  // Force showResults to be true for completed quizzes
  useEffect(() => {
    if (isQuizCompleted && !showResults) {
      setShowResults(true);
    }
  }, [isQuizCompleted, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchQuizId = (selectedQuizId: string) => {
    console.log("Redirecting to quiz:", selectedQuizId);
    router.push(`/quiz/${selectedQuizId}`);
  };

  const switchToQuiz = (selectedQuizId: string) => {
    console.log("Switching to quiz:", selectedQuizId);
    fetchQuizId(selectedQuizId);
  };

  const createNewQuiz = () => {
    const newThreadId = crypto.randomUUID();
    const newThread: QuizThread = {
      id: newThreadId,
      title: "New Chat",
      createdAt: new Date(),
    };

    setQuizzes((prev) => [newThread, ...prev]);
    router.push(`/quiz/${newThreadId}`);
  };

  const getQuizHistories = async () => {
    try {
      const response = await fetch("/api/quiz?user_id=1");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        console.warn("Empty response from quiz API");
        setQuizzes([]);
        return;
      }

      const quizzes = JSON.parse(text);
      console.log("Fetched quizzes:", quizzes);
      setQuizzes(Array.isArray(quizzes) ? quizzes : []);
    } catch (error) {
      console.error("Error fetching quiz histories:", error);
      setQuizzes([]);
    }
  };

  useEffect(() => {
    getQuizHistories();
  }, []);

  if (isLoading) {
    return (
      <AssistantRuntimeProvider runtime={runtime}>
        <SidebarProvider>
          <div className="flex h-dvh w-full pr-0.5">
            <NavigationSidebar
              module="quiz"
              currentId={quizId}
              onCreateNew={createNewQuiz}
              onRefresh={getQuizHistories}
              onSwitch={switchToQuiz}
              data={quizzes}
            />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="text-sm">Loading...</div>
              </header>
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p>Loading quiz...</p>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    );
  }

  if (!quizData?.questions || quizData.questions.length === 0) {
    return (
      <AssistantRuntimeProvider runtime={runtime}>
        <SidebarProvider>
          <div className="flex h-dvh w-full pr-0.5">
            <NavigationSidebar
              module="quiz"
              currentId={quizId}
              onCreateNew={createNewQuiz}
              onRefresh={getQuizHistories}
              onSwitch={switchToQuiz}
              data={quizzes}
            />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/quiz">Quiz</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Quiz Not Found</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <div className="flex flex-1 items-center justify-center p-6">
                <Card className="mx-auto max-w-md">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">
                      Quiz Not Available
                    </CardTitle>
                    <CardDescription>
                      {quizData === null
                        ? "This quiz could not be found. It may have expired or the link is invalid."
                        : "No quiz questions were found for this quiz."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Quiz ID:{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          {quizId}
                        </code>
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => router.push("/quiz")}
                          className="w-full"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back to Quiz Selection
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.location.reload()}
                          className="w-full"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  // Debug current state when rendering
  if (showResults || isQuizCompleted) {
    console.log("=== RENDERING QUIZ ===");
    console.log("Current question index:", currentQuestion);
    console.log(
      "Current question:",
      currentQ?.question?.substring(0, 50) + "...",
    );
    console.log("Current selectedAnswers:", selectedAnswers);
    console.log("isQuizCompleted:", isQuizCompleted);
    console.log("showResults:", showResults);
    console.log("quiz status:", quizData.status);
    console.log("===================");
  }

  if (showResults) {
    console.log("Rendering results with quizData:", quizData);
    console.log("Questions for results:", quizData.questions);

    const score = calculateScore();

    // Count correct answers - use status field from Lambda if available
    const correctAnswers = quizData.questions
      ? quizData.questions.filter((question: Question) => {
          console.log(`Question status check:`, {
            question: question.question?.substring(0, 50) + "...",
            status: question.status,
            user_selected: question.user_selected,
            correct_answer: question.correct_answer,
          });
          return question.status === true;
        }).length
      : 0;

    console.log("Score:", score);
    console.log("Correct answers count:", correctAnswers);
    console.log("Total questions:", quizData.questions?.length);

    return (
      <AssistantRuntimeProvider runtime={runtime}>
        <SidebarProvider>
          <div className="flex h-dvh w-full pr-0.5">
            <NavigationSidebar
              module="quiz"
              currentId={quizId}
              onCreateNew={createNewQuiz}
              onRefresh={getQuizHistories}
              onSwitch={switchToQuiz}
              data={quizzes}
            />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/quiz">Quiz</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Results</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <div className="flex-1 p-6">
                <Card className="mx-auto max-w-2xl">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Quiz Results</CardTitle>
                    <div className="space-y-2 text-sm">
                      {quizData.title && (
                        <p className="font-medium text-foreground">
                          {quizData.title}
                        </p>
                      )}
                      <div className="flex flex-wrap justify-center gap-4 text-muted-foreground">
                        {quizData.subject && (
                          <span>
                            Subject: <strong>{quizData.subject}</strong>
                          </span>
                        )}
                        {quizData.chapter && (
                          <span>
                            Chapter: <strong>{quizData.chapter}</strong>
                          </span>
                        )}
                        {quizData.difficulty && (
                          <span>
                            Difficulty:{" "}
                            <span
                              className={`font-medium ${
                                quizData.difficulty === "easy"
                                  ? "text-green-600"
                                  : quizData.difficulty === "medium"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {quizData.difficulty.toUpperCase()}
                            </span>
                          </span>
                        )}
                      </div>
                      {Boolean(quizData.quiz_id) && (
                        <p className="text-xs text-muted-foreground">
                          Quiz ID:{" "}
                          <code className="rounded bg-muted px-1 py-0.5">
                            {quizData.quiz_id}
                          </code>
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="mb-2 text-4xl font-bold text-primary">
                        {score.toFixed(1)}%
                      </div>
                      <p className="text-lg">
                        {correctAnswers} out of {quizData.questions.length}{" "}
                        correct
                      </p>
                      {quizData.feedback && (
                        <p className="text-lg font-medium text-primary">
                          {quizData.feedback}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Time taken:{" "}
                        {formatTime(quizData.duration || timeElapsed)}
                      </p>
                      {/* Debug info - remove this in production */}
                      <div className="mt-2 border-t pt-2 text-xs text-gray-500">
                        <p>
                          Debug: Status: {quizData.status}, Score from Lambda:{" "}
                          {quizData.score}, Calculated:{" "}
                          {(
                            (correctAnswers / quizData.questions.length) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                        <p>
                          Status field available:{" "}
                          {quizData.questions.some(
                            (q: Question) => q.status !== undefined,
                          )
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Question Review:
                      </h3>
                      {quizData.questions.map((question, index) => {
                        // Get user's answer - prefer the submitted user_selected from Lambda
                        let userAnswer =
                          question.user_selected || selectedAnswers[index];

                        // If user_selected is just a key (like "A"), find the full option text
                        if (
                          userAnswer &&
                          !userAnswer.includes(")") &&
                          question.options
                        ) {
                          const matchingOption = question.options.find(
                            (option) => option.startsWith(userAnswer + ")"),
                          );
                          if (matchingOption) {
                            userAnswer = matchingOption;
                          }
                        }

                        // Extract just the key from both answers for comparison (A, B, C, D)
                        const userKey = userAnswer
                          ? userAnswer.split(")")[0].trim()
                          : "";
                        const correctKey = question.correct_answer
                          ? question.correct_answer.split(")")[0].trim()
                          : "";

                        // Use the status from Lambda if available, otherwise compare keys
                        const isCorrect =
                          question.status !== undefined
                            ? question.status
                            : userKey === correctKey;

                        console.log(`Question ${index + 1} display:`, {
                          originalUserSelected: question.user_selected,
                          fallbackSelectedAnswer: selectedAnswers[index],
                          finalUserAnswer: userAnswer,
                          userKey,
                          correctKey,
                          isCorrect,
                          status: question.status,
                          options: question.options?.slice(0, 2), // Show first 2 options for context
                        });

                        return (
                          <div key={index} className="rounded-lg border p-4">
                            <p className="mb-2 font-medium">
                              {index + 1}. {question.question}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="font-medium">
                                  Your answer:
                                </span>{" "}
                                <span
                                  className={
                                    isCorrect
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {userAnswer || "Not answered"}
                                </span>
                              </p>
                              <p>
                                <span className="font-medium">
                                  Correct answer:
                                </span>{" "}
                                <span className="text-green-600">
                                  {question.correct_answer}
                                </span>
                              </p>
                              {question.explanation && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">
                                    Explanation:
                                  </span>{" "}
                                  {question.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={() => router.push("/quiz")}
                        variant="outline"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Quiz Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    );
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <NavigationSidebar
            module="quiz"
            currentId={quizId}
            onCreateNew={createNewQuiz}
            onRefresh={getQuizHistories}
            onSwitch={switchToQuiz}
            data={quizzes}
          />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/quiz">Quiz</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  {quizData.chapter && (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbPage className="max-w-[200px] truncate">
                          {quizData.chapter}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  )}
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      Question {currentQuestion + 1} of{" "}
                      {quizData.questions.length}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(timeElapsed)}
                </div>
                {quizData.subject && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {quizData.subject}
                  </div>
                )}
                {quizData.difficulty && (
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        quizData.difficulty === "easy"
                          ? "bg-green-100 text-green-800"
                          : quizData.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {quizData.difficulty.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </header>
            <div className="flex-1 p-6">
              <Card className="mx-auto max-w-2xl">
                <CardHeader>
                  {(showResults || isQuizCompleted) && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Preview Mode - This quiz has been completed
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Question {currentQuestion + 1} of{" "}
                        {quizData.questions.length}
                      </CardTitle>
                      {(quizData.subject || quizData.chapter) && (
                        <CardDescription className="mt-1">
                          {quizData.subject && `${quizData.subject}`}
                          {quizData.subject && quizData.chapter && " • "}
                          {quizData.chapter && `${quizData.chapter}`}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {Math.round(
                          ((currentQuestion + 1) / quizData.questions.length) *
                            100,
                        )}
                        % Complete
                      </div>
                      {quizData.difficulty && (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              quizData.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : quizData.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {quizData.difficulty.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h2 className="mb-4 text-lg font-medium">
                      {currentQ.question}
                    </h2>
                    <div className="space-y-2">
                      {currentQ.options.map((option, index) => {
                        const isSelected =
                          selectedAnswers[currentQuestion] === option;
                        const isCorrect = currentQ.correct_answer === option;

                        // Debug logging for completed quizzes
                        if (showResults || isQuizCompleted) {
                          console.log(
                            `Question ${currentQuestion + 1}, Option "${option}":`,
                            {
                              isSelected,
                              isCorrect,
                              currentUserAnswer:
                                selectedAnswers[currentQuestion],
                              selectedAnswersArray: selectedAnswers,
                              exactMatch:
                                selectedAnswers[currentQuestion] === option,
                              optionLength: option.length,
                              userAnswerLength:
                                selectedAnswers[currentQuestion]?.length || 0,
                            },
                          );
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={showResults || isQuizCompleted}
                            className={`w-full rounded-lg border p-4 text-left transition-colors ${
                              showResults || isQuizCompleted
                                ? // For completed quizzes, show correct/incorrect styling
                                  isCorrect
                                  ? "border-green-500 bg-green-50 text-green-900" // Correct answer
                                  : isSelected
                                    ? "border-red-500 bg-red-50 text-red-900" // User's wrong answer
                                    : "cursor-not-allowed border-muted bg-muted/20 text-muted-foreground"
                                : // For active quizzes
                                  isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center">
                                <span className="mr-2 font-medium">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                {option}
                              </div>
                              {(showResults || isQuizCompleted) && (
                                <div className="ml-2 flex-shrink-0">
                                  {isCorrect ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : isSelected ? (
                                    <X className="h-4 w-4 text-red-600" />
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      disabled={currentQuestion === 0 || isQuizCompleted}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentQuestion === quizData.questions.length - 1 ? (
                      showResults || isQuizCompleted ? (
                        <div className="text-sm font-medium text-muted-foreground">
                          Preview Mode - Quiz Completed
                        </div>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            !selectedAnswers[currentQuestion] ||
                            isSubmitting ||
                            isQuizCompleted
                          }
                        >
                          {isSubmitting ? "Submitting..." : "Submit Quiz"}
                        </Button>
                      )
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={
                          (!showResults && !selectedAnswers[currentQuestion]) ||
                          isQuizCompleted
                        }
                      >
                        Next
                        <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}
