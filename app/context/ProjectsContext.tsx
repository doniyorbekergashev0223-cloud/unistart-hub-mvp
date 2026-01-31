'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Project {
  id: number | string;
  name: string;
  user: string;
  date: string;
  status: string;
}

interface ProjectsContextType {
  projects: Project[];
  searchQuery: string;
  isSearching: boolean;
  isLoading: boolean;
  addProject: (project: Project) => void;
  searchProjects: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

interface ProjectsProviderProps {
  children: ReactNode;
}

type ApiError = { code: string; message: string; details?: unknown };
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return !!value && typeof value === 'object' && 'ok' in value;
}

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('Failed to load projects:', res.status, res.statusText);
        return;
      }

      const json = (await res.json().catch(() => null)) as unknown;
      if (!isApiResponse<{ projects: Array<{ id: string; title: string; status: string; createdAt: string; user: { name: string } }> }>(json)) {
        console.error('Invalid API response format');
        return;
      }

      if (!json.ok) {
        console.error('API error:', json.error);
        return;
      }

      const mapped: Project[] = (json.data.projects || []).map((p) => ({
        id: p.id,
        name: p.title,
        user: p.user?.name ?? '—',
        date: new Date(p.createdAt).toISOString().split('T')[0],
        status: p.status,
      }));

      setProjects(mapped);
    } catch (error) {
      console.error('Network error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setSearchQuery('');
      setIsSearching(false);
      setIsLoading(false);
      return;
    }
    void loadProjects();
  }, [isAuthenticated, user?.id, user?.role, loadProjects]);

  const searchProjects = useCallback(async (query: string) => {
    if (!isAuthenticated || !user) return;

    setSearchQuery(query);

    if (!query.trim()) {
      setIsSearching(false);
      await loadProjects();
      return;
    }

    setIsSearching(true);
    try {
      const searchParam = encodeURIComponent(query.trim());
      const res = await fetch(`/api/projects?search=${searchParam}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('Search failed:', res.status, res.statusText);
        return;
      }

      const json = (await res.json().catch(() => null)) as unknown;
      if (!isApiResponse<{ projects: Array<{ id: string; title: string; status: string; createdAt: string; user: { name: string } }> }>(json)) {
        return;
      }

      if (!json.ok) {
        return;
      }

      const mapped: Project[] = (json.data.projects || []).map((p) => ({
        id: p.id,
        name: p.title,
        user: p.user?.name ?? '—',
        date: new Date(p.createdAt).toISOString().split('T')[0],
        status: p.status,
      }));

      setProjects(mapped);
    } catch {
      // Network error - keep current projects
    } finally {
      setIsSearching(false);
    }
  }, [isAuthenticated, user, loadProjects]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    void loadProjects();
  }, [loadProjects]);

  const addProject = (project: Project) => {
    // Client-side only: assume project allaqachon API orqali yaratilgan
    // va bu yerda faqat lokal ro'yxatni yangilaymiz.
    setProjects(prevProjects => [project, ...prevProjects]);
  };

  return (
    <ProjectsContext.Provider value={{ projects, searchQuery, isSearching, isLoading, addProject, searchProjects, clearSearch }}>
      {children}
    </ProjectsContext.Provider>
  );
};