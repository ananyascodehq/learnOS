import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface PomodoroState {
  running: boolean;
  isStarted: boolean;
  startTime: number | null;
  duration: number; // in seconds
  remaining: number; // in seconds
  taskTitle: string;
  setTaskTitle: (title: string) => void;
  setDuration: (duration: number) => void;
  setIsStarted: (isStarted: boolean) => void;
  start: (duration?: number) => void;
  pause: () => void;
  stop: () => void;
  tick: () => void;
}


const PomodoroContext = createContext<PomodoroState | undefined>(undefined);

const STORAGE_KEY = 'pomodoro-timer-state-v1';

function getInitialState(): Omit<PomodoroState, 'setTaskTitle' | 'setDuration' | 'setIsStarted' | 'start' | 'pause' | 'stop' | 'tick'> {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          running: parsed.running,
          isStarted: parsed.isStarted || false,
          startTime: parsed.startTime,
          duration: parsed.duration,
          remaining: parsed.remaining,
          taskTitle: parsed.taskTitle || '',
        };
      } catch { }
    }
  }
  return { running: false, isStarted: false, startTime: null, duration: 1500, remaining: 1500, taskTitle: '' };
}

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const init = getInitialState()
  const [running, setRunning] = useState(init.running);
  const [isStarted, setIsStarted] = useState(init.isStarted);
  const [startTime, setStartTime] = useState<number | null>(init.startTime);
  const [duration, setDuration] = useState(init.duration);
  const [remaining, setRemaining] = useState(init.remaining);
  const [taskTitle, setTaskTitle] = useState(init.taskTitle);

  // Persist state
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ running, isStarted, startTime, duration, remaining, taskTitle })
    );
  }, [running, isStarted, startTime, duration, remaining, taskTitle]);

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
  const start = useCallback((dur?: number) => {
    if (dur !== undefined) {
      setDuration(dur);
      setRemaining(dur);
    }
    setStartTime(Date.now());
    setRunning(true);
    setIsStarted(true);
  }, []);

  // Pause timer
  const pause = useCallback(() => {
    setRunning(false);
    setStartTime(null);
  }, []);

  // Stop timer
  const stop = useCallback(() => {
    setRunning(false);
    setIsStarted(false);
    setStartTime(null);
    setDuration(1500);
    setRemaining(1500);
    setTaskTitle('');
  }, []);

  // Manual tick (not used, but for API completeness)
  const tick = useCallback(() => {
    setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  return (
    <PomodoroContext.Provider value={{ running, isStarted, startTime, duration, remaining, taskTitle, setTaskTitle, setDuration, setIsStarted, start, pause, stop, tick }}>
      {children}
    </PomodoroContext.Provider>
  );
};

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
}
