import { WidgetType, type DashboardLayout } from "./types";

export const DEFAULT_LAYOUT: DashboardLayout = {
  columns: 12,
  widgets: [
    { id: "greeting", type: WidgetType.GREETING, title: "Greeting", x: 0, y: 0, w: 8, h: 2, visible: true, settings: {} },
    { id: "clock", type: WidgetType.CLOCK, title: "Clock", x: 8, y: 0, w: 4, h: 2, visible: true, settings: {} },
    { id: "weather", type: WidgetType.WEATHER, title: "Weather", x: 0, y: 2, w: 4, h: 3, visible: true, settings: {} },
    { id: "tasks", type: WidgetType.TASKS, title: "Tasks", x: 4, y: 2, w: 4, h: 3, visible: true, settings: {} },
    { id: "calendar", type: WidgetType.CALENDAR, title: "Calendar", x: 8, y: 2, w: 4, h: 3, visible: true, settings: {} },
    { id: "habits", type: WidgetType.HABITS, title: "Habits", x: 0, y: 5, w: 4, h: 3, visible: true, settings: {} },
    { id: "finance", type: WidgetType.FINANCE, title: "Finance", x: 4, y: 5, w: 4, h: 3, visible: true, settings: {} },
    { id: "notes", type: WidgetType.NOTES, title: "Notes", x: 8, y: 5, w: 4, h: 3, visible: true, settings: {} },
    { id: "quick-links", type: WidgetType.QUICK_LINKS, title: "Quick Links", x: 0, y: 8, w: 6, h: 2, visible: true, settings: {} },
    { id: "assistant", type: WidgetType.AI_CHAT, title: "Assistant", x: 6, y: 8, w: 6, h: 2, visible: false, settings: {} },
  ],
};

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Health & Fitness",
  "Education",
  "Travel",
  "Subscriptions",
  "Personal Care",
  "Gifts",
  "Home",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Business",
  "Refunds",
  "Gifts",
  "Other",
];

export const TASK_CATEGORIES = [
  "Work",
  "Personal",
  "Home",
  "Health",
  "Finance",
  "Learning",
  "Shopping",
  "Errands",
  "Other",
];

export const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

export const DEFAULT_PIN = "1234";
