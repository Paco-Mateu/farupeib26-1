# Xarxa PK/PD Intelligence Hub
## Del conocimiento clínico a la plataforma digital

---

### Origen del prototipo

Este prototipo surge de la actividad **Networking Lazareto, Proyectos de Innovación**, una iniciativa para promover la colaboración, el intercambio de conocimiento y el desarrollo de proyectos innovadores en el ámbito sanitario, celebrada en el marco de la **10ª Jornada FARUPEIB**, con el patrocinio de AbbVie.

En la sesión se presentaron 14 proyectos de innovación impulsados por profesionales de diferentes hospitales y áreas terapéuticas. Entre ellos, **"Cómo innovar en PK/PD desde la Farmacia Hospitalaria"**, liderado por la **Dra. María Badia, Jefa del Servicio de Farmacia del Hospital Universitari de Bellvitge**, fue seleccionado como proyecto ganador por su capacidad para transformar la forma en que Farmacia Hospitalaria contribuye a las decisiones terapéuticas complejas.

A partir de esta idea, **Francesc Mateu, Principal, Healthcare Industry Solutions at MongoDB**, desarrolló este prototipo como un ejercicio de *art of possible*: una demostración de cómo las tecnologías actuales, la IA generativa, los agentes inteligentes, el desarrollo acelerado y las arquitecturas modernas de datos pueden convertir una visión clínica en una experiencia digital tangible.

El prototipo fue construido en aproximadamente cinco horas como prototipo conceptual, no como producto final. Representa una visión: cómo Farmacia Hospitalaria puede elevar su rol como consultor experto, colaborar de forma más estructurada con Digestivo, Enfermería y Laboratorio, y convertir cada caso PK/PD en conocimiento compartido para la red.

---

### Por qué ahora

Las decisiones terapéuticas basadas en PK/PD son cada vez más relevantes en tratamientos complejos, especialmente en áreas como Crohn, donde la exposición al fármaco, la respuesta clínica, los biomarcadores, la inmunogenicidad y la historia terapéutica deben interpretarse de forma conjunta.

Al mismo tiempo, Farmacia Hospitalaria está evolucionando hacia un rol más consultivo, más clínico y más conectado con equipos multidisciplinares. Los farmacéuticos hospitalarios poseen un conocimiento estructurado único sobre exposición, cinética, interacciones y optimización terapéutica que, con las herramientas adecuadas, puede desplegarse de forma sistemática y colaborativa.

La IA generativa y los agentes inteligentes permiten acelerar esta transformación, no sustituyendo al profesional, sino ayudándole a estructurar información, detectar gaps, coordinar tareas, preparar análisis y documentar recomendaciones. El resultado es que el farmacéutico puede participar de forma activa, visible y trazable en decisiones que antes dependían de consultas informales, correos dispersos o circuitos no sistematizados.

Xarxa PK/PD Intelligence Hub explora cómo podría ser esa nueva forma de trabajar.

---

### Qué demuestra este prototipo

Este prototipo demuestra que una red de profesionales puede convertir la experiencia PK/PD en una plataforma colaborativa de conocimiento clínico, y que construir esa experiencia no requiere meses de desarrollo ni equipos técnicos grandes.

Permite visualizar cómo una solicitud puede transformarse en un caso estructurado, cómo los agentes IA pueden preparar el trabajo, cómo el farmacéutico puede validar y enriquecer la recomendación, cómo el equipo multidisciplinar puede colaborar sobre un mismo objeto clínico y cómo cada caso puede alimentar el aprendizaje de la red.

No es un producto final. Es una demostración de posibilidades: una forma rápida de hacer visible una visión, compartirla con equipos clínicos, presentarla en reuniones y acelerar la conversación sobre el futuro de la Farmacia Hospitalaria como motor de farmacoterapia de precisión.

---

## Si eres farmacéutico y quieres construir algo parecido

Lo que sigue es una guía práctica para profesionales sanitarios sin conocimientos técnicos que quieran crear su propio prototipo digital. No necesitas saber programar. Necesitas conocer bien tu problema clínico y tener disposición para colaborar con herramientas de IA.

---

### Paso 1 — Define el problema clínico con precisión

El punto de partida no es la tecnología. Es el problema.

