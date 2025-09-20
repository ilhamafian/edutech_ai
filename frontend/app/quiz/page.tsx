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

// Define subjects and their quiz options
const subjects = {
  math: {
    name: "SPM Computer Science",
    icon: Code,
    color: "bg-blue-500",
    quizzes: [
      "Chapter 1",
      "Chapter 2",
      "Chapter 3",
      "Chapter 4",
      "Chapter 5",
      "Chapter 6",
      "Chapter 7",
      "Chapter 8",
    ],
  },
};

type SubjectKey = keyof typeof subjects;

export default function QuizPage() {
  const [currentSubject, setCurrentSubject] = useState<SubjectKey | null>(null);

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
                  onClick={() => console.log(`Starting ${quiz} quiz`)}
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
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}
