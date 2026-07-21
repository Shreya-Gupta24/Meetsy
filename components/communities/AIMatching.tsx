import React from 'react'
import { Button } from '../ui/button'

const AIMatching = ({totalGoals}: {totalGoals: number}) => {
  return (
    <div className="text-center py-8">
        <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
            <p>
                Our AI will analyze your learning goals and atomatically match you with the most compatible learning partners in this community.
            </p>
        </div>
        <Button size="lg" disabled={totalGoals === 0}>🤖 Find Partners with AI</Button>
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