Antes de abrir ninguna herramienta, dedica tiempo a escribir una descripción clara de lo que quieres resolver. Una o dos páginas son suficientes. Responde estas preguntas:

- **¿Qué decisión clínica está mal soportada hoy?** Por ejemplo: "Cuando Digestivo nos consulta sobre pérdida de respuesta a un biológico, la información llega dispersa en correos, llamadas y papel. No tenemos un circuito estructurado."
- **¿Quiénes participan en esa decisión?** Lista los roles: farmacéutico hospitalario, digestólogo, enfermería EII, laboratorio...
- **¿Qué datos necesitan cada uno para hacer su parte?** Niveles de fármaco, anticuerpos, CRP, calprotectina, historial de dosis, fechas de extracción...
- **¿Qué pasa hoy cuando algo falla?** Datos incompletos, decisiones retrasadas, pérdida de trazabilidad, duplicación de trabajo...
- **¿Cómo sería el flujo ideal?** Describe el proceso paso a paso: quién hace qué, en qué orden, qué queda documentado.

Este documento es tu brief clínico. Es lo más valioso que vas a aportar al proyecto, y ninguna tecnología puede sustituirlo.

---

### Paso 2 — Convierte el brief clínico en una historia de usuario

Con tu descripción del problema, ahora necesitas transformarlo en algo que una herramienta de IA pueda entender y construir. Esto se llama "historia de usuario" y es muy sencillo:

> "Como farmacéutico hospitalario, cuando recibo una solicitud de revisión PK/PD de Digestivo, quiero tener una pantalla donde pueda ver todos los datos del paciente, los gaps de información que faltan, las tareas asignadas a cada profesional y una interpretación preliminar de los niveles, para poder preparar mi recomendación sin tener que buscar la información en varios sistemas."

Cuanto más específico eres, mejor será el resultado. Incluye:

- El nombre de cada pantalla o sección que necesitas
- Los datos que deben aparecer en cada pantalla
- Las acciones que puede hacer el usuario
- Las reglas del negocio clínico (por ejemplo: "si faltan niveles de fármaco, el caso no puede pasar a revisión")

No te preocupes si no suena técnico. La IA lo traducirá.

---

### Paso 3 — Elige tus herramientas (explicadas sin tecnicismos)

Estas son las herramientas que usamos en este proyecto. Todas tienen versión gratuita o de bajo coste:

**Claude (claude.ai) o ChatGPT (chatgpt.com)**
Tu "desarrollador virtual". Le describes lo que quieres en lenguaje natural y él escribe el código. No necesitas entender el código, solo saber si hace lo que describiste cuando lo pruebas en el navegador.

**Cursor (cursor.com)**
Un editor de código con IA integrada. Es como tener a un desarrollador experto sentado a tu lado que escribe mientras tú describes. Alternativa más potente al simple chat. Si quieres ir más allá del chat básico, este es el siguiente paso.

**Next.js**
El framework que crea la aplicación web. Piensa en él como la estructura de un edificio: define cómo se organizan las páginas, cómo se comunican entre sí y cómo se conectan al servidor. No necesitas entenderlo en profundidad; la IA lo configura por ti.

**MongoDB Atlas (mongodb.com/atlas)**
La base de datos donde viven tus datos clínicos. Tiene versión gratuita que es suficiente para un prototipo. No requiere instalación: funciona en la nube. Lo que almacena puede ser tan flexible como un documento Word estructurado: casos clínicos, determinantes, tareas, eventos, recomendaciones.

**Vercel (vercel.com)**
El servicio donde publicas tu aplicación. Es como subir un archivo a Google Drive, pero en lugar de un documento, subes tu aplicación web y queda accesible con una URL pública. Tiene versión gratuita para proyectos pequeños.

**GitHub (github.com)**
Donde guardas y versionas tu código. Es como el historial de revisiones de un documento Word, pero para código. Permite colaborar con otros y deshacer cambios si algo va mal. Vercel se conecta directamente a GitHub y actualiza la app automáticamente cuando guardas cambios.

---

### Paso 4 — El desarrollo acelerado asistido por IA (qué es el "vibe coding")

El "vibe coding" o desarrollo acelerado asistido por IA es una técnica de construcción de software en la que no escribes código tú mismo, sino que describes lo que quieres y dejas que una herramienta de IA lo escriba por ti.

