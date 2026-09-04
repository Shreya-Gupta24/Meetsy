import React from 'react'
import { Button } from '../ui/button'
import { useAiPartners } from '@/hooks/useAIPartners'
import { toast } from 'sonner'

const AIMatching = ({totalGoals, selectedCommunityId, showLockIcon}: {totalGoals: number, selectedCommunityId: string, showLockIcon: boolean}) => {
    const aiPartnerMutation= useAiPartners();
    const handleFindAIPartners = () => {
        try{
            aiPartnerMutation.mutate(selectedCommunityId);
            toast.success("AI partners found successfully!");
        }catch(error){
            console.error("error findinf ai partners", error)
            toast.error("Error finding ai partners");
        }
    }
  return (
    <div className="text-center py-8">
        <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
            <p>
                Our AI will analyze your learning goals and atomatically match you with the most compatible learning partners in this community.
            </p>
        </div>
        <Button size="lg" disabled={totalGoals === 0 || showLockIcon} onClick={handleFindAIPartners}>🤖 Find Partners with AI</Button>
        {totalGoals > 0 && (
            <p className="mt4 text-sm text-muted-foreground">You have {totalGoals} learning goals set</p>
        )}
        {totalGoals === 0 && (
            <p className="mt4 text-sm text-muted-foreground">Add learning goals first to enable AI matching</p>
        )}
    </div>
  )
}

export default AIMatching