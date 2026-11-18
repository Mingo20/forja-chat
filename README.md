<div align="center">

<img src="https://raw.githubusercontent.com/Mingo20/dtech/main/assets/brand/dg-logo-512.png" width="84" alt="DGTech" />

# Forja

**Agente conversacional que construye aplicaciones completas bajo demanda a partir de ideas del usuario.**

![Versión](https://img.shields.io/badge/versión-2.0.0-FF6A13?style=flat-square) ![Estado](https://img.shields.io/badge/estado-Producción-2EA44F?style=flat-square) ![Tipo](https://img.shields.io/badge/tipo-PWA-0B2545?style=flat-square) ![DGTech](https://img.shields.io/badge/by-DGTech-FF6A13?style=flat-square)

[**Abrir la aplicación**](https://mingo20.github.io/forja-chat/) · [Hub DGTech](https://mingo20.github.io/dtech/) · [Guía para agentes](AGENTS.md) · [Cambios](CHANGELOG.md)

<img src="https://raw.githubusercontent.com/Mingo20/dtech/main/assets/shots/forja.jpg" alt="Forja" width="720" />

</div>

## El problema

Crear una app exige conocimientos técnicos que la mayoría de los emprendedores no tiene.

## Qué hace

- Chat para describir la app que se quiere
- Ideas sugeridas por sector: servicios, tiendas, educación y finanzas
- Panel de proyectos y apps forjadas
- Demo de barbería incluida

## Cómo está construido

**Tipo:** PWA

Interfaz de chat que llama a una API de generación y lista los proyectos creados.

**Tecnologías**

- JavaScript sin frameworks (api.js, app.js, icons.js)
- Service Worker (forja-pwa-v2.0.0)

**Backend**

- Definido en api.js

**Datos**

- Proyectos forjados

## Datos sensibles

Ideas y proyectos del usuario.

## Reglas del proyecto

- Cada app generada debe ser instalable como PWA

## Pendientes conocidos

- Documentar el contrato de api.js

## Estructura del repositorio

Consulta [AGENTS.md](AGENTS.md) para el mapa de archivos y las instrucciones de trabajo.

## Parte de DGTech

Este proyecto forma parte del ecosistema **DGTech**, un estudio de software dominicano que construye aplicaciones instalables para resolver problemas reales. Todas las aplicaciones están en [https://mingo20.github.io/dtech/](https://mingo20.github.io/dtech/).

---

<sub>© 2026 DGTech · Domingo Guerra · Todos los derechos reservados. Consulta el archivo NOTICE.</sub>