No es magia, y no es improvisado. Es una forma de trabajo iterativa y supervisada:

1. **Describes lo que quieres** en lenguaje natural: "Necesito una página con una lista de casos clínicos. Cada caso muestra el nombre del paciente, el estado del pipeline, el tipo de consulta y cuántos días lleva abierto. Debe poder filtrarse por estado y por tipo."

2. **La IA escribe el código** y te lo muestra. Puedes copiarlo, pegarlo y verlo en funcionamiento casi inmediatamente.

3. **Lo pruebas** en tu navegador. ¿Tiene el aspecto que querías? ¿Los datos aparecen correctamente? ¿Las acciones funcionan?

4. **Ajustas en lenguaje natural**: "El botón de filtro es demasiado pequeño. El estado debería aparecer como un chip de color, no como texto. Quiero que al hacer clic en un caso abra un panel lateral."

5. **Repites** hasta que el resultado se parece a lo que tenías en mente.

Este proceso requiere paciencia y criterio clínico, no habilidades técnicas. La herramienta de IA comete errores, especialmente en lógica de negocio clínica. Tu valor está precisamente en detectar esos errores: sabes cuándo una interpretación PK/PD no tiene sentido, aunque no sepas por qué el código que la genera está mal.

---

### Paso 5 — La arquitectura del proyecto (sin tecnicismos)

Para que entiendas cómo están conectadas las piezas de este prototipo:

```
Navegador del usuario
        ↓
   Aplicación web (Next.js)
     - Páginas y componentes visuales
     - Lo que el usuario ve y hace
        ↓
   Servidor de lógica (FastAPI / Python)
     - Las reglas de negocio clínico
     - Los agentes IA
     - Las integraciones con OpenAI
        ↓
   Base de datos (MongoDB Atlas)
     - Casos clínicos
     - Determinantes
     - Tareas y eventos
     - Recomendaciones e informes
```

También hay una conexión directa entre la aplicación web y el servidor de IA (OpenAI), que es la que permite:
- Extraer datos clínicos de un correo o texto libre
- Generar un borrador de recomendación
- Detectar gaps de información
- Estructurar un caso nuevo

**Lo que necesitas entender como farmacéutico**: el dato clínico entra como texto no estructurado (un correo, una nota), la IA lo estructura en campos concretos (tipo de consulta, medicamento, dosis, determinantes solicitados, historia relevante), y ese dato estructurado es el que alimenta el workflow, las tareas y la interpretación posterior.

---

### Paso 6 — Construye tu primer prototipo: itinerario concreto

#### Semana 1 — Define y documenta (sin ordenador)

- Escribe el brief clínico (1-2 páginas)
- Dibuja en papel las pantallas principales que necesitas (no hace falta que sean bonitas)
- Lista los datos que aparecen en cada pantalla
- Describe los flujos: qué hace el usuario en cada paso, qué pasa después

#### Semana 2 — Configura las herramientas

