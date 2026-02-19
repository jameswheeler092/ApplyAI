// Shared TypeScript contracts for ApplyAI
// This file is the single source of truth for all types used across the app.
// Agents: append new types to the bottom — do not reorganise existing types.

// ─── Profile ───────────────────────────────────────────────────────────────

export interface WorkHistoryEntry {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string | null // null = current
  employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance'
  bullets: string[]
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  subject: string
  startDate: string
  endDate: string | null
}

export interface CertificationEntry {
  id: string
  name: string
  issuer: string
  year: number
}

export interface SkillNarrativeEntry {
  id: string
  skill: string
  narrative: string
}

export type Tone = 'professional' | 'conversational' | 'assertive'

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  headline: string | null
  summary: string | null
  work_history: WorkHistoryEntry[]
  education: EducationEntry[]
  certifications: CertificationEntry[]
  skills_experiences: SkillNarrativeEntry[]
  cover_letter_template: string | null
  target_industries: string[]
  target_roles: string[]
  culture_values: string[]
  career_aspirations: string | null
  hobbies_interests: string | null
  preferred_tone: Tone
  email_notifications: boolean
  onboarding_complete: boolean
  updated_at: string
}

// ─── Applications ──────────────────────────────────────────────────────────

export type DocumentType = 'research' | 'cv' | 'cover_letter' | 'intro_email'
export type DocumentStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
export type GenerationStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type CoverLetterLength = 'short' | 'standard' | 'detailed'

export interface Application {
  id: string
  user_id: string
  job_title: string
  company_name: string
  job_description: string
  job_url: string | null
  hiring_manager_name: string | null
  documents_requested: DocumentType[]
  cover_letter_length: CoverLetterLength
  cover_letter_max_words: number | null
  tone: Tone
  status: GenerationStatus
  application_status: ApplicationStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  application_id: string
  user_id: string
  type: DocumentType
  content: string | null
  edited_content: string | null
  version: number
  status: DocumentStatus
  created_at: string
}

// ─── Usage ─────────────────────────────────────────────────────────────────

export interface Usage {
  id: string
  user_id: string
  period: string // 'YYYY-MM-DD' format, first of month
  applications_generated: number
}

// ─── API Route Payloads ────────────────────────────────────────────────────

export interface CreateApplicationPayload {
  job_title: string
  company_name: string
  job_description: string
  job_url?: string
  hiring_manager_name?: string
  documents_requested: DocumentType[]
  cover_letter_length?: CoverLetterLength
  cover_letter_max_words?: number
  tone: Tone
}

// ─── UI State ──────────────────────────────────────────────────────────────

export interface DocumentPanelState {
  type: DocumentType
  status: DocumentStatus
  content: string | null
  editedContent: string | null
  version: number
  isEditing: boolean
}
