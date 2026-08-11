// src/types/index.ts
export interface Assignment {
  id: number;
  date: string;
  QuestionName: string;
  Subject: string;
  Topic?: string;
  Link: string;
  sheetSource?: string; // Which sheet this assignment came from
}

export interface FilterOptions {
  subject?: string;
  sheetSource?: string;
  searchTerm?: string;
}

// Backend types
export interface Question {
  id: string;
  questionName: string;
  subject: string;
  topic: string;
  link: string;
  semester: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  admin: Admin;
}