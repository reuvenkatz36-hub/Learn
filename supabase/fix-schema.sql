-- MasteryAI — corrected schema (drops the earlier mismatched tables and rebuilds)
-- Safe to run in the Supabase SQL Editor.

drop table if exists public.daily_activity cascade;
drop table if exists public.knowledge_edges cascade;
drop table if exists public.knowledge_nodes cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.assignments cascade;
drop table if exists public.quizzes cascade;
drop table if exists public.lessons cascade;
drop table if exists public.roadmaps cascade;
drop table if exists public.profiles cascade;

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  bio text,
  streak_count integer default 0,
  last_activity_date date,
  total_xp integer default 0,
  credits integer default 3,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.roadmaps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  topic text not null,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  estimated_hours integer default 10,
  sections jsonb not null default '[]',
  status text check (status in ('active', 'completed', 'paused')) default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  section_index integer not null,
  content jsonb default '[]',
  status text check (status in ('locked', 'available', 'in_progress', 'completed')) default 'locked',
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  questions jsonb not null default '[]',
  score integer,
  max_score integer,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prompt text not null,
  submission text,
  ai_feedback text,
  score integer,
  status text check (status in ('pending', 'submitted', 'graded')) default 'pending',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete set null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table public.knowledge_nodes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  label text not null,
  node_type text check (node_type in ('topic', 'concept', 'skill')) default 'concept',
  position jsonb default '{"x": 0, "y": 0}',
  mastery_level integer default 0 check (mastery_level between 0 and 100),
  created_at timestamp with time zone default now()
);

create table public.knowledge_edges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  source_id uuid references public.knowledge_nodes(id) on delete cascade not null,
  target_id uuid references public.knowledge_nodes(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

create table public.daily_activity (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_date date not null,
  xp_earned integer default 0,
  lessons_completed integer default 0,
  quizzes_taken integer default 0,
  unique(user_id, activity_date)
);

alter table public.profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.assignments enable row level security;
alter table public.chat_messages enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_edges enable row level security;
alter table public.daily_activity enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can manage own roadmaps" on public.roadmaps for all using (auth.uid() = user_id);
create policy "Users can manage own lessons" on public.lessons for all using (auth.uid() = user_id);
create policy "Users can manage own quizzes" on public.quizzes for all using (auth.uid() = user_id);
create policy "Users can manage own assignments" on public.assignments for all using (auth.uid() = user_id);
create policy "Users can manage own chat messages" on public.chat_messages for all using (auth.uid() = user_id);
create policy "Users can manage own knowledge nodes" on public.knowledge_nodes for all using (auth.uid() = user_id);
create policy "Users can manage own knowledge edges" on public.knowledge_edges for all using (auth.uid() = user_id);
create policy "Users can manage own activity" on public.daily_activity for all using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
