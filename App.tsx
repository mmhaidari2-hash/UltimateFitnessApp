import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BADGES, CHALLENGES, COLORS, MOVEMENTS, YOUTUBE_SEARCH } from './constants';
import {
  currentStreak,
  ImportedProfile,
  levelForXp,
  parseWorkoutBackup,
  recommendedWeight,
  workoutCompletionRate,
  workoutVolume,
} from './domain';
import { badgeName, t, TranslationKey } from './localization';
import { EMPTY_DATA, loadData, makeCredential, matchesPassword, saveData } from './storage';
import { Account, AppData, Exercise, Goal, Language, Profile, Tab, Workout } from './types';

type Theme = { background: string; surface: string; text: string; muted: string; border: string };
const DARK: Theme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.white,
  muted: COLORS.muted,
  border: COLORS.border,
};
const LIGHT: Theme = {
  background: '#F3F6F8',
  surface: '#FFFFFF',
  text: '#17212B',
  muted: '#63717D',
  border: '#DCE3E8',
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function Label({ children, theme, style }: { children: ReactNode; theme: Theme; style?: object }) {
  return <Text style={[styles.label, { color: theme.text }, style]}>{children}</Text>;
}

function Button({
  title,
  onPress,
  theme,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  theme: Theme;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: secondary ? theme.surface : danger ? '#9D3434' : COLORS.primary },
        secondary && { borderColor: theme.border, borderWidth: 1 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? theme.text : COLORS.white }]}>{title}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  theme,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  editable = true,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  theme: Theme;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          multiline && styles.multiline,
          !editable && { opacity: 0.7 },
        ]}
        value={value}
      />
    </View>
  );
}

