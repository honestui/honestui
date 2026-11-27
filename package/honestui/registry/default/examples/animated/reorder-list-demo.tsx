"use client";

import { useState } from "react";
import { Bug, FileText, GitPullRequest, Rocket, Users } from "honestui/icons";
import { ReorderList } from "@/registry/default/animated/reorder-list";

type Task = {
  id: string;
  title: string;
  meta: string;
  icon: typeof Bug;
};

const TASKS: Task[] = [
  { id: "checkout", title: "Fix checkout timeout", meta: "Bug · 3 reports", icon: Bug },
  { id: "review", title: "Review billing changes", meta: "Pull request · 12 files", icon: GitPullRequest },
  { id: "launch", title: "Ship onboarding v2", meta: "Launch · Friday", icon: Rocket },
  { id: "interviews", title: "Synthesize interviews", meta: "Research · 8 notes", icon: Users },
  { id: "docs", title: "Update API docs", meta: "Docs · 2 pages", icon: FileText },
];

export default function ReorderListDemo() {
  const [tasks, setTasks] = useState(TASKS);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-sm font-semibold text-foreground">This week&apos;s priorities</p>
        <button
          type="button"
          onClick={() => setTasks(TASKS)}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Reset
        </button>
      </div>
      <ReorderList
        label="This week's priorities"
        items={tasks}
        onReorder={setTasks}
        getKey={(task) => task.id}
        getLabel={(task) => task.title}
        renderItem={(task, { index }) => {
          const Icon = task.icon;
          return (
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">{task.meta}</p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                {index + 1}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
