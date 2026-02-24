create table if not exists journal_entries (
  id uuid primary key,
  visit_id text not null,
  captured_at timestamptz not null,
  updated_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  heading_deg double precision,
  measurement_kind text not null check (measurement_kind in ('direct', 'calculated')),
  direct_value numeric,
  calc_base_value numeric,
  calc_top_value numeric,
  unit text not null check (unit in ('imperial', 'metric')),
  notes text not null default '',
  deleted boolean not null default false,
  check (
    (
      measurement_kind = 'direct'
      and direct_value is not null
      and calc_base_value is null
      and calc_top_value is null
    )
    or
    (
      measurement_kind = 'calculated'
      and direct_value is null
      and calc_base_value is not null
      and calc_top_value is not null
    )
  )
);

create index if not exists idx_journal_entries_visit_captured
  on journal_entries (visit_id, captured_at desc);

create index if not exists idx_journal_entries_visit_updated
  on journal_entries (visit_id, updated_at desc);
