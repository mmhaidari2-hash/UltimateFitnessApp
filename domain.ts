import { Goal, Language, Profile, Workout } from './types';

export function workoutCompletionRate(workout: Workout) {
  const planned = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const completed = workout.exercises.reduce(
    (sum, exercise) => sum + Math.min(exercise.completedSets, exercise.sets),
    0,
  );
  return planned === 0 ? 0 : Math.round((completed / planned) * 100);
}

export function recommendedWeight(weight: number, completionRate: number) {
  if (completionRate > 85) return Math.round(weight * 1.025 * 100) / 100;
  if (completionRate < 70) return Math.round(weight * 0.975 * 100) / 100;
  return weight;
}

export function currentStreak(workouts: Workout[], now = new Date()) {
  const days = new Set(
    workouts
      .filter((workout) => workout.completed)
      .map((workout) => workout.date.slice(0, 10)),
  );
  const cursor = new Date(now);
  const today = cursor.toISOString().slice(0, 10);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function workoutVolume(workout: Workout) {
  return workout.exercises.reduce(
    (total, exercise) =>
      total + exercise.weight * exercise.reps * Math.min(exercise.completedSets, exercise.sets),
    0,
  );
}

export function levelForXp(xp: number) {
  return Math.floor(Math.max(0, xp) / 500) + 1;
}

export type ImportedProfile = Pick<
  Profile,
  'name' | 'age' | 'weight' | 'height' | 'goal' | 'language' | 'darkMode' | 'unit'
>;

export function parseWorkoutBackup(
  raw: string,
): { workouts: Workout[]; xp: number; profile: ImportedProfile | null } | null {
  if (raw.length > 1_000_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const backup = value as { workouts?: unknown; xp?: unknown; profile?: unknown };
    if (
      !Array.isArray(backup.workouts) ||
      backup.workouts.length > 500 ||
      typeof backup.xp !== 'number' ||
      !Number.isFinite(backup.xp) ||
      backup.xp < 0
    ) return null;
    const valid = backup.workouts.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const workout = item as Partial<Workout>;
      return typeof workout.id === 'string' &&
        typeof workout.name === 'string' && workout.name.length <= 120 &&
        typeof workout.date === 'string' && !Number.isNaN(Date.parse(workout.date)) &&
        Number.isInteger(workout.duration) && (workout.duration ?? 0) > 0 &&
        typeof workout.notes === 'string' && workout.notes.length <= 1000 &&
        typeof workout.completed === 'boolean' &&
        Number.isFinite(workout.completionRate) &&
        (workout.completionRate ?? -1) >= 0 && (workout.completionRate ?? 101) <= 100 &&
        Array.isArray(workout.exercises) && workout.exercises.length > 0 && workout.exercises.length <= 50 &&
        workout.exercises.every((exercise) =>
          typeof exercise.id === 'string' &&
          typeof exercise.name === 'string' && exercise.name.length <= 120 &&
          typeof exercise.muscleGroup === 'string' && exercise.muscleGroup.length <= 60 &&
          Number.isInteger(exercise.sets) && exercise.sets > 0 &&
          Number.isInteger(exercise.reps) && exercise.reps > 0 &&
          Number.isFinite(exercise.weight) && exercise.weight >= 0 &&
          Number.isInteger(exercise.completedSets) && exercise.completedSets >= 0 &&
          exercise.completedSets <= exercise.sets,
        );
    });
    let profile: ImportedProfile | null = null;
    if (backup.profile !== undefined) {
      if (!backup.profile || typeof backup.profile !== 'object') return null;
      const candidate = backup.profile as Partial<Profile>;
      const goals: Goal[] = ['muscle_gain', 'fat_loss', 'strength'];
      const languages: Language[] = ['en', 'fa'];
      if (
        typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 100 ||
        !Number.isInteger(candidate.age) || (candidate.age ?? -1) < 0 || (candidate.age ?? 121) > 120 ||
        !Number.isFinite(candidate.weight) || (candidate.weight ?? -1) < 0 || (candidate.weight ?? 1001) > 1000 ||
        !Number.isFinite(candidate.height) || (candidate.height ?? -1) < 0 || (candidate.height ?? 301) > 300 ||
        !goals.includes(candidate.goal as Goal) ||
        !languages.includes(candidate.language as Language) ||
        typeof candidate.darkMode !== 'boolean' ||
        !['kg', 'lb'].includes(candidate.unit ?? '')
      ) return null;
      profile = {
        name: candidate.name,
        age: candidate.age as number,
        weight: candidate.weight as number,
        height: candidate.height as number,
        goal: candidate.goal as Goal,
        language: candidate.language as Language,
        darkMode: candidate.darkMode,
        unit: candidate.unit as 'kg' | 'lb',
      };
    }
    return valid ? { workouts: backup.workouts as Workout[], xp: backup.xp, profile } : null;
  } catch {
    return null;
  }
}
