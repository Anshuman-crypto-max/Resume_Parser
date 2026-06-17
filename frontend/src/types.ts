export type UserRole = "admin" | "recruiter";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  skills: string[];
  education: Record<string, unknown>[];
  experience: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  certifications: string[];
  score: number;
  source_filename: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_candidates: number;
  average_score: number;
  top_skills: { name: string; count: number }[];
  score_buckets: { label: string; count: number }[];
  candidates_by_location: { name: string; count: number }[];
  recent_candidates: Candidate[];
}

export interface Match {
  id: number;
  job_id: number;
  candidate_id: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  rationale: string;
  candidate: Candidate;
}

