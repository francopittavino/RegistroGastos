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
- **Los períodos tienen precisión de timestamp, no de día**: viven en la
  tabla `periods` (una fila por cada vez que el usuario cerró el mes, con
  `start_at timestamptz`). El período actual es siempre el de `start_at`
  más reciente, y su fin es `null` (todavía abierto, sin límite) o el
  `start_at` del siguiente período si ya se cerró. Cerrar el período dos
  veces el mismo día crea igual un período nuevo distinto (antes era por
  `date`, con un `unique` que lo bloqueaba — ya no). Toda esta lógica vive
  en `lib/periods.ts` (`rangoDePeriodo`, `diasTranscurridos`, que ahora
  devuelve días con decimales) — no reintroduzcas un cálculo de "día X del
  mes" basado en el calendario.
- **Un gasto pertenece a un período por su `created_at` real, no por su
  `date`**: `date` es editable (el usuario puede backdatear un gasto) y no
  debe afectar a qué período pertenece — lo que importa es el momento en
  que se cargó. Por eso `getExpensesInRange`/`getTotales`/
  `getTotalesPorCategoria`/`getResumenComida` en `lib/queries.ts` filtran
  por `e.created_at`, no por `e.date`. `date` se sigue usando para mostrar
  y ordenar la lista de gastos, solo no para decidir el período.
- **`hasta` es `string | null` en las queries de rango**: `null` significa
  "sin límite superior" (el período actual, todavía abierto) — las queries
  arman dos variantes de SQL (con y sin el `and ... < hasta`) en vez de
  intentar splicear condicionalmente un fragmento dentro de un mismo
  template de `sql` (el driver de Neon no lo soporta bien).
- **La proyección de Home es distinta del período de pago**: usa
  `proyeccionCalendario()` (también en `lib/periods.ts`), que se ancla al 1°
  del mes calendario que viene, independiente de cuándo el usuario cobra.
  No la confundas con `rangoDePeriodo`/`diasTranscurridos`, que sí siguen el
  período de pago.
- **Colores del gráfico de torta**: paleta categórica fija en `lib/colors.ts`
  (`PALETA_CATEGORICA`), en orden fijo, nunca generada ni ciclada. Si hay
  más de 7 categorías con gasto en el período, el resto se pliega en una
  porción "Otras categorías" con `COLOR_OTRAS` (gris neutro). No agregues
  colores nuevos a mano en un componente — todo pasa por `armarSlices()`.
- **Cantidad + unidad son opcionales, solo tienen sentido para comida**:
  viven en `expense_items.quantity` / `.unit` (`Unit` en `lib/types.ts`, un
  enum fijo: kg, g, l, ml, unidad, paquete). `getResumenComida()` en
  `lib/queries.ts` agrupa por `(lower(trim(detail)), unit)` dentro de
  categorías `kind = 'comida'` — es la base de la vista "Comida" en
  Historial. Si el usuario carga cantidad sin elegir unidad, el form
  defaultea a `'unidad'` (ver `formulario-gasto.tsx`) para no bloquear el
  guardado por un campo secundario.
- **No hay CSV.** Se sacó del V1 original a pedido del usuario — no lo
  reintroduzcas sin que lo pida explícitamente.
- **Editar/borrar un gasto nunca depende del período**: no hay ni debe
  haber ninguna restricción en `formulario-gasto.tsx`/`actions.ts` que
  bloquee editar o borrar un gasto de un período ya cerrado.
- **Las Server Actions validan sus datos de entrada del lado del
  servidor** (`validarGastoInput` y las validaciones inline en
  `lib/actions.ts`), no solo el formulario. Son endpoints POST públicos —
  cualquiera que conozca la URL puede mandar un POST directo sin pasar por
  la UI. Si agregás una action nueva que reciba datos del cliente,
  validalos ahí también.
- **Una categoría con gastos cargados no se puede borrar** (`borrarCategoria`
  tira error si `cantidadGastos > 0`), solo renombrar o recategorizar
  (comida ↔ otros). Evita perder el historial de esos gastos "huérfanos".
- **`app/error.tsx` y `app/loading.tsx`** cubren toda la app (no hay
  versiones por ruta) — si agregás una ruta nueva, hereda esas por
  default, no dupliques a menos que necesites un mensaje específico.

## Base de datos

- Neon Postgres. El mismo `DATABASE_URL` sirve tanto a Preview como a
  Production en Vercel (una sola base, sin branching por ambiente) — **no
  hay una base de "desarrollo" separada**. Cualquier dato de prueba cargado
  localmente contra `.env.local` queda en la base real, y el usuario puede
  estar usando la app en producción **al mismo tiempo** que vos probás en
  local (ya pasó: mientras se testeaba una feature, el usuario cargó gastos
  reales desde `registrodatos.vercel.app`).
  **Antes de correr cualquier `delete`/`update` "de limpieza" contra la
  base, mirá primero qué hay** (`select * from expenses order by id desc
  limit 20`, fijate fechas/montos) y borrá por `id` puntual lo que vos mismo
  insertaste en esta sesión de prueba — nunca un `delete from expenses`
  a secas ni nada que arrase la tabla entera. Ante la duda de si una fila es
  tuya o del usuario, preguntale antes de borrar.
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
