export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum WidgetType {
  WEATHER = "WEATHER",
  CALENDAR = "CALENDAR",
  TASKS = "TASKS",
  FINANCE = "FINANCE",
  HABITS = "HABITS",
  NOTES = "NOTES",
  AI_CHAT = "AI_CHAT",
  QUICK_LINKS = "QUICK_LINKS",
  CLOCK = "CLOCK",
  GREETING = "GREETING",
}

export enum AIProvider {
  OPENAI = "OPENAI",
  OLLAMA = "OLLAMA",
  GEMINI = "GEMINI",
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  columns: number;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
  forecast: WeatherForecastItem[];
}

export interface WeatherForecastItem {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  color: string;
  allDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: Date;
  createdAt: Date;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: { category: string; amount: number; percentage: number }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: "DAILY" | "WEEKLY";
  createdAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  logs: HabitLog[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  category: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  pin: string;
  aiProvider: AIProvider;
  openaiApiKey: string | null;
  openaiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  weatherApiKey: string | null;
  weatherCity: string;
  temperatureUnit: "C" | "F";
  theme: "light" | "dark" | "system";
  dashboardLayout: DashboardLayout;
}