function Panel({ children, theme, style }: { children: ReactNode; theme: Theme; style?: object }) {
  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

function AuthScreen({
  language,
  onLanguage,
  onLogin,
  onSignup,
  theme,
}: {
  language: Language;
  onLanguage: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (name: string, email: string, password: string) => Promise<boolean>;
  theme: Theme;
}) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const tx = (key: TranslationKey) => t(language, key);

  const submit = async () => {
    setMessage('');
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!validEmail || password.length < 8 || (isSignup && !name.trim())) {
      setMessage(isSignup && !name.trim() ? tx('nameRequired') : tx('invalid'));
      return;
    }
    const ok = isSignup
      ? await onSignup(name.trim(), email.trim().toLowerCase(), password)
      : await onLogin(email.trim().toLowerCase(), password);
    if (!ok) setMessage(isSignup ? tx('invalid') : tx('authError'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.authRoot, { backgroundColor: theme.background, direction: language === 'fa' ? 'rtl' : 'ltr' }]}
    >
      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onLanguage} style={styles.languageToggle}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{language === 'en' ? 'فارسی' : 'English'}</Text>
        </Pressable>
        <Text style={styles.logo}>🏋️</Text>
        <Text style={[styles.title, { color: theme.text }]}>Ultimate Fitness</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {isSignup ? tx('signup') : tx('login')}
        </Text>
        <Panel theme={theme} style={styles.authPanel}>
          {isSignup && (
            <Field label={tx('name')} value={name} onChangeText={setName} theme={theme} />
          )}
          <Field
            label={tx('email')}
            value={email}
            onChangeText={setEmail}
            theme={theme}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label={tx('password')}
            value={password}
            onChangeText={setPassword}
            theme={theme}
            secureTextEntry
            placeholder="At least 8 characters"
          />
          {message ? <Text style={styles.errorText}>{message}</Text> : null}
          <Button title={isSignup ? tx('signup') : tx('login')} onPress={submit} theme={theme} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMessage('');
              setIsSignup(!isSignup);
            }}
            style={styles.linkButton}
          >
            <Text style={{ color: COLORS.primary, textAlign: 'center' }}>
              {isSignup ? tx('hasAccount') : tx('noAccount')}
            </Text>
          </Pressable>
        </Panel>
        <Text style={[styles.caption, { color: theme.muted }]}>Your data stays on this device.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function WorkoutEditor({
  initial,
  language,
  theme,
  unit,
  onSave,
  onCancel,
}: {
  initial?: Workout;
  language: Language;
  theme: Theme;
  unit: 'kg' | 'lb';
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}) {
  const tx = (key: TranslationKey) => t(language, key);
  const [name, setName] = useState(initial?.name ?? '');
  const [duration, setDuration] = useState(String(initial?.duration ?? 45));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [exercises, setExercises] = useState<Exercise[]>(
    initial?.exercises ?? [
      { id: makeId(), name: '', sets: 3, reps: 10, weight: 0, completedSets: 0, muscleGroup: 'Full body' },
    ],
  );
  const [error, setError] = useState('');

  const changeExercise = (id: string, field: keyof Exercise, value: string) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== id) return exercise;
        if (field === 'name' || field === 'muscleGroup') return { ...exercise, [field]: value };
        const numeric = Number(value);
        return { ...exercise, [field]: Number.isFinite(numeric) ? numeric : 0 };
      }),
    );
  };

  const save = () => {
    if (
      !name.trim() ||
      !Number.isInteger(Number(duration)) ||
      Number(duration) < 1 ||
      exercises.length === 0 ||
      exercises.some(
        (exercise) =>
          !exercise.name.trim() ||
          !Number.isInteger(exercise.sets) ||
          exercise.sets < 1 ||
          !Number.isInteger(exercise.reps) ||
          exercise.reps < 1 ||
          !Number.isFinite(exercise.weight) ||
          exercise.weight < 0 ||
          !Number.isInteger(exercise.completedSets) ||
          exercise.completedSets < 0 ||
          exercise.completedSets > exercise.sets,
      )
    ) {
      setError(tx('invalid'));
      return;
    }
    const planned = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    const done = exercises.reduce((sum, exercise) => sum + Math.min(exercise.completedSets, exercise.sets), 0);
    onSave({
      id: initial?.id ?? makeId(),
      date: initial?.date ?? new Date().toISOString(),
      name: name.trim(),
      duration: Number(duration),
      notes: notes.trim(),
      exercises: exercises.map((exercise) => ({ ...exercise, name: exercise.name.trim() })),
      completed: initial?.completed ?? false,
      completionRate: initial?.completed && planned > 0
        ? Math.round((done / planned) * 100)
        : initial?.completionRate ?? 0,
    });
  };

  return (
    <Panel theme={theme}>
      <Label theme={theme} style={styles.sectionTitle}>{initial ? tx('editWorkout') : tx('addWorkout')}</Label>
      <Field label={tx('workoutName')} value={name} onChangeText={setName} theme={theme} />
      <Field label={tx('duration')} value={duration} onChangeText={setDuration} theme={theme} keyboardType="numeric" />
      <Field label={tx('notes')} value={notes} onChangeText={setNotes} theme={theme} multiline />
      <Label theme={theme} style={styles.subheading}>{tx('exercises')}</Label>
      {exercises.map((exercise, index) => (
        <View key={exercise.id} style={[styles.exerciseEditor, { borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Label theme={theme} style={styles.exerciseHeading}>{tx('exercise')} {index + 1}</Label>
            {exercises.length > 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('delete')}
                onPress={() => setExercises((current) => current.filter((item) => item.id !== exercise.id))}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            )}
          </View>
          <Field
            label={tx('exercise')}
            value={exercise.name}
            onChangeText={(value) => changeExercise(exercise.id, 'name', value)}
            theme={theme}
            placeholder="e.g. Barbell squat"
          />
          <View style={styles.row}>
            <View style={styles.third}>
              <Field label={tx('sets')} value={String(exercise.sets)} onChangeText={(value) => changeExercise(exercise.id, 'sets', value)} theme={theme} keyboardType="numeric" />
            </View>
            <View style={styles.third}>
              <Field label={tx('reps')} value={String(exercise.reps)} onChangeText={(value) => changeExercise(exercise.id, 'reps', value)} theme={theme} keyboardType="numeric" />
            </View>
            <View style={styles.third}>
              <Field label={`${tx('weight')} (${unit})`} value={String(exercise.weight)} onChangeText={(value) => changeExercise(exercise.id, 'weight', value)} theme={theme} keyboardType="numeric" />
            </View>
          </View>
          <Field
            label={`${tx('completedSets')} (0–${exercise.sets})`}
            value={String(exercise.completedSets)}
            onChangeText={(value) => changeExercise(exercise.id, 'completedSets', value)}
            theme={theme}
            keyboardType="numeric"
          />
          <Field label={tx('muscleGroup')} value={exercise.muscleGroup} onChangeText={(value) => changeExercise(exercise.id, 'muscleGroup', value)} theme={theme} />
        </View>
      ))}
      <Button
        title={`＋ ${tx('addExercise')}`}
        secondary
        theme={theme}
        onPress={() =>
          setExercises((current) => [
            ...current,
            { id: makeId(), name: '', sets: 3, reps: 10, weight: 0, completedSets: 0, muscleGroup: 'Full body' },
          ])
        }
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.row}>
        <View style={styles.half}><Button title={tx('cancel')} secondary theme={theme} onPress={onCancel} /></View>
        <View style={styles.half}><Button title={tx('save')} theme={theme} onPress={save} /></View>
      </View>
    </Panel>
  );
}

