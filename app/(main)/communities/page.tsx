"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState, useEffect, startTransition } from 'react';
import { useCommunities, useCommunityGoals, useDeleteCommunity, useLeaveCommunity } from '@/hooks/useCommunities';
import { useDeleteGoal } from '@/hooks/useGoals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotIcon, LockIcon, LogOutIcon, SearchIcon, TagIcon, Trash2Icon, XIcon } from 'lucide-react';
import AIMatching from '@/components/communities/AIMatching';
import AddLearningGoal from '@/components/communities/AddLearningGoal';
import { useCurrentUser } from '@/hooks/useUser';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ConfirmAction =
    | { type: "leave"; communityId: string; name: string }
    | { type: "delete"; communityId: string; name: string }
    | null;

const CommunitiesPage = () => {
    const [activeTab, setActiveTab] = useState<"goals" | "matches">("goals");
    const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [goalToDelete, setGoalToDelete] = useState<{ id: string; title: string } | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // 300ms debounce
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const {
        data: communities,
        isLoading: isLoadingCommunities,
        error: errorCommunities
    } = useCommunities(debouncedSearch || undefined);

    const {
        data: communityGoals,
        isLoading: isLoadingCommunityGoals,
        error: errorCommunityGoals
    } = useCommunityGoals(selectedCommunity);

    // Always fetch unfiltered communities for lock icon count + user data
    const { data: allCommunities } = useCommunities();
    const { data: user } = useCurrentUser();
    const leaveMutation = useLeaveCommunity();
    const deleteMutation = useDeleteCommunity();
    const deleteGoalMutation = useDeleteGoal();

    useEffect(() => {
        if (communities && communities.length > 0 && !selectedCommunity) {
            startTransition(() => {
                setSelectedCommunity(communities[0].community.id);
            });
        }
    }, [communities?.length]);

    if (isLoadingCommunities && !debouncedSearch) return <div className="p-6">Loading communities...</div>;
    if (errorCommunities) return <div className="p-6 text-destructive">Error: {errorCommunities.message}</div>;

    const totalJoined = allCommunities?.length || 0;
    const isPro = user?.isPro;
    const showLockIcon = totalJoined >= 3 && !isPro;

    // Split into name and tag groups
    const nameMatches = communities?.filter((c: any) => c.matchType === "name") ?? [];
    const tagMatches = communities?.filter((c: any) => c.matchType === "tag") ?? [];
    const hasTagMatches = tagMatches.length > 0;
    const hasNoResults = debouncedSearch && communities?.length === 0;

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        const mutation = confirmAction.type === "delete" ? deleteMutation : leaveMutation;
        try {
            await mutation.mutateAsync(confirmAction.communityId);
            toast.success(
                confirmAction.type === "delete"
                    ? `"${confirmAction.name}" deleted`
                    : `Left "${confirmAction.name}"`
            );
            if (selectedCommunity === confirmAction.communityId) {
                setSelectedCommunity(null);
            }
        } catch (err: any) {
            toast.error(err.message ?? "Something went wrong");
        } finally {
            setConfirmAction(null);
        }
    };

    const handleDeleteGoal = async () => {
        if (!goalToDelete || !selectedCommunity) return;
        try {
            await deleteGoalMutation.mutateAsync({
                goalId: goalToDelete.id,
                communityId: selectedCommunity,
            });
            toast.success(`Goal "${goalToDelete.title}" deleted`);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to delete goal");
        } finally {
            setGoalToDelete(null);
        }
    };

    const isPending = leaveMutation.isPending || deleteMutation.isPending;

    const CommunityButton = ({ c }: { c: any }) => {
        const isCreator = c.community.createdById === user?.id;
        const isSelected = selectedCommunity === c.community.id;

        return (
            <div
                key={c.community.id}
                onClick={() => setSelectedCommunity(c.community.id)}
                className={cn(
                    "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                    isSelected ? "bg-accent border-primary font-medium" : "bg-card hover:bg-accent/50"
                )}
            >
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{c.community.name}</span>
                        {c.matchType === "tag" && (
                            <span className="shrink-0 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-normal">
                                tag
                            </span>
                        )}
                    </div>
                    {c.community.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c.community.description}</p>
                    )}
                </div>

                {isCreator ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            title="Leave community (remove membership only)"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ type: "leave", communityId: c.community.id, name: c.community.name });
                            }}
                        >
                            <LogOutIcon className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            title="Delete community (wipes community entirely)"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ type: "delete", communityId: c.community.id, name: c.community.name });
                            }}
                        >
                            <Trash2Icon className="size-3.5" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Leave community"
                        onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction({ type: "leave", communityId: c.community.id, name: c.community.name });
                        }}
                    >
                        <LogOutIcon className="size-3.5" />
                    </Button>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Sidebar: Communities List */}
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            {showLockIcon && <LockIcon className="size-4 text-muted-foreground" />}
                            Communities
                        </CardTitle>
                        <CardDescription>{totalJoined} joined</CardDescription>

                        {/* Search bar */}
                        <div className="relative mt-1">
                            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search by name or tag..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-8 pr-8 h-8 text-sm"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Clear search"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 overflow-y-auto">
                        {isLoadingCommunities && debouncedSearch ? (
                            <p className="text-xs text-muted-foreground text-center py-2">Searching...</p>
                        ) : hasNoResults ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <SearchIcon className="size-6 mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-medium">No results</p>
                                <p className="text-xs">Try a different keyword</p>
                            </div>
                        ) : (
                            <>
                                {/* Name matches */}
                                {nameMatches.length > 0 && (
                                    <div className="space-y-1.5">
                                        {debouncedSearch && hasTagMatches && (
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1">
                                                Name match
                                            </p>
                                        )}
                                        {nameMatches.map((c: any) => (
                                            <CommunityButton key={c.community.id} c={c} />
                                        ))}
                                    </div>
                                )}

                                {/* Tag matches with divider */}
                                {hasTagMatches && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 py-1">
                                            <div className="h-px flex-1 bg-border" />
                                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                                <TagIcon className="size-2.5" />
                                                Via tags
                                            </span>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                        {tagMatches.map((c: any) => (
                                            <CommunityButton key={c.community.id} c={c} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Right Pane: Goals or AI Matching */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex gap-2 mb-4">
                            <Button
                                onClick={() => setActiveTab("goals")}
                                variant={activeTab === "goals" ? "default" : "outline"}
                            >
                                My Goals
                            </Button>
                            <Button
                                onClick={() => setActiveTab("matches")}
                                variant={activeTab === "matches" ? "default" : "outline"}
                            >
                                <BotIcon className="size-4 mr-2" />
                                <span>Find Partners with AI</span>
                            </Button>
                        </div>
                        <CardTitle>
                            {activeTab === "goals" ? "Learning Goals" : "Potential Learning Partners"}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === "goals"
                                ? `${communityGoals?.length ?? 0} ${communityGoals?.length === 1 ? "goal" : "goals"} in selected community`
                                : "Members with similar learning goals"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingCommunityGoals ? (
                            <div className="p-4 text-sm text-muted-foreground">Loading community goals...</div>
                        ) : errorCommunityGoals ? (
                            <div className="p-4 text-sm text-destructive">Error loading goals: {errorCommunityGoals.message}</div>
                        ) : activeTab === "goals" ? (
                            <div className="space-y-2">
                                {communityGoals?.map((c: any) => (
                                    <Card key={c.id} className="shadow-none">
                                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base">{c.title}</CardTitle>
                                                <CardDescription>{c.description}</CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                                                title="Delete learning goal"
                                                onClick={() => setGoalToDelete({ id: c.id, title: c.title })}
                                            >
                                                <Trash2Icon className="size-4" />
                                            </Button>
                                        </CardHeader>
                                    </Card>
                                ))}
                                <AddLearningGoal selectedCommunityId={selectedCommunity!} showLockIcon={showLockIcon} />
                            </div>
                        ) : (
                            <AIMatching totalGoals={communityGoals?.length ?? 0} selectedCommunityId={selectedCommunity!} showLockIcon={showLockIcon} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Community Confirmation Dialog */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                title={confirmAction?.type === "delete" ? "Delete community?" : "Leave community?"}
                description={
                    confirmAction?.type === "delete"
                        ? `This will permanently delete "${confirmAction?.name}" and all its members and goals. This cannot be undone.`
                        : `Are you sure you want to leave "${confirmAction?.name}"? You can rejoin later.`
                }
                confirmLabel={confirmAction?.type === "delete" ? "Delete" : "Leave"}
                isPending={isPending}
                onConfirm={handleConfirmAction}
            />

            {/* Goal Confirmation Dialog */}
            <ConfirmDialog
                open={!!goalToDelete}
                onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}
                title="Delete learning goal?"
                description={`Are you sure you want to delete "${goalToDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                isPending={deleteGoalMutation.isPending}
                onConfirm={handleDeleteGoal}
            />
        </>
    );
};

export default CommunitiesPage;