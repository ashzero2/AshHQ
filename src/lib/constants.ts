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
  // rowHeight = 56 — heights are chosen so each widget has ~180-500px of usable content area
  lg: [
    { i: "clock",       x: 9, y: 0,  w: 3, h: 4,  minW: 2, minH: 2 },
    { i: "weather",     x: 9, y: 4,  w: 3, h: 5,  minW: 2, minH: 3 },
    { i: "habits",      x: 9, y: 9,  w: 3, h: 9,  minW: 2, minH: 4 },
    { i: "tasks",       x: 0, y: 0,  w: 5, h: 8,  minW: 3, minH: 4 },
    { i: "calendar",    x: 5, y: 0,  w: 4, h: 8,  minW: 3, minH: 4 },
    { i: "bills",       x: 0, y: 8,  w: 3, h: 6,  minW: 2, minH: 3 },
    { i: "notes",       x: 3, y: 8,  w: 3, h: 6,  minW: 2, minH: 3 },
    { i: "quick-links", x: 6, y: 8,  w: 3, h: 5,  minW: 2, minH: 3 },
    { i: "pomodoro",    x: 0, y: 14, w: 4, h: 8,  minW: 3, minH: 4 },
    { i: "analytics",   x: 4, y: 14, w: 5, h: 8,  minW: 3, minH: 4 },
  ],
  md: [
    // clock + weather sit side-by-side (each 2/8 cols) instead of full-width halves
    { i: "clock",       x: 0, y: 0,  w: 2, h: 4,  minW: 2, minH: 2 },
    { i: "weather",     x: 2, y: 0,  w: 2, h: 4,  minW: 2, minH: 3 },
    { i: "tasks",       x: 0, y: 4,  w: 4, h: 6,  minW: 3, minH: 4 },
    { i: "calendar",    x: 4, y: 0,  w: 4, h: 6,  minW: 3, minH: 4 },
    { i: "habits",      x: 0, y: 10, w: 4, h: 6,  minW: 2, minH: 4 },
    { i: "bills",       x: 4, y: 6,  w: 4, h: 5,  minW: 2, minH: 3 },
    { i: "notes",       x: 0, y: 16, w: 4, h: 5,  minW: 2, minH: 3 },
    { i: "quick-links", x: 4, y: 11, w: 4, h: 4,  minW: 2, minH: 3 },
    { i: "pomodoro",    x: 0, y: 21, w: 4, h: 6,  minW: 3, minH: 4 },
    { i: "analytics",   x: 4, y: 15, w: 4, h: 6,  minW: 3, minH: 4 },
  ],
};
