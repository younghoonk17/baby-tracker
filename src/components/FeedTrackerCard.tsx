interface FeedTrackerCardProps {
  isFeeding: boolean;
  currentFeedStartTime?: string;
  currentFeedBoobSide?: string;
  feedTimerActive: boolean;
  selectedBoob: string | null;
  formatDuration: (start: string, end?: string) => string;
  onSelectBoob: (side: 'left' | 'right') => void;
  onStartFeed: () => void;
  onStopFeed: () => void;
  onEditStartTime: () => void;
}

function FeedTrackerCard({
  isFeeding,
  currentFeedStartTime,
  currentFeedBoobSide,
  feedTimerActive,
  selectedBoob,
  formatDuration,
  onSelectBoob,
  onStartFeed,
  onStopFeed,
  onEditStartTime,
}: FeedTrackerCardProps) {
  return (
    <div className={`p-6 rounded-[2.5rem] shadow-xl transition-colors duration-500 ${isFeeding ? 'bg-emerald-600 text-white' : 'bg-white text-gray-800'}`}>
      <h3 className="text-lg font-bold mb-4">Feeding Tracker</h3>
      {isFeeding ? (
        <>
          <p className="text-sm opacity-90 mb-2">Currently feeding ({currentFeedBoobSide})</p>
          <p className="text-xs opacity-80 mb-4">{feedTimerActive ? 'Timer running' : 'Timer paused'}</p>
          <p className="text-4xl font-mono font-bold tracking-wider mb-6">
            {currentFeedStartTime ? formatDuration(currentFeedStartTime) : '00:00:00'}
          </p>
          <button
            onClick={onEditStartTime}
            className="w-full mb-3 bg-white/20 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-white/30 transition-colors"
          >
            Edit Start Time
          </button>
          <button
            onClick={onStopFeed}
            className="w-full bg-white text-emerald-700 px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-50 transition-transform active:scale-95"
          >
            Stop Feed
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">Choose side and start a feeding session.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => onSelectBoob('left')}
              className={`py-3 rounded-2xl font-semibold border transition-colors ${selectedBoob === 'left' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => onSelectBoob('right')}
              className={`py-3 rounded-2xl font-semibold border transition-colors ${selectedBoob === 'right' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
            >
              Right
            </button>
          </div>
          <button
            onClick={onStartFeed}
            disabled={!selectedBoob}
            className="w-full bg-emerald-500 disabled:bg-emerald-200 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-transform active:scale-95"
          >
            Start Feed
          </button>
        </>
      )}
    </div>
  );
}

export default FeedTrackerCard;