function WorkoutsScreen({
  account,
  language,
  theme,
  unit,
  onChange,
}: {
  account: Account;
  language: Language;
  theme: Theme;
  unit: 'kg' | 'lb';
  onChange: (workouts: Workout[], xp: number) => void;
}) {
  const tx = (key: TranslationKey) => t(language, key);
  const [editor, setEditor] = useState<Workout | null | undefined>(undefined);
  const workouts = [...account.workouts].sort((a, b) => b.date.localeCompare(a.date));

  const saveWorkout = (workout: Workout) => {
    const next = account.workouts.some((item) => item.id === workout.id)
      ? account.workouts.map((item) => (item.id === workout.id ? workout : item))
      : [workout, ...account.workouts];
    onChange(next, account.xp);
    setEditor(undefined);
  };

  const deleteWorkout = (workout: Workout) =>
    Alert.alert(tx('delete'), workout.name, [
      { text: tx('cancel'), style: 'cancel' },
      {
        text: tx('delete'),
        style: 'destructive',
        onPress: () =>
          onChange(
            account.workouts.filter((item) => item.id !== workout.id),
            Math.max(0, account.xp - (workout.completed ? 100 : 0)),
          ),
      },
    ]);

  const completeWorkout = (workout: Workout) => {
    const completionRate = workoutCompletionRate(workout);
    const updated = { ...workout, completed: true, completionRate };
    onChange(
      account.workouts.map((item) => (item.id === workout.id ? updated : item)),
      account.xp + (workout.completed ? 0 : 100),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.rowBetween}>
        <Label theme={theme} style={styles.title}>{tx('workouts')}</Label>
        {!editor && <Button title={`＋ ${tx('addWorkout')}`} onPress={() => setEditor(null)} theme={theme} />}
      </View>
      {editor !== undefined && (
        <WorkoutEditor
          initial={editor ?? undefined}
          language={language}
          theme={theme}
          unit={unit}
          onSave={saveWorkout}
          onCancel={() => setEditor(undefined)}
        />
      )}
      {workouts.length === 0 && editor === undefined ? (
        <Panel theme={theme}><Label theme={theme}>{tx('empty')}</Label></Panel>
      ) : null}
      {workouts.map((workout) => (
        <Panel key={workout.id} theme={theme}>
          <View style={styles.rowBetween}>
            <Label theme={theme} style={styles.subheading}>{workout.name}</Label>
            {workout.completed && <Text style={styles.completedPill}>✓ {tx('done')}</Text>}
          </View>
          <Text style={[styles.body, { color: theme.muted }]}>
            {new Date(workout.date).toLocaleDateString()} · {workout.duration} min
          </Text>
          {workout.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseLine}>
              <Label theme={theme}>{exercise.name}</Label>
              <Text style={[styles.body, { color: theme.muted }]}>
                {exercise.sets} × {exercise.reps} · {exercise.weight} {unit} · {exercise.completedSets}/{exercise.sets}
              </Text>
            </View>
          ))}
          {!!workout.notes && <Text style={[styles.body, { color: theme.muted }]}>{workout.notes}</Text>}
          {workout.completed && (
            <Text style={[styles.body, { color: COLORS.success }]}>
              {tx('completion')}: {workout.completionRate}%
            </Text>
          )}
          <View style={styles.row}>
            {!workout.completed && (
              <View style={styles.half}>
                <Button title={tx('complete')} onPress={() => completeWorkout(workout)} theme={theme} />
              </View>
            )}
            <View style={styles.half}>
              <Button title={tx('editWorkout')} secondary onPress={() => setEditor(workout)} theme={theme} />
            </View>
            <View style={styles.half}>
              <Button title={tx('delete')} danger onPress={() => deleteWorkout(workout)} theme={theme} />
            </View>
          </View>
        </Panel>
      ))}
      <RestTimer language={language} theme={theme} />
    </ScrollView>
  );
}

