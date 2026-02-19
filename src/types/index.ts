// Shared TypeScript contracts for ApplyAI
// This file is the single source of truth for all types used across the app.
// Agents: append new types to the bottom — do not reorganise existing types.

export type DocumentType = 'research' | 'cv' | 'cover_letter' | 'email'

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
