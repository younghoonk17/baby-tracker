import { Edit2, History, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';

export interface RecentActivityItem {
  id: string;
  type: 'sleep' | 'feed';
  start_time: string;
  end_time: string;
  boob_side?: string;
}

interface RecentActivityListProps {
  recentActivity: RecentActivityItem[];
  formatDuration: (start: string, end?: string) => string;
  onEdit: (log: RecentActivityItem) => void;
}

function RecentActivityList({ recentActivity, formatDuration, onEdit }: RecentActivityListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History size={20} className="text-pink-500" /> Recent Activity
        </h3>
      </div>
      <div className="space-y-3">
        {recentActivity.map((log) => (
          <div
            key={`${log.type}-${log.id}`}
            className={`bg-white p-4 rounded-2xl flex justify-between items-center border ${log.type === 'sleep' ? 'border-pink-100' : 'border-emerald-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${log.type === 'sleep' ? 'bg-pink-50' : 'bg-emerald-50'}`}>
                {log.type === 'sleep' ? (
                  <Moon size={16} className="text-pink-400" />
                ) : (
                  <Sun size={16} className="text-emerald-500" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{format(new Date(log.start_time), 'MMM d, h:mm:ss a')}</p>
                  <span className="text-gray-300">→</span>
                  <p className="text-sm font-semibold text-gray-600">{format(new Date(log.end_time), 'h:mm:ss a')}</p>
                </div>
                <p className="text-xs text-gray-400 font-medium">
                  <span className={`font-semibold mr-2 ${log.type === 'sleep' ? 'text-pink-500' : 'text-emerald-600'}`}>
                    {log.type === 'sleep' ? 'Sleep' : `Feed (${log.boob_side})`}
                  </span>
                  Duration: <span className={`font-mono ${log.type === 'sleep' ? 'text-pink-500' : 'text-emerald-600'}`}>{formatDuration(log.start_time, log.end_time)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onEdit(log)}
              className={`p-2 text-gray-400 transition-colors ${log.type === 'sleep' ? 'hover:text-pink-500' : 'hover:text-emerald-500'}`}
            >
              <Edit2 size={18} />
            </button>
          </div>
        ))}
        {recentActivity.length === 0 && (
          <p className="text-center text-gray-400 py-10">No activity yet. Start tracking above!</p>
        )}
      </div>
    </div>
  );
}

export default RecentActivityList;
