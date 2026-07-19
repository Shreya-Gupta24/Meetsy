"use client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { client } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircleIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";

export default function DashboardPage(){
    const user= useUser();
    const {
    data: userCommunities,
    isLoading: isLoadingUserCommunities,
    error: errorUserCommunities
    } = useQuery<any>({
        queryKey: ["communities"],
        queryFn: async() => {
            const res= await client.api.communities.$get();
            return res.json();
        }
    })
    if(isLoadingUserCommunities) return <div>Loading...</div>;
    if(errorUserCommunities) return <div>Error: {errorUserCommunities.message}</div>;

    const pendingMatches= 6;

    return (
        <div className="page-wrapper">
            <div>
                <h1 className="text-3xl font-bold racking-tight">Dashboard</h1>
                <p className= "text-muted-foreground">
                    Welcome back, {user?.user?.firstName || "User"}!
                </p>
            </div>

            <Card className="border border-primary">
                <CardHeader>
                    <CardTitle>
                        🎉 You have {pendingMatches} new{" "}
                        {/* {pendingMatches === 1 ? "match" : "matches"}! */}
                    </CardTitle>
                    <CardDescription>
                        Review and accept your matches to start chatting
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/chat">
                        <Button>Review Matches</Button>
                    </Link>
                </CardContent>
            </Card>

            { /*Stats*/}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title= "Your Communities"
                    value= {userCommunities?.length || 0} 
                />
                <StatsCard
                    title= "Learning Goals"
                    value= {6} 
                />
                <StatsCard
                    title= "Active Matches"
                    value= {6} 
                />
                <StatsCard
                    title= "Pending Matches"
                    value= {pendingMatches || 0} 
                />
            </div>

            {/* recent Chats */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center">
                            <MessageCircleIcon className= "size-4 mr-2 text-primary" />
                            Recent Chats
                        </CardTitle>
                        <Link href="/chat">
                            <Button variant= "outline" size= "sm">
                                View All
                            </Button>
                        </Link>
                        </div>
                        <CardDescription>Communities you&apos;re part of</CardDescription>
                    </CardHeader>
                    <CardContent></CardContent>
                </Card>

            {/* Communities */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center">
                            <UserIcon className= "size-4 mr-2 text-primary" />
                            Communities
                        </CardTitle>
                        <Link href="/communities">
                            <Button variant= "outline" size= "sm">
                                Manage
                            </Button>
                        </Link>
                        </div>
                        <CardDescription>Communities you&apos;re part of</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {userCommunities?.map((community: any) => (
                                <Card className="shadow-none" key={community.id}>
                                    <Link href={`/communities/${community.communityId}`}>
                                        <CardHeader>
                                            <CardTitle className= "text-sm">{community.community.name}</CardTitle>
                                            <CardDescription className="text-sm">{community.community.description}</CardDescription>
                                        </CardHeader>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}