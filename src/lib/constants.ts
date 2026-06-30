import type { ResponsiveLayouts } from "react-grid-layout";

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

export const WIDGET_TITLES: Record<string, string | undefined> = {
  weather: "Weather",
  tasks: "Tasks",
  calendar: "Calendar",
  habits: "Habits",
  bills: "Bills",
  notes: "Notes",
  "quick-links": "Quick Links",
  pomodoro: "Focus",
  analytics: "Review",
};

export const DASHBOARD_WIDGET_IDS = [
  "clock", "weather", "tasks", "calendar",
  "habits", "bills", "notes", "quick-links",
  "pomodoro", "analytics",
] as const;

export const DEFAULT_DASHBOARD_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "clock",       x: 9, y: 0,  w: 3, h: 3, minW: 2, minH: 2 },
    { i: "weather",     x: 9, y: 3,  w: 3, h: 4, minW: 2, minH: 3 },
    { i: "habits",      x: 9, y: 7,  w: 3, h: 7, minW: 2, minH: 4 },
    { i: "tasks",       x: 0, y: 0,  w: 5, h: 6, minW: 3, minH: 4 },
    { i: "calendar",    x: 5, y: 0,  w: 4, h: 6, minW: 3, minH: 4 },
    { i: "bills",       x: 0, y: 6,  w: 3, h: 5, minW: 2, minH: 3 },
    { i: "notes",       x: 3, y: 6,  w: 3, h: 5, minW: 2, minH: 3 },
    { i: "quick-links", x: 6, y: 6,  w: 3, h: 4, minW: 2, minH: 3 },
    { i: "pomodoro",    x: 0, y: 11, w: 4, h: 6, minW: 3, minH: 4 },
    { i: "analytics",   x: 4, y: 11, w: 5, h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: "clock",       x: 0, y: 0,  w: 4, h: 3, minW: 2, minH: 2 },
    { i: "weather",     x: 4, y: 0,  w: 4, h: 4, minW: 2, minH: 3 },
    { i: "tasks",       x: 0, y: 3,  w: 4, h: 6, minW: 3, minH: 4 },
    { i: "calendar",    x: 4, y: 4,  w: 4, h: 6, minW: 3, minH: 4 },
    { i: "habits",      x: 0, y: 9,  w: 4, h: 6, minW: 2, minH: 4 },
    { i: "bills",       x: 4, y: 10, w: 4, h: 5, minW: 2, minH: 3 },
    { i: "notes",       x: 0, y: 15, w: 4, h: 5, minW: 2, minH: 3 },
    { i: "quick-links", x: 4, y: 15, w: 4, h: 4, minW: 2, minH: 3 },
    { i: "pomodoro",    x: 0, y: 20, w: 4, h: 6, minW: 3, minH: 4 },
    { i: "analytics",   x: 4, y: 20, w: 4, h: 6, minW: 3, minH: 4 },
  ],
};
