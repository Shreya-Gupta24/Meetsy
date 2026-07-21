import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'
import { client } from '@/lib/api-client'


export const useCommunities = () => {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery<any>({
        queryKey: ["communities"],
        queryFn: async () => {
            const res = await client.api.communities.$get()
            if (!res.ok) {
                throw new Error("Failed to fetch user communities")
            }
            return res.json()
        },
        // ✅ Only execute when Clerk is completely loaded and user is signed in
        enabled: isLoaded && isSignedIn, 
    })
}

export const useAllCommunities = () => {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery<any>({
        // ✅ Unique query key so it doesn't clash with user joined communities
        queryKey: ["communities", "all"], 
        queryFn: async () => {
            const res = await client.api.communities.all.$get()
            if (!res.ok) {
                throw new Error("Failed to fetch communities")
            }
            return res.json()
        },
        // ✅ Only execute when Clerk is completely loaded and user is signed in
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
        // ✅ Only execute when Clerk is ready AND a community ID is selected
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