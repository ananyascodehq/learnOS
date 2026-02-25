import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface PomodoroState {
  running: boolean;
  startTime: number | null;
  duration: number; // in seconds
  remaining: number; // in seconds
  taskTitle: string;
  setTaskTitle: (title: string) => void;
  start: (duration: number) => void;
  stop: () => void;
  tick: () => void;
}

const PomodoroContext = createContext<PomodoroState | undefined>(undefined);

const STORAGE_KEY = 'pomodoro-timer-state-v1';

function getInitialState(): Omit<PomodoroState, 'setTaskTitle' | 'start' | 'stop' | 'tick'> {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          running: parsed.running,
          startTime: parsed.startTime,
          duration: parsed.duration,
          remaining: parsed.remaining,
          taskTitle: parsed.taskTitle || '',
        };
      } catch { }
    }
  }
  return { running: false, startTime: null, duration: 1500, remaining: 1500, taskTitle: '' };
}

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const init = getInitialState()
  const [running, setRunning] = useState(init.running);
  const [startTime, setStartTime] = useState<number | null>(init.startTime);
  const [duration, setDuration] = useState(init.duration);
  const [remaining, setRemaining] = useState(init.remaining);
  const [taskTitle, setTaskTitle] = useState(init.taskTitle);

  // Persist state
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ running, startTime, duration, remaining, taskTitle })
    );
  }, [running, startTime, duration, remaining, taskTitle]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setStartTime(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  // Start timer
  const start = useCallback((dur: number) => {
    setDuration(dur);
    setRemaining(dur);
    setStartTime(Date.now());
    setRunning(true);
  }, []);

  // Stop timer
  const stop = useCallback(() => {
    setRunning(false);
    setStartTime(null);
    setRemaining(duration);
    setTaskTitle('');
  }, [duration]);

  // Manual tick (not used, but for API completeness)
  const tick = useCallback(() => {
    setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  return (
    <PomodoroContext.Provider value={{ running, startTime, duration, remaining, taskTitle, setTaskTitle, start, stop, tick }}>
      {children}
    </PomodoroContext.Provider>
  );
};

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
}
