// src/api/timeEntries.ts
import apiClient from './client';
import { TimeEntry } from '../types/api.types';

interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
}

/**
 * Pokud předáte { projectId }, vrátí jen ty položky, které ke
 * projektu patří, jinak vrátí všechny.
 */
export const getTimeEntries = async (
  opts: { projectId?: number } = {}
): Promise<TimeEntry[]> => {
  try {
    // 1) stáhnu všechny záznamy
    const response = await apiClient.get<TimeEntriesResponse>('/time-entries');
    const all = response.data.timeEntries ?? [];

    // 2) pokud mám projectId, odfiltruju
    if (opts.projectId !== undefined) {
      return all.filter((e) => e.project?.id === opts.projectId);
    }
    return all;
  } catch (error: any) {
    console.error(
      `Chyba při načítání časových záznamů (${opts.projectId ?? 'all'}):`,
      error
    );
    throw new Error('Nepodařilo se načíst časové záznamy');
  }
};

export const getRunningTimeEntry = async (): Promise<TimeEntry | null> => {
  try {
    const response = await apiClient.get('/time-entries/running');
    return response.data.runningEntry;
  } catch (error) {
    console.error('Chyba při načítání běžícího časovače', error);
    throw new Error('Nepodařilo se načíst běžící časovač');
  }
};

export const startTimeEntry = async (projectId: number, description?: string): Promise<TimeEntry> => {
  try {
    const response = await apiClient.post('/time-entries/start', {
      projectId,
      description
    });
    return response.data.timeEntry;
  } catch (error) {
    console.error('Chyba při spouštění časovače', error);
    throw new Error('Nepodařilo se spustit časovač');
  }
};

export const stopTimeEntry = async (id: number): Promise<TimeEntry> => {
  try {
    const response = await apiClient.post(`/time-entries/${id}/stop`);
    return response.data.timeEntry;
  } catch (error) {
    console.error('Chyba při zastavení časovače', error);
    throw new Error('Nepodařilo se zastavit časovač');
  }
};

// src/api/timeEntries.ts (rozšíření)
export const getTimeEntry = async (id: number): Promise<TimeEntry> => {
  try {
    const response = await apiClient.get(`/time-entries/${id}`);
    return response.data.timeEntry;
  } catch (error) {
    console.error(`Chyba při načítání časového záznamu ID: ${id}`, error);
    throw new Error('Nepodařilo se načíst časový záznam');
  }
};

export const deleteTimeEntry = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/time-entries/${id}`);
  } catch (error) {
    console.error(`Chyba při mazání časového záznamu ID: ${id}`, error);
    throw new Error('Nepodařilo se smazat časový záznam');
  }
};

export const updateTimeEntry = async (id: number, data: {
  startTime?: string;
  endTime?: string | null;
  description?: string;
  isBillable?: boolean;
}): Promise<TimeEntry> => {
  try {
    const response = await apiClient.put(`/time-entries/${id}`, data);
    return response.data.timeEntry;
  } catch (error) {
    console.error(`Chyba při aktualizaci časového záznamu ID: ${id}`, error);
    throw new Error('Nepodařilo se aktualizovat časový záznam');
  }
};