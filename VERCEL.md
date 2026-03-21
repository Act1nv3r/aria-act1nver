# Desplegar ArIA (Next.js) en Vercel

Vercel encaja bien con este proyecto: **HTTPS**, **preview URLs**, y **cero servidor** para el front. La carpeta `backend/` (FastAPI) **no** se despliega con estos pasos; el API hay que alojarlo aparte (Railway, Render, Fly.io, etc.) y apuntar `NEXT_PUBLIC_API_URL` a esa URL pública **https**.

---

## Qué obtienes (plan gratuito habitual)

- URL pública tipo `aria-actinver.vercel.app` (o la que elijas)
- HTTPS automático
- Deploy en pocos minutos
- Previews en cada push si conectas GitHub

---

## Opción A — CLI, sin GitHub

### 1. No uses `npm i -g vercel` si te sale `EACCES` / `permission denied`

En macOS, instalar paquetes globales en `/usr/local` suele requerir `sudo` y no hace falta. **Mejor:**

```bash
npm run vercel
# o directamente:
npx vercel
```

`npx` descarga la CLI en caché de tu usuario **sin** tocar `/usr/local`.

*(Si aun así quisieras global: `sudo npm i -g vercel` — no recomendado.)*

### 2. Ir a la raíz del repo (donde está `package.json` y `next.config.ts`)

```bash
cd "/Users/guillermo.garcia/Library/CloudStorage/OneDrive-ACTINVER/ArIA by Actinver"
```

### 3. Primer deploy

```bash
npm run vercel
```

**No pegues líneas que empiecen por `#`** en la terminal (zsh las intenta ejecutar y verás `command not found: #`).

Respuestas típicas (puedes aceptar muchas con Enter):

| Pregunta | Sugerencia |
|----------|------------|
| Set up and deploy? | **Y** |
| Which scope? | Tu cuenta / equipo |
| Link to existing project? | **N** (primera vez) |
| Project name | **`aria-actinver`** (solo minúsculas, sin espacios; ver nota abajo) |
| Directory | `./` (raíz del Next) |
| Multiple services (Next + FastAPI detectados) | **Set up project with "frontend"** — el API en `backend/` no se despliega aquí |

**Nombre del proyecto (error 400)**  
Vercel **no** acepta mayúsculas, espacios ni caracteres raros. Válido: letras minúsculas, números, `.`, `_`, `-` (máx. 100 caracteres, sin la secuencia `---`).  
Mal: `Ar.IA by Actinver` · Bien: `aria-actinver`, `aria-by-actinver`.  
Este repo incluye `vercel.json` con `"name": "aria-actinver"` para que la CLI sugiera un nombre correcto.

**Si la CLI falló a medias:** borra la carpeta `.vercel` en la raíz del proyecto y vuelve a ejecutar `npm run vercel` (no subas `.vercel` a Git; ya está en `.gitignore`).

Al terminar verás una URL de **preview**.

### 4. Producción

```bash
npm run vercel:prod
# equivalente: npx vercel --prod
```

Así queda asignado el dominio principal del proyecto (p. ej. `*.vercel.app`).

---

## Variables de entorno (importante)

El front usa `NEXT_PUBLIC_API_URL` (ver `src/lib/api-client.ts`). Sin API pública, el sitio carga pero las llamadas fallan en el navegador.

### ¿De dónde saco la URL del API? (`https://…`)

**No sale sola:** es la dirección **pública** de tu **FastAPI** (carpeta `backend/`) **después de desplegarlo** en un servicio que no sea tu PC.

| Situación | Qué poner |
|-----------|-----------|
| Solo corres `uvicorn` en tu Mac | **No tienes** URL pública para producción; el navegador no puede usar `localhost` desde Vercel. |
| Ya desplegaste el API en Railway / Render / Fly.io / etc. | El propio panel del servicio te muestra una URL tipo `https://algo.up.railway.app` o `https://tu-app.onrender.com`. **Esa** es la base (sin `/api/...` al final). |
| Compruebas que responde | Abre en el navegador `https://TU-URL/docs` — si ves la documentación de FastAPI (Swagger), la base es correcta. |