1. Crea una cuenta en [Claude.ai](https://claude.ai) (plan Pro, ~20€/mes) o [ChatGPT](https://chatgpt.com) (plan Plus)
2. Crea una cuenta en [GitHub](https://github.com) (gratuito)
3. Crea una cuenta en [MongoDB Atlas](https://mongodb.com/atlas) (gratuito para empezar)
4. Crea una cuenta en [Vercel](https://vercel.com) (gratuito para proyectos pequeños)
5. Descarga [Cursor](https://cursor.com) o usa [VS Code](https://code.visualstudio.com) (gratuitos)

No te preocupes si alguno de estos pasos te parece complejo. Claude puede guiarte paso a paso.

#### Semana 3 — El primer prototipo funcional

Describe a Claude exactamente esto:

> "Quiero construir una aplicación web sencilla con Next.js para gestionar casos de consulta PK/PD en Farmacia Hospitalaria. La aplicación debe tener: (1) una página principal con una lista de casos que muestre nombre del paciente, tipo de consulta, estado y fecha; (2) un formulario para crear un nuevo caso con los campos [lista tus campos]; (3) una página de detalle de caso que muestre toda la información y permita añadir notas. Usa MongoDB Atlas como base de datos. Hazlo lo más sencillo posible para empezar."

Claude te dará el código. Pégalo en Cursor o VS Code. Sigue las instrucciones para arrancar la aplicación localmente.

#### Semana 4 — Añade la inteligencia clínica

Una vez que tienes la base funcionando, añade la IA:

> "Quiero añadir una función que, cuando pegue el texto de un correo de solicitud de revisión PK/PD, use la API de OpenAI para extraer automáticamente: el nombre del paciente, el medicamento, la dosis actual, los determinantes solicitados y el motivo de consulta. Muéstrame los datos extraídos para que pueda confirmarlos antes de crear el caso."

Esta es la primera integración real de IA. A partir de aquí puedes ir añadiendo capas: detección de gaps, interpretación preliminar, borrador de recomendación.

#### Semana 5 — Despliega y muéstralo

Con tu prototipo funcionando localmente, es hora de publicarlo:

1. Sube el código a GitHub (Claude puede guiarte)
2. Conecta tu repositorio de GitHub a Vercel (se hace en 3 clics)
3. Vercel publica la aplicación automáticamente con una URL pública
4. Comparte esa URL con tu equipo clínico

Ahora tienes algo tangible que mostrar en una reunión, que funciona de verdad, y que cualquier profesional puede usar desde su navegador sin instalar nada.

---

### Paso 7 — Valida con el equipo clínico

La tecnología ya está hecha. Ahora empieza el trabajo más importante: validar que resuelve el problema real.

Muestra el prototipo a las personas que lo usarían: el digestólogo que envía las consultas, la enfermería EII que coordina las extracciones, el farmacéutico que revisa los casos.

Hazte estas preguntas con ellos:
- ¿Tiene sentido este flujo tal como está?
- ¿Falta algún dato importante?
- ¿Qué cambiarías para que lo usaras en tu día a día?
- ¿Qué parte te genera más confianza? ¿Cuál menos?

Cada conversación de 30 minutos con un usuario real vale más que horas de refinamiento técnico.

---

### Paso 8 — Itera y abre la conversación estratégica

Tu prototipo no es el producto final. Es una herramienta de conversación.

Úsalo para:
- **Alinear la visión clínica** con tu equipo y con la dirección del hospital
- **Presentar en jornadas y reuniones** de manera tangible, no solo con diapositivas
- **Atraer recursos** (financiación, tiempo de TI, partners tecnológicos)
- **Explorar el modelo de red** con otros hospitales que enfrentan el mismo problema
- **Iterar rápido** sobre los workflows antes de comprometerse con un desarrollo mayor

Un prototipo funcional cambia completamente la conversación. En lugar de hablar de ideas abstractas, hablas de una experiencia concreta. Eso acelera las decisiones y alinea a los equipos mucho más rápido.

---

### El stack tecnológico de este proyecto, explicado

Para quienes quieran entender en más detalle qué hay debajo:

| Componente | Tecnología | Qué hace |
|---|---|---|
| Aplicación web | **Next.js 14** | El framework que construye las páginas y las conecta al servidor |
| Estilos visuales | **Tailwind CSS v4** | El sistema de diseño que da aspecto profesional al interfaz |
| Componentes UI | **shadcn/ui** | Librería de componentes visuales reutilizables |
| Animaciones | **Framer Motion** | Transiciones y efectos visuales fluidos |
| Iconos | **Lucide React** | Librería de iconos vectoriales |
| Servidor de lógica | **FastAPI (Python)** | El backend que procesa las reglas de negocio y los agentes |
| IA generativa | **OpenAI GPT-4.1** | El modelo que extrae, interpreta y genera texto clínico |
| Base de datos | **MongoDB Atlas** | Base de datos flexible para datos clínicos no estructurados |
| Hosting web | **Vercel** | Publicación automática desde GitHub |
| Versionado de código | **GitHub** | Historial y colaboración de código |

**¿Por qué MongoDB para datos clínicos?**
Los datos clínicos son por naturaleza irregulares: un caso puede tener 3 determinantes o 12; una consulta puede incluir historia de inmunogenicidad o no; el número de tareas varía según el tipo de caso. MongoDB almacena documentos flexibles (parecidos a archivos JSON) que se adaptan a esta variabilidad sin necesidad de definir una estructura rígida de antemano. Eso lo hace ideal para prototipar rápido y para escalar después a modelos de datos más complejos.

---

### ¿Cuánto tiempo y dinero se necesita?

Para un prototipo funcional como el de este proyecto:

**Tiempo:**
- Brief clínico y diseño en papel: 3-5 horas
- Configuración de herramientas: 2-3 horas (una sola vez)
- Desarrollo del prototipo base: 8-15 horas con asistencia de IA
- Refinamiento e iteración con el equipo: 5-10 horas
- **Total estimado**: 20-30 horas, distribuidas en 2-4 semanas

**Coste mensual durante el desarrollo:**
- Claude Pro o ChatGPT Plus: ~20€/mes
- MongoDB Atlas (tier gratuito): 0€
- Vercel (tier gratuito): 0€
- GitHub (tier gratuito): 0€
- **Total**: ~20€/mes

Lo que este proyecto requiere no es presupuesto técnico. Requiere tiempo clínico para definir bien el problema y capacidad de iteración con el equipo.

---

### Qué es el desarrollo acelerado asistido por IA: una nota sobre el proceso de creación

Este prototipo fue construido usando técnicas de **desarrollo acelerado asistido por IA**, incluyendo métodos de vibe coding, generación asistida de código y diseño iterativo con modelos de lenguaje de gran escala.

El proceso consistió en:
1. Definir el problema clínico y la arquitectura de la solución
2. Describir en lenguaje natural cada componente, pantalla y flujo de trabajo
3. Usar Claude como asistente de desarrollo para escribir el código
4. Revisar, probar y ajustar de forma iterativa
5. Integrar la lógica clínica (gaps, interpretación PK/PD, agentes) en el backend

Este enfoque permite pasar de una idea clínica a un prototipo funcional en horas, no en meses. No produce un producto de producción listo para hospitales, pero produce algo suficientemente real para alinear visiones, presentar propuestas y acelerar la conversación con equipos técnicos y de gestión.

La tecnología cambia rápidamente. Lo que hoy requiere 5 horas de vibe coding, mañana puede requerir 2. Lo que no cambia es la necesidad de un profesional clínico que sepa exactamente qué problema resolver.

---

### Recursos para empezar

- **Claude**: [claude.ai](https://claude.ai) — empieza aquí para asistencia de desarrollo
- **Cursor**: [cursor.com](https://cursor.com) — editor de código con IA integrada
- **MongoDB Atlas**: [mongodb.com/atlas](https://mongodb.com/atlas) — base de datos gratuita para prototipos
- **Vercel**: [vercel.com](https://vercel.com) — hosting gratuito para proyectos web
- **GitHub**: [github.com](https://github.com) — versionado y colaboración de código
- **Next.js**: [nextjs.org](https://nextjs.org) — framework de aplicaciones web
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com) — sistema de diseño para interfaces

Para cualquier consulta sobre cómo replicar este proyecto o adaptarlo a tu contexto clínico, el punto de contacto es:

**Francesc Mateu**
Principal, Healthcare Industry Solutions at MongoDB
[francesc.mateu@mongodb.com](mailto:francesc.mateu@mongodb.com)

---

### Notas técnicas del repositorio

Esta sección es para quienes trabajan directamente con el código.

**Estructura del repositorio:**
- `app/` — Frontend Next.js (App Router)
- `backend/` — FastAPI backend con servicios y rutas
- `components/` — Componentes React reutilizables
- `data/` — Datos raw, procesados y sintéticos
- `docs/briefs/` — Documentación clínica y de producto

**Rutas principales:**
| Ruta | Portal | Descripción |
|---|---|---|
| `/` | Landing | Presentación del prototipo |
| `/pro` | Profesional | Portal de escritorio completo |
| `/app` | Paciente/móvil | Portal móvil (reservado para fases futuras) |

**Variables de entorno necesarias:**
```
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=proto1
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4.1-mini
```

**Arrancar en local:**
```bash
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm run demo:start
```

**Reglas de seguridad no negociables:**
- Nunca commitear `.env`, `.env.local`, `.vercel/` ni claves reales
- Solo commitear `.env.example` con placeholders
- Ejecutar `npm run security:check` antes de cada push
