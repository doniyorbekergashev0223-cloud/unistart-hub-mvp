"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import { supabase } from '@/lib/supabase';

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
  const t = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    description: '',
    contact: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = t('projectForm.projectNameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('projectForm.descriptionRequired');
    }

    if (!formData.contact.trim()) {
      newErrors.contact = t('projectForm.contactRequired');
    } else if (!formData.contact.includes('@') && !formData.contact.match(/^\+?[\d\s\-\(\)]+$/)) {
      newErrors.contact = t('projectForm.contactInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadProjectFileToSupabase = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop() || 'dat';
    const uniqueName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('project-files')
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(
        "Faylni Supabase Storage'ga yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki faylsiz yuboring."
      );
    }

    const { data: publicData } = supabase.storage
      .from('project-files')
      .getPublicUrl(uniqueName);

    if (!publicData?.publicUrl) {
      throw new Error("Fayl URL ni olishda xatolik yuz berdi.");
    }

    return publicData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hard submission lock to prevent double submits (click, Enter, mobile tap, etc.)
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Step 1: Validate input
      if (!validateForm()) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      if (!user) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        alert(t('projectForm.pleaseLogin'));
        router.push('/auth/login');
        return;
      }

      if (!user.id || !user.role) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        alert("Foydalanuvchi ma'lumotlari topilmadi. Iltimos, qayta tizimga kiring.");
        router.push('/auth/login');
        return;
      }

      // Step 3: Upload file to Supabase Storage (if any)
      let fileUrl: string | undefined;
      if (selectedFile) {
        fileUrl = await uploadProjectFileToSupabase(selectedFile, user.id);
      }

      // Step 4: Create project record in database
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const payload = {
        title: formData.projectName.trim(),
        description: formData.description.trim(),
        contact: formData.contact.trim(),
        fileUrl,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.error?.message || "Loyiha yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
        throw new Error(errorMessage);
      }

      const result = await response.json();

      const projectForContext = {
        id: result.data.project.id,
        name: result.data.project.title,
        user: result.data.project.user?.name || t('common.user'),
        date: new Date(result.data.project.createdAt).toISOString().split('T')[0],
        status: result.data.project.status,
      };

      addProject(projectForContext);
      window.dispatchEvent(new CustomEvent('stats-refetch'));
      window.dispatchEvent(new CustomEvent('notifications-refetch'));

      setFormData({
        projectName: '',
        description: '',
        contact: '',
      });
      setSelectedFile(null);

      const fileInput = document.getElementById('projectFile') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Project submission error:', error);
      const message =
        error instanceof Error
          ? error.message
          : t('projectForm.submitError');
      alert(message);
    } finally {
      isSubmittingRef.current = false;
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
        alert(t('projectForm.fileTypesAllowed'));
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        alert(t('projectForm.fileSizeMax'));
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  if (submitSuccess) {
    return (
      <div className="project-form-container project-form-success" role="status" aria-live="polite">
        <div className="project-form-success-message">
          <p>{t('projectForm.success')}</p>
          <p className="project-form-success-hint">{t('projectForm.successHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-form-container">
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="projectName" className="form-label">
            {t('projectForm.projectName')} *
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            className={`form-input ${errors.projectName ? 'error' : ''}`}
            placeholder={t('projectForm.projectNamePlaceholder')}
          />
          {errors.projectName && <span className="error-message">{errors.projectName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            {t('projectForm.description')} *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder={t('projectForm.descriptionPlaceholder')}
            rows={6}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contact" className="form-label">
            {t('projectForm.contact')} *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className={`form-input ${errors.contact ? 'error' : ''}`}
            placeholder={t('projectForm.contactPlaceholder')}
          />
          {errors.contact && <span className="error-message">{errors.contact}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="projectFile" className="form-label">
            {t('projectForm.file')}
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
            {t('projectForm.fileHelp')}
          </small>
          {selectedFile && (
            <div className="file-info">
              {t('projectForm.selectedFile')}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </div>
          )}
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? t('projectForm.submitting') : t('projectForm.submit')}
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;