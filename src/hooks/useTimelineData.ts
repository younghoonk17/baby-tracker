import { useMemo } from 'react';
import { differenceInMinutes, endOfDay, format, formatDistanceToNow, startOfDay } from 'date-fns';

export function useTimelineData(sleepLogs: any[], feedLogs: any[], now: Date) {
  const todaySleepSessions = useMemo(() => {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    return sleepLogs
      .map((log) => {
        const rawStart = new Date(log.start_time);
        const rawEnd = log.end_time ? new Date(log.end_time) : now;
        if (rawEnd < todayStart || rawStart > todayEnd) return null;

        const start = rawStart < todayStart ? todayStart : rawStart;
        const end = rawEnd > todayEnd ? todayEnd : rawEnd;
        const offset = Math.max(0, differenceInMinutes(start, todayStart));
        const duration = Math.max(0, differenceInMinutes(end, start));

        return {
          id: log.id,
          start,
          end,
          offset,
          duration,
          label: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        };
      })
      .filter((session): session is NonNullable<typeof session> => Boolean(session))
      .filter((session) => session.duration > 0)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [now, sleepLogs]);

  const todayFeedSessions = useMemo(() => {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    return feedLogs
      .map((log) => {
        const rawStart = new Date(log.start_time);
        const rawEnd = log.end_time ? new Date(log.end_time) : now;
        if (rawEnd < todayStart || rawStart > todayEnd) return null;

        const start = rawStart < todayStart ? todayStart : rawStart;
        const end = rawEnd > todayEnd ? todayEnd : rawEnd;
        const offset = Math.max(0, differenceInMinutes(start, todayStart));
        const duration = Math.max(0, differenceInMinutes(end, start));

        return {
          id: log.id,
          start,
          end,
          offset,
          duration,
          boobSide: log.boob_side === 'right' ? 'right' : 'left',
          label: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        };
      })
      .filter((session): session is NonNullable<typeof session> => Boolean(session))
      .filter((session) => session.duration > 0)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [feedLogs, now]);

  const totalMinutesToday = useMemo(
    () => todaySleepSessions.reduce((acc, curr) => acc + curr.duration, 0),
    [todaySleepSessions]
  );
  const totalHoursToday = useMemo(() => (totalMinutesToday / 60).toFixed(1), [totalMinutesToday]);

  const totalFeedMinutesToday = useMemo(
    () => todayFeedSessions.reduce((acc, session) => acc + session.duration, 0),
    [todayFeedSessions]
  );

  const todayTimelineData = useMemo(
    () =>
      [
        ...todaySleepSessions.map((session, index) => ({
          ...session,
          activityType: 'sleep' as const,
          sessionName: `Sleep ${index + 1}`,
        })),
        ...todayFeedSessions.map((session, index) => ({
          ...session,
          activityType: 'feed' as const,
          sessionName: `Feed ${index + 1}`,
        })),
      ].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [todayFeedSessions, todaySleepSessions]
  );

  const recentActivity = useMemo(
    () =>
      [
        ...sleepLogs
          .filter((log) => log.end_time)
          .map((log) => ({ type: 'sleep' as const, ...log })),
        ...feedLogs
          .filter((log) => log.end_time)
          .map((log) => ({ type: 'feed' as const, ...log })),
      ]
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 10),
    [feedLogs, sleepLogs]
  );

  const lastWakeTime = useMemo(
    () => sleepLogs.find((log) => log.end_time)?.end_time,
    [sleepLogs]
  );
  const lastWakeAgoText = useMemo(
    () => (lastWakeTime ? `${formatDistanceToNow(new Date(lastWakeTime))} ago` : 'No data'),
    [lastWakeTime]
  );

  return {
    todaySleepSessions,
    todayFeedSessions,
    todayTimelineData,
    totalHoursToday,
    totalFeedMinutesToday,
    recentActivity,
    lastWakeTime,
    lastWakeAgoText,
  };
}
