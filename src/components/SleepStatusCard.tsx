import { Moon, Sun } from 'lucide-react';

interface SleepStatusCardProps {
  babyName: string;
  isSleeping: boolean;
  currentSleepStartTime?: string;
  lastWakeAgoText: string;
  formatDuration: (start: string, end?: string) => string;
  onEditStartTime: () => void;
  onToggleSleep: () => void;
}

function SleepStatusCard({
  babyName,
  isSleeping,
  currentSleepStartTime,
  lastWakeAgoText,
  formatDuration,
  onEditStartTime,
  onToggleSleep,
}: SleepStatusCardProps) {
  return (
    <div className={`p-8 rounded-[2.5rem] shadow-xl text-center transition-colors duration-500 ${isSleeping ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}>
      {isSleeping ? (
        <>
          <Moon size={48} className="mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">Shhh! {babyName} is sleeping</h2>
          <div className="bg-white/10 py-4 px-6 rounded-2xl mb-8 inline-block">
            <p className="text-4xl font-mono font-bold tracking-wider mb-1">
              {currentSleepStartTime ? formatDuration(currentSleepStartTime) : '00:00:00'}
            </p>
            <p className="text-xs opacity-70 uppercase tracking-widest">Elapsed Time</p>
          </div>
          <br />
          <button
            onClick={onEditStartTime}
            className="mb-4 bg-white/15 text-white px-6 py-2 rounded-xl font-semibold hover:bg-white/25 transition-colors"
          >
            Edit Start Time
          </button>
          <br />
          <button
            onClick={onToggleSleep}
            className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-transform active:scale-95"
          >
            Wake Up
          </button>
        </>
      ) : (
        <>
          <Sun size={48} className="mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold mb-2">{babyName} is awake</h2>
          <p className="text-gray-400 mb-8">Last woke up {lastWakeAgoText}</p>
          <button
            onClick={onToggleSleep}
            className="bg-pink-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-600 transition-transform active:scale-95"
          >
            Put to Sleep
          </button>
        </>
      )}
    </div>
  );
}

export default SleepStatusCard;
