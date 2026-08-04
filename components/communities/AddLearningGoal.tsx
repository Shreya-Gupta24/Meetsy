import React from 'react'
import { Button } from '../ui/button'
import { PlusIcon } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { useCreateLearningGoal } from '@/hooks/useGoals'

const AddLearningGoal = ({
    selectedCommunityId,
}: {
    selectedCommunityId: string | null;
}
) => {
    const [showNewGoalForm, setShowNewGoalForm] = React.useState(false);
    const [newGoalText, setNewGoalText] = React.useState("");
    const createGoalMutation = useCreateLearningGoal();
    const handleCreateGoal = async () => {
        try{
            await createGoalMutation.mutateAsync({
                communityId: selectedCommunityId || "", // Replace with actual community ID
                title: newGoalText.slice(0,100),
                description:newGoalText.slice(0,100),
                tags: [],
            });
            setNewGoalText("");
            setShowNewGoalForm(false);
        } catch (error) {
            console.error("Error creating goal:", error);
        }
    }

    return (
    <div>
        {showNewGoalForm ? (
            <div className="space-y-3 pt-3 border-t">
                <Textarea
                    placeholder="What do you want to learn?"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    rows={4}
                    className="resize-none"
                />
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={handleCreateGoal}
                        disabled={createGoalMutation.isPending || newGoalText.trim() === ""}
                    >
                        Add Goal
                    </Button>
                    <Button
                        size="sm"
                        variant={"outline"}
                        onClick={() => setShowNewGoalForm(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        ) :(
        <Button variant={"outline"} className="w-full" onClick={() => setShowNewGoalForm(true)}>
            <PlusIcon className="size-3" /> Add Learning Goal
        </Button>
        )}
    </div>
  )
}

export default AddLearningGoal