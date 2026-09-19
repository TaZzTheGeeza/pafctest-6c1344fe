create table public.homework_tasks (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  title text not null,
  description text,
  drill_media_path text,
  drill_media_type text check (drill_media_type in ('image','video')),
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.homework_tasks(id) on delete cascade,
  player_registration_id uuid references public.player_registrations(id) on delete set null,
  player_name text not null default '',
  user_id uuid not null references auth.users(id) on delete cascade,
  proof_path text,
  proof_type text check (proof_type in ('image','video')),
  note text,
  coach_liked boolean not null default false,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.homework_feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.homework_submissions(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

create table public.homework_stars (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  player_registration_id uuid references public.player_registrations(id) on delete set null,
  player_name text not null,
  task_id uuid references public.homework_tasks(id) on delete set null,
  citation text,
  week_start date not null,
  set_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (team_slug, week_start)
);

create index homework_tasks_team_idx on public.homework_tasks (team_slug, due_date);
create index homework_submissions_task_idx on public.homework_submissions (task_id);
create index homework_submissions_user_idx on public.homework_submissions (user_id);
create index homework_feedback_submission_idx on public.homework_feedback (submission_id);

create trigger set_homework_tasks_updated_at before update on public.homework_tasks
  for each row execute function public.update_updated_at_column();
create trigger set_homework_submissions_updated_at before update on public.homework_submissions
  for each row execute function public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_stars TO authenticated;
GRANT ALL ON public.homework_tasks TO service_role;
GRANT ALL ON public.homework_submissions TO service_role;
GRANT ALL ON public.homework_feedback TO service_role;
GRANT ALL ON public.homework_stars TO service_role;

alter table public.homework_tasks enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.homework_feedback enable row level security;
alter table public.homework_stars enable row level security;

create policy "Authenticated can view homework tasks"
  on public.homework_tasks for select to authenticated
  using (true);

create policy "Coaches and admins create homework tasks"
  on public.homework_tasks for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'));

create policy "Coaches and admins update homework tasks"
  on public.homework_tasks for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'));

create policy "Coaches and admins delete homework tasks"
  on public.homework_tasks for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'));

create policy "Owners, coaches and admins view homework submissions"
  on public.homework_submissions for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'coach')
  );

create policy "Parents submit their own homework"
  on public.homework_submissions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owners, coaches and admins update homework submissions"
  on public.homework_submissions for update to authenticated
  using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'coach')
  )
  with check (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'coach')
  );

create policy "Owners and admins delete homework submissions"
  on public.homework_submissions for delete to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Submission owners, coaches and admins view feedback"
  on public.homework_feedback for select to authenticated
  using (
    exists (
      select 1 from public.homework_submissions s
      where s.id = submission_id
        and (
          s.user_id = auth.uid()
          or public.has_role(auth.uid(), 'admin')
          or public.has_role(auth.uid(), 'coach')
        )
    )
  );

create policy "Coaches and admins add homework feedback"
  on public.homework_feedback for insert to authenticated
  with check (
    coach_id = auth.uid()
    and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'))
  );

create policy "Coaches manage their own feedback"
  on public.homework_feedback for update to authenticated
  using (coach_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (coach_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Coaches and admins delete homework feedback"
  on public.homework_feedback for delete to authenticated
  using (coach_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Authenticated can view homework stars"
  on public.homework_stars for select to authenticated
  using (true);

create policy "Coaches and admins set homework stars"
  on public.homework_stars for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'));

create policy "Coaches and admins update homework stars"
  on public.homework_stars for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'));

create policy "Coaches and admins delete homework stars"
  on public.homework_stars for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'));

create policy "Parents upload homework proof to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'homework-proof'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] = 'drill'
        and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'coach'))
      )
    )
  );

create policy "Owners and team coaches view homework media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'homework-proof'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = 'drill'
      or public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'coach')
    )
  );

create policy "Owners update their homework media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'homework-proof'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners and admins delete homework media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'homework-proof'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(auth.uid(), 'admin')
    )
  );