// Definice typů pro entity v aplikaci

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface TimeEntry {
  id: number;
  startTime: string;
  endTime?: string;
  description?: string;
  project: Project;
  isBillable: boolean;
  durationInHours?: number;
}

// Definice typů pro API požadavky a odpovědi

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TimeEntryStartRequest {
  projectId: number;
  description?: string;
}

export interface TimeEntryStartResponse {
  entry: TimeEntry;
}