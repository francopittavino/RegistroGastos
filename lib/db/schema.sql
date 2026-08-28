create table if not exists categories (
  id serial primary key,
  name text not null unique,
  kind text not null check (kind in ('comida', 'otros')),
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id serial primary key,
  date date not null,
  category_id integer not null references categories(id),
  detail text,
  amount numeric(12, 2) not null,
  payment_method text check (payment_method in ('efectivo', 'debito', 'transferencia', 'otro')),
  created_at timestamptz not null default now()
);

create table if not exists expense_items (
  id serial primary key,
  expense_id integer not null references expenses(id) on delete cascade,
  detail text not null,
  amount numeric(12, 2) not null
);

create table if not exists settings (
  id integer primary key default 1,
  monthly_budget numeric(12, 2),
  constraint settings_single_row check (id = 1)
);

-- Un período arranca el día que el usuario aprieta "Cerrar mes" (o el día de la
-- primera migración, para el período inicial). No tiene fecha de fin fija: el
-- fin de un período es el start_date del siguiente, o "hoy" si es el actual.
create table if not exists periods (
  id serial primary key,
  start_date date not null unique,
  created_at timestamptz not null default now()
);

alter table settings drop column if exists month_start_day;

insert into categories (name, kind) values
  ('Supermercado', 'comida'),
  ('Verdulería', 'comida'),
  ('Delivery / Restaurante', 'comida'),
  ('Vivienda', 'otros'),
  ('Servicios', 'otros'),
  ('Transporte', 'otros'),
  ('Salud', 'otros'),
  ('Ocio', 'otros'),
  ('Otros', 'otros')
on conflict (name) do nothing;

insert into settings (id, monthly_budget) values (1, null)
on conflict (id) do nothing;

-- Se usa la fecha de Argentina, no la del servidor (Vercel/Neon corren en UTC),
-- para que coincida con hoyISO() del lado de la app y no arranque "un día
-- adelantado".
insert into periods (start_date)
select (now() at time zone 'America/Argentina/Buenos_Aires')::date
where not exists (select 1 from periods);