Ejemplo: si Swagger está en `https://mi-api-production.up.railway.app/docs`, entonces  
`NEXT_PUBLIC_API_URL=https://mi-api-production.up.railway.app`

**No uses** la URL de Vercel (`aria-actinver.vercel.app`) ahí: esa es el **front**; el valor es siempre el **servidor del API**.

### Desde la terminal

```bash
npx vercel env add NEXT_PUBLIC_API_URL
```

Elige **Production** (y **Preview** si quieres previews con API de staging).  
Valor ejemplo: `https://tu-backend.railway.app` — **https**, sin barra final.

### Desde el dashboard

Project → **Settings** → **Environment Variables** → añadir `NEXT_PUBLIC_API_URL`.

Tras cambiar variables, haz **Redeploy** en el último deployment.

### Backend (CORS)

En **`backend/.env.local`** (o donde definas variables del API), ajusta **`CORS_ORIGINS`** separando orígenes con comas **sin espacios** (o con espacios si tu código los recorta — el split actual es por `,`):

```env
CORS_ORIGINS=http://localhost:3000,https://aria-actinver.vercel.app
```

Incluye tu dominio Vercel real y, si usas previews, añade esas URLs o un origen que FastAPI acepte.

---

## «No se pudo conectar al servidor» en el login (Vercel)

Eso casi siempre **no es tu Wi‑Fi**: el navegador intenta hablar con la API y falla.

1. **Sin `NEXT_PUBLIC_API_URL` en Vercel**, el front usa por defecto `http://localhost:8000`. Desde [aria-actinver.vercel.app](https://aria-actinver.vercel.app) eso apunta al **ordenador del usuario**, no a un servidor → falla siempre.
2. **Solución:** en Vercel → **Settings** → **Environment Variables** → crea **`NEXT_PUBLIC_API_URL`** = URL **https** de tu FastAPI ya desplegado (Railway, Render, etc.), **sin** `/` al final. Luego **Redeploy**.
3. En el **backend**, **`CORS_ORIGINS`** debe incluir `https://aria-actinver.vercel.app` (y el origen de previews si aplica). Si CORS bloquea, en consola del navegador verás errores de red/CORS, no solo el mensaje genérico.

El backend de la carpeta **`backend/`** no corre en Vercel con el flujo “solo frontend”; tienes que **publicar el API en otro servicio** o el login no podrá validar credenciales.

---

## Comprobar build en local (igual que en Vercel)

```bash
npm run build
```

---

## Opción B — GitHub + Vercel

1. Repo en GitHub con este proyecto (raíz = Next.js).
2. [vercel.com](https://vercel.com) → **Add New Project** → importar el repo.
3. Framework: Next.js (autodetectado). Root: `./`
4. Añadir `NEXT_PUBLIC_API_URL` en Environment Variables.
5. Cada push a la rama principal → deploy a producción (configurable).

---

## Alternativas rápidas

| Opción | Ventaja | Nota |
|--------|---------|------|
| **Vercel** | Nativo para Next.js | Cuenta necesaria |
| **Netlify** | Muy simple | Adapter / config extra para algunas apps Next |
| **Cloudflare Pages** | CDN global | Soporte Next variable |
| **GitHub Pages** | Estático | No aplica a esta app tal cual (SSR/rutas dinámicas) |

---

## English (short)

- Deploy the **repo root** (Next.js). The **`backend/`** folder is not deployed by these steps—host FastAPI elsewhere and set **`NEXT_PUBLIC_API_URL`** to that **https** origin; configure **CORS** for your `*.vercel.app` domain.
- First time: `npm run vercel` or `npx vercel` → then `npm run vercel:prod` (avoid `npm i -g vercel` if you get **EACCES** on macOS).
- Env: `npx vercel env add NEXT_PUBLIC_API_URL` or the Vercel dashboard → Redeploy after changes.
- **Project name** must be **lowercase**, no spaces (e.g. `aria-actinver`). See `vercel.json` in this repo. If setup failed, delete `.vercel` and run `npm run vercel` again. When prompted for multiple services, choose **frontend** only.
