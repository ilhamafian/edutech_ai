"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Clock, BookOpen } from "lucide-react";
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
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface QuizData {
  questions?: Question[];
  title?: string;
  subject?: string;
  chapter?: string;
  difficulty?: string;
  // Handle case where the response might be a string
  [key: string]: unknown;
}

interface QuizThread {
  id: string;
  title: string;
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
  
  // Get quiz ID from params
  const quizId = params.id as string;
  
  // State for sidebar functionality
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizThread[]>([]);

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  useEffect(() => {
    // Load quiz data from sessionStorage
    const storedQuiz = sessionStorage.getItem(`quiz-${quizId}`);

    if (storedQuiz) {
      try {
        let parsedQuiz = JSON.parse(storedQuiz);

        // Handle case where the response might be a string that needs parsing
        if (typeof parsedQuiz === "string") {
          parsedQuiz = JSON.parse(parsedQuiz);
        }

        console.log("Loaded quiz data:", parsedQuiz);
        setQuizData(parsedQuiz);

        // Initialize selected answers array
        if (parsedQuiz.questions) {
          setSelectedAnswers(new Array(parsedQuiz.questions.length).fill(""));
        }
      } catch (error) {
        console.error("Error parsing quiz data:", error);
        alert("Error loading quiz data");
        router.push("/quiz");
      }
    } else {
      alert("Quiz not found");
      router.push("/quiz");
    }

    setIsLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (answer: string) => {
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

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!quizData?.questions) return 0;

    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });

    return (correct / quizData.questions.length) * 100;
  };

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
      setIsLoadingQuizzes(true);
      const response = await fetch("/api/quiz");
      
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
    } finally {
      setIsLoadingQuizzes(false);
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
                      <BreadcrumbPage>Error</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="text-center">
                  <p className="mb-4 text-lg">No quiz questions found</p>
                  <Button onClick={() => router.push("/quiz")}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Quiz Selection
                  </Button>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  if (showResults) {
    const score = calculateScore();
    const correctAnswers = quizData.questions.filter(
      (question, index) => selectedAnswers[index] === question.correct_answer,
    ).length;

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
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {quizData.subject && <p>Subject: {quizData.subject}</p>}
                    {quizData.chapter && <p>Chapter: {quizData.chapter}</p>}
                    {quizData.difficulty && (
                      <p>Difficulty: {quizData.difficulty}</p>
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
                    <p className="text-sm text-muted-foreground">
                      Time taken: {formatTime(timeElapsed)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Question Review:</h3>
                    {quizData.questions.map((question, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <p className="mb-2 font-medium">
                          {index + 1}. {question.question}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Your answer:</span>{" "}
                            <span
                              className={
                                selectedAnswers[index] ===
                                question.correct_answer
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {selectedAnswers[index] || "Not answered"}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Correct answer:</span>{" "}
                            <span className="text-green-600">
                              {question.correct_answer}
                            </span>
                          </p>
                          {question.explanation && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Explanation:</span>{" "}
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => router.push("/quiz")}
                      variant="outline"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Quiz Selection
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Retake Quiz
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
              </div>
            </header>
          <div className="flex-1 p-6">
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    Question {currentQuestion + 1} of{" "}
                    {quizData.questions.length}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(
                      ((currentQuestion + 1) / quizData.questions.length) * 100,
                    )}
                    % Complete
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
                    {currentQ.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full rounded-lg border p-4 text-left transition-colors ${
                          selectedAnswers[currentQuestion] === option
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span className="mr-2 font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentQuestion === quizData.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedAnswers[currentQuestion]}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!selectedAnswers[currentQuestion]}
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
