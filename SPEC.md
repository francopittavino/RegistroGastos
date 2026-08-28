# SPEC — Registro de Gastos

App personal para controlar gastos mensuales, con foco en medir cuánto se gasta en
comida durante el primer mes viviendo solo, para poder presupuestar los meses
siguientes.

## Prioridad número uno

Cargar un gasto tiene que llevar **menos de 10 segundos**. Todo el resto del diseño
(pantallas de análisis, gráficos, historial) es secundario frente a esto.

## Stack

- **Next.js (App Router) + TypeScript** — full-stack en un solo proyecto, deploy directo en Vercel.
- **Tailwind CSS** — mobile-first real, sin componentes de escritorio achicados.
- **Tema oscuro único**: la app es oscura siempre, no hay modo claro ni toggle de tema. Se define una sola paleta de colores oscura y listo — no hay que soportar `prefers-color-scheme` ni mantener dos paletas.
- **Neon Postgres** (vía integración de Vercel Marketplace) — persiste entre dispositivos y sobrevive a cambiar de celular. Se accede con SQL directo (`@neondatabase/serverless`; `@vercel/postgres` está deprecado desde la migración de Vercel Postgres a Neon), sin ORM: son pocas tablas y las queries son simples, un ORM sería peso muerto.
- **Server Actions** de Next.js para las mutaciones (guardar/editar/borrar gasto, importar CSV) — sin API routes separadas, sin state manager (alcanza con estado de React + revalidación de Server Components).
- **PWA**: `manifest.json` + service worker mínimo (cachea el shell) para poder "Agregar a pantalla de inicio" y abrir sin barra de navegador. No se busca soporte offline completo — si no hay internet no se puede guardar en la base, pero la app abre instantáneo.
- **Autenticación**: ninguna. Sin login, sin contraseña, sin cookies de sesión. La app es privada solo porque la URL de producción no se comparte ni se indexa. Es una decisión consciente del usuario dado que es una app de un solo uso personal con datos de bajo riesgo (montos de gastos, no datos sensibles).
- **CSV import/export**: parser manual simple (el formato de columnas es fijo y conocido), sin librerías externas de CSV.

## Modelo de datos

### `expenses`
| campo | tipo | notas |
|---|---|---|
| id | serial / uuid | PK |
| date | date | default: hoy |
| category_id | FK → categories | |
| detail | text, nullable | descripción libre |
| amount | numeric(12,2) | si el gasto tiene ítems, es la suma de `expense_items` |
| payment_method | text, nullable | `efectivo` / `debito` / `transferencia` / `otro` — opcional |
| created_at | timestamptz | default now() |

### `expense_items` (solo cuando se usa el desglose opcional)
| campo | tipo | notas |
|---|---|---|
| id | serial / uuid | PK |
| expense_id | FK → expenses | |
| detail | text | ej: "leche" |
| amount | numeric(12,2) | |

El desglose es **opcional**: por defecto se carga un monto único (rápido). Si el
usuario toca "+ agregar ítems", se despliega una lista de ítem+monto y el campo
`amount` del gasto se recalcula como la suma. Esto evita que el desglose sea
obligatorio y rompa el requisito de <10s.

### `settings` (una sola fila, `id = 1`)
| campo | tipo | notas |
|---|---|---|
| monthly_budget | numeric(12,2), nullable | presupuesto único para el total de TODOS los gastos del período (no por categoría) |

### `periods`
| campo | tipo | notas |
|---|---|---|
| id | serial | PK |
| start_date | date, unique | día en que arrancó el período |
| created_at | timestamptz | default now() |

El usuario no cobra el mismo día todos los meses, así que no hay un "día de
inicio de mes" fijo. En cambio, cada período (lo que en la UI se llama "mes")
arranca el día que el usuario aprieta **"Cerrar mes"** en Configuración —
eso inserta una fila nueva en `periods` con `start_date = hoy`. El fin de un
período es el `start_date` del siguiente, o "hoy" si es el período actual
(todavía abierto). El primer período se siembra en la migración inicial con
`start_date = hoy` de ese momento.

## Categorías

Viven en una tabla `categories`, no como constante fija, porque el usuario puede
crear las suyas desde el V1.

### `categories`
| campo | tipo | notas |
|---|---|---|
| id | serial / uuid | PK |
| name | text | nombre visible, ej. "Supermercado" |
| kind | text | `comida` \| `otros` — define si suma al total de comida de la Home (se llama `kind` y no `group` porque `group` es palabra reservada en SQL) |
| created_at | timestamptz | default now() |

Se seedean estas de partida (grupo entre paréntesis):

- Supermercado (comida)
- Verdulería (comida)
- Delivery / Restaurante (comida)
- Vivienda — alquiler, expensas (otros)
- Servicios — luz, gas, agua, internet (otros)
- Transporte (otros)
- Salud (otros)
- Ocio (otros)
- Otros (otros)

