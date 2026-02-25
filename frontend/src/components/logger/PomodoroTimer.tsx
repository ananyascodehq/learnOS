
import { useEffect, useRef, useCallback, useState } from 'react'
import { Timer, X, Play, Pause } from 'lucide-react'
import { usePomodoro } from '../../contexts/PomodoroContext'


interface PomodoroTimerProps {
    onStart: (time: string) => void
    onEnd: (time: string) => void
    onCancel: () => void
}


const DURATION_OPTIONS = [
    { label: '25 min', value: 1500 },
    { label: '50 min', value: 3000 },
]

function formatTimeOfDay(): string {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}


export default function PomodoroTimer({ onStart, onEnd, onCancel }: PomodoroTimerProps) {
    const { running, duration, remaining, start, stop, setTaskTitle } = usePomodoro();
    const [localDuration, setLocalDuration] = useState(1500);
    const [isStarted, setIsStarted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const audioRef = useRef<AudioContext | null>(null);

    const totalSeconds = duration;
    const secondsLeft = running ? remaining : localDuration;
    const progress = isStarted ? 1 - (secondsLeft / totalSeconds) : 0;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    const playBeep = useCallback(() => {
        try {
            const ctx = new AudioContext()
            audioRef.current = ctx
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 800
            gain.gain.value = 0.3
            osc.start()
            osc.stop(ctx.currentTime + 0.3)
            setTimeout(() => {
                const osc2 = ctx.createOscillator()
                const gain2 = ctx.createGain()
                osc2.connect(gain2)
                gain2.connect(ctx.destination)
                osc2.frequency.value = 1000
                gain2.gain.value = 0.3
                osc2.start()
                osc2.stop(ctx.currentTime + 0.3)
            }, 400)
        } catch {
            // Audio not available
        }
    }, [])


    useEffect(() => {
        if (running && remaining === 0) {
            setIsComplete(true);
            playBeep();
            onEnd(formatTimeOfDay());
        }
    }, [running, remaining, onEnd, playBeep]);


    const handleStart = () => {
        if (!isStarted) {
            setIsStarted(true);
            setTaskTitle('');
            onStart(formatTimeOfDay());
            start(localDuration);
        } else if (!running) {
            start(duration);
        }
    };


    const handlePause = () => {
        stop();
    };


    const handleCancel = () => {
        stop();
        setIsStarted(false);
        setIsComplete(false);
        onCancel();
    };


    const handleDurationChange = (secs: number) => {
        if (isStarted) return;
        setLocalDuration(secs);
    };


    // SVG circle math
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-white">Pomodoro Timer</span>
                </div>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="text-muted hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Duration selector */}
            {!isStarted && (
                <div className="flex gap-2 mb-5">
                    {DURATION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleDurationChange(opt.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 cursor-pointer ${duration === opt.value
                                ? 'border-primary/50 bg-primary/15 text-primary'
                                : 'border-white/5 bg-white/[0.02] text-muted hover:bg-white/5'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Timer display with circular progress */}
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="6"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={isComplete ? '#10B981' : '#1A56DB'}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    {/* Time display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-mono font-bold ${isComplete ? 'text-projects' : 'text-white'}`}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Complete message */}
                {isComplete && (
                    <p className="text-projects text-sm font-medium mt-3 animate-pulse">
                        Session complete! Log what you did.
                    </p>
                )}

                {/* Controls */}
                {!isComplete && (
                    <div className="flex gap-3 mt-4">
                        {running ? (
                            <button
                                type="button"
                                onClick={handlePause}
                                className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                <Pause className="w-4 h-4" />
                                Pause
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStart}
                                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                <Play className="w-4 h-4" />
                                {isStarted ? 'Resume' : 'Start'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
