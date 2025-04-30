// src/contexts/TimeEntryContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { TimeEntry } from '../types/api.types';
import { getRunningTimeEntry, startTimeEntry, stopTimeEntry } from '../api/timeEntries';
import { useAuth } from './AuthContext';

interface TimeEntryContextData {
  runningEntry: TimeEntry | null;
  loading: boolean;
  startTimer: (projectId: number, description?: string) => Promise<void>;
  stopTimer: (timeEntryId: number) => Promise<void>;
  refreshRunningEntry: () => Promise<void>;
}

const TimeEntryContext = createContext<TimeEntryContextData>({
  runningEntry: null,
  loading: true,
  startTimer: async () => {},
  stopTimer: async () => {},
  refreshRunningEntry: async () => {},
});

export const TimeEntryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function refreshRunningEntry() {
    if (!user) return;

    try {
      setLoading(true);
      const entry = await getRunningTimeEntry();
      setRunningEntry(entry);
    } catch (error) {
      console.error('Chyba při načítání běžícího časovače', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      refreshRunningEntry();
    } else {
      setRunningEntry(null);
      setLoading(false);
    }
  }, [user]);

  async function startTimer(projectId: number, description?: string) {
    try {
      const newEntry = await startTimeEntry(projectId, description);
      setRunningEntry(newEntry);
    } catch (error) {
      console.error('Chyba při spouštění časovače', error);
      throw error;
    }
  }

  async function stopTimer(timeEntryId: number) {
    try {
      await stopTimeEntry(timeEntryId);
      setRunningEntry(null);
    } catch (error) {
      console.error('Chyba při zastavení časovače', error);
      throw error;
    }
  }

  return (
    <TimeEntryContext.Provider
      value={{
        runningEntry,
        loading,
        startTimer,
        stopTimer,
        refreshRunningEntry
      }}
    >
      {children}
    </TimeEntryContext.Provider>
  );
};

export function useTimeEntry() {
  const context = useContext(TimeEntryContext);
  if (!context) {
    throw new Error('useTimeEntry musí být používán uvnitř TimeEntryProvider');
  }
  return context;
}