-- Run once in Supabase SQL Editor. Add users in Authentication > Users.
create extension if not exists pgcrypto;

create table if not exists public.qa_projects (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 200),
    description text not null default '',
    created_at timestamptz not null default now()
);

create table if not exists public.qa_items (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.qa_projects(id) on delete cascade,
    title text not null check (char_length(title) between 1 and 200),
    description text not null default '',
    assignee text not null default '',
    priority text not null default '보통' check (priority in ('낮음', '보통', '높음')),
    status text not null default '대기' check (status in ('대기', '진행', '수정완료', '통과')),
    created_at timestamptz not null default now()
);

create table if not exists public.qa_attachments (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.qa_items(id) on delete cascade,
    file_name text not null,
    storage_path text not null unique,
    created_at timestamptz not null default now()
);

create index if not exists qa_items_project_idx on public.qa_items(project_id);
create index if not exists qa_attachments_item_idx on public.qa_attachments(item_id);

alter table public.qa_projects enable row level security;
alter table public.qa_items enable row level security;
alter table public.qa_attachments enable row level security;

-- Small trusted-team MVP: all authenticated accounts can read/write all projects.
-- Restrict membership further before inviting untrusted users.
create policy "team projects" on public.qa_projects for all to authenticated using (true) with check (true);
create policy "team items" on public.qa_items for all to authenticated using (true) with check (true);
create policy "team attachments" on public.qa_attachments for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qa-screenshots', 'qa-screenshots', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "team screenshot read" on storage.objects for select to authenticated using (bucket_id = 'qa-screenshots');
create policy "team screenshot upload" on storage.objects for insert to authenticated with check (bucket_id = 'qa-screenshots');
create policy "team screenshot delete" on storage.objects for delete to authenticated using (bucket_id = 'qa-screenshots');

-- Realtime publication. If already added, skip safely.
do $$ begin
    alter publication supabase_realtime add table public.qa_projects, public.qa_items, public.qa_attachments;
exception when duplicate_object then null;
end $$;
