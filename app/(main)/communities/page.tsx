"use client";
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, startTransition } from 'react';
import { useCommunities, useCommunityGoals } from '@/hooks/useCommunities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotIcon } from 'lucide-react';
import AIMatching from '@/components/communities/AIMatching';

const CommunitiesPage = () => {
    const [activeTab, setActiveTab] = useState<"goals" | "matches">("goals");
    const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

    // ✅ HOOK 1: Fetch communities
    const {
        data: communities,
        isLoading: isLoadingCommunities,
        error: errorCommunities
    } = useCommunities();

    // ✅ HOOK 2: Fetch goals (MUST be placed before any early returns!)
    const {
        data: communityGoals,
        isLoading: isLoadingCommunityGoals,
        error: errorCommunityGoals
    } = useCommunityGoals(selectedCommunity);

    // ✅ HOOK 3: Auto-select the first community
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

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Sidebar: Communities List */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Communities</CardTitle>
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
                        {activeTab === "goals" ? "Learning Goals" : "Find Partners with AI"}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === "goals"
                            ? `${communityGoals?.length ?? 0} ${communityGoals?.length === 1 ? "goal" : "goals"} in selected community`
                            : "Find potential learning partners with AI"}
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
                        </div>
                    ) : (
                        <AIMatching totalGoals={communityGoals?.length ?? 0} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CommunitiesPage;