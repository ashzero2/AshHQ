"use client";

import { useState } from "react";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { Plus } from "lucide-react";
import type { Task } from "@prisma/client";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {["ALL", "ACTIVE", "TODO", "IN_PROGRESS", "DONE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {f === "IN_PROGRESS" ? "In Progress" : f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Task counts */}
      <p className="text-xs text-zinc-500 mb-3">
        {activeTasks.length} active · {doneTasks.length} completed · {tasks.length} total
      </p>

      {/* Active tasks */}
      <div className="space-y-2">
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(t) => {
              setEditingTask(t);
              setShowForm(true);
            }}
          />
        ))}
      </div>

      {/* Completed tasks */}
      {doneTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Completed
          </p>
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-sm">No tasks found</p>
          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="text-blue-400 text-sm mt-2 hover:underline"
          >
            Create your first task
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
