@AGENTS.md

# Registro de Gastos — convenciones del proyecto

App personal de un solo usuario para trackear gastos mensuales, con foco en
medir el gasto en comida. Ver `SPEC.md` para el modelo de datos completo,
las pantallas y lo que queda explícitamente fuera del V1.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Neon Postgres (vía integración de Vercel Marketplace) accedido con
  `@neondatabase/serverless` — SQL directo con tagged templates, sin ORM
- Server Actions para todas las mutaciones (no hay API routes separadas)
- Deploy en Vercel

## Convenciones de código

- **Todo el texto de cara al usuario va en español**: labels, categorías,
  mensajes de error, confirmaciones. Los nombres de variables/funciones
  pueden estar en español cuando nombran conceptos del dominio (`crearGasto`,
  `periodoActual`, `montoTotal`) — es consistente con el resto del código y
  más fácil de mapear a la spec en español.
- **Moneda y fechas en formato argentino**: `formatMonto` / `formatFecha` en
  `lib/format.ts`. Nunca formatear montos o fechas a mano en un componente.
- **"Hoy" es siempre horario argentino** (`America/Argentina/Buenos_Aires`),
  sin importar en qué timezone corra el servidor (Vercel corre en UTC). Usar
  `hoyISO()` de `lib/format.ts`, nunca `new Date()` pelado para fechas de
  negocio.
- **Las columnas `date` de Postgres vuelven del driver de Neon como objetos
  `Date` de JS**, no strings, y con un corrimiento raro si el proceso local
  tiene timezone no-UTC. Por eso todas las queries en `lib/queries.ts` hacen
  `to_char(e.date, 'YYYY-MM-DD') as date` explícito. Si agregás una query
  nueva que lea `date`, hacé lo mismo — no confíes en el tipo por default.
- **Sin ORM, sin query builder**: `lib/db/index.ts` exporta un único `sql`
  (tagged template de `@neondatabase/serverless`). Las queries de lectura
  viven en `lib/queries.ts`, las mutaciones (`'use server'`) en
  `lib/actions.ts`.
- **Páginas con datos dinámicos llevan `export const dynamic = 'force-dynamic'`**
  (`/`, `/nuevo`, `/historial`, `/configuracion`). Sin esto, Next las
  prerenderiza como estáticas en build time y quedan con el "hoy" y los
  totales congelados del momento del build — es la razón principal detrás de
  esta convención, no una preferencia estética.
- **Dark mode único, sin toggle**: los tokens de color viven en
  `app/globals.css` sobre `:root` directamente (no hay bloque
  `prefers-color-scheme` ni `[data-theme]`). No agregues una paleta clara.
- **Mobile-first real**: el contenido vive en un contenedor `max-w-md
  mx-auto`. Todos los targets tocables ≥44px (`min-h-[44px]` o más). Botones
  de categoría son `<button>` en grilla, nunca `<select>`.
- **El flujo de carga de gasto es lo más importante de la app**: cualquier
  cambio en `app/components/formulario-gasto.tsx` tiene que mantener el
  camino "abrir → monto → categoría → guardar" en menos de 10 segundos. Si
  una feature nueva agrega un paso obligatorio a ese camino, probablemente no
  va en el V1 (ver sección "Futuro" de `SPEC.md`).
- **Categorías**: `kind` es `'comida' | 'otros'`, nunca `'group'` (palabra
  reservada en SQL). El total de "comida" en la Home es la suma de gastos
  cuya categoría tiene `kind = 'comida'`.
- **No hay "día de inicio de mes" fijo**: los períodos viven en la tabla
  `periods` (una fila por cada vez que el usuario cerró el mes, con
  `start_date`). El período actual es siempre el de `start_date` más
  reciente, y su fin es "hoy" (todavía abierto) o el `start_date` del
  siguiente período si ya se cerró. Toda esta lógica vive en `lib/periods.ts`
  (`rangoDePeriodo`, `diasTranscurridos`) — no reintroduzcas un cálculo de
  "día X del mes" basado en el calendario.

## Base de datos

- Neon Postgres. El mismo `DATABASE_URL` sirve tanto a Preview como a
  Production en Vercel (una sola base, sin branching por ambiente) — **no
  hay una base de "desarrollo" separada**. Cualquier dato de prueba cargado
  localmente contra `.env.local` queda en la base real. Limpiar después de
  probar (`delete from expenses;` es seguro, `categories`/`settings` seedeados
  en `lib/db/schema.sql`).
- Migraciones: `npm run db:migrate` corre `lib/db/schema.sql` completo
  (statements `create table if not exists` + seeds con `on conflict do
  nothing`, así es re-ejecutable sin duplicar nada). No hay sistema de
  migraciones versionado — para V1 alcanza con un único schema.sql
  idempotente. Si en el futuro hace falta alterar una tabla existente,
  agregar un `alter table ... if not exists` al mismo archivo.

## Qué NO hacer

- No agregues un ORM (Prisma, Drizzle, etc.) — las queries son simples y el
  proyecto es de un solo usuario.
- No agregues autenticación/login — es una decisión consciente del usuario
  (ver SPEC.md), la privacidad depende de no compartir la URL.
- No conviertas el formulario de carga en un wizard multi-paso ni le agregues
  campos obligatorios nuevos sin confirmar con el usuario primero.
- No implementes nada de la sección "Futuro" de `SPEC.md` sin que el usuario
  lo pida explícitamente.
