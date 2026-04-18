import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useBabyData() {
  const [session, setSession] = useState<any>(null);
  const [baby, setBaby] = useState<any>(null);
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [isSleeping, setIsSleeping] = useState(false);
  const [currentSleepLog, setCurrentSleepLog] = useState<any>(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [currentFeedLog, setCurrentFeedLog] = useState<any>(null);
  const [feedTimerActive, setFeedTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetLocalData = useCallback(() => {
    setBaby(null);
    setSleepLogs([]);
    setFeedLogs([]);
    setIsSleeping(false);
    setCurrentSleepLog(null);
    setIsFeeding(false);
    setCurrentFeedLog(null);
    setFeedTimerActive(false);
  }, []);

  const refreshSleepLogs = useCallback(async (babyId: string) => {
    const { data: logs } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('baby_id', babyId)
      .order('start_time', { ascending: false });

    if (!logs) return;

    setSleepLogs(logs);
    const activeLog = logs.find((log) => !log.end_time);
    if (activeLog) {
      setIsSleeping(true);
      setCurrentSleepLog(activeLog);
    } else {
      setIsSleeping(false);
      setCurrentSleepLog(null);
    }
  }, []);

  const refreshFeedLogs = useCallback(async (babyId: string) => {
    const { data: logs } = await supabase
      .from('feed_logs')
      .select('*')
      .eq('baby_id', babyId)
      .order('start_time', { ascending: false });

    if (!logs) return;

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
  }, []);

  const refreshBabyAndLogs = useCallback(async () => {
    setLoading(true);
    const { data: babies } = await supabase
      .from('babies')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (babies && babies.length > 0) {
      setBaby(babies[0]);
      await Promise.all([refreshSleepLogs(babies[0].id), refreshFeedLogs(babies[0].id)]);
    } else {
      resetLocalData();
    }

    setLoading(false);
  }, [refreshFeedLogs, refreshSleepLogs, resetLocalData]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        refreshBabyAndLogs();
      } else {
        resetLocalData();
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        refreshBabyAndLogs();
      } else {
        resetLocalData();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshBabyAndLogs, resetLocalData]);

  return {
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
  };
}
