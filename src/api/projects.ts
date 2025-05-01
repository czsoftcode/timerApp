// src/api/projects.ts
import apiClient from './client';
import { Project } from '../types/api.types';
import { getTimeEntries } from './timeEntries';
import { TimeEntry } from '../types/api.types';

/**
 * Vrátí seznam projektů z /projects
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const res = await apiClient.get<{ projects: Project[] }>('/projects');
    return res.data.projects ?? [];
  } catch (err: any) {
    console.error('Chyba při načítání všech projektů:', err.response?.data || err.message);
    throw new Error('Nepodařilo se načíst seznam projektů');
  }
};

/**
 * Vrátí detail projektu (z místního seznamu) + timeEntries (z /projects/{id}/time-entries).
 */
export const getProject = async (
  id: number
): Promise<Project & { timeEntries: TimeEntry[] }> => {
  try {
    // 1) stáhnu všechny projekty
    const projects = await getProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) {
      throw new Error(`Projekt s ID ${id} nenalezen`);
    }

    // 2) stáhnu jeho časové záznamy
    const timeEntries = await getTimeEntries({ projectId: id });

    // 3) sloučím a vrátím
    return {
      ...project,
      timeEntries,
    };
  } catch (err: any) {
    console.error(`Chyba při načítání projektu ID=${id}:`, err.response?.data || err.message);
    throw new Error(err.message || 'Nepodařilo se načíst projekt');
  }
};
