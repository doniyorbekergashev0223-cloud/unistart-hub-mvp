'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';

interface FormData {
  projectName: string;
  description: string;
  contact: string;
  projectFile?: File;
}

const ProjectForm = () => {
  const router = useRouter();
  const { addProject } = useProjects();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    description: '',
    contact: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Loyiha nomi majburiy';
    }

    if (!formData.description.trim()) {
      newErrors.description = "G'oya tavsifi majburiy";
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "Aloqa ma'lumotlari majburiy";
    } else if (!formData.contact.includes('@') && !formData.contact.match(/^\+?[\d\s\-\(\)]+$/)) {
      newErrors.contact = 'To\'g\'ri email yoki telefon raqam kiriting';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      alert('Iltimos, avval tizimga kiring.');
      router.push('/auth/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug: Console'da user ma'lumotlarini ko'rsatish
      console.log('🔍 Project Submission Debug:');
      console.log('User:', user);
      console.log('User ID:', user?.id);
      console.log('User Role:', user?.role);
      
      if (!user?.id || !user?.role) {
        alert('Foydalanuvchi ma\'lumotlari topilmadi. Iltimos, qayta tizimga kiring.');
        router.push('/auth/login');
        setIsSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.projectName.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('contact', formData.contact.trim());

      // Add file if selected
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'x-user-id': user.id,
        'x-user-role': user.role,
      };

      // Debug: Console'da headerlarni ko'rsatish
      console.log('📤 Request Headers:', headers);

      // Submit to API with authentication headers
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: headers,
        body: formDataToSend,
      });

      // Debug: Response'ni ko'rsatish
      console.log('📥 Response Status:', response.status);
      console.log('📥 Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Loyiha yuborishda xatolik yuz berdi';
        
        // Show more specific error messages
        if (errorData.error?.code === 'DATABASE_CONNECTION_LIMIT' || 
            errorData.error?.code === 'DATABASE_TENANT_ERROR') {
          alert(`Xatolik: ${errorMessage}\n\nIltimos, Vercel logs'ni tekshiring va CRITICAL_DATABASE_FIX.md faylini ko'ring.`);
        } else if (errorData.error?.code === 'UNAUTHORIZED') {
          alert('Kirish talab qilinadi. Iltimos, qayta tizimga kiring.');
          router.push('/auth/login');
          return;
        } else {
          alert(`Xatolik: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Update local context with the returned project data
      const projectForContext = {
        id: result.data.project.id,
        name: result.data.project.title,
        user: result.data.project.user?.name || 'Anonim foydalanuvchi',
        date: new Date(result.data.project.createdAt).toISOString().split('T')[0],
        status: result.data.project.status,
      };

      addProject(projectForContext);

      // Reset form
      setFormData({
        projectName: '',
        description: '',
        contact: ''
      });
      setSelectedFile(null);

      // Clear file input
      const fileInput = document.getElementById('projectFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Navigate back to dashboard
      router.push('/');
    } catch (error) {
      console.error('Submission error:', error);
      // In a real app, you might want to show a toast notification here
      alert(error instanceof Error ? error.message : 'Loyiha yuborishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic file validation
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        alert('Faqat PDF, DOC, DOCX, PPT, PPTX yoki ZIP fayllar qabul qilinadi.');
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        alert('Fayl hajmi 10MB dan oshmasligi kerak.');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  return (
    <div className="project-form-container">
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="projectName" className="form-label">
            Loyiha nomi *
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            className={`form-input ${errors.projectName ? 'error' : ''}`}
            placeholder="Loyihangiz nomini kiriting"
          />
          {errors.projectName && <span className="error-message">{errors.projectName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            G'oya tavsifi *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Startap g'oyangizni batafsil tavsiflang"
            rows={6}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contact" className="form-label">
            Aloqa ma'lumotlari *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className={`form-input ${errors.contact ? 'error' : ''}`}
            placeholder="Email yoki telefon raqamingiz"
          />
          {errors.contact && <span className="error-message">{errors.contact}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="projectFile" className="form-label">
            Loyiha fayli (ixtiyoriy)
          </label>
          <input
            type="file"
            id="projectFile"
            name="projectFile"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
            className="form-file-input"
          />
          <small className="form-help">
            PDF, DOC, DOCX, PPT, PPTX yoki ZIP fayllar. Maksimal hajm: 10MB
          </small>
          {selectedFile && (
            <div className="file-info">
              Tanlangan fayl: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </div>
          )}
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;