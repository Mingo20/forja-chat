# AGENTS.md · Forja

Guía para agentes de IA y para personas que necesiten modificar este proyecto. Léela completa antes de tocar el código.

## Contexto

- **Organización:** DGTech (República Dominicana). Fundador: Domingo Guerra.
- **Proyecto:** Forja · versión actual **2.0.0** · estado **Producción**.
- **Repositorio:** `Mingo20/forja-chat`
- **Aplicación en vivo:** https://mingo20.github.io/forja-chat/
- **Hub del ecosistema:** https://mingo20.github.io/dtech/
- **Idioma de la interfaz y de las respuestas:** español dominicano.

## Qué resuelve

Crear una app exige conocimientos técnicos que la mayoría de los emprendedores no tiene.

## Resumen técnico

**Tipo:** PWA

Interfaz de chat que llama a una API de generación y lista los proyectos creados.

**Stack**

- JavaScript sin frameworks (api.js, app.js, icons.js)
- Service Worker (forja-pwa-v2.0.0)

**Backend**

- Definido en api.js

**Datos**

- Proyectos forjados

## Reglas que no se pueden romper

- Cada app generada debe ser instalable como PWA

## Datos sensibles

Ideas y proyectos del usuario.

## Cómo trabajar aquí

1. Lee el README y este archivo. Luego abre el código que vayas a cambiar.
2. Haz el cambio más pequeño que resuelva el problema. No reescribas lo que funciona.
3. Prueba en el navegador antes de dar algo por terminado: abre la aplicación, recorre el flujo afectado y revisa la consola.
4. Si la app tiene Service Worker, **sube el número de la caché** al cambiar archivos, o los usuarios seguirán viendo la versión vieja.
5. Registra cada cambio en `CHANGELOG.md` con la versión, la fecha y una línea clara.
6. Sube la versión según la regla: *mayor* si rompes algo, *menor* si añades una función, *parche* si corriges un error.

## Reglas de seguridad

- **Nunca** escribas contraseñas, tokens, claves de API ni PIN en el código, en los README ni en los mensajes de commit. Este repositorio es público.
- Las claves van como secretos del backend. En el navegador solo puede haber datos públicos.
- Si encuentras una credencial expuesta, avisa al dueño y recomienda rotarla antes de seguir.
- No borres datos de producción sin confirmación explícita del dueño.

## Pendientes conocidos

- Documentar el contrato de api.js

## Estilo

- Textos para el usuario en español dominicano, claros y cordiales.
- Horas en formato de 12 horas (9:45 p. m.). Fechas con el mes en letras.
- Diseño limpio, rápido y pensado primero para el celular.

## Contacto

Domingo Guerra · DGTech · WhatsApp 829-646-9885
