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

const DEFAULT_MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Smart Farming Platform',
    user: 'Abdulla Rahimov',
    date: '2024-01-20',
    status: 'Qabul qilindi'
  },
  {
    id: 2,
    name: 'Online Learning Hub',
    user: 'Malika Karimova',
    date: '2024-01-18',
    status: 'Jarayonda'
  },
  {
    id: 3,
    name: 'Local E-commerce',
    user: 'Rustam Aliyev',
    date: '2024-01-15',
    status: 'Qabul qilindi'
  },
  {
    id: 4,
    name: 'Healthcare App',
    user: 'Dilnoza Umarova',
    date: '2024-01-12',
    status: 'Rad etildi'
  },
  {
    id: 5,
    name: 'Tourism Guide',
    user: 'Bekzod Toshmatov',
    date: '2024-01-10',
    status: 'Jarayonda'
  },
  {
    id: 6,
    name: 'Financial Tracker',
    user: 'Gulnora Saidova',
    date: '2024-01-08',
    status: 'Qabul qilindi'
  }
];

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // DB sozlangan bo'lsa, mock ko'rsatmaslik uchun bo'sh ro'yxat bilan boshlaymiz.
  // DATABASE_URL yo'q bo'lsa, API `DATABASE_NOT_CONFIGURED` qaytaradi va biz mock-ga tushamiz.
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
        // DATABASE_URL yo'q bo'lsa, mock ma'lumotlar bilan ishlashda davom etamiz.
        if (json.error?.code === 'DATABASE_NOT_CONFIGURED') {
          setProjects(DEFAULT_MOCK_PROJECTS);
          return;
        }
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
        // If search fails, fall back to normal projects
        if (json.error?.code === 'DATABASE_NOT_CONFIGURED') {
          // Filter mock projects by query
          const filtered = DEFAULT_MOCK_PROJECTS.filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.user.toLowerCase().includes(query.toLowerCase()) ||
              p.status.toLowerCase().includes(query.toLowerCase())
          );
          setProjects(filtered);
        }
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