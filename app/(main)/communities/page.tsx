"use client";
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, startTransition } from 'react';
import { useCommunities, useCommunityGoals } from '@/hooks/useCommunities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotIcon, PlusIcon, LockIcon } from 'lucide-react';
import AIMatching from '@/components/communities/AIMatching';
import AddLearningGoal from '@/components/communities/AddLearningGoal';
import { useCurrentUser } from '@/hooks/useUser';

const CommunitiesPage = () => {
    const [activeTab, setActiveTab] = useState<"goals" | "matches">("goals");
    const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

    // ✅ HOOK 1: Fetch communities
    const {
        data: communities,
        isLoading: isLoadingCommunities,
        error: errorCommunities
    } = useCommunities();

    // ✅ HOOK 2: Fetch goals
    const {
        data: communityGoals,
        isLoading: isLoadingCommunityGoals,
        error: errorCommunityGoals
    } = useCommunityGoals(selectedCommunity);

    // ✅ HOOK 3: Fetch current user (placed before any early returns)
    const { data: user } = useCurrentUser();

    // ✅ HOOK 4: Auto-select the first community
    useEffect(() => {
        if (communities && communities.length > 0 && !selectedCommunity) {
            startTransition(() => {
                setSelectedCommunity(communities[0].community.id);
            });
        }
    }, [communities?.length]);

    // 🛑 ALL CONDITIONAL RETURNS GO BELOW ALL HOOKS
    if (isLoadingCommunities) return <div className="p-6">Loading communities...</div>;
    if (errorCommunities) return <div className="p-6 text-destructive">Error: {errorCommunities.message}</div>;

    const numberOfCommunities = communities?.length || 0;
    const isPro = user?.isPro;
    const showLockIcon = numberOfCommunities >= 3 && !isPro;

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Sidebar: Communities List */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {showLockIcon && (
                            <LockIcon className="size-4 text-muted-foreground" />
                        )}{" "}
                        Communities
                    </CardTitle>
                    <CardDescription>{communities?.length || 0} joined</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {communities?.map((c: any) => (
                        <Button 
                            key={c.id} 
                            variant={selectedCommunity === c.community.id ? "default" : "outline"} 
                            className="w-full justify-start" 
                            onClick={() => setSelectedCommunity(c.community.id)}
                        >
                            {c.community.name}
                        </Button>
                    ))}
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
                    {/* Granular inline loading for goals sub-pane */}
                    {isLoadingCommunityGoals ? (
                        <div className="p-4 text-sm text-muted-foreground">Loading community goals...</div>
                    ) : errorCommunityGoals ? (
                        <div className="p-4 text-sm text-destructive">Error loading goals: {errorCommunityGoals.message}</div>
                    ) : activeTab === "goals" ? (
                        <div className="space-y-2">
                            {communityGoals?.map((c: any) => (
                                <Card key={c.id} className="shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-base">{c.title}</CardTitle>
                                        <CardDescription>{c.description}</CardDescription>
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
    );
};

export default CommunitiesPage;