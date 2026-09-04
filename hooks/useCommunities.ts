import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'
import { client } from '@/lib/api-client'


export const useCommunities = (search?: string) => {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery<any>({
        queryKey: ["communities", search ?? ""],
        queryFn: async () => {
            const url = search
                ? `/api/communities?search=${encodeURIComponent(search)}`
                : "/api/communities"
            const res = await fetch(url)
            if (!res.ok) {
                throw new Error("Failed to fetch user communities")
            }
            return res.json()
        },
        enabled: isLoaded && isSignedIn,
    })
}

export const useAllCommunities = (search?: string) => {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery<any>({
        queryKey: ["communities", "all", search ?? ""],
        queryFn: async () => {
            const url = search
                ? `/api/communities/all?search=${encodeURIComponent(search)}`
                : "/api/communities/all"
            const res = await fetch(url)
            if (!res.ok) {
                throw new Error("Failed to fetch communities")
            }
            return res.json()
        },
        enabled: isLoaded && isSignedIn,
    })
}

export const useCommunityGoals = (communityId: string | null) => {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery({
        queryKey: ["communityGoals", communityId],
        queryFn: async () => {
            const res = await client.api.communities[":communityId"].goals.$get({
                param: { communityId: communityId! },
            })
            if (!res.ok) {
                throw new Error("Failed to fetch community goals")
            }
            return res.json()
        },
        enabled: isLoaded && isSignedIn && !!communityId,
    })
}

export const useJoinCommunity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (communityId: string) => {
            const res = await client.api.communities[":communityId"].join.$post({
                param: { communityId: communityId },
            });
            if (!res.ok) {
                throw new Error("Failed to join community");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communities"] });
        },
        onError: (error) => {
            console.error("Error joining community", error);
        },
    });
};

export const useCreateCommunity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            name: string;
            description?: string;
            goals?: { title: string; description?: string }[];
        }) => {
            // 1. Create the community
            const res = await fetch("/api/communities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: data.name, description: data.description }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message ?? "Failed to create community");
            }
            const community = await res.json();

            // 2. Create each goal sequentially under the new community
            if (data.goals && data.goals.length > 0) {
                for (const goal of data.goals) {
                    await fetch("/api/communities/goals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            communityId: community.id,
                            title: goal.title,
                            description: goal.description ?? "",
                            tags: [],
                        }),
                    });
                }
            }

            return community;
        },
        onSuccess: (community) => {
            queryClient.invalidateQueries({ queryKey: ["communities"] });
            queryClient.invalidateQueries({ queryKey: ["communityGoals", community.id] });
        },
        onError: (error) => {
            console.error("Error creating community", error);
        },
    });
};

export const useLeaveCommunity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (communityId: string) => {
            // Uses the dedicated /leave endpoint — always just removes membership
            const res = await fetch(`/api/communities/${communityId}/leave`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message ?? "Failed to leave community");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communities"] });
        },
        onError: (error) => {
            console.error("Error leaving community", error);
        },
    });
};

export const useDeleteCommunity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (communityId: string) => {
            // Uses DELETE — only works if caller is creator, deletes everything
            const res = await fetch(`/api/communities/${communityId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message ?? "Failed to delete community");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communities"] });
            queryClient.invalidateQueries({ queryKey: ["communities", "all"] });
        },
        onError: (error) => {
            console.error("Error deleting community", error);
        },
    });
};