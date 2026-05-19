import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl as string;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('wxg_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ──────────────────────────────────────────────────────

export interface Project {
  id:          string;
  name:        string;
  projectCode: string | null;
  hasPolygon:  boolean;
}

export interface TimeEntry {
  id:              string;
  projectId:       string;
  date:            string;
  startTime:       string;
  endTime:         string | null;
  totalMinutes:    number | null;
  isRetroactive:   boolean;
  project:         { id: string; name: string; projectCode: string | null };
}

export interface MonthlyReport {
  id:                  string;
  year:                number;
  month:               number;
  totalWorkedMinutes:  number;
  expectedMinutes:     number;
  overtimeMinutes:     number;
  absenceMinutes:      number;
  status:              'OPEN' | 'PENDING' | 'APPROVED' | 'LOCKED';
}

export interface Employee {
  id:             string;
  fullName:       string;
  email:          string | null;
  jobTitle:       string | null;
  company:        string;
  isPayrollAdmin: boolean;
}

// ── API calls ──────────────────────────────────────────────────

export const attendanceApi = {
  clockIn: (data: {
    projectId:       string;
    lat?:            number;
    lng?:            number;
    isRetroactive?:  boolean;
    retroactiveNote?: string;
    retroactiveTime?: string;
  }) => api.post('/api/attendance/clock-in', data),

  clockOut: (data: {
    lat?:            number;
    lng?:            number;
    isRetroactive?:  boolean;
    retroactiveNote?: string;
    retroactiveTime?: string;
  }) => api.post('/api/attendance/clock-out', data),

  getToday:  () => api.get<{ entries: TimeEntry[]; isCurrentlyClockedIn: boolean }>('/api/attendance/today'),
  getMonth:  (year: number, month: number) =>
    api.get<TimeEntry[]>(`/api/attendance/month?year=${year}&month=${month}`),
};

export const projectApi = {
  getMyProjects: () => api.get<Project[]>('/api/projects'),
};

export const employeeApi = {
  getMe: () => api.get<Employee>('/api/employees/me'),
};

export const reportApi = {
  getReports:  (year: number, month: number) =>
    api.get<MonthlyReport[]>(`/api/reports?year=${year}&month=${month}`),
  getReport:   (id: string) => api.get<MonthlyReport>(`/api/reports/${id}`),
};
