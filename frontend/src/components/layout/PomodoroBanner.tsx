import { usePomodoro } from '../../contexts/PomodoroContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const QUOTES = [
  "Stay on target! 🚀",
  "Don't break the streak!",
  "Focus is your superpower.",
  "Almost there, keep going!",
  "Distraction is the enemy of progress.",
  "You got this! 💪",
  "Every second counts!",
  "Back to work, champion!",
  "Greatness is built one session at a time.",
  "Your future self will thank you."
];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PomodoroBanner() {
  const { running, remaining, taskTitle } = usePomodoro();
  const location = useLocation();
  const navigate = useNavigate();

  // Must call useMemo before any early returns (React rules of hooks)
  const quote = useMemo(() => {
    const idx = Math.floor((Date.now() / 1000) % QUOTES.length);
    return QUOTES[idx];
  }, []);

  // Hide on logger page or when not running
  if (location.pathname === '/log') return null;
  if (!running || remaining <= 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
      <span className="font-mono text-lg font-bold tracking-widest">
        ⏳ {formatTime(remaining)}
      </span>
      <span className="font-semibold">
        {taskTitle ? `"${taskTitle}"` : 'Pomodoro in progress'}
      </span>
      <span className="hidden sm:inline text-white/80 text-sm italic">{quote}</span>
      <button
        type="button"
        className="ml-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium cursor-pointer"
        onClick={() => navigate('/log')}
      >
        Get back to your work
      </button>
    </div>
  );
}
