# jereth-rent-car

Plataforma web de Rent Car (MVP). Portal cliente + backoffice administrativo, construida con Next.js, TypeScript y Material UI.

## Stack

- Next.js (App Router) + TypeScript + React
- Material UI (MUI) + MUI Icons
- React Hook Form + Zod (validación)
- PostgreSQL + Prisma (Fase 2)

## Requisitos

- Node.js 18.18+ (recomendado 20+)

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

> Las imágenes de vehículos y del hero provienen de Unsplash, por lo que se requiere conexión a internet para visualizarlas.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — sirve el build de producción

## Estructura

```
src/
  app/
    (public)/        Portal cliente (landing, catálogo, detalle)
    (admin)/         Backoffice (dashboard, usuarios, roles, branding)
  components/
    ui/              Componentes reutilizables (Logo, WhatsAppButton, etc.)
    public/          Componentes del portal cliente
    admin/           Layout y navegación del backoffice
  features/          Lógica por dominio (vehicles: mock + helpers)
  lib/               branding, permissions, whatsapp
  theme/             Theme MUI centralizado (palette, tema, adaptadores)
  types/             Tipos de dominio
```

## Estado

**Fase 1 completa:** UI del portal cliente y backoffice con datos mock, theme centralizado y navegación responsive. La conexión con PostgreSQL/Prisma llega en la Fase 2.