function RestTimer({ language, theme }: { language: Language; theme: Theme }) {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || seconds <= 0) {
      if (seconds === 0) setRunning(false);
      return;
    }
    const timer = setTimeout(() => setSeconds((remaining) => remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, seconds]);
  return (
    <Panel theme={theme}>
      <Label theme={theme} style={styles.subheading}>⏱ {t(language, 'restTimer')}</Label>
      <View style={styles.rowBetween}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setRunning(false);
            setSeconds((value) => Math.max(30, value - 30));
          }}
        ><Text style={[styles.body, { color: COLORS.primary }]}>−30</Text></Pressable>
        <Text style={[styles.timer, { color: theme.text }]}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setRunning(false);
            setSeconds((value) => Math.min(120, value + 30));
          }}
        ><Text style={[styles.body, { color: COLORS.primary }]}>+30</Text></Pressable>
      </View>
      <Button
        title={running ? t(language, 'pauseTimer') : seconds === 0 ? t(language, 'restartTimer') : t(language, 'startTimer')}
        theme={theme}
        secondary
        onPress={() => {
          if (seconds === 0) setSeconds(60);
          setRunning(!running || seconds === 0);
        }}
      />
      <Text style={[styles.caption, { color: theme.muted, textAlign: 'center' }]}>
        {language === 'fa' ? '۳۰ تا ۱۲۰ ثانیه' : 'Choose 30–120 seconds'}
      </Text>
    </Panel>
  );
}

function HomeScreen({
  account,
  language,
  theme,
  onStart,
}: {
  account: Account;
  language: Language;
  theme: Theme;
  onStart: () => void;
}) {
  const tx = (key: TranslationKey) => t(language, key);
  const completed = account.workouts.filter((workout) => workout.completed);
  const level = levelForXp(account.xp);
  const streak = currentStreak(account.workouts);
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = completed.some((workout) => workout.date.slice(0, 10) === today);
  const challenge = CHALLENGES[0];
  const latest = completed.sort((a, b) => b.date.localeCompare(a.date))[0];
  const advice = latest?.exercises[0]
    ? recommendedWeight(latest.exercises[0].weight, latest.completionRate)
    : null;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={[styles.eyebrow, { color: theme.muted }]}>{tx('greeting')}</Text>
      <Label theme={theme} style={styles.title}>{account.profile.name} 👋</Label>
      <Text style={[styles.body, { color: theme.muted }]}>{tx('today')}</Text>
      <View style={styles.statGrid}>
        <StatCard title={tx('sessions')} value={String(completed.length)} theme={theme} />
        <StatCard title={tx('streak')} value={`🔥 ${streak}`} theme={theme} />
        <StatCard title={tx('xp')} value={`⚡ ${account.xp}`} theme={theme} />
        <StatCard title={tx('level')} value={`⭐ ${level}`} theme={theme} />
      </View>
      <Button title={`＋ ${tx('start')}`} theme={theme} onPress={onStart} />
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('challenge')}</Label>
        <Text style={[styles.body, { color: theme.muted }]}>{language === 'fa' ? 'امروز یک تمرین کامل کن' : challenge.detail}</Text>
        <Text style={[styles.challengeState, { color: doneToday ? COLORS.success : COLORS.primary }]}>
          {doneToday ? `✓ ${tx('todayDone')}` : '○ 0 / 1'}
        </Text>
      </Panel>
      {advice !== null && latest && (
        <Panel theme={theme}>
          <Label theme={theme} style={styles.subheading}>🤖 {tx('suggestion')}</Label>
          <Text style={[styles.body, { color: theme.muted }]}>
            {latest.exercises[0].name}: {latest.exercises[0].weight} → {advice} {account.profile.unit}
            {' · '}{latest.completionRate}%
          </Text>
        </Panel>
      )}
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>🏅 {tx('badges')}</Label>
        <View style={styles.badgeGrid}>
          {BADGES.map((badge) => {
            const unlocked = completed.length >= badge.requirement;
            return (
              <View key={badge.id} style={[styles.badge, { borderColor: unlocked ? COLORS.primary : theme.border }]}>
                <Text style={styles.badgeIcon}>{unlocked ? '🏆' : '🔒'}</Text>
                <Text numberOfLines={2} style={[styles.caption, { color: unlocked ? theme.text : theme.muted, textAlign: 'center' }]}>
                  {badgeName(language, badge.id)}
                </Text>
              </View>
            );
          })}
        </View>
      </Panel>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>🏆 {tx('leaderboard')} · Demo</Label>
        {[
          { name: account.profile.name, xp: account.xp },
          { name: 'Alex · Demo', xp: 450 },
          { name: 'Sam · Demo', xp: 300 },
        ]
          .sort((a, b) => b.xp - a.xp)
          .map((item, index) => (
            <View key={item.name} style={styles.rowBetween}>
              <Text style={[styles.body, { color: theme.text }]}>{index + 1}. {item.name}</Text>
              <Text style={[styles.body, { color: COLORS.primary }]}>{item.xp} XP</Text>
            </View>
          ))}
      </Panel>
      {account.workouts.length > 0 && (
        <Panel theme={theme}>
          <Label theme={theme} style={styles.subheading}>{tx('recent')}</Label>
          {account.workouts
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 3)
            .map((workout) => (
              <View key={workout.id} style={styles.rowBetween}>
                <Text style={[styles.body, { color: theme.text }]}>{workout.name}</Text>
                <Text style={[styles.caption, { color: theme.muted }]}>{new Date(workout.date).toLocaleDateString()}</Text>
              </View>
            ))}
        </Panel>
      )}
    </ScrollView>
  );
}

