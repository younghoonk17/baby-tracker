import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Moon, Sun, History, Settings, Plus, Square, Baby, X, BarChart2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getNextSleepRecommendation } from './utils/sleepRecommendations';
import ActivityGanttChart from './components/ActivityGanttChart';
import RecentActivityList, { type RecentActivityItem } from './components/RecentActivityList';
import EditLogModal from './components/EditLogModal';
import SleepStatusCard from './components/SleepStatusCard';
import FeedTrackerCard from './components/FeedTrackerCard';
import { useBabyData } from './hooks/useBabyData';
import { useTimelineData } from './hooks/useTimelineData';

function App() {
  const {
    session,
    baby,
    sleepLogs,
    feedLogs,
    isSleeping,
    currentSleepLog,
    isFeeding,
    currentFeedLog,
    feedTimerActive,
    loading,
    refreshBabyAndLogs,
    refreshSleepLogs,
    refreshFeedLogs,
  } = useBabyData();
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
  const [selectedBoob, setSelectedBoob] = useState<string | null>(null);


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
      setSelectedBoob(null); // Reset selection after starting
      await refreshFeedLogs(baby.id);
    }
  };

  const stopFeed = async () => {
    if (!currentFeedLog) return;

    const { error } = await supabase
      .from('feed_logs')
      .update({ end_time: new Date().toISOString() })
      .eq('id', currentFeedLog.id);

    if (!error) {
      await refreshFeedLogs(baby.id);
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
      if (baby) await refreshFeedLogs(baby.id);
    }
  };

  const deleteFeedLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feed log?')) return;
    const { error } = await supabase.from('feed_logs').delete().eq('id', id);
    if (!error && baby) await refreshFeedLogs(baby.id);
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
        if (baby) refreshSleepLogs(baby.id);
      }
  };

    const deleteLog = async (id: string) => {
      if (!confirm('Are you sure you want to delete this sleep log?')) return;
      const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
      if (!error && baby) refreshSleepLogs(baby.id);
    };
    const {
      todaySleepSessions,
      todayFeedSessions,
      todayTimelineData,
      totalHoursToday,
      totalFeedMinutesToday,
      recentActivity,
      lastWakeTime,
      lastWakeAgoText,
    } = useTimelineData(sleepLogs, feedLogs, now);

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

    const toggleSleep = async () => {
      if (!baby) return;

      if (isSleeping && currentSleepLog) {
        // End sleep
        const { error } = await supabase
          .from('sleep_logs')
          .update({ end_time: new Date().toISOString() })
          .eq('id', currentSleepLog.id);

        if (!error) {
          await refreshSleepLogs(baby.id);
        }
      } else {
        // Start sleep
        const { data } = await supabase
          .from('sleep_logs')
          .insert([{ baby_id: baby.id, start_time: new Date().toISOString() }])
          .select();

        if (data && data.length > 0) {
          await refreshSleepLogs(baby.id);
        }
      }
    };

    const recommendation = baby && lastWakeTime
      ? getNextSleepRecommendation(new Date(baby.birth_date), new Date(lastWakeTime))
      : null;
    const authRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;

    const handleEditRecentActivity = (log: RecentActivityItem) => {
      setEditingLog(log);
      setEditingLogType(log.type);
      setEditStartTime(format(new Date(log.start_time), "yyyy-MM-dd'T'HH:mm:ss"));
      setEditEndTime(log.end_time ? format(new Date(log.end_time), "yyyy-MM-dd'T'HH:mm:ss") : '');
      if (log.type === 'feed') {
        setEditBoobSide(log.boob_side === 'right' ? 'right' : 'left');
      }
    };

    const handleDeleteEditingLog = () => {
      if (!editingLog) return;
      if (editingLogType === 'feed') {
        deleteFeedLog(editingLog.id);
      } else {
        deleteLog(editingLog.id);
      }
      setEditingLog(null);
      setEditingLogType(null);
    };

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
                const { error } = await supabase.auth.signInWithOtp({
                  email,
                  options: {
                    emailRedirectTo: authRedirectTo,
                  },
                });
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
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: authRedirectTo,
                },
              })}
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
              const { data: createdBaby, error } = await supabase.from('babies').insert([{
                name,
                birth_date: birthDate,
                user_id: session.user.id
              }]).select().single();

              if (!error && createdBaby) {
                const { error: memberError } = await supabase
                  .from('baby_members')
                  .upsert(
                    [{ baby_id: createdBaby.id, user_id: session.user.id, role: 'owner' }],
                    { onConflict: 'baby_id,user_id' }
                  );

                if (memberError) {
                  alert(`Baby created, but membership setup failed: ${memberError.message}`);
                }

                refreshBabyAndLogs();
              }
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

              <SleepStatusCard
                babyName={baby.name}
                isSleeping={isSleeping}
                currentSleepStartTime={currentSleepLog?.start_time}
                lastWakeAgoText={lastWakeAgoText}
                formatDuration={formatDuration}
                onEditStartTime={() => {
                  if (!currentSleepLog) return;
                  setEditingLog(currentSleepLog);
                  setEditingLogType('sleep');
                  setEditStartTime(format(new Date(currentSleepLog.start_time), "yyyy-MM-dd'T'HH:mm:ss"));
                  setEditEndTime('');
                }}
                onToggleSleep={toggleSleep}
              />

              <FeedTrackerCard
                isFeeding={isFeeding}
                currentFeedStartTime={currentFeedLog?.start_time}
                currentFeedBoobSide={currentFeedLog?.boob_side}
                feedTimerActive={feedTimerActive}
                selectedBoob={selectedBoob}
                formatDuration={formatDuration}
                onSelectBoob={setSelectedBoob}
                onStartFeed={startFeed}
                onStopFeed={stopFeed}
                onEditStartTime={() => {
                  if (!currentFeedLog) return;
                  setEditingLog(currentFeedLog);
                  setEditingLogType('feed');
                  setEditStartTime(format(new Date(currentFeedLog.start_time), "yyyy-MM-dd'T'HH:mm:ss"));
                  setEditEndTime('');
                  setEditBoobSide(currentFeedLog.boob_side === 'right' ? 'right' : 'left');
                }}
              />
              <RecentActivityList
                recentActivity={recentActivity}
                formatDuration={formatDuration}
                onEdit={handleEditRecentActivity}
              />
            </>
          ) : (
            <div className="space-y-6">
              <ActivityGanttChart totalHoursToday={totalHoursToday} timelineData={todayTimelineData} />

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

        <EditLogModal
          isOpen={Boolean(editingLog)}
          editingLogType={editingLogType}
          editStartTime={editStartTime}
          editEndTime={editEndTime}
          editBoobSide={editBoobSide}
          onClose={() => {
            setEditingLog(null);
            setEditingLogType(null);
          }}
          onSubmit={editingLogType === 'feed' ? updateFeedLog : updateLog}
          onDelete={handleDeleteEditingLog}
          onEditStartTimeChange={setEditStartTime}
          onEditEndTimeChange={setEditEndTime}
          onEditBoobSideChange={setEditBoobSide}
        />

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
