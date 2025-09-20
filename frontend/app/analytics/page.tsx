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
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Award,
  Brain
} from "lucide-react";

// Mock data for analytics
const mockAnalyticsData = {
  overallPerformance: {
    totalQuizzes: 24,
    averageScore: 78.5,
    totalTimeSpent: 480, // minutes
    improvementRate: 12.3,
  },
  recentQuizzes: [
    { chapter: "Chapter 1", score: 85, timeSpent: 25, difficulty: "Easy", date: "2024-01-15" },
    { chapter: "Chapter 2", score: 72, timeSpent: 32, difficulty: "Medium", date: "2024-01-14" },
    { chapter: "Chapter 3", score: 90, timeSpent: 28, difficulty: "Easy", date: "2024-01-13" },
    { chapter: "Chapter 4", score: 65, timeSpent: 45, difficulty: "Hard", date: "2024-01-12" },
    { chapter: "Chapter 5", score: 88, timeSpent: 30, difficulty: "Medium", date: "2024-01-11" },
  ],
  timeAnalysis: {
    averageTimePerQuiz: 30,
    fastestCompletion: 18,
    slowestCompletion: 52,
    timeByDifficulty: {
      easy: 22,
      medium: 35,
      hard: 48,
    },
  },
  difficultyAnalysis: {
    easy: { attempted: 8, correct: 7, accuracy: 87.5 },
    medium: { attempted: 12, correct: 9, accuracy: 75.0 },
    hard: { attempted: 4, correct: 2, accuracy: 50.0 },
  },
  strengths: ["Data Structures", "Algorithms", "Programming Logic"],
  weaknesses: ["Database Management", "Network Security", "System Design"],
};

export default function AnalyticsPage() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Analytics - Quiz Performance</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            
            <div className="flex-1 p-6 space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                      <p className="text-2xl font-bold">{mockAnalyticsData.overallPerformance.totalQuizzes}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">{mockAnalyticsData.overallPerformance.averageScore}%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                      <p className="text-2xl font-bold">{Math.floor(mockAnalyticsData.overallPerformance.totalTimeSpent / 60)}h {mockAnalyticsData.overallPerformance.totalTimeSpent % 60}m</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                      <p className="text-2xl font-bold">+{mockAnalyticsData.overallPerformance.improvementRate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              {/* Recent Quiz Performance */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Quiz Performance
                </h3>
                <div className="space-y-3">
                  {mockAnalyticsData.recentQuizzes.map((quiz, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getDifficultyColor(quiz.difficulty)}`}></div>
                        <div>
                          <p className="font-medium">{quiz.chapter}</p>
                          <p className="text-sm text-muted-foreground">{quiz.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className={`font-bold ${getScoreColor(quiz.score)}`}>{quiz.score}%</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{quiz.timeSpent}m</p>
                          <p className="text-xs text-muted-foreground">Time</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">{quiz.difficulty}</p>
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time Analysis */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average per Quiz</span>
                      <span className="font-medium">{mockAnalyticsData.timeAnalysis.averageTimePerQuiz} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fastest Completion</span>
                      <span className="font-medium text-green-600">{mockAnalyticsData.timeAnalysis.fastestCompletion} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Slowest Completion</span>
                      <span className="font-medium text-red-600">{mockAnalyticsData.timeAnalysis.slowestCompletion} minutes</span>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Time by Difficulty</p>
                      <div className="space-y-2">
                        {Object.entries(mockAnalyticsData.timeAnalysis.timeByDifficulty).map(([level, time]) => (
                          <div key={level} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level)}`}></div>
                            <span className="text-sm capitalize flex-1">{level}</span>
                            <span className="font-medium">{time}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Question Difficulty Analysis */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Question Difficulty Analysis
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(mockAnalyticsData.difficultyAnalysis).map(([level, stats]) => (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level)}`}></div>
                            <span className="font-medium capitalize">{level}</span>
                          </div>
                          <span className={`font-bold ${getScoreColor(stats.accuracy)}`}>
                            {stats.accuracy}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getDifficultyColor(level)}`}
                            style={{ width: `${stats.accuracy}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stats.correct}/{stats.attempted} questions correct
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Strengths
                  </h3>
                  <div className="space-y-2">
                    {mockAnalyticsData.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-2">
                    {mockAnalyticsData.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}
