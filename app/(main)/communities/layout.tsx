"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon, XIcon, TargetIcon, ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useCreateCommunity } from "@/hooks/useCommunities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Goal = { title: string; description: string };

const EMPTY_GOAL = (): Goal => ({ title: "", description: "" });

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {[1, 2].map((s) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-200",
              step >= s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {s}
          </div>
          {s < 2 && (
            <div
              className={cn(
                "flex-1 h-0.5 rounded-full transition-all duration-300",
                step >= 2 ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 fields — list of goals
  const [goals, setGoals] = useState<Goal[]>([EMPTY_GOAL()]);

  const createMutation = useCreateCommunity();

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setGoals([EMPTY_GOAL()]);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) resetForm();
  };

  // ── Goal helpers ──
  const updateGoal = (index: number, field: keyof Goal, value: string) => {
    setGoals((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  const addGoal = () => setGoals((prev) => [...prev, EMPTY_GOAL()]);

  const removeGoal = (index: number) =>
    setGoals((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ──
  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      const validGoals = goals.filter((g) => g.title.trim() !== "");

      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        goals: validGoals.map((g) => ({
          title: g.title.trim(),
          description: g.description.trim() || undefined,
        })),
      });

      toast.success(`"${name.trim()}" community created!`);
      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create community");
    }
  };

  const step1Valid = name.trim().length > 0;
  const isCreating = createMutation.isPending;

  return (
    <div className="page-wrapper">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground">
            Manage your learning goals and find learning partners
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* ── Create Community Dialog ── */}
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="size-4 mr-1" />
                Create Community
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <StepIndicator step={step} />
                <DialogTitle>
                  {step === 1 ? "Create a new community" : "Add learning goals"}
                </DialogTitle>
                <DialogDescription>
                  {step === 1
                    ? "Start your own learning community. You'll be joined automatically."
                    : "Add goals you want to achieve in this community. You can always add more later."}
                </DialogDescription>
              </DialogHeader>

              {/* ── Step 1: Community details ── */}
              {step === 1 && (
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="community-name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="community-name"
                      placeholder="e.g. Python Learners"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && step1Valid) setStep(2);
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="community-description">
                      Description{" "}
                      <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Textarea
                      id="community-description"
                      placeholder="What is this community about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 2: Learning goals ── */}
              {step === 2 && (
                <div className="space-y-3 py-2 max-h-[55vh] overflow-y-auto pr-1">
                  {goals.map((goal, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg border bg-muted/30 p-3 space-y-2"
                    >
                      {/* Remove button — only show if more than 1 goal */}
                      {goals.length > 1 && (
                        <button
                          onClick={() => removeGoal(index)}
                          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove goal"
                        >
                          <XIcon className="size-4" />
                        </button>
                      )}

                      <div className="flex items-center gap-2 mb-1">
                        <TargetIcon className="size-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Goal {index + 1}
                        </span>
                      </div>

                      <Input
                        placeholder="Goal title (e.g. Master async Python)"
                        value={goal.title}
                        onChange={(e) => updateGoal(index, "title", e.target.value)}
                        maxLength={100}
                        className="bg-background"
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={goal.description}
                        onChange={(e) =>
                          updateGoal(index, "description", e.target.value)
                        }
                        maxLength={500}
                        rows={2}
                        className="resize-none bg-background text-sm"
                      />
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-dashed"
                    onClick={addGoal}
                  >
                    <PlusIcon className="size-3.5" />
                    Add another goal
                  </Button>
                </div>
              )}

              <DialogFooter className="gap-2 mt-1">
                {step === 1 ? (
                  <>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!step1Valid}
                    >
                      Next
                      <ArrowRightIcon className="size-4 ml-1" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={isCreating}
                    >
                      <ArrowLeftIcon className="size-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Community"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Join more */}
          <Link href="/communities/all">
            <Button variant="outline">+ Join More Communities</Button>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}