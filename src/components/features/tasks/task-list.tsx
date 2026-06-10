"use client";

import { useState } from "react";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { RecurringTaskList } from "./recurring-task-list";
import { Plus, Repeat } from "lucide-react";
import type { Task, RecurringTask } from "@prisma/client";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "TODO", label: "Todo" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
];

interface TaskListProps {
  tasks: Task[];
  recurringTasks: RecurringTask[];
}

export function TaskList({ tasks, recurringTasks }: TaskListProps) {
  const [tab, setTab] = useState<"tasks" | "recurring">("tasks");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = tasks.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return t.status !== "DONE";
    if (filter === "DONE") return t.status === "DONE";
    return t.status === filter;
  });

  const activeTasks = filtered.filter((t) => t.status !== "DONE");
  const doneTasks = filtered.filter((t) => t.status === "DONE");

  if (tab === "recurring") {
    return (
      <div className="w-full">
        <div className="flex gap-1 mb-5">
          <button onClick={() => setTab("tasks")} className="text-[12px] px-3 py-1.5 rounded-lg font-medium bg-surface-raised text-muted-fg border border-outline hover:text-foreground transition-colors">
            Tasks
          </button>
          <button className="text-[12px] px-3 py-1.5 rounded-lg font-medium bg-accent text-background transition-colors flex items-center gap-1.5">
            <Repeat size={11} /> Recurring
          </button>
        </div>
        <RecurringTaskList initialTasks={recurringTasks} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex gap-1 overflow-x-auto flex-nowrap pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-[12px] px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap flex-shrink-0 ${
                  filter === f.key
                    ? "bg-accent text-background"
                    : "bg-surface-raised text-muted-fg hover:text-foreground border border-outline hover:border-outline-strong"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setTab("recurring")}
              className="text-[12px] px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap flex-shrink-0 bg-surface-raised text-muted-fg hover:text-foreground border border-outline hover:border-outline-strong flex items-center gap-1"
            >
              <Repeat size={11} /> Recurring
            </button>
          </div>
          <button
            onClick={() => { setEditingTask(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors flex-shrink-0"
          >
            <Plus size={13} /> Add Task
          </button>
        </div>
      </div>

      <p className="text-[11px] text-subtle-fg mb-4 tabular-nums">
        {activeTasks.length} active · {doneTasks.length} completed · {tasks.length} total
      </p>

      {/* Active tasks */}
      <div className="space-y-2">
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(t) => { setEditingTask(t); setShowForm(true); }}
          />
        ))}
      </div>

      {/* Completed tasks */}
      {doneTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-3">
            Completed
          </p>
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => { setEditingTask(t); setShowForm(true); }}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-14">
          <p className="text-sm text-muted-fg">No tasks found</p>
          <button
            onClick={() => { setEditingTask(null); setShowForm(true); }}
            className="text-[12px] text-accent hover:text-accent-light transition-colors mt-2"
          >
            Create your first task
          </button>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
