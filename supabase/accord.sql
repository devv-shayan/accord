-- Apply to a dedicated Accord project. Server-only access uses SUPABASE_SECRET_KEY.
-- Google authentication is verified by the server. No browser receives the service key.
create table if not exists public.accord_documents (
  kind text not null check (kind in ('user','session','extension','capture','chunk','share')),
  id text not null,
  owner_id text not null,
  data jsonb not null,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  primary key (kind, id)
);
create index if not exists accord_documents_owner_kind on public.accord_documents(owner_id, kind);
create index if not exists accord_documents_capture_id on public.accord_documents((data->>'captureId')) where kind = 'chunk';
alter table public.accord_documents enable row level security;
revoke all on public.accord_documents from anon, authenticated;
grant all on public.accord_documents to service_role;

create table if not exists public.accord_locks (id text primary key, token text not null, expires_at timestamptz not null);
alter table public.accord_locks enable row level security;
revoke all on public.accord_locks from anon, authenticated;
grant all on public.accord_locks to service_role;
create or replace function public.accord_acquire_lock(lock_id text, lock_token text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  insert into public.accord_locks(id, token, expires_at) values(lock_id, lock_token, now() + interval '10 minutes')
  on conflict(id) do update set token=excluded.token, expires_at=excluded.expires_at
  where public.accord_locks.expires_at < now();
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
create or replace function public.accord_release_lock(lock_id text, lock_token text) returns void
language sql security invoker set search_path = '' as $$
  delete from public.accord_locks where id = lock_id and token = lock_token;
$$;
revoke all on function public.accord_acquire_lock(text,text) from public, anon, authenticated;
revoke all on function public.accord_release_lock(text,text) from public, anon, authenticated;
grant execute on function public.accord_acquire_lock(text,text) to service_role;
grant execute on function public.accord_release_lock(text,text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('accord-recordings', 'accord-recordings', false, 134217728, array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','application/octet-stream'])
on conflict (id) do nothing;
-- No public storage policies. All recording reads require an owner session or a clip token.