function StatCard({ title, value, theme }: { title: string; value: string; theme: Theme }) {
  return (
    <Panel theme={theme} style={styles.statCard}>
      <Text style={[styles.caption, { color: theme.muted }]}>{title}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </Panel>
  );
}

function AnalyticsScreen({
  workouts,
  language,
  theme,
  unit,
}: {
  workouts: Workout[];
  language: Language;
  theme: Theme;
  unit: 'kg' | 'lb';
}) {
  const tx = (key: TranslationKey) => t(language, key);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    const volume = workouts
      .filter((workout) => workout.completed && workout.date.slice(0, 10) === key)
      .reduce((sum, workout) => sum + workoutVolume(workout), 0);
    return { key, label: day.toLocaleDateString(language, { weekday: 'short' }), volume };
  }), [workouts, language]);
  const maxVolume = Math.max(1, ...days.map((day) => day.volume));
  const groups = workouts.flatMap((workout) =>
    workout.exercises.map((exercise) => ({
      group: exercise.muscleGroup,
      volume: exercise.weight * exercise.reps * Math.min(exercise.completedSets, exercise.sets),
    })),
  );
  const byGroup = groups.reduce<Record<string, number>>((result, item) => {
    result[item.group] = (result[item.group] ?? 0) + item.volume;
    return result;
  }, {});
  const exerciseProgress = workouts
    .flatMap((workout) => workout.exercises.map((exercise) => ({ ...exercise, date: workout.date })))
    .reduce<Record<string, { first: number; latest: number; date: string }>>((result, exercise) => {
      const saved = result[exercise.name];
      if (!saved) result[exercise.name] = { first: exercise.weight, latest: exercise.weight, date: exercise.date };
      else if (exercise.date < saved.date) result[exercise.name] = { ...saved, first: exercise.weight };
      else if (exercise.date > saved.date) result[exercise.name] = { ...saved, latest: exercise.weight, date: exercise.date };
      return result;
    }, {});
  const weekdays = workouts.filter((workout) => workout.completed).reduce<Record<string, number>>((result, workout) => {
    const day = new Date(workout.date).toLocaleDateString(language, { weekday: 'long' });
    result[day] = (result[day] ?? 0) + 1;
    return result;
  }, {});
  const bestDay = Object.entries(weekdays).sort((a, b) => b[1] - a[1])[0]?.[0];
  const worstDay = Object.entries(weekdays).sort((a, b) => a[1] - b[1])[0]?.[0];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Label theme={theme} style={styles.title}>{tx('analytics')}</Label>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('weeklyVolume')} ({unit})</Label>
        <View style={styles.chart}>
          {days.map((day) => (
            <View key={day.key} style={styles.barColumn}>
              <Text style={[styles.chartValue, { color: theme.muted }]}>{Math.round(day.volume)}</Text>
              <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.bar, { height: `${Math.max(3, (day.volume / maxVolume) * 100)}%` }]} />
              </View>
              <Text style={[styles.chartLabel, { color: theme.muted }]}>{day.label}</Text>
            </View>
          ))}
        </View>
      </Panel>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('progress')}</Label>
        {Object.entries(exerciseProgress).length === 0 ? (
          <Text style={[styles.body, { color: theme.muted }]}>{tx('empty')}</Text>
        ) : Object.entries(exerciseProgress).map(([name, values]) => (
          <View key={name} style={styles.rowBetween}>
            <Text style={[styles.body, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.body, { color: COLORS.primary }]}>{values.first} → {values.latest} {unit}</Text>
          </View>
        ))}
      </Panel>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('distribution')}</Label>
        {Object.entries(byGroup).length === 0 ? (
          <Text style={[styles.body, { color: theme.muted }]}>{tx('empty')}</Text>
        ) : Object.entries(byGroup).sort((a, b) => b[1] - a[1]).map(([group, volume]) => (
          <View key={group} style={styles.rowBetween}>
            <Text style={[styles.body, { color: theme.text }]}>{group}</Text>
            <Text style={[styles.body, { color: theme.muted }]}>{Math.round(volume)} {unit}</Text>
          </View>
        ))}
      </Panel>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('bestDay')}</Label>
        <Text style={[styles.body, { color: theme.muted }]}>{bestDay ?? '—'}</Text>
      </Panel>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('worstDay')}</Label>
        <Text style={[styles.body, { color: theme.muted }]}>{worstDay ?? '—'}</Text>
      </Panel>
    </ScrollView>
  );
}

