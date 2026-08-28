# Registro de Gastos

App personal para controlar gastos mensuales, con foco en medir cuánto se
gasta en comida. Ver [`SPEC.md`](./SPEC.md) para el modelo de datos, las
pantallas y qué queda fuera del V1. Ver [`CLAUDE.md`](./CLAUDE.md) para las
convenciones del proyecto.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Neon Postgres, deploy en
Vercel. PWA instalable desde el navegador del celular.

## Variables de entorno

| Variable | De dónde sale | Para qué |
|---|---|---|
| `DATABASE_URL` | Vercel → proyecto → Storage → base Neon conectada | Conexión a Postgres, usada por `lib/db/index.ts` y `scripts/migrate.mjs` |

El resto de las variables que aparecen en `.env.local` (`PG*`, `POSTGRES_*`,
`NEON_*`, etc.) las genera automáticamente la integración de Neon en Vercel —
no hace falta tocarlas a mano, `DATABASE_URL` es la única que usa el código.

`.env.local` no se commitea (está en `.gitignore`). Para traerlo en una
máquina nueva, con el proyecto ya linkeado a Vercel:

```bash
npx vercel link
npx vercel env pull .env.local --environment=preview
```

(se usa `preview` porque en este proyecto la base de datos no tiene un valor
propio en el ambiente `development` de Vercel — es la misma base para
Preview y Production).

## Desarrollo local

```bash
npm install
npm run db:migrate   # crea las tablas y siembra las categorías, es idempotente
npm run dev
```

**Ojo**: no hay una base de datos de "desarrollo" separada de producción —
`DATABASE_URL` apunta a la misma base Neon en ambos casos. Cualquier gasto
que cargues probando localmente queda en los datos reales. Para limpiar
datos de prueba sin tocar categorías ni configuración:

```bash
node --env-file=.env.local -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`delete from expenses\`.then(() => console.log('listo'));
"
```

## Deploy

El repo está conectado a un proyecto de Vercel (deploy automático al pushear
a la rama principal). La base de datos Neon se administra desde la pestaña
Storage del proyecto en el dashboard de Vercel.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run db:migrate` — aplica `lib/db/schema.sql` (crear tablas + seed de categorías)
- `npm run lint` — ESLint
