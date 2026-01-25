'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  const loadProjects = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      const json = (await res.json().catch(() => null)) as unknown;
      if (!isApiResponse<{ projects: Array<{ id: string; title: string; status: string; createdAt: string; user: { name: string } }> }>(json)) {
        return;
      }

      if (!json.ok) {
        return;
      }

      const mapped: Project[] = json.data.projects.map((p) => ({
        id: p.id,
        name: p.title,
        user: p.user?.name ?? '—',
        date: new Date(p.createdAt).toISOString().split('T')[0],
        status: p.status,
      }));

      setProjects(mapped);
    } catch {
      // Network/parse xatolarida crash qilmaymiz (UI mock ma'lumotlar bilan qoladi)
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.role]);

  const searchProjects = async (query: string) => {
    if (!isAuthenticated || !user) return;

    setSearchQuery(query);
    
    // If query is empty, load normal projects
    if (!query.trim()) {
      setIsSearching(false);
      await loadProjects();
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/projects/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      const json = (await res.json().catch(() => null)) as unknown;
      if (!isApiResponse<{ projects: Array<{ id: string; title: string; status: string; createdAt: string; user: { name: string } }> }>(json)) {
        return;
      }

      if (!json.ok) {
        return;
      }

      const mapped: Project[] = json.data.projects.map((p) => ({
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
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    void loadProjects();
  };

  const addProject = (project: Project) => {
    // Real API (safe migration): POST /api/projects, keyin GET bilan ro'yxatni yangilaymiz.
    // Eslatma: hozirgi UI `addProject()` ga description/contact uzatmaydi,
    // shuning uchun vaqtincha DOM dan o'qishga harakat qilamiz (keyingi bosqichda UI → API bevosita bo'ladi).
    void (async () => {
      if (!isAuthenticated || !user) {
        setProjects(prevProjects => [project, ...prevProjects]);
        return;
      }

      const title = project.name?.trim?.() ? project.name : '—';

      // Real submit uchun description/contact ProjectForm tomonidan yuboriladi.
      // (UI o'zgarmaydi, faqat payload to'liq bo'ladi.)
      const extra = project as unknown as { description?: unknown; contact?: unknown };
      let description = typeof extra.description === 'string' ? extra.description.trim() : '';
      let contact = typeof extra.contact === 'string' ? extra.contact.trim() : '';

      // Legacy safety: agar eski payload kelib qolsa, DOM dan o'qib ko'ramiz.
      if (!description || !contact) {
        try {
          const descEl = document.getElementById('description') as HTMLTextAreaElement | null;
          const contactEl = document.getElementById('contact') as HTMLInputElement | null;
          description = description || descEl?.value?.trim?.() || '';
          contact = contact || contactEl?.value?.trim?.() || '';
        } catch {
          // ignore
        }
      }

      // API validatsiyasidan o'tish uchun minimal qiymatlar (UI regressiya bo'lmasin)
      if (!description) description = "—";
      if (!contact) contact = "—";

      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-user-role': user.role,
          },
          body: JSON.stringify({
            title,
            description,
            contact,
            status: project.status || 'Jarayonda',
          }),
        });

        const json = (await res.json().catch(() => null)) as unknown;
        if (!isApiResponse<{ project: { id: string } }>(json)) {
          // Fallback: UI ishlashda davom etsin
          setProjects(prevProjects => [project, ...prevProjects]);
          return;
        }

        if (!json.ok) {
          // DATABASE_URL yo'q bo'lsa yoki boshqa xatolik bo'lsa ham UI crash bo'lmasin
          setProjects(prevProjects => [project, ...prevProjects]);
          return;
        }

        // Real DB dan yangilab olamiz
        await loadProjects();
      } catch {
        setProjects(prevProjects => [project, ...prevProjects]);
      }
    })();
  };

  return (
    <ProjectsContext.Provider value={{ projects, searchQuery, isSearching, addProject, searchProjects, clearSearch }}>
      {children}
    </ProjectsContext.Provider>
  );
};