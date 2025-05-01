// src/api/projects.ts - opravená verze s robustnějším zacházením s chybami
import apiClient from './client';
import { Project, TimeEntry } from '../types/api.types';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await apiClient.get('/projects');
    return response.data.projects || [];
  } catch (error) {
    console.error('Chyba při načítání projektů', error);
    throw new Error('Nepodařilo se načíst projekty');
  }
};

export const getProject = async (id: number): Promise<Project & { timeEntries?: TimeEntry[] }> => {
  if (!id) {
    console.error('Chybějící ID projektu');
    throw new Error('Chybějící ID projektu');
  }

  try {
    // Získat detaily projektu
    const response = await apiClient.get(`/projects/${id}`);

    if (!response.data || !response.data.project) {
      console.error('Neplatná odpověď API - chybí data projektu');
      throw new Error('Nepodařilo se načíst projekt: neplatná odpověď API');
    }

    const project = response.data.project;

    // Pokud projekt už obsahuje timeEntries, použijeme je přímo
    if (project.timeEntries) {
      console.log(`Projekt #${id} obsahuje časové záznamy přímo v odpovědi`, project.timeEntries.length);
      return project;
    }

    // Jinak se pokusíme načíst časové záznamy samostatně
    try {
      console.log(`Načítám časové záznamy pro projekt #${id}`);
      const timeResponse = await apiClient.get(`/projects/${id}/time-entries`);

      // Ověříme, že odpověď obsahuje časové záznamy
      if (!timeResponse.data || !Array.isArray(timeResponse.data.timeEntries)) {
        console.warn('Neplatná odpověď API pro časové záznamy - použijeme prázdné pole');
        return {
          ...project,
          timeEntries: []
        };
      }

      // Připojit časové záznamy k objektu projektu
      console.log(`Načteno ${timeResponse.data.timeEntries.length} časových záznamů`);
      return {
        ...project,
        timeEntries: timeResponse.data.timeEntries
      };
    } catch (timeError) {
      console.error(`Chyba při načítání časových záznamů pro projekt ID: ${id}`, timeError);
      // I když nastane chyba při načítání časových záznamů, vrátíme alespoň projekt
      return {
        ...project,
        timeEntries: []
      };
    }
  } catch (error) {
    console.error(`Chyba při načítání projektu ID: ${id}`, error);
    throw new Error(`Nepodařilo se načíst projekt: ${error.message || 'neznámá chyba'}`);
  }
}