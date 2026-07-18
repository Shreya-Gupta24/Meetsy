"use client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

export default function DashboardPage(){
    const user= useUser()
    const {data, isLoading, error}= useQuery<{id: number; name: string}[]>({
        queryKey: ["communities"],
        // queryFn: async () => {
        //     const res=await fetch("/api/communities");
        //     return res.json();
        //}
        queryFn: async() => {
            return new Promise<{id: number; name: string}[]>((resolve) => {
                setTimeout(() => {
                    resolve([{id: 1, name: "Community 1"}])
                },1000);
            })
        }
    })
    if(isLoading) return <div>Loading...</div>;
    if(error) return <div>Error: {error.message}</div>;
    return (
        <div className="page-wrapper">
            <div>
                <h1 className="text-3xl font-bold racking-tight">Dashboard</h1>
                <p className= "text-muted-foreground">
                    Welcome back, {user?.user?.firstName || "User"}!
                </p>
            </div>
            {data && data?.map((community: {id: number; name: string}) => (
                <div key={community.id}>{community.name}</div>
            ))}
        </div>
    )
}