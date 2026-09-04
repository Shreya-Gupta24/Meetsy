"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { UserAvatar } from "../ui/user-avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useClearChat, useDeleteMessage } from "@/hooks/useConversations";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Trash2Icon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

export default function ChatInterface({ matchId }: { matchId: string }) {
  const { user: clerkUser } = useUser();
  const [message, setMessage] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearChatMutation = useClearChat();
  const deleteMessageMutation = useDeleteMessage();

  //fetch the conversation for the match
  const { data: conversation } = useQuery({
    queryKey: ["conversation", matchId],
    queryFn: async () => {
      const res = await client.api.matches[":matchId"].conversation.$get({
        param: { matchId },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch conversation");
      }
      return res.json();
    },
  });

  //fetch the messages for the conversation
  const { data: messages } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: async () => {
      const res = await client.api.conversations[
        ":conversationId"
      ].messages.$get({
        param: { conversationId: conversation!.id },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      return res.json();
    },
    enabled: !!conversation?.id,
    refetchInterval: 5000, // poll every 5 seconds
  });

  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      const res = await client.api.conversations[
        ":conversationId"
      ].messages.$post({
        param: { conversationId: conversation!.id },
        // @ts-expect-error - content is not defined in the API client
        json: { content: message },
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({
        queryKey: ["messages", conversation?.id],
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.conversations[
        ":conversationId"
      ].summarize.$post({
        param: { conversationId: conversation!.id },
      });

      if (!res.ok) {
        // Extract the exact error message sent by the backend
        const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = typeof errorData?.error === "string"
          ? errorData.error
          : `HTTP ${res.status}: Failed to generate summary`;
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["summary", conversation?.id],
      });
    },
    onError: (error: Error) => {
      console.error("Summary generation error:", error.message);
    },
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", conversation?.id],
    queryFn: async () => {
      const res = await client.api.conversations[
        ":conversationId"
      ].summary.$get({
        param: { conversationId: conversation!.id },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch summary");
      }
      return res.json();
    },
    enabled: !!conversation?.id,
  });

  const handleClearChat = async () => {
    if (!conversation?.id) return;
    try {
      await clearChatMutation.mutateAsync(conversation.id);
      toast.success("Chat history cleared");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to clear chat");
    } finally {
      setShowClearConfirm(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversation?.id) return;
    try {
      await deleteMessageMutation.mutateAsync({
        conversationId: conversation.id,
        messageId,
      });
      toast.success("Message deleted");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete message");
    }
  };

  if (!conversation) {
    return <div>Loading...</div>;
  }

  const otherUser = {
    id: conversation.otherUser.id,
    name: conversation.otherUser.name,
    imageUrl: conversation.otherUser.imageUrl,
  };

  const currentUser = {
    name: (clerkUser?.firstName + " " + clerkUser?.lastName).trim() ?? "You",
    imageUrl: clerkUser?.imageUrl ?? undefined,
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card className="h-150 flex flex-col">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={otherUser.name}
                  imageUrl={otherUser.imageUrl ?? undefined}
                />
                <CardTitle>{otherUser.name}</CardTitle>
              </div>
              {messages && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive text-xs gap-1.5"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear chat history"
                >
                  <Trash2Icon className="size-3.5" />
                  Clear Chat
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages && messages.length > 0 ? (
                messages.map((msg: any) => {
                  const isCurrentUser =
                    msg.senderId === conversation.currentUserId;
                  const user = isCurrentUser ? currentUser : otherUser;
                  return (
                    <div key={msg.id} className="space-y-4 group">
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          isCurrentUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isCurrentUser && (
                          <UserAvatar
                            name={user?.name ?? "U"}
                            imageUrl={user?.imageUrl ?? undefined}
                          />
                        )}
                        <div className="relative flex items-center gap-1 group/msg">
                          {isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/msg:opacity-100 transition-opacity shrink-0"
                              title="Delete message"
                              onClick={() => handleDeleteMessage(msg.id)}
                            >
                              <TrashIcon className="size-3" />
                            </Button>
                          )}
                          <div
                            className={cn(
                              "max-w-[70vw] sm:max-w-md rounded-lg p-3",
                              isCurrentUser
                                ? "bg-primary/10 text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <p className="text-xs opacity-70 mt-1 text-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {isCurrentUser && (
                          <UserAvatar
                            name={currentUser?.name ?? "You"}
                            imageUrl={currentUser?.imageUrl ?? undefined}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No messages yet. Send a message to start the conversation!
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="flex w-full gap-2 items-center">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessageMutation.mutate();
                    }
                  }}
                />
                <Button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={sendMessageMutation.isPending || !message.trim()}
                >
                  Send
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversation Summary</CardTitle>
                <Button
                  disabled={!conversation?.id || generateSummaryMutation.isPending}
                  size="sm"
                  onClick={() => generateSummaryMutation.mutate()}
                >
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary ? (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {summary.summary}
                    </p>
                  </div>
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Points</h4>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.actionItems && summary.actionItems.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Action Items</h4>
                      <div className="space-y-2">
                        {summary.actionItems.map((item: any, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <ul className="flex-1 list-disc list-inside">
                              <li className="text-sm">{typeof item === 'string' ? item : item.description || JSON.stringify(item)}</li>
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {summary.nextSteps && summary.nextSteps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Next Steps</h4>
                      <ul className="space-y-1">
                        {summary.nextSteps.map((step: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No summary generated yet. Click &quot;Generate&quot; to create
                  one.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear all messages?"
        description="Are you sure you want to clear the message history for this chat? This cannot be undone."
        confirmLabel="Clear Chat"
        isPending={clearChatMutation.isPending}
        onConfirm={handleClearChat}
      />
    </>
  );
}