function VideosScreen({ language, theme }: { language: Language; theme: Theme }) {
  const tx = (key: TranslationKey) => t(language, key);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [group, setGroup] = useState('');
  const levels = Array.from(new Set(MOVEMENTS.map((movement) => movement.level)));
  const groups = Array.from(new Set(MOVEMENTS.map((movement) => movement.group)));
  const filtered = MOVEMENTS.filter((movement) =>
    movement.name.toLowerCase().includes(query.toLowerCase()) &&
    (!level || movement.level === level) &&
    (!group || movement.group === group),
  );

  const filters = (values: string[], selected: string, setSelected: (value: string) => void, all: string) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {[all, ...values].map((item) => {
        const value = item === all ? '' : item;
        return (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setSelected(value)}
            style={[styles.chip, { borderColor: selected === value ? COLORS.primary : theme.border, backgroundColor: theme.surface }]}
          >
            <Text style={{ color: selected === value ? COLORS.primary : theme.text }}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Label theme={theme} style={styles.title}>{tx('videos')}</Label>
      <Field label={tx('search')} value={query} onChangeText={setQuery} theme={theme} />
      {filters(levels, level, setLevel, tx('allLevels'))}
      {filters(groups, group, setGroup, tx('allGroups'))}
      {filtered.length === 0 && <Text style={[styles.body, { color: theme.muted }]}>{tx('noResults')}</Text>}
      {filtered.map((movement) => (
        <Panel key={movement.name} theme={theme} style={styles.videoCard}>
          <Text style={styles.videoIcon}>▶️</Text>
          <View style={styles.videoInfo}>
            <Label theme={theme}>{movement.name}</Label>
            <Text style={[styles.caption, { color: theme.muted }]}>{movement.group} · {movement.level}</Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(YOUTUBE_SEARCH(movement.name))}>
              <Text style={[styles.caption, { color: COLORS.primary }]}>{tx('watch')} ↗</Text>
            </Pressable>
          </View>
        </Panel>
      ))}
    </ScrollView>
  );
}

function ProfileScreen({
  account,
  language,
  theme,
  onProfile,
  onToggleLanguage,
  onToggleTheme,
  onToggleUnit,
  onSignOut,
  onReset,
  onImport,
}: {
  account: Account;
  language: Language;
  theme: Theme;
  onProfile: (profile: Profile) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onToggleUnit: () => void;
  onSignOut: () => void;
  onReset: () => void;
  onImport: (workouts: Workout[], xp: number, profile: ImportedProfile | null) => void;
}) {
  const tx = (key: TranslationKey) => t(language, key);
  const profile = account.profile;
  const [backup, setBackup] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const update = (changes: Partial<Profile>) => onProfile({ ...profile, ...changes });
  const goalValues: Goal[] = ['muscle_gain', 'fat_loss', 'strength'];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Label theme={theme} style={styles.title}>{tx('profile')}</Label>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('account')}</Label>
        <Field label={tx('name')} value={profile.name} onChangeText={(name) => update({ name })} theme={theme} />
        <Field label={tx('email')} value={profile.email} theme={theme} editable={false} />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field label={tx('age')} value={profile.age ? String(profile.age) : ''} onChangeText={(value) => update({ age: Number(value) || 0 })} theme={theme} keyboardType="numeric" />
          </View>
          <View style={styles.half}>
            <Field label={`${tx('weight')} (${profile.unit})`} value={profile.weight ? String(profile.weight) : ''} onChangeText={(value) => update({ weight: Number(value) || 0 })} theme={theme} keyboardType="numeric" />
          </View>
        </View>
        <Field label={tx('height')} value={profile.height ? String(profile.height) : ''} onChangeText={(value) => update({ height: Number(value) || 0 })} theme={theme} keyboardType="numeric" />
        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{tx('goal')}</Text>
        <View style={styles.chips}>
          {goalValues.map((goal) => (
            <Pressable
              accessibilityRole="button"
              key={goal}
              onPress={() => update({ goal })}
              style={[styles.chip, { borderColor: profile.goal === goal ? COLORS.primary : theme.border, backgroundColor: theme.surface }]}
            >
              <Text style={{ color: profile.goal === goal ? COLORS.primary : theme.text }}>{tx(goal)}</Text>
            </Pressable>
          ))}
        </View>
      </Panel>
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('appearance')}</Label>
        <SettingsRow label={tx('language')} value={language === 'en' ? 'English' : 'فارسی'} onPress={onToggleLanguage} theme={theme} />
        <SettingsRow label={tx('darkMode')} value={profile.darkMode ? '●' : '○'} onPress={onToggleTheme} theme={theme} />
        <SettingsRow label={tx('units')} value={profile.unit} onPress={onToggleUnit} theme={theme} />
      </Panel>
      <Button title={tx('export')} theme={theme} secondary onPress={async () => {
        try {
          await Share.share({ message: JSON.stringify({ profile: account.profile, workouts: account.workouts, xp: account.xp }, null, 2) });
        } catch {
          Alert.alert(tx('export'), tx('exportReady'));
        }
      }} />
      <Panel theme={theme}>
        <Label theme={theme} style={styles.subheading}>{tx('import')}</Label>
        <Field
          label={tx('pasteBackup')}
          value={backup}
          onChangeText={setBackup}
          theme={theme}
          multiline
          maxLength={1_000_000}
        />
        {importMessage ? <Text style={[styles.caption, { color: importMessage === tx('imported') ? COLORS.success : '#FF6B6B' }]}>{importMessage}</Text> : null}
        <Button title={tx('import')} theme={theme} onPress={() => {
          const parsed = parseWorkoutBackup(backup);
          if (!parsed) {
            setImportMessage(tx('invalidBackup'));
            return;
          }
          onImport(parsed.workouts, parsed.xp, parsed.profile);
          setBackup('');
          setImportMessage(tx('imported'));
        }} />
      </Panel>
      <Button title={tx('signOut')} theme={theme} secondary onPress={onSignOut} />
      <Button
        title={tx('reset')}
        theme={theme}
        danger
        onPress={() => Alert.alert(tx('reset'), tx('resetConfirm'), [
          { text: tx('cancel'), style: 'cancel' },
          { text: tx('reset'), style: 'destructive', onPress: onReset },
        ])}
      />
    </ScrollView>
  );
}

