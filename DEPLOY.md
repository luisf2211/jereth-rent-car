# Despliegue en Vercel

Guía para desplegar Jereth Rent Car (Next.js 16 + Prisma 7 + Supabase) en Vercel.

## 1. Requisitos previos

- El repo ya está en GitHub (`luisf2211/jereth-rent-car`).
- Proyecto de Supabase con la base de datos y el bucket `media` (público) creados.

## 2. Conexión a la base de datos (importante)

Vercel corre en serverless, así que la app **debe** usar el **Transaction Pooler**
de Supabase (puerto 6543), no la conexión directa. Las migraciones sí usan la
conexión directa (5432).

En Supabase → **Connect → ORMs** copia las dos cadenas:

- `DATABASE_URL` → **Transaction pooler** (6543). Añade al final:
  `?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` → **Direct connection / Session pooler** (5432).

## 3. Variables de entorno en Vercel

En **Project → Settings → Environment Variables** agrega (Production + Preview):

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `DATABASE_URL` | pooler 6543 + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | conexión directa 5432 |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` (secreta) |
| `SUPABASE_STORAGE_BUCKET` | `media` |
| `RESEND_API_KEY` | `re_...` (secreta) — dominio `jerethrentcar.com` |
| `RESEND_FROM_EMAIL` | *(opcional)* `JERETH RENT CAR <reservas@jerethrentcar.com>` |
| `RESERVATION_NOTIFICATION_EMAIL` | correo del admin que recibe las nuevas solicitudes de reserva |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (para el botón "Ver reserva" del correo) |

`AUTH_URL` no suele hacer falta (Auth.js infiere el host en Vercel). Si hay
problemas de callback, fíjala a la URL pública del sitio.

`RESEND_API_KEY` es secreta: no lleva prefijo `NEXT_PUBLIC_` y nunca se sube al
repo (`.env*` está en `.gitignore`). El cliente de Resend vive en
`src/lib/email/resend.ts` (marcado `server-only`), así que la clave solo se usa
en el servidor. Los correos aún no están implementados; esta variable solo deja
Resend listo para la próxima fase.

## 4. Migraciones

El `build` de Vercel ejecuta `prisma generate && next build` (ya configurado),
pero **no** corre migraciones automáticamente. Aplica el schema a la base una vez
(desde tu máquina, apuntando a la DB de producción) con:

```bash
npm run db:migrate:deploy   # prisma migrate deploy
```

Opcional: sembrar datos base (`npm run db:seed`) y contenido demo
(`npx tsx prisma/seed-demo-content.ts`). Las reseñas demo deben reemplazarse
por reales.

## 5. Deploy

1. En Vercel: **Add New → Project** → importa el repo de GitHub.
2. Framework: Next.js (autodetectado). No cambies el build command
   (usa el `build` del package.json).
3. Agrega las variables de entorno del paso 3.
4. Deploy.

## 6. Post-deploy

- Verifica `/` (home) y `/vehicles`.
- Inicia sesión en `/login` y confirma que `/admin` funciona.
- Prueba subir una imagen (branding o vehículo) para validar el Storage.
