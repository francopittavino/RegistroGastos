# Registro de Gastos

App personal (un solo usuario) para controlar gastos mensuales, con foco en
medir cuánto se gasta en comida. V1 en producción:
**https://registrodatos.vercel.app**

## Estado actual

**Stack**: Next.js (App Router) + TypeScript + Tailwind CSS, Neon Postgres
(`@neondatabase/serverless`, sin ORM), Server Actions para las mutaciones,
PWA instalable, tema oscuro único (sin toggle), sin login (privada solo
porque la URL no se comparte). Deploy en Vercel conectado a GitHub
(`francopittavino/RegistroGastos`, rama `master`, deploy automático en cada push).

**Modelo de datos** (Neon Postgres):

| Tabla | Qué guarda |
|---|---|
| `expenses` | Un gasto: fecha, categoría, detalle, monto, medio de pago opcional |
| `expense_items` | Desglose opcional de un gasto en ítems (ej. "leche", "pan"), con cantidad + unidad opcionales (kg, g, l, ml, unidad, paquete) |
| `categories` | Nombre + `kind` (`comida` \| `otros`). Seedeadas: Supermercado, Verdulería, Delivery/Restaurante (comida); Vivienda, Servicios, Transporte, Salud, Ocio, Otros (otros). Se pueden crear desde el formulario de carga, y editar/borrar desde Configuración (una categoría con gastos cargados no se puede borrar, solo renombrar o recategorizar) |
| `periods` | Cada fila es un "mes": arranca en el instante exacto (día y hora) en que el usuario toca "Cerrar mes" en Configuración. El fin de un período es el inicio del siguiente, o "ahora" si es el actual. Los gastos se agrupan en un período por su `created_at` real (el momento en que se cargaron), no por la fecha editable del gasto |
| `settings` | Presupuesto total del período (una sola fila) |

**Pantallas**:

- **Home** (`/`) — total gastado en el período (todas las categorías, no
  solo comida) con gráfico de torta por categoría; total de comida y su
  promedio diario; presupuesto restante y una proyección "si seguís a este
  ritmo, para el 1° de [mes que viene] te van a quedar/pasar $X" (anclada al
  calendario, no al período de pago); navegación `‹ ›` para ver períodos
  anteriores (sin la proyección, que solo aplica al período abierto); botón
  fijo "+ Cargar gasto"
- **Cargar gasto** (`/nuevo`) — monto único o desglose en ítems (cada ítem
  puede llevar cantidad + unidad, además de detalle y monto), categorías
  como botones (con creación de categoría nueva inline), medio de pago y
  fecha opcionales; el formulario se limpia solo después de guardar para
  cargar el siguiente gasto sin volver a Home
- **Historial** (`/historial`) — dos vistas con tabs, "Gastos" (lista del
  período elegido, navegación `‹ ›` entre períodos incluidos los ya
  cerrados, filtro por categoría en un panel que se desliza desde la
  izquierda, tacho de basura por fila para borrar sin entrar a editar, tap
  en el resto de la fila para editar) y "Comida" (cantidades totales
  cargadas por ítem — ej. "Arroz — 5 kg" — para planear la compra del mes
  siguiente). Editar o borrar un gasto funciona igual sin importar si su
  período ya está cerrado. Un período ya cerrado se puede borrar (con
  confirmación inline) — nunca el actual. Borrar un período no borra sus
  gastos: al desaparecer ese límite, esos gastos pasan a formar parte del
  período anterior.
- **Configuración** (`/configuracion`) — presupuesto del período, botón
  "Cobré: cerrar mes y empezar de nuevo" (con confirmación inline, no un
  `confirm()` nativo; cierra en el instante exacto en que se toca el
  botón, así que cerrar dos veces el mismo día arranca igual un período
  nuevo distinto desde ese momento), y gestión de categorías (renombrar,
  cambiar entre comida/otros, o borrar si no tiene gastos cargados)

**Robustez**: `app/error.tsx` y `app/loading.tsx` en español (en vez de la
pantalla genérica de Next si algo falla o tarda). Las Server Actions
validan sus datos de entrada del lado del servidor (monto > 0, categoría
existente, fecha con formato válido, etc.) — no confían solo en la
validación del formulario, porque son endpoints POST alcanzables
directamente por cualquiera que conozca la URL.

**Formato**: moneda `$45.000`, fechas `DD/MM/AAAA`, toda la UI en español,
targets táctiles ≥44px, "hoy" siempre en horario argentino sin importar el
timezone del servidor. Colores de categoría en el gráfico de torta siguen
una paleta categórica fija (nunca se generan colores nuevos; con más de 7
categorías con gasto, el resto se pliega en "Otras categorías").

**Sin CSV.** Se sacó la importación/exportación de CSV que tenía el V1
original — decisión del usuario, ya no es parte de la app.

## Propuestas a futuro

Ninguna de estas está decidida — son recomendaciones para elegir si te
interesan, no un compromiso de trabajo.

1. **Proyección basada en la duración real de los períodos de pago.** Hoy
   la proyección de Home se ancla siempre al calendario (1° del mes que
   viene), sin relación con el período de pago real. Con 2-3 períodos
   cerrados se podría ofrecer también una proyección anclada a cuándo
   históricamente cobrás.
2. **Recordatorio de carga.** Notificación push (la PWA ya lo permite en
   principio) si pasó un día entero sin cargar ningún gasto. Requeriría
   pedir permiso de notificaciones, que hoy no se pide.
3. **Comparación entre períodos ajustada por inflación.** Se dejó afuera a
   propósito porque comparar montos nominales en Argentina es engañoso. Si
   en algún momento te interesa, lo más simple sería ingresar manualmente
   un índice de referencia (o un ajuste por mes) en vez de comparar montos
   crudos.
4. **Unidades personalizadas.** Hoy la unidad de cantidad es una lista fija
   (kg, g, l, ml, unidad, paquete). Si compras algo que no encaja bien ahí
   (ej. "docena", "atado"), se podría permitir texto libre.

## Cuentas separadas (a futuro, sin decidir todavía)

Hoy la app no tiene login: es privada solo porque no se comparte la URL, y
todos los datos son de un único usuario global. Si en algún momento se
quiere dar la app a otras personas, cada una con su propia cuenta aislada:

- **Autenticación real**, hoy inexistente. Para un grupo chico y cerrado de
  gente conocida, las opciones más simples son login con Google (sin
  manejar contraseñas ni emails) o usuario/contraseña asignado a mano (sin
  flujo de registro). Email + link mágico también sirve, pero necesita un
  proveedor de envío de mails.
- **Modelo de datos**: agregar una tabla `users` y una columna `user_id` en
  `categories`, `expenses`, `periods` y `settings`. Todas las queries (ya
  centralizadas en `lib/queries.ts` y `lib/actions.ts`) necesitan filtrar
  por el usuario logueado — refactor grande pero mecánico gracias a esa
  organización.
- Cada usuario arrancaría con su propio set de categorías seedeadas (hoy
  son globales).
- Sesión: cookie + tabla de sesiones (a mano, o con una librería como
  Auth.js).

Es un cambio de arquitectura considerable, pensado como una etapa aparte,
no algo para el corto plazo.
