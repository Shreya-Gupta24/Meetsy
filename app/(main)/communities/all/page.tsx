"use client";
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeftIcon, CheckIcon, LockIcon, SearchIcon, TagIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useAllCommunities, useCommunities, useJoinCommunity } from '@/hooks/useCommunities';
import { useCurrentUser } from '@/hooks/useUser';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Community = {
    id: string;
    name: string;
    description: string | null;
    matchType: "name" | "tag";
};

export default function AllCommunitiesPage() {
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // 350ms debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: allCommunities,
        isLoading,
        error,
    } = useAllCommunities(debouncedSearch || undefined);

    const { data: userCommunities } = useCommunities();
    const { data: user } = useCurrentUser();
    const isPro = user?.isPro;

    const numberOfCommunities = userCommunities?.length || 0;
    const showLockIcon = numberOfCommunities >= 3 && !isPro;

    const isJoined = (communityId: string) =>
        userCommunities?.some((c: any) => c.community.id === communityId);

    const joinMutation = useJoinCommunity();

    const handleJoin = async (communityId: string) => {
        await joinMutation.mutateAsync(communityId);
        toast.success("Successfully joined the community!");
    };

    // Split into name-match and tag-only groups
    const nameMatches: Community[] = allCommunities?.filter((c: Community) => c.matchType === "name") ?? [];
    const tagMatches: Community[] = allCommunities?.filter((c: Community) => c.matchType === "tag") ?? [];
    const hasTagMatches = tagMatches.length > 0;

    const CommunityCard = ({ community }: { community: Community }) => (
        <Card key={community.id}>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{community.name}</CardTitle>
                    {community.matchType === "tag" && (
                        <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                            <TagIcon className="size-3" />
                            via tags
                        </Badge>
                    )}
                </div>
                <CardDescription>{community.description}</CardDescription>
                <CardFooter className="px-0 mt-2">
                    <Button
                        className="w-full gap-2"
                        onClick={() => handleJoin(community.id)}
                        disabled={isJoined(community.id) || showLockIcon || joinMutation.isPending}
                    >
                        {showLockIcon && <LockIcon className="size-4 text-muted-foreground" />}
                        {isJoined(community.id) ? (
                            <><CheckIcon className="size-4" /> Joined</>
                        ) : (
                            "Join Community"
                        )}
                    </Button>
                </CardFooter>
            </CardHeader>
        </Card>
    );

    return (
        <div>
            <Link href="/communities">
                <Button variant="outline">
                    <ArrowLeftIcon className="size-4" />
                    Back to My Communities
                </Button>
            </Link>

            <div className="space-y-6 mt-6">
                {/* Header + Search */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-2xl font-bold">Browse Communities</h2>
                    <div className="relative w-full sm:w-72">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                            id="community-search"
                            placeholder="Search by name or tag..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Clear search"
                            >
                                <XIcon className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results summary */}
                {debouncedSearch && !isLoading && (
                    <p className="text-sm text-muted-foreground -mt-2">
                        {(allCommunities?.length ?? 0) === 0
                            ? `No results for "${debouncedSearch}"`
                            : `${nameMatches.length} name match${nameMatches.length !== 1 ? "es" : ""}${hasTagMatches ? `, ${tagMatches.length} via tags` : ""} for "${debouncedSearch}"`}
                    </p>
                )}

                {isLoading ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                        {debouncedSearch ? "Searching..." : "Loading communities..."}
                    </div>
                ) : error ? (
                    <div className="text-sm text-destructive py-4">Error: {error.message}</div>
                ) : (allCommunities?.length ?? 0) === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <SearchIcon className="size-8 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No communities found</p>
                        {debouncedSearch && (
                            <p className="text-sm mt-1">Try a different keyword.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Name matches */}
                        {nameMatches.length > 0 && (
                            <div className="space-y-4">
                                {debouncedSearch && hasTagMatches && (
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Matching name
                                    </p>
                                )}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {nameMatches.map((community) => (
                                        <CommunityCard key={community.id} community={community} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tag matches — shown below with a divider */}
                        {hasTagMatches && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                        <TagIcon className="size-3" />
                                        Matched via tags
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {tagMatches.map((community) => (
                                        <CommunityCard key={community.id} community={community} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}