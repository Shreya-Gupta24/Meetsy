import { client } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateLearningGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
        communityId,
        title,
        description,
        tags,
        }: {
        communityId: string;
        title: string;
        description: string;
        tags: string[] | undefined;
        }) => {
        const res = await client.api.communities.goals.$post({
            param: { communityId },
            json: {
                communityId,
                title,
                description,
                tags: tags || [],
            },
        }as any);
        if (!res.ok) {
            throw new Error("Failed to create learning goal");
        }
        return res.json();
        },
        onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
            queryKey: ["communityGoals", variables.communityId],
        });
        },
        onError: (error) => {
        console.error("Error creating learning goal", error);
        },
    });
};

export const useDeleteGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ goalId, communityId }: { goalId: string; communityId: string }) => {
            const res = await fetch(`/api/communities/goals/${goalId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message ?? "Failed to delete goal");
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["communityGoals", variables.communityId],
            });
        },
        onError: (error) => {
            console.error("Error deleting learning goal", error);
        },
    });
};