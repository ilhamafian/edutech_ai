"use client";

import { useEffect, useState } from "react";
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
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  Brain
} from "lucide-react";

interface QuizPerformance {
  subject: string;
  chapter: string;
  score: number;
  time_seconds: number;
  level: string;
  completed_at: string;
}

interface AnalyticsData {
  total_quizzes: number;
  average_score: number;
  total_time_seconds: number;
  improvement_vs_previous_quiz: number;
  recent_quiz_performance: QuizPerformance[];
  time_analysis: {
    average_time_per_quiz: number;
    fastest_completion_seconds: number;
    slowest_completion_seconds: number;
    time_by_difficulty: {
      [key: string]: {
        average_time_seconds: number;
      };
    };
  };
  question_difficulty_analysis: {
    [key: string]: {
      correct_answers: number;
      total_questions: number;
      accuracy_percentage: number;
    };
  };
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

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

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAnalyticsData = async () => {
    try {
        setIsLoading(true);
        const response = await fetch("/api/analytics?user_id=1");
        const data = await response.json() as AnalyticsData;
        console.log("Analytics data:", data);
        setAnalyticsData(data);
    } catch (error) {
        console.error("Error fetching analytics data:", error);
    }finally{
        setIsLoading(false);
    }
  };

  useEffect(() => {
    getAnalyticsData();
  }, []);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <NavigationSidebar module="analytics" />
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
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading analytics data...</p>
                </div>
              ) : analyticsData ? (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                          <p className="text-2xl font-bold">{analyticsData.total_quizzes}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-500" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                          <p className="text-2xl font-bold">{analyticsData.average_score.toFixed(1)}%</p>
                        </div>
                        <Target className="h-8 w-8 text-green-500" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                          <p className="text-2xl font-bold">{Math.floor(analyticsData.total_time_seconds / 60)}m {analyticsData.total_time_seconds % 60}s</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                          <p className="text-2xl font-bold">+{analyticsData.improvement_vs_previous_quiz}%</p>
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
                      {analyticsData.recent_quiz_performance.length > 0 ? (
                        analyticsData.recent_quiz_performance.map((quiz, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${getDifficultyColor(quiz.level)}`}></div>
                              <div>
                                <p className="font-medium">{quiz.subject}</p>
                                <p className="text-sm text-muted-foreground">{quiz.chapter}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(quiz.completed_at).toLocaleDateString()} at {new Date(quiz.completed_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center w-16">
                                <p className={`font-bold ${getScoreColor(quiz.score)}`}>{quiz.score}%</p>
                                <p className="text-xs text-muted-foreground">Score</p>
                              </div>
                              <div className="text-center w-16">
                                <p className="font-medium">{quiz.time_seconds}s</p>
                                <p className="text-xs text-muted-foreground">Time</p>
                              </div>
                              <div className="text-center w-16">
                                <p className={`font-medium capitalize ${getDifficultyTextColor(quiz.level)}`}>{quiz.level}</p>
                                <p className="text-xs text-muted-foreground">Level</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No recent quiz performance data available
                        </div>
                      )}
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
                          <span className="font-medium">{analyticsData.time_analysis.average_time_per_quiz.toFixed(1)} seconds</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Fastest Completion</span>
                          <span className="font-medium text-green-600">{analyticsData.time_analysis.fastest_completion_seconds} seconds</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Slowest Completion</span>
                          <span className="font-medium text-red-600">{analyticsData.time_analysis.slowest_completion_seconds} seconds</span>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-3">Time by Difficulty</p>
                          <div className="space-y-2">
                            {Object.entries(analyticsData.time_analysis.time_by_difficulty).map(([level, data]) => (
                              <div key={level} className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level)}`}></div>
                                <span className={`text-sm capitalize flex-1 ${getDifficultyTextColor(level)}`}>{level}</span>
                                <span className="font-medium">{data.average_time_seconds}s</span>
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
                        {Object.entries(analyticsData.question_difficulty_analysis).map(([level, stats]) => (
                          <div key={level} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level)}`}></div>
                                <span className={`font-medium capitalize ${getDifficultyTextColor(level)}`}>{level}</span>
                              </div>
                              <span className={`font-bold ${getScoreColor(stats.accuracy_percentage)}`}>
                                {stats.accuracy_percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getDifficultyColor(level)}`}
                                style={{ width: `${stats.accuracy_percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {stats.correct_answers}/{stats.total_questions} questions correct
                            </p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p>No analytics data available</p>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}
