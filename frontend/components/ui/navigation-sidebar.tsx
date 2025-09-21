"use client";

// Remove unused imports
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  ChartLine,
  Github,
  ListCheck,
  MessagesSquare,
  MessageSquareIcon,
  PlusIcon,
  RefreshCwIcon,
  FileText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatThread {
  id: string;
  title: string;
  chapter?: string;
  score?: number;
  createdAt: Date | string;
}

interface DynamoDBChatItem {
  id?: string;
  session_id?: string;
  user_id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messages?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  [key: string]: string | number | boolean | undefined | Array<unknown>;
}

type ModuleType = "chats" | "quiz" | "analytics";

interface NavigationSidebarProps {
  // Module determines the sidebar behavior and active state
  module?: ModuleType;
  // Optional props for chat functionality
  currentId?: string | null;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  onSwitch?: (threadId: string) => void;
  showChatSection?: boolean;
  // Data to display in the sidebar (overrides mock data when provided)
  data?: ChatThread[];
}

export function NavigationSidebar({
  module = "chats",
  currentId = null,
  onCreateNew,
  onRefresh,
  onSwitch,
  showChatSection = false,
  data,
  ...props
}: NavigationSidebarProps & React.ComponentProps<typeof Sidebar>) {
  // Mock data for different modules
  const getMockData = (): ChatThread[] => {
    switch (module) {
      case "chats":
        return [
          // {
          //   id: "chat-1",
          //   title: "Help with JavaScript Arrays",
          //   messages: [],
          //   createdAt: new Date("2024-01-15T10:30:00")
          // },
          // {
          //   id: "chat-2",
          //   title: "Python Data Structures Explained",
          //   messages: [],
          //   createdAt: new Date("2024-01-14T14:20:00")
          // },
          // {
          //   id: "chat-3",
          //   title: "React Hooks Best Practices",
          //   messages: [],
          //   createdAt: new Date("2024-01-13T16:45:00")
          // },
          // {
          //   id: "chat-4",
          //   title: "Database Design Fundamentals",
          //   messages: [],
          //   createdAt: new Date("2024-01-12T09:15:00")
          // }
        ];

      case "quiz":
        return [];

      case "analytics":
        return [
          {
            id: "analytics-1",
            title: "Weekly Performance Report",
            createdAt: new Date("2024-01-15T09:00:00"),
          },
          {
            id: "analytics-2",
            title: "Learning Progress - January",
            createdAt: new Date("2024-01-08T12:00:00"),
          },
          {
            id: "analytics-3",
            title: "Quiz Performance Analysis",
            createdAt: new Date("2024-01-01T08:30:00"),
          },
        ];

      default:
        return [];
    }
  };

  // Use provided data if available, otherwise fall back to mock data
  const threads = data || getMockData();

  // Determine which section to show chats based on module
  const shouldShowChats =
    showChatSection || module === "chats" || threads.length > 0;

  // Helper function to determine if a navigation item is active
  const isNavActive = (navModule: ModuleType) => {
    return module === navModule;
  };
  return (
    <Sidebar {...props}>
      <SidebarHeader className="mb-2 border-b">
        <div className="flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <MessagesSquare className="size-4" />
                  </div>
                  <div className="mr-6 flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">TemanTutor</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={
                  isNavActive("chats")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }
              >
                <Link href="/">
                  <BookOpen className="size-4" />
                  <span>Ask Tutor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={
                  isNavActive("quiz")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }
              >
                <Link href="/quiz">
                  <ListCheck className="size-4" />
                  <span>Quiz</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={
                  isNavActive("analytics")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }
              >
                <Link href="/analytics">
                  <ChartLine className="size-4" />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {shouldShowChats && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>
                {module === "chats"
                  ? "Chats"
                  : module === "quiz"
                    ? "Quiz History"
                    : "Analytics"}
              </SidebarGroupLabel>
              <div className="flex gap-1">
                {onCreateNew && (
                  <Button
                    onClick={onCreateNew}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    title={
                      module === "chats"
                        ? "New Chat"
                        : module === "quiz"
                          ? "New Quiz"
                          : "New Analysis"
                    }
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                )}
                {onRefresh && (
                  <Button
                    onClick={onRefresh}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    title={
                      module === "chats"
                        ? "Refresh Chats"
                        : module === "quiz"
                          ? "Refresh History"
                          : "Refresh Analytics"
                    }
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <SidebarMenu className="space-y-1">
              {threads.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {module === "chats"
                    ? "No chat history yet"
                    : module === "quiz"
                      ? "No quiz history yet"
                      : "No analytics data yet"}
                </div>
              ) : (
                threads.map((thread) => {
                  // Choose icon based on module type
                  const IconComponent =
                    module === "chats"
                      ? MessageSquareIcon
                      : module === "quiz"
                        ? FileText
                        : TrendingUp;

                  return (
                    <SidebarMenuItem key={thread.id}>
                      <div className="group relative flex items-center py-2">
                        <SidebarMenuButton
                          onClick={() => onSwitch?.(thread.id)}
                          className={`flex-1 justify-start gap-2 ${
                            currentId === thread.id ? "bg-sidebar-accent" : ""
                          }`}
                        >
                          <IconComponent className="size-4 flex-shrink-0" />
                          <div className="flex min-w-0 flex-1 flex-col items-start">
                            <span className="truncate text-sm font-medium">
                              {module === "quiz" && thread.chapter
                                ? thread.chapter
                                : thread.title}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {module === "quiz" && thread.score !== undefined
                                ? `Score: ${thread.score}%`
                                : new Date(
                                    thread.createdAt,
                                  ).toLocaleDateString()}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </div>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="https://github.com/assistant-ui/assistant-ui"
                target="_blank"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Github className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">GitHub</span>
                  <span>View Source</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
