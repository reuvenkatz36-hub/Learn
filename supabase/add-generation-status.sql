-- All-in-one course generation: track whether a roadmap's full content
-- (lessons + quizzes + assignments) has finished generating.
alter table public.roadmaps
  add column if not exists generation_status text
  check (generation_status in ('generating', 'ready', 'error'))
  default 'ready';

-- Existing roadmaps are already populated on-demand; treat them as ready.
update public.roadmaps set generation_status = 'ready' where generation_status is null;
