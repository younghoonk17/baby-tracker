import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type TimelineActivityType = 'sleep' | 'feed';

export interface ActivityTimelineItem {
  id: string;
  sessionName: string;
  label: string;
  offset: number;
  duration: number;
  activityType: TimelineActivityType;
}

interface ActivityGanttChartProps {
  totalHoursToday: string;
  timelineData: ActivityTimelineItem[];
}

function ActivityGanttChart({ totalHoursToday, timelineData }: ActivityGanttChartProps) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Today's Sleep</h2>
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="bg-pink-50 px-6 py-3 rounded-2xl">
          <p className="text-3xl font-bold text-pink-500">{totalHoursToday}h</p>
          <p className="text-xs text-pink-400 uppercase font-semibold">Total Slept</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis
              type="number"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af' }}
              domain={[0, 1440]}
              ticks={[0, 360, 720, 1080, 1440]}
              tickFormatter={(value: number) => {
                const hour = Math.floor(value / 60);
                return `${hour.toString().padStart(2, '0')}:00`;
              }}
            />
            <YAxis
              type="category"
              dataKey="sessionName"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af' }}
              width={60}
            />
            <Tooltip
              cursor={{ fill: '#fdf2f8' }}
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as ActivityTimelineItem | undefined;
                return row?.label ? `Session: ${row.label}` : 'Session';
              }}
            />
            <Bar dataKey="offset" stackId="activity-gantt" fill="transparent" />
            <Bar dataKey="duration" stackId="activity-gantt" radius={[0, 6, 6, 0]}>
              {timelineData.map((entry) => (
                <Cell
                  key={`${entry.activityType}-${entry.id}`}
                  fill={entry.activityType === 'sleep' ? '#ec4899' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Sleep
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Feed
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-2">Gantt timeline of today&apos;s sleep and feed sessions.</p>
    </div>
  );
}

export default ActivityGanttChart;
