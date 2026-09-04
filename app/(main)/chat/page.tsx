"use client";
import { Card, CardTitle, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { useMatches, useAcceptMatch, useRemoveMatch } from "@/hooks/useAIPartners";
import { useCurrentUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ChatPage() {
  const {
    data: matches,
    isLoading: isLoadingMatches,
    error: errorMatches,
  } = useMatches();

  const { data: user } = useCurrentUser();
  const isPro = user?.isPro;

  const router = useRouter();
  const acceptMatchMutation = useAcceptMatch();
  const removeMatchMutation = useRemoveMatch();

  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [chatSearch, setChatSearch] = useState("");

  if (isLoadingMatches) return <div>Loading...</div>;
  if (errorMatches) return <div>Error: {errorMatches.message}</div>;

  const acceptedMatches = matches?.filter((match) => match.status === "accepted");
  const pendingMatches = matches?.filter((match) => match.status === "pending");

  const filteredAcceptedMatches = acceptedMatches?.filter((match) => {
    if (!chatSearch.trim()) return true;
    const q = chatSearch.toLowerCase().trim();
    const partnerName = match.partner?.name?.toLowerCase() || "";
    const communityName = match.community?.name?.toLowerCase() || "";
    const partnerGoals = match.partnerGoals?.map((g) => g.title.toLowerCase()).join(" ") || "";
    const userGoals = match.userGoals?.map((g) => g.title.toLowerCase()).join(" ") || "";

    return (
      partnerName.includes(q) ||
      communityName.includes(q) ||
      partnerGoals.includes(q) ||
      userGoals.includes(q)
    );
  });

  let pendingMatchesToShow = [];
  if (!isPro) {
    pendingMatchesToShow = pendingMatches?.slice(0, 1) || [];
  } else {
    pendingMatchesToShow = pendingMatches || [];
  }

  if (acceptMatchMutation.isError)
    return <div>Error: {acceptMatchMutation.error.message}</div>;

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await removeMatchMutation.mutateAsync(removeTarget.id);
      toast.success(`Match with ${removeTarget.name} removed`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove match");
    } finally {
      setRemoveTarget(null);
    }
  };

  return (
    <div className="page-wrapper space-y-8">
      {/* Pending Matches Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Pending Matches</h2>
          {!isPro && pendingMatches && pendingMatches.length > 1 && (
            <span className="text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded-full border">
              Upgrade to Pro to see all {pendingMatches.length} matches
            </span>
          )}
        </div>

        {pendingMatchesToShow && pendingMatchesToShow.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {pendingMatchesToShow.map((match) => {
              const partner = {
                id: match.partner.id || "",
                name: match.partner.name || "Partner",
                imageUrl: match.partner.imageUrl ?? undefined,
              };
              return (
                <Card
                  key={match.id}
                  className="w-[280px] sm:w-[320px] shrink-0 flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={partner.name} imageUrl={partner.imageUrl} />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {partner.name}
                        </CardTitle>
                        {match.community && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                            {match.community.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 justify-between gap-4 pt-0">
                    <div>
                      {match.partnerGoals && match.partnerGoals.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Their Learning Goals:
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {match.partnerGoals.map((g) => (
                              <Badge
                                key={g.id}
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {g.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No learning goals listed
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full mt-2"
                      onClick={() => acceptMatchMutation.mutate(match.id)}
                      disabled={acceptMatchMutation.isPending}
                    >
                      {acceptMatchMutation.isPending
                        ? "Accepting..."
                        : "Accept & Start Chatting"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center text-muted-foreground bg-muted/20 border-dashed">
            <p className="text-sm font-medium">No pending matches right now</p>
            <p className="text-xs mt-1">Join communities and add learning goals to get matched with learning partners!</p>
          </Card>
        )}
      </section>

      {/* Active Chats Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Active Chats</h2>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search active chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="pl-8 pr-8 h-9 text-sm"
            />
            {chatSearch && (
              <button
                onClick={() => setChatSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredAcceptedMatches && filteredAcceptedMatches.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredAcceptedMatches.map((match) => {
              const partner = {
                id: match.partner.id || "",
                name: match.partner.name || "Partner",
                imageUrl: match.partner.imageUrl ?? undefined,
              };
              return (
                <Card
                  key={match.id}
                  className="flex w-full hover:bg-accent/50 transition-colors duration-200"
                >
                  <CardContent
                    className="flex items-center gap-4 p-4 flex-1 cursor-pointer"
                    onClick={() => router.push(`/chat/${match.id}`)}
                  >
                    <UserAvatar name={partner.name} imageUrl={partner.imageUrl} />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate font-semibold">
                        {match.partner.name}
                      </CardTitle>
                      {match.community && (
                        <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                          {match.community.name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {match.userGoals && (
                          <span className="text-xs text-muted-foreground">
                            Your goals:{" "}
                            {match.userGoals.map((g) => g.title).join(", ")}
                          </span>
                        )}
                        {match.partnerGoals && match.partnerGoals.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Their goals:{" "}
                            {match.partnerGoals.map((g) => g.title).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove match button — stops card click propagation */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive size-8"
                      title="Remove match"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveTarget({ id: match.id, name: partner.name });
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : chatSearch ? (
          <Card className="p-8 text-center text-muted-foreground bg-muted/20 border-dashed">
            <SearchIcon className="size-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No chats found</p>
            <p className="text-xs mt-1">No active conversations match &quot;{chatSearch}&quot;</p>
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted-foreground bg-muted/20 border-dashed">
            <p className="text-sm font-medium">No active chats yet</p>
            <p className="text-xs mt-1">Accept a pending match above to start chatting!</p>
          </Card>
        )}
      </section>

      {/* Confirm remove match dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title="Remove this match?"
        description={`This will permanently remove your match with ${removeTarget?.name} and delete the conversation. This cannot be undone.`}
        confirmLabel="Remove"
        isPending={removeMatchMutation.isPending}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}