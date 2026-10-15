export type Language = 'en' | 'fa';
export type Goal = 'muscle_gain' | 'fat_loss' | 'strength';
export type Tab = 'home' | 'workouts' | 'analytics' | 'videos' | 'profile';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  completedSets: number;
  muscleGroup: string;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  duration: number;
  notes: string;
  exercises: Exercise[];
  completed: boolean;
  completionRate: number;
}

export interface Profile {
  email: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: Goal;
  createdAt: string;
  language: Language;
  darkMode: boolean;
  unit: 'kg' | 'lb';
}

export interface Account {
  email: string;
  salt: string;
  passwordHash: string;
  profile: Profile;
  workouts: Workout[];
  xp: number;
}

export interface AppData {
  accounts: Account[];
  activeEmail: string | null;
}
