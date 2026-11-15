# Rusito & Shily · nuestro lugar seguro

Una web privada para los dos: un universo que suma una estrella por día, un jardín que crece con el agua de ambos, una mascota que crían juntos, cartas con candado, notas escondidas, recuerdos, juegos y un rincón de calma.

Pensada con cuidado: nada se muere ni se castiga, no hay rachas que se pierdan, no hay notificaciones, y existe un modo de **movimiento tranquilo** (Ajustes) que además respeta la configuración del sistema.

## Probarla en tu compu

Necesitás [Node.js](https://nodejs.org) (versión LTS). Después:

- **Windows:** doble clic en `iniciar.bat`.
- **Git Bash, Mac o Linux:** `./iniciar.sh`.

Los dos instalan las dependencias la primera vez y abren la web en el navegador (`http://localhost:5173`). A mano sería `npm install` y `npm run dev`.

Sin configurar Supabase arranca en **modo vista previa**: guarda todo en ese navegador. Las claves son `shily` y `rusito`.

## Música

El reproductor (abajo a la derecha) lee solo los archivos de `src/audios`:

- `src/audios/shily/` → lista de Shily
- `src/audios/rusito/` → lista de Rusito
- mp3 sueltos en `src/audios/` → aparecen en las dos listas

Si la web está abierta con `iniciar.bat`, las canciones nuevas aparecen al instante. Para que lleguen a la web publicada, hay que subirlas a GitHub (si el repo es privado, mejor). Si el archivo trae título, artista y tapa del disco, se muestran; si no, se usa el nombre del archivo (`Artista - Canción.mp3`).

## Ponerla online (gratis)

### 1. Supabase (la base compartida)
1. Entrá a [supabase.com](https://supabase.com) → **New project** (región São Paulo queda cerca).
2. **Authentication → Sign In / Providers**: desactivá **Allow new users to sign up** (así nadie más puede crear cuenta).
3. **Authentication → Users → Add user → Create new user**, dos veces, marcando **Auto Confirm User**:
   - la cuenta de Shily (por ejemplo `shily@rusitoyshily.love`) con **su** clave,
   - la cuenta de Rusito (por ejemplo `rusito@rusitoyshily.love`) con **tu** clave.
4. **SQL Editor** → pegá todo `supabase/schema.sql`, cambiá los dos emails marcados con ← por los del paso 3 → **Run**.
   Con esto cada uno solo puede escribir a su nombre: nadie puede regar, responder ni escribir cartas haciéndose pasar por el otro.
5. **Project Settings → API**: copiá la *Project URL* y la *anon public key*.

### 2. Vercel (la web)
1. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo `Rusito-y-Shily`.
2. En **Environment Variables** cargá:
   - `VITE_SUPABASE_URL` = la Project URL
   - `VITE_SUPABASE_ANON_KEY` = la anon key
   - `VITE_EMAIL_SHILY` y `VITE_EMAIL_RUSITO` = los emails del paso 3
3. **Deploy**. Cada vez que se sube algo a GitHub se actualiza sola.

Para correrla en tu compu conectada a Supabase, copiá `.env.example` como `.env.local` y completalo.

## Cómo está armada

- `src/pages/` una sección por archivo: `Home`, `Universe`, `Garden`, `Pet`, `Letters`, `Memories`, `Together`, `Calm`, `Settings`.
- `src/lib/content.ts` todo el catálogo: plantas, mascotas, ropita, preguntas del día, ideas de citas, vales. Para sumar cosas, se agregan acá.
- `src/lib/game.ts` reglas del jardín, la mascota, las semillas y los logros.
- `src/lib/store.tsx` + `backend.ts` guardan todo en una sola tabla `items` (con `kind` y `data`), así un universo nuevo no necesita tocar la base.
- Las cartas con palabra secreta se cifran en el navegador (AES-GCM): ni mirando la base se pueden leer sin la palabra.

## Créditos de arte

- Emojis animados: [Noto Emoji Animation](https://googlefonts.github.io/noto-emoji-animation/) de Google, licencia CC BY 4.0.
- Ilustraciones 3D: [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) de Microsoft, licencia MIT.
- Íconos: [Lucide](https://lucide.dev). Tipografías: Fraunces y Nunito.