**Crear categoría**: en la grilla de categorías del formulario de carga hay un
botón "+ Nueva categoría" al final. Al tocarlo, un mini-formulario pide nombre +
si es de comida o no (dos botones grandes, no checkbox), la guarda y la deja
seleccionada al toque para no interrumpir la carga del gasto en curso.

V1 no incluye editar ni renombrar categorías existentes, ni borrarlas — eso
queda en "Futuro". `expenses.category` pasa a ser una FK a `categories.id` en
vez de texto libre.

## Pantallas

### 1. Home (`/`)
Lo primero que se ve al abrir la app:
- Total gastado en **comida** en el período actual (suma de las categorías del grupo comida)
- Promedio diario de comida hasta la fecha (días transcurridos desde que arrancó el período)
- Proyección a 30 días de comida (promedio diario × 30) — no hay "proyección de fin de mes" porque el período no tiene una duración fija conocida de antemano
- Total gastado en TODOS los gastos del período, y si hay `monthly_budget` configurado, cuánto resta o cuánto te excediste
- Fecha de inicio del período actual, y un link a Configuración para cerrarlo cuando cobre
- Botón grande y fijo **"+ Cargar gasto"**

No incluye lista de últimos gastos (eso vive en Historial) para mantener la home mínima y rápida de leer.

### 2. Cargar gasto (`/nuevo`)
- Monto: primer campo, autofocus, `inputMode="decimal"`, teclado numérico nativo
- Categoría: botones grandes tocables (grid), no `<select>`
- Detalle: texto libre, opcional
- Medio de pago: botones chicos, opcional
- Fecha: autocompletada con hoy, editable
- "+ agregar ítems" opcional (ver desglose arriba)
- Al guardar: como el usuario suele cargar varios gastos juntos a la noche, el
  formulario se limpia y vuelve a estar listo para el siguiente gasto (foco en
  monto), con una confirmación breve (toast). Hay un botón "Listo" separado
  para volver a la Home cuando termina de cargar.

### 3. Historial (`/historial`)
Lista cronológica de gastos del período actual, con navegación `‹ ›` para ver
períodos anteriores (cerrados con "Cerrar mes") sin perder ese historial. El
filtro por categoría es un panel que se desliza desde el borde izquierdo de
la pantalla (no una fila de chips arriba), para no restar espacio a la lista
de gastos. Cada gasto se puede editar o borrar tocándolo. Acá es donde se
corrigen errores de carga.

### 4. Configuración (`/configuracion`)
- Período actual (fecha de inicio) + botón **"Cobré: cerrar mes y empezar de
  nuevo"**, con una confirmación inline antes de cerrarlo (no es un `confirm()`
  nativo del navegador)
- Presupuesto total del período
- Importar CSV
- Exportar CSV

## Importar / Exportar CSV

Columnas, en este orden: `fecha, categoria, detalle, monto, medio_pago`.

- **Importar**: valida que `categoria` matchee el `name` de alguna categoría
  existente (comparación case-insensitive); si no existe, se crea automáticamente
  en el grupo `otros` (se puede recategorizar como comida después, a mano). Las
  filas con datos inválidos (fecha o monto mal formados) se marcan como error y
  se avisan, sin abortar el resto del archivo. Sirve para no perder los datos
  que el usuario ya viene cargando en una planilla.
- **Exportar**: mismas columnas, todos los gastos o filtrados por mes. Los gastos
  con ítems desglosados exportan el monto total (no cada ítem por separado en V1).

## Formato

- Moneda: `$45.000` (separador de miles con punto, sin decimales si es entero)
- Fechas: `DD/MM/AAAA`
- Toda la UI en español: labels, categorías, mensajes de error

## Accesibilidad táctil

Todos los targets tocables ≥ 44px. Ninguna interacción depende exclusivamente de hover.

## Fuera de V1 (Futuro)

- Multi-usuario / gastos compartidos con otra persona
- Editar, renombrar o borrar categorías existentes (V1 solo permite crear nuevas)
- Comparación mes contra mes (se ignora explícitamente por ahora: la inflación
  argentina hace que comparar montos nominales entre meses sea engañoso; si se
  agrega en el futuro, debería ser con algún ajuste, no comparación directa)
- Exportar el desglose de ítems en el CSV (V1 exporta solo el monto total del gasto)
- Gráficos / analíticas avanzadas más allá de lo que pide la Home
- Notificaciones o recordatorios para cargar gastos
- Soporte offline completo (guardar sin conexión y sincronizar después)
- Proyección inteligente basada en la duración real de períodos anteriores
  (por ahora la proyección es siempre a 30 días fijos, sin importar cuánto
  duraron los períodos cerrados hasta ahora)
- Deshacer un "Cerrar mes" (por ahora es una acción sin vuelta atrás desde la UI)

## Criterio de éxito del V1

Abrir la app desde el ícono en la pantalla de inicio del celular, cargar un
gasto en menos de 10 segundos, y ver en la Home cuánto se lleva gastado en
comida este mes y cuál es el promedio por día.
