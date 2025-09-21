"use client";

import { useState, useEffect } from "react";
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
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavigationSidebar } from "@/components/ui/navigation-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpIcon,
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
  createdAt: Date;
}

interface DynamoDBChatItem {
  id: string; // session_id 
  title: string;
  // Messages are no longer included in the chat history response
  // They are fetched separately when clicking on a chat
}

export const Assistant = () => {
  // Hardcoded value for debugging
  const HARDCODED_USER_ID = "1";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const createNewThread = () => {
    const newThreadId = crypto.randomUUID();
    const newThread: ChatThread = {
      id: newThreadId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    };

    setThreads((prev) => [newThread, ...prev]);
    setCurrentThreadId(newThreadId);
    setMessages([]);
  };

  const fetchMessagesForSession = async (sessionId: string) => {
    try {
      setIsLoadingMessages(true);
      console.log("Fetching messages for session:", sessionId);

      const response = await fetch(`/api/chat?session_id=${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const messages = await response.json();
      console.log("Fetched messages:", messages);

      // Convert API messages to our Message format
      const formattedMessages: Message[] = messages.map(
        (msg: {
          id?: string;
          role: string;
          content: string;
          timestamp?: string;
        }) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }),
      );

      return formattedMessages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const switchToThread = async (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setCurrentThreadId(threadId);

      // If thread already has messages, use them, otherwise fetch from API
      if (thread.messages && thread.messages.length > 0) {
        setMessages(thread.messages);
      } else {
        const fetchedMessages = await fetchMessagesForSession(threadId);
        setMessages(fetchedMessages);

        // Update the thread with fetched messages
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, messages: fetchedMessages } : t,
          ),
        );
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Create new thread if none exists
    let threadId = currentThreadId;
    if (!threadId) {
      threadId = crypto.randomUUID();
      const newThread: ChatThread = {
        id: threadId,
        title:
          input.trim().slice(0, 30) + (input.trim().length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
      };
      setThreads((prev) => [newThread, ...prev]);
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
      const requestBody = {
        prompt: userMessage.content, // ✅ match Lambda param
        user_id: HARDCODED_USER_ID, // ✅ hardcoded for debugging
        session_id: threadId, // ✅ use current thread ID
      };
      console.log("Sending request to /api/chat:", requestBody);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Backend error ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data from Lambda:", data);

      // Handle session_id returned from Lambda
      const backendSessionId = data.session_id;
      if (backendSessionId && backendSessionId !== threadId) {
        // Update the current thread ID if Lambda created a new session_id
        setCurrentThreadId(backendSessionId);
        threadId = backendSessionId;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response || "No response",
      };

      console.log("Created assistant message:", assistantMessage);

      const updatedMessages = [...newMessages, assistantMessage];
      console.log("Updating messages to:", updatedMessages);
      setMessages(updatedMessages);

      // Update thread with new messages and title if it's the first message
      setThreads((prev) =>
        prev.map((thread) => {
          // Handle both old threadId and new backendSessionId
          if (thread.id === currentThreadId || thread.id === threadId) {
            return {
              ...thread,
              id: backendSessionId || threadId, // Update thread ID to match backend session_id
              messages: updatedMessages,
              title:
                thread.title === "New Chat"
                  ? userMessage.content.slice(0, 30) +
                    (userMessage.content.length > 30 ? "..." : "")
                  : thread.title,
            };
          }
          return thread;
        }),
      );

      // Refresh chat histories to sync with backend
      getChatHistories();
    } catch (error) {
      console.error("Error in sendMessage:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);

      // Update thread with error message
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThreadId || thread.id === threadId
            ? { ...thread, messages: updatedMessages }
            : thread,
        ),
      );
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

  const getChatHistories = async () => {
    try {
      console.log("Getting chat histories for user:", HARDCODED_USER_ID);

      const response = await fetch("/api/chat", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: DynamoDBChatItem[] = await response.json();
      console.log("Chat histories from DynamoDB:", data);
      console.log("First item structure:", data[0]);

      // Convert DynamoDB items to ChatThread format
      const chatThreads: ChatThread[] = data.map((item, index) => {
        console.log(`Processing item ${index}:`, item);

        return {
          id: item.id,
          title: item.title,
          messages: [], // Messages are fetched separately when user clicks on chat
          createdAt: new Date(), // We don't have created_at in the simplified response
        };
      });

      // Keep the order as returned by the API (assuming it's already sorted)
      setThreads(chatThreads);
    } catch (error) {
      console.error("Error fetching chat histories:", error);
    }
  };

  useEffect(() => {
    getChatHistories();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full pr-0.5">
        <NavigationSidebar  
          module="chats"
          currentId={currentThreadId}
          onCreateNew={createNewThread}
          onRefresh={getChatHistories}
          onSwitch={switchToThread}
          data={threads}
        />

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

          <div className="mx-auto flex w-[80%] flex-1 flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {isLoadingMessages && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-2 text-lg font-semibold">
                    Loading messages...
                  </div>
                  <p className="text-muted-foreground">
                    Fetching conversation history
                  </p>
                </div>
              )}

              {!isLoadingMessages &&
                messages.length === 0 &&
                !currentThreadId && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <h2 className="mb-2 text-2xl font-semibold">
                      Welcome to your AI Tutor!
                    </h2>
                    <p className="text-muted-foreground">
                      Ready to learn? Ask me anything!
                    </p>
                  </div>
                )}

              {!isLoadingMessages &&
                messages.length === 0 &&
                currentThreadId && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <h2 className="mb-2 text-xl font-semibold">
                      No messages yet
                    </h2>
                    <p className="text-muted-foreground">
                      This conversation is empty
                    </p>
                  </div>
                )}

              {!isLoadingMessages &&
                messages.map((message) => (
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
                  <div className="max-w-[80%] rounded-3xl bg-muted px-4 py-2 text-foreground">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="mx-auto flex max-w-4xl gap-2">
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
