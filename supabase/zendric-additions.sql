-- Zendric additions — run in the Supabase SQL Editor.
-- Everything is additive and idempotent (safe to run more than once).
-- The app degrades gracefully without this migration, but language/reading-mode
-- persistence, drawing submissions, level rewards and certificates need it.

-- 1. Profiles: language + reading-mode preferences
alter table public.profiles
  add column if not exists preferred_language text check (preferred_language in ('en', 'he')) default 'en',
  add column if not exists preferred_reading_mode text check (preferred_reading_mode in ('spotify', 'book', 'plain', 'story')) default 'spotify',
  add column if not exists credits integer default 3;

-- 2. Roadmaps: the language the course content was generated in
alter table public.roadmaps
  add column if not exists language text check (language in ('en', 'he')) default 'en';

-- 3. Assignments: multi-input submissions (text / drawing) + AI-marked input types
alter table public.assignments
  add column if not exists submission_type text check (submission_type in ('text', 'drawing')) default 'text',
  add column if not exists drawing_data text,
  add column if not exists input_types jsonb default '["text"]';

-- 4. Level-up rewards (badge every level, free course credit every 10th)
create table if not exists public.level_rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  level integer not null,
  reward_type text check (reward_type in ('discount', 'badge', 'free_course')) not null,
  reward_value jsonb default '{}',
  claimed boolean default false,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, level)
);

-- 5. Shareable course-completion certificates
create table if not exists public.certificates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  image_url text,
  language text check (language in ('en', 'he')) default 'en',
  share_count integer default 0,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.level_rewards enable row level security;
alter table public.certificates enable row level security;

drop policy if exists "Users can manage own level rewards" on public.level_rewards;
create policy "Users can manage own level rewards" on public.level_rewards for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own certificates" on public.certificates;
create policy "Users can manage own certificates" on public.certificates for all using (auth.uid() = user_id);
