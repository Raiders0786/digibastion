// Lovable Cloud exposes its managed backend through Supabase-compatible browser
// APIs. These URL and anon/publishable values are intentionally public client
// configuration; they do not imply a separately accessible Supabase project.
// Keeping a checked-in fallback prevents hosts that do not inject Vite variables
// from crashing before React can render. Never place a service-role key here.
const DEFAULT_SUPABASE_URL = 'https://sdszjqltoheqhfkeprrd.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkc3pqcWx0b2hlcWhma2VwcnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjk3MjUsImV4cCI6MjA4MDg0NTcyNX0.Zve0FNpRWwi64dFy188gvWdmCjDYUb5-KcNcyCryA-o';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
