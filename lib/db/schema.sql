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

-- cantidad + unidad opcionales, para poder ver a fin de mes qué cantidad de
-- cada comida se compró (pensado para planear la compra mensual siguiente).
alter table expense_items add column if not exists quantity numeric(10, 2);
alter table expense_items add column if not exists unit text
  check (unit in ('kg', 'g', 'l', 'ml', 'unidad', 'paquete'));

create table if not exists settings (
  id integer primary key default 1,
  monthly_budget numeric(12, 2),
  constraint settings_single_row check (id = 1)
);

-- Un período arranca en el momento exacto (día y hora) en que el usuario
-- aprieta "Cerrar mes" (o el momento de la primera migración, para el
-- período inicial). No tiene fin fijo: el fin de un período es el start_at
-- del siguiente, o "ahora" si es el actual. Se guarda con precisión de
-- timestamp (no solo la fecha) para que cerrar el período dos veces el
-- mismo día arranque igual un período nuevo desde ese momento.
create table if not exists periods (
  id serial primary key,
  start_date date,
  created_at timestamptz not null default now()
);

alter table periods add column if not exists start_at timestamptz;
update periods set start_at = (start_date::timestamp at time zone 'America/Argentina/Buenos_Aires')
  where start_at is null and start_date is not null;
alter table periods alter column start_at set not null;
alter table periods drop column if exists start_date;

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

insert into periods (start_at)
select now()
where not exists (select 1 from periods);
