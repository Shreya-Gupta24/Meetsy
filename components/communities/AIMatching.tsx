import React from 'react'
import { Button } from '../ui/button'
import { useAiPartners } from '@/hooks/useAIPartners'
import { toast } from 'sonner'
import { LockIcon } from 'lucide-react'

const AIMatching = ({
    totalGoals, 
    selectedCommunityId, 
    showLockIcon
}: {
    totalGoals: number; 
    selectedCommunityId: string; 
    showLockIcon: boolean;
}) => {
    const aiPartnerMutation = useAiPartners();

    const handleFindAIPartners = async () => {
        try {
            await aiPartnerMutation.mutateAsync(selectedCommunityId);
            toast.success("AI partners found successfully!");
        } catch (error) {
            console.error("Error finding ai partners", error);
            toast.error("Error finding ai partners");
        }
    };

    return (
        <div className="text-center py-8">
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Our AI will analyze your learning goals and automatically match you with the most compatible learning partners in this community.
                </p>
            </div>
            <Button 
                size="lg" 
                className="gap-2"
                disabled={totalGoals === 0 || showLockIcon || aiPartnerMutation.isPending} 
                onClick={handleFindAIPartners}
            >
                {showLockIcon && <LockIcon className="size-4 text-muted-foreground" />}
                {aiPartnerMutation.isPending ? "Matching..." : "🤖 Find Partners with AI"}
            </Button>
            {totalGoals > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                    You have {totalGoals} {totalGoals === 1 ? "learning goal" : "learning goals"} set
                </p>
            )}
            {totalGoals === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                    Add learning goals first to enable AI matching
                </p>
            )}
        </div>
    );
};

export default AIMatching;