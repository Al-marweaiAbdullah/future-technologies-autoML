-- Voer uit in Supabase → SQL Editor.
-- We bewaren enkel scores en kaartlabels, nooit beelden.
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  speler      text    not null check (char_length(speler) between 1 and 30),
  punten      integer not null check (punten >= 0 and punten <= 2000),
  kaarten     jsonb   not null default '[]',
  created_at  timestamptz not null default now()
);

alter table public.scores enable row level security;

-- Iedereen met de app mag scores lezen en toevoegen, niet wijzigen of verwijderen.
create policy "scores lezen"     on public.scores for select using (true);
create policy "scores toevoegen" on public.scores for insert with check (true);
