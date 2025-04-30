// src/api/projects.ts
import apiClient from './client';
import { Project } from '../types/api.types';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await apiClient.get('/projects');
    return response.data.projects;
  } catch (error) {
    console.error('Chyba při načítání projektů', error);
    throw new Error('Nepodařilo se načíst projekty');
  }
};

export const getProject = async (id: number): Promise<Project> => {
  try {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.project;
  } catch (error) {
    console.error(`Chyba při načítání projektu ID: ${id}`, error);
    throw new Error('Nepodařilo se načíst projekt');
  }
};