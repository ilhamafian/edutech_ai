"use client";

import { useState } from "react";
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
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Define subjects and their quiz options
const subjects = {
  math: {
    name: "SPM Computer Science",
    icon: Code,
    color: "bg-blue-500",
    quizzes: [
      "Pengkomputeran",
      "Pangkalan Data Lanjutan",
      "Pengaturcaraan Berasaskan WebChapter 3",
    ],
  },
};

type SubjectKey = keyof typeof subjects;

interface QuizConfig {
  subject: string;
  quizName: string;
  totalQuestions: number;
  difficulty: string;
}

export default function QuizPage() {
  const [currentSubject, setCurrentSubject] = useState<SubjectKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<{
    subject: string;
    quiz: string;
  } | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    subject: "",
    quizName: "",
    totalQuestions: 10,
    difficulty: "medium",
  });

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  const handleSubjectClick = (subjectKey: SubjectKey) => {
    setCurrentSubject(subjectKey);
  };

  const handleBackToSubjects = () => {
    setCurrentSubject(null);
  };

  const handleQuizClick = (subjectKey: string, quizName: string) => {
    setSelectedQuiz({ subject: subjectKey, quiz: quizName });
    setQuizConfig({
      subject: subjectKey,
      quizName: quizName,
      totalQuestions: 10,
      difficulty: "medium",
    });
    setIsModalOpen(true);
  };

  const handleStartQuiz = () => {
    console.log("Starting quiz with config:", quizConfig);
    // Here you would navigate to the actual quiz or make an API call
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
  };

  const renderBreadcrumb = () => {
    if (currentSubject) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={handleBackToSubjects}
                className="cursor-pointer hover:text-foreground"
              >
                Quiz
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subjects[currentSubject].name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Quiz - Select Subject</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  const renderContent = () => {
    if (currentSubject) {
      const subject = subjects[currentSubject];
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSubjects}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Subjects
            </Button>
          </div>
          <div className="grid h-full grid-cols-4 gap-4">
            {subject.quizzes.map((quiz, index) => {
              const IconComponent = subject.icon;
              return (
                <div
                  key={index}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                  onClick={() => handleQuizClick(currentSubject, quiz)}
                >
                  <div className={`rounded-lg p-3 ${subject.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-center text-sm leading-tight">
                    {quiz}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Show subjects grid
    return (
      <div className="grid h-48 grid-cols-4 gap-4">
        {Object.entries(subjects).map(([key, subject]) => {
          const IconComponent = subject.icon;
          return (
            <div
              key={key}
              className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
              onClick={() => handleSubjectClick(key as SubjectKey)}
            >
              <div className={`rounded-lg p-4 ${subject.color} text-white`}>
                <IconComponent className="h-8 w-8" />
              </div>
              <span className="text-center font-semibold text-foreground">
                {subject.name}
              </span>
              <span className="text-center text-xs text-muted-foreground">
                {subject.quizzes.length} quizzes available
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {renderBreadcrumb()}
            </header>
            <div className="flex-1 p-6">{renderContent()}</div>
          </SidebarInset>
        </div>

        {/* Quiz Configuration Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Quiz</DialogTitle>
              <DialogDescription>
                Set up your quiz for &quot;{selectedQuiz?.quiz}&quot; in{" "}
                {selectedQuiz &&
                  subjects[selectedQuiz.subject as SubjectKey]?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="total-questions"
                  className="text-right text-sm font-medium"
                >
                  Total Questions
                </label>
                <Input
                  id="total-questions"
                  type="number"
                  min="1"
                  max="50"
                  value={quizConfig.totalQuestions}
                  onChange={(e) =>
                    setQuizConfig({
                      ...quizConfig,
                      totalQuestions: parseInt(e.target.value) || 1,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="difficulty"
                  className="text-right text-sm font-medium"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={quizConfig.difficulty}
                  onChange={(e) =>
                    setQuizConfig({
                      ...quizConfig,
                      difficulty: e.target.value,
                    })
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button onClick={handleStartQuiz}>Start Quiz</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}