function SettingsRow({ label, value, onPress, theme }: { label: string; value: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.body, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.body, { color: COLORS.primary }]}>{value}  ›</Text>
    </Pressable>
  );
}

const TABS: { id: Tab; icon: string }[] = [
  { id: 'home', icon: '⌂' },
  { id: 'workouts', icon: '🏋' },
  { id: 'analytics', icon: '▥' },
  { id: 'videos', icon: '▶' },
  { id: 'profile', icon: '◉' },
];

export default function App() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const [guestLanguage, setGuestLanguage] = useState<Language>('en');

  useEffect(() => {
    loadData()
      .then(setData)
      .catch(() => setData(EMPTY_DATA))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) saveData(data).catch(() => undefined);
  }, [data, loading]);

  const account = data.accounts.find((item) => item.email === data.activeEmail);
  const language = account?.profile.language ?? guestLanguage;
  const theme = account?.profile.darkMode === false ? LIGHT : DARK;
  const tx = (key: TranslationKey) => t(language, key);

  const updateAccount = (updater: (current: Account) => Account) => {
    setData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.email === current.activeEmail ? updater(item) : item,
      ),
    }));
  };

  const signup = async (name: string, email: string, password: string) => {
    if (data.accounts.some((item) => item.email === email)) return false;
    const credential = await makeCredential(password);
    const profile: Profile = {
      name,
      email,
      age: 0,
      weight: 0,
      height: 0,
      goal: 'muscle_gain',
      createdAt: new Date().toISOString(),
      language: guestLanguage,
      darkMode: true,
      unit: 'kg',
    };
    const newAccount: Account = { ...credential, email, profile, workouts: [], xp: 0 };
    setData((current) => ({
      accounts: [...current.accounts, newAccount],
      activeEmail: email,
    }));
    return true;
  };

  const login = async (email: string, password: string) => {
    const found = data.accounts.find((item) => item.email === email);
    if (!found || !(await matchesPassword(found, password))) return false;
    setData((current) => ({ ...current, activeEmail: email }));
    return true;
  };

  const reset = () => {
    setData(EMPTY_DATA);
    setTab('home');
  };

  let content;
  if (!account) {
    content = (
      <AuthScreen
        language={language}
        onLanguage={() => setGuestLanguage((current) => current === 'en' ? 'fa' : 'en')}
        onLogin={login}
        onSignup={signup}
        theme={theme}
      />
    );
  } else {
    const setWorkouts = (workouts: Workout[], xp: number) => updateAccount((current) => ({ ...current, workouts, xp }));
    switch (tab) {
      case 'home':
        content = <HomeScreen account={account} language={language} theme={theme} onStart={() => setTab('workouts')} />;
        break;
      case 'workouts':
        content = <WorkoutsScreen account={account} language={language} theme={theme} unit={account.profile.unit} onChange={setWorkouts} />;
        break;
      case 'analytics':
        content = <AnalyticsScreen workouts={account.workouts} language={language} theme={theme} unit={account.profile.unit} />;
        break;
      case 'videos':
        content = <VideosScreen language={language} theme={theme} />;
        break;
      case 'profile':
        content = (
          <ProfileScreen
            account={account}
            language={language}
            theme={theme}
            onProfile={(profile) => updateAccount((current) => ({ ...current, profile }))}
            onToggleLanguage={() => updateAccount((current) => ({
              ...current,
              profile: { ...current.profile, language: language === 'en' ? 'fa' : 'en' },
            }))}
            onToggleTheme={() => updateAccount((current) => ({
              ...current,
              profile: { ...current.profile, darkMode: !current.profile.darkMode },
            }))}
            onToggleUnit={() => updateAccount((current) => ({
              ...current,
              profile: {
                ...current.profile,
                unit: current.profile.unit === 'kg' ? 'lb' : 'kg',
                weight: Math.round(current.profile.weight * (current.profile.unit === 'kg' ? 2.20462 : 0.453592) * 10) / 10,
              },
              workouts: current.workouts.map((workout) => ({
                ...workout,
                exercises: workout.exercises.map((exercise) => ({
                  ...exercise,
                  weight: Math.round(exercise.weight * (current.profile.unit === 'kg' ? 2.20462 : 0.453592) * 100) / 100,
                })),
              })),
            }))}
            onSignOut={() => setData((current) => ({ ...current, activeEmail: null }))}
            onReset={reset}
            onImport={(workouts, xp, profile) => updateAccount((current) => ({
              ...current,
              workouts,
              xp,
              profile: profile ? { ...current.profile, ...profile } : current.profile,
            }))}
          />
        );
        break;
    }
  }

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <StatusBar style={theme === DARK ? 'light' : 'dark'} />
        <Text style={{ color: theme.text }}>{tx('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background, direction: language === 'fa' ? 'rtl' : 'ltr' }]}>
      <StatusBar style={theme === DARK ? 'light' : 'dark'} />
      {content}
      {account && (
        <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={item.id}
                onPress={() => setTab(item.id)}
                style={styles.tab}
              >
                <Text style={{ color: active ? COLORS.primary : theme.muted, fontSize: 19 }}>{item.icon}</Text>
                <Text numberOfLines={1} style={[styles.tabLabel, { color: active ? COLORS.primary : theme.muted }]}>
                  {tx(item.id)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  authRoot: { flex: 1 },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  languageToggle: { alignSelf: 'flex-end', padding: 12 },
  logo: { fontSize: 48, textAlign: 'center', marginTop: 16 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 18 },
  authPanel: { padding: 20 },
  page: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 28, gap: 14 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 16, fontWeight: '600', textAlign: 'auto' },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'auto' },
  caption: { fontSize: 12, textAlign: 'auto' },
  eyebrow: { fontSize: 14, marginBottom: -6 },
  sectionTitle: { fontSize: 20, marginBottom: 4 },
  subheading: { fontSize: 17, marginBottom: 2 },
  field: { flex: 1, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, textAlign: 'auto', writingDirection: 'auto' },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  button: { minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  linkButton: { padding: 12 },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  half: { flex: 1 },
  third: { flex: 1 },
  exerciseEditor: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  exerciseHeading: { fontSize: 14 },
  removeText: { color: '#FF6B6B', fontSize: 24, paddingHorizontal: 8 },
  exerciseLine: { borderTopWidth: 1, borderTopColor: '#2A3742', paddingTop: 8, gap: 3 },
  completedPill: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', minHeight: 84, justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  challengeState: { fontSize: 14, fontWeight: '700' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  badge: { width: '31%', minHeight: 78, borderWidth: 1, borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { fontSize: 20, marginBottom: 4 },
  timer: { fontSize: 28, fontWeight: '800' },
  chart: { height: 190, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: 12 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 5 },
  chartValue: { fontSize: 10 },
  barTrack: { height: 120, width: 18, borderRadius: 9, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { backgroundColor: COLORS.primary, width: '100%', borderRadius: 9 },
  chartLabel: { fontSize: 10 },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  videoCard: { flexDirection: 'row', alignItems: 'center' },
  videoIcon: { fontSize: 26 },
  videoInfo: { flex: 1, gap: 4 },
  settingsRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 3 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});
