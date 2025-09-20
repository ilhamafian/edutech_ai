"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpIcon,
  BookOpen,
  ChartLine,
  Github,
  ListCheck,
  MessagesSquare,
  MessageSquareIcon,
  PlusIcon,
  TrashIcon,
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
  messages: Message[];
  lastMessage?: string;
  createdAt: Date;
}

export const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const createNewThread = () => {
    const newThreadId = Date.now().toString();
    const newThread: ChatThread = {
      id: newThreadId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    };
    
    setThreads(prev => [newThread, ...prev]);
    setCurrentThreadId(newThreadId);
    setMessages([]);
  };

  const switchToThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setCurrentThreadId(threadId);
      setMessages(thread.messages);
    }
  };

  const deleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (currentThreadId === threadId) {
      setCurrentThreadId(null);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Create new thread if none exists
    let threadId = currentThreadId;
    if (!threadId) {
      threadId = Date.now().toString();
      const newThread: ChatThread = {
        id: threadId,
        title: input.trim().slice(0, 30) + (input.trim().length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
      };
      setThreads(prev => [newThread, ...prev]);
      setCurrentThreadId(threadId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            id: userMessage.id,
            role: userMessage.role,
            parts: [{ type: "text", text: userMessage.content }],
          }],
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: data.id,
        role: "assistant",
        content: data.content,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Update thread with new messages and title if it's the first message
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? {
              ...thread,
              messages: updatedMessages,
              lastMessage: assistantMessage.content.slice(0, 50) + "...",
              title: thread.title === "New Chat" ? userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : "") : thread.title
            }
          : thread
      ));
      
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      
      // Update thread with error message
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, messages: updatedMessages }
          : thread
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full pr-0.5">
        {/* Custom Sidebar */}
        <Sidebar>
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
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <BookOpen className="size-4"/>
                      <span>Ask Tutor</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/quiz">
                      <ListCheck className="size-4"/>
                      <span>Quiz</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/analytics">
                      <ChartLine className="size-4"/>
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <div className="flex items-center justify-between">
                <SidebarGroupLabel>Chats</SidebarGroupLabel>
                <Button
                  onClick={createNewThread}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <SidebarMenu className="space-y-1">
                {threads.map((thread) => (
                  <SidebarMenuItem key={thread.id}>
                    <div className="group relative flex items-center">
                      <SidebarMenuButton
                        onClick={() => switchToThread(thread.id)}
                        className={`flex-1 ${currentThreadId === thread.id ? 'bg-sidebar-accent' : ''}`}
                      >
                        <MessageSquareIcon className="size-4" />
                        <span className="truncate">{thread.title}</span>
                      </SidebarMenuButton>
                      <button
                        onClick={(e) => deleteThread(thread.id, e)}
                        className="absolute right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded hover:bg-sidebar-accent"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
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

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="https://www.assistant-ui.com/docs/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ask Tutor
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Chat</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-2xl font-semibold mb-2">Welcome to your AI Tutor!</h2>
                  <p className="text-muted-foreground">Ready to learn? Ask me anything!</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-3xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground max-w-[80%] rounded-3xl px-4 py-2">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send a message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
