import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Moon, Sun, History, Settings, Plus, Square, Baby, Edit2, X, BarChart2 } from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getNextSleepRecommendation } from './utils/sleepRecommendations';

function App() {
  const [session, setSession] = useState<any>(null);
  const [baby, setBaby] = useState<any>(null);
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [isSleeping, setIsSleeping] = useState(false);
  const [currentSleepLog, setCurrentSleepLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editingLogType, setEditingLogType] = useState<'sleep' | 'feed' | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBoobSide, setEditBoobSide] = useState<'left' | 'right'>('left');
  const [activeTab, setActiveTab] = useState<'home' | 'stats'>('home');
  const [isEditingBaby, setIsEditingBaby] = useState(false);
  const [editBabyName, setEditBabyName] = useState('');
  const [editBabyBirthDate, setEditBabyBirthDate] = useState('');
  const [isFeeding, setIsFeeding] = useState(false);
  const [currentFeedLog, setCurrentFeedLog] = useState<any>(null);
  const [selectedBoob, setSelectedBoob] = useState<string | null>(null);
  const [feedTimerActive, setFeedTimerActive] = useState(false);


  const updateBaby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baby) return;
  };

  const startFeed = async () => {
    if (!baby || !selectedBoob) return;

    const { data } = await supabase
      .from('feed_logs')
      .insert([{ baby_id: baby.id, start_time: new Date().toISOString(), boob_side: selectedBoob }])
      .select();

    if (data && data.length > 0) {
      setCurrentFeedLog(data[0]);
      setIsFeeding(true);
      setFeedTimerActive(true);
      setSelectedBoob(null); // Reset selection after starting
      await fetchFeedLogs(baby.id);
    }
  };

  const stopFeed = async () => {
    if (!currentFeedLog) return;

    const { error } = await supabase
      .from('feed_logs')
      .update({ end_time: new Date().toISOString() })
      .eq('id', currentFeedLog.id);

    if (!error) {
      setIsFeeding(false);
      setFeedTimerActive(false);
      setCurrentFeedLog(null);
      await fetchFeedLogs(baby.id);
    }
  };

  const fetchFeedLogs = async (babyId: string) => {
    const { data: logs } = await supabase
      .from('feed_logs')
      .select('*')
      .eq('baby_id', babyId)
      .order('start_time', { ascending: false });

    if (logs) {
      setFeedLogs(logs);
      const activeLog = logs.find((log) => !log.end_time);
      if (activeLog) {
        setIsFeeding(true);
        setFeedTimerActive(true);
        setCurrentFeedLog(activeLog);
      } else {
        setIsFeeding(false);
        setFeedTimerActive(false);
        setCurrentFeedLog(null);
      }
    }
  };

  const updateFeedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    const { error } = await supabase
      .from('feed_logs')
      .update({
        start_time: new Date(editStartTime).toISOString(),
        end_time: editEndTime ? new Date(editEndTime).toISOString() : null,
        boob_side: editBoobSide
      })
      .eq('id', editingLog.id);

    if (!error) {
      setEditingLog(null);
      setEditingLogType(null);
      if (baby) await fetchFeedLogs(baby.id);
    }
  };

  const deleteFeedLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feed log?')) return;
    const { error } = await supabase.from('feed_logs').delete().eq('id', id);
    if (!error && baby) await fetchFeedLogs(baby.id);
  };


  const updateLog = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingLog) return;

      const { error } = await supabase
        .from('sleep_logs')
        .update({
          start_time: new Date(editStartTime).toISOString(),
          end_time: editEndTime ? new Date(editEndTime).toISOString() : null
        })
        .eq('id', editingLog.id);

      if (!error) {
        setEditingLog(null);
        setEditingLogType(null);
        if (baby) fetchLogs(baby.id);
      }
  };

    const deleteLog = async (id: string) => {
      if (!confirm('Are you sure you want to delete this sleep log?')) return;
      const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
      if (!error && baby) fetchLogs(baby.id);
    };

    const getTodaySleepSessions = () => {
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const sessions = sleepLogs
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

      return sessions;
    };

    const todaySleepSessions = getTodaySleepSessions();
    const totalMinutesToday = todaySleepSessions.reduce((acc, curr) => acc + curr.duration, 0);
    const totalHoursToday = (totalMinutesToday / 60).toFixed(1);
    const getTodayFeedSessions = () => {
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
    };
    const todayFeedSessions = getTodayFeedSessions();
    const todayTimelineData = [
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
    ].sort((a, b) => a.start.getTime() - b.start.getTime());
    const totalFeedMinutesToday = todayFeedSessions.reduce((acc, log) => {
      return acc + log.duration;
    }, 0);

    useEffect(() => {
      let interval: any;
      if (isSleeping || isFeeding) {
        interval = setInterval(() => {
          setNow(new Date());
        }, 1000);
      } else {
        setNow(new Date());
      }
      return () => clearInterval(interval);
    }, [isSleeping, isFeeding]);

    const formatDuration = (start: string, end?: string) => {
      const startTime = new Date(start).getTime();
      const endTime = end ? new Date(end).getTime() : now.getTime();
      const diff = Math.max(0, endTime - startTime);
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));

      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchBabyAndLogs(session.user.id);
        else setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) fetchBabyAndLogs(session.user.id);
        else {
          setBaby(null);
          setSleepLogs([]);
          setFeedLogs([]);
          setIsFeeding(false);
          setCurrentFeedLog(null);
          setFeedTimerActive(false);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }, []);

    const fetchBabyAndLogs = async (userId: string) => {
      setLoading(true);
      // Fetch first baby
      const { data: babies } = await supabase
        .from('babies')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (babies && babies.length > 0) {
        setBaby(babies[0]);
        await Promise.all([fetchLogs(babies[0].id), fetchFeedLogs(babies[0].id)]);
      }
      setLoading(false);
    };

    const fetchLogs = async (babyId: string) => {
      const { data: logs } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('baby_id', babyId)
        .order('start_time', { ascending: false });

      if (logs) {
        setSleepLogs(logs);
        const activeLog = logs.find(log => !log.end_time);
        if (activeLog) {
          setIsSleeping(true);
          setCurrentSleepLog(activeLog);
        } else {
          setIsSleeping(false);
          setCurrentSleepLog(null);
        }
      }
    };

    const toggleSleep = async () => {
      if (!baby) return;

      if (isSleeping && currentSleepLog) {
        // End sleep
        const { error } = await supabase
          .from('sleep_logs')
          .update({ end_time: new Date().toISOString() })
          .eq('id', currentSleepLog.id);

        if (!error) {
          setIsSleeping(false);
          setCurrentSleepLog(null);
          fetchLogs(baby.id);
        }
      } else {
        // Start sleep
        const { data } = await supabase
          .from('sleep_logs')
          .insert([{ baby_id: baby.id, start_time: new Date().toISOString() }])
          .select();

        if (data && data.length > 0) {
          setIsSleeping(true);
          setCurrentSleepLog(data[0]);
          fetchLogs(baby.id);
        }
      }
    };

    const lastWakeTime = sleepLogs.find(log => log.end_time)?.end_time;
    const recommendation = baby && lastWakeTime
      ? getNextSleepRecommendation(new Date(baby.birth_date), new Date(lastWakeTime))
      : null;
    const recentActivity = [
      ...sleepLogs
        .filter((log) => log.end_time)
        .map((log) => ({ type: 'sleep' as const, ...log })),
      ...feedLogs
        .filter((log) => log.end_time)
        .map((log) => ({ type: 'feed' as const, ...log })),
    ]
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 10);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-pink-50 text-pink-500">
          <div className="animate-pulse flex flex-col items-center">
            <Baby size={64} className="mb-4" />
            <p className="font-semibold">Loading Baby Tracker...</p>
          </div>
        </div>
      );
    }

    if (!isSupabaseConfigured) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50 p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
            <Baby size={64} className="text-pink-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Supabase Not Configured</h1>
            <p className="text-gray-600 mb-2">Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.</p>
            <p className="text-gray-500 text-sm">For GitHub Pages, add these as repository Action secrets too.</p>
          </div>
        </div>
      );
    }

    if (!session) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50 p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
            <Baby size={80} className="text-pink-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Baby Sleep Tracker</h1>
            <p className="text-gray-600 mb-8">Sign in to start tracking your baby's sleep.</p>

            <form
              className="space-y-4 mb-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const email = new FormData(e.currentTarget).get('email') as string;
                const { error } = await supabase.auth.signInWithOtp({ email });
                if (error) alert(error.message);
                else alert('Check your email for the login link!');
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="Your email address"
                required
                className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none text-center"
              />
              <button
                type="submit"
                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold hover:bg-pink-600 transition-colors shadow-lg"
              >
                Send Magic Link
              </button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or continue with</span></div>
            </div>

            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Google
            </button>
            <p className="mt-6 text-xs text-gray-400">Sync data across devices automatically.</p>
          </div>
        </div>
      );
    }

    if (!baby) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Your Baby</h2>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const birthDate = formData.get('birthDate') as string;
              const { error } = await supabase.from('babies').insert([{
                name,
                birth_date: birthDate,
                user_id: session.user.id
              }]);
              if (!error) fetchBabyAndLogs(session.user.id);
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" required className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="Enter baby's name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                <input name="birthDate" type="date" required className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none" />
              </div>
              <button type="submit" className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg hover:bg-pink-600 transition-colors">
                Save Baby
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-pink-50 pb-20 font-sans text-gray-800">
        {/* Header */}
        <header className="bg-white p-6 rounded-b-3xl shadow-sm flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <Baby className="text-pink-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{baby.name}</h1>
              <div className="flex flex-col">
                <p className="text-xs text-gray-400">Born {format(new Date(baby.birth_date), 'MMM d, yyyy')}</p>
                <p className="text-xs font-semibold text-pink-500">{differenceInDays(new Date(), new Date(baby.birth_date))} days old</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditBabyName(baby.name);
              setEditBabyBirthDate(baby.birth_date);
              setIsEditingBaby(true);
            }}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings size={24} />
          </button>
        </header>

        <main className="p-6 space-y-6 max-w-md mx-auto">
          {activeTab === 'home' ? (
            <>
              {/* Recommendation Card */}
              {recommendation && !isSleeping && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl shadow-sm">
                  <h3 className="text-blue-800 font-semibold mb-1 flex items-center gap-2">
                    <Sun size={18} /> Next Nap Recommendation
                  </h3>
                  <p className="text-blue-600 text-sm mb-3">Based on {baby.name}'s age-appropriate wake window.</p>
                  <div className="bg-white/50 p-4 rounded-2xl">
                    <p className="text-2xl font-bold text-blue-900">
                      {format(recommendation.min, 'h:mm a')} - {format(recommendation.max, 'h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* Current Status Card */}
              <div className={`p-8 rounded-[2.5rem] shadow-xl text-center transition-colors duration-500 ${isSleeping ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}>
                {isSleeping ? (
                  <>
                    <Moon size={48} className="mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold mb-2">Shhh! {baby.name} is sleeping</h2>
                    <div className="bg-white/10 py-4 px-6 rounded-2xl mb-8 inline-block">
                      <p className="text-4xl font-mono font-bold tracking-wider mb-1">
                        {formatDuration(currentSleepLog.start_time)}
                      </p>
                      <p className="text-xs opacity-70 uppercase tracking-widest">Elapsed Time</p>
                    </div>
                    <br />
                    <button
                      onClick={toggleSleep}
                      className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-transform active:scale-95"
                    >
                      Wake Up
                    </button>
                  </>
                ) : (
                  <>
                    <Sun size={48} className="mx-auto mb-4 text-amber-400" />
                    <h2 className="text-2xl font-bold mb-2">{baby.name} is awake</h2>
                    <p className="text-gray-400 mb-8">Last woke up {lastWakeTime ? formatDistanceToNow(new Date(lastWakeTime)) + ' ago' : 'No data'}</p>
                    <button
                      onClick={toggleSleep}
                      className="bg-pink-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-600 transition-transform active:scale-95"
                    >
                      Put to Sleep
                    </button>
                  </>
                )}
              </div>

              {/* Feed Tracker */}
              <div className={`p-6 rounded-[2.5rem] shadow-xl transition-colors duration-500 ${isFeeding ? 'bg-emerald-600 text-white' : 'bg-white text-gray-800'}`}>
                <h3 className="text-lg font-bold mb-4">Feeding Tracker</h3>
                {isFeeding && currentFeedLog ? (
                  <>
                    <p className="text-sm opacity-90 mb-2">Currently feeding ({currentFeedLog.boob_side})</p>
                    <p className="text-xs opacity-80 mb-4">{feedTimerActive ? 'Timer running' : 'Timer paused'}</p>
                    <p className="text-4xl font-mono font-bold tracking-wider mb-6">
                      {formatDuration(currentFeedLog.start_time)}
                    </p>
                    <button
                      onClick={stopFeed}
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
                        onClick={() => setSelectedBoob('left')}
                        className={`py-3 rounded-2xl font-semibold border transition-colors ${selectedBoob === 'left' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBoob('right')}
                        className={`py-3 rounded-2xl font-semibold border transition-colors ${selectedBoob === 'right' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Right
                      </button>
                    </div>
                    <button
                      onClick={startFeed}
                      disabled={!selectedBoob}
                      className="w-full bg-emerald-500 disabled:bg-emerald-200 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-transform active:scale-95"
                    >
                      Start Feed
                    </button>
                  </>
                )}
              </div>





              {/* Combined History Section */}
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
                        onClick={() => {
                          setEditingLog(log);
                          setEditingLogType(log.type);
                          setEditStartTime(format(new Date(log.start_time), "yyyy-MM-dd'T'HH:mm:ss"));
                          setEditEndTime(log.end_time ? format(new Date(log.end_time), "yyyy-MM-dd'T'HH:mm:ss") : '');
                          if (log.type === 'feed') {
                            setEditBoobSide(log.boob_side === 'right' ? 'right' : 'left');
                          }
                        }}
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
            </>
          ) : (
            <div className="space-y-6">
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
                    <BarChart layout="vertical" data={todayTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                          const row = payload?.[0]?.payload;
                          return row?.label ? `Session: ${row.label}` : 'Session';
                        }}
                      />
                      <Bar dataKey="offset" stackId="activity-gantt" fill="transparent" />
                      <Bar dataKey="duration" stackId="activity-gantt" radius={[0, 6, 6, 0]}>
                        {todayTimelineData.map((entry) => (
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

              <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100">
                <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2">
                  <Moon size={20} className="text-indigo-500" /> Day Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700">Sleep Sessions</span>
                    <span className="font-bold text-indigo-900">{todaySleepSessions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700">Longest Session</span>
                    <span className="font-bold text-indigo-900">
                      {Math.max(0, ...todaySleepSessions.map((s) => s.duration))} mins
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700">Feed Sessions</span>
                    <span className="font-bold text-indigo-900">{todayFeedSessions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700">Feeding Time</span>
                    <span className="font-bold text-indigo-900">{totalFeedMinutesToday} mins</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-around items-center rounded-t-3xl shadow-2xl z-10 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`${activeTab === 'home' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <History size={28} />
          </button>
          <button onClick={toggleSleep} className="bg-pink-500 text-white p-4 rounded-2xl shadow-lg -mt-12 transition-transform active:scale-95">
            {isSleeping ? <Square size={24} /> : <Plus size={24} />}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`${activeTab === 'stats' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <BarChart2 size={28} />
          </button>
        </nav>

        {/* Edit Modal */}
        {editingLog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingLogType === 'feed' ? 'Edit Feed Log' : 'Edit Sleep Log'}
                </h2>
                <button
                  onClick={() => {
                    setEditingLog(null);
                    setEditingLogType(null);
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={editingLogType === 'feed' ? updateFeedLog : updateLog} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    step="1"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-pink-50/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    step="1"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-pink-50/30"
                    placeholder="Still sleeping..."
                  />
                </div>

                {editingLogType === 'feed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Side</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditBoobSide('left')}
                        className={`py-3 rounded-2xl font-semibold border transition-colors ${editBoobSide === 'left' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditBoobSide('right')}
                        className={`py-3 rounded-2xl font-semibold border transition-colors ${editBoobSide === 'right' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-600 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingLogType === 'feed') {
                        deleteFeedLog(editingLog.id);
                      } else {
                        deleteLog(editingLog.id);
                      }
                      setEditingLog(null);
                      setEditingLogType(null);
                    }}
                    className="w-full text-red-500 py-4 font-semibold hover:bg-red-50 rounded-2xl transition-colors"
                  >
                    Delete Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Baby Settings Modal */}
        {isEditingBaby && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Baby Settings</h2>
                <button onClick={() => setIsEditingBaby(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={updateBaby} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Baby's Name</label>
                  <input
                    type="text"
                    value={editBabyName}
                    onChange={(e) => setEditBabyName(e.target.value)}
                    className="w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-pink-50/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
                  <input
                    type="date"
                    value={editBabyBirthDate}
                    onChange={(e) => setEditBabyBirthDate(e.target.value)}
                    className="w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-pink-50/30"
                    required
                  />
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-600 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      supabase.auth.signOut();
                      setIsEditingBaby(false);
                    }}
                    className="w-full text-gray-500 py-4 font-semibold hover:bg-gray-50 rounded-2xl transition-colors mt-2"
                  >
                    Log Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
}

export default App;
