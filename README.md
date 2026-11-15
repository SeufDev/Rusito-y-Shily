# Rusito & Shily · nuestro lugar seguro

Una web privada para los dos: un universo que suma una estrella por día, un jardín que crece con el agua de ambos, una mascota que crían juntos, cartas con candado, notas escondidas, recuerdos, juegos y un rincón de calma.

Pensada con cuidado: nada se muere ni se castiga, no hay rachas que se pierdan, no hay notificaciones, y existe un modo de **movimiento tranquilo** (Ajustes) que además respeta la configuración del sistema.

## Probarla en tu compu

Necesitás [Node.js](https://nodejs.org) (versión LTS). Después:

- **Windows:** doble clic en `iniciar.bat`.
- **Git Bash, Mac o Linux:** `./iniciar.sh`.

Los dos instalan las dependencias la primera vez y abren la web en el navegador (`http://localhost:5173`). A mano sería `npm install` y `npm run dev`.

Sin configurar Supabase arranca en **modo vista previa**: guarda todo en ese navegador. La clave es `nosotros`. Abrí dos pestañas y entrá como Shily en una y como Rusito en la otra para ver cómo se sincroniza.

## Ponerla online (gratis)

### 1. Supabase (la base compartida)
1. Entrá a [supabase.com](https://supabase.com) → **New project** (región São Paulo queda cerca).
2. **SQL Editor** → pegá todo `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers**: desactivá **Allow new users to sign up** (así nadie más puede crear cuenta).
4. **Authentication → Users → Add user → Create new user**: un email cualquiera (por ejemplo `nosotros@rusitoyshily.love`), **la clave de ustedes** y marcá **Auto Confirm User**.
5. **Project Settings → API**: copiá la *Project URL* y la *anon public key*.

### 2. Vercel (la web)
1. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo `Rusito-y-Shily`.
2. En **Environment Variables** cargá:
   - `VITE_SUPABASE_URL` = la Project URL
   - `VITE_SUPABASE_ANON_KEY` = la anon key
   - `VITE_SHARED_EMAIL` = el email del paso 4
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
