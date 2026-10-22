/**
 * Capa API para Forja PWA
 * Permite la conexión a un backend real (Deno) por fetch o activa el motor local simulado (Modo Demo).
 */

const STORAGE_KEY_CONFIG = 'forja_api_config';

const defaultConfig = {
  backendUrl: '', // URL configurable en Ajustes (ej. https://api.forja.dev/v1)
  demoMode: true,  // Por defecto activo en esta 1ra versión
  agentName: 'Forja'
};

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  } catch (e) {
    return defaultConfig;
  }
}

function saveConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error guardando config:', e);
  }
}

const currentConfig = loadConfig();

window.ForjaAPI = {
  getConfig() {
    return { ...currentConfig };
  },

  updateConfig(newPartialConfig) {
    Object.assign(currentConfig, newPartialConfig);
    saveConfig(currentConfig);
  },

  /**
   * Envía un mensaje al agente (backend Deno o motor simulado)
   * @param {string} userMessage - Mensaje enviado por el usuario
   * @param {Array} history - Historial de la conversación
   * @param {Object} extraContext - Contexto adicional (ej: opción elegida de chips o aprobación)
   * @returns {Promise<Object>} Respuesta del agente estructurada en bloques JSON
   */
  async enviarMensaje(userMessage, history = [], extraContext = {}) {
    // Si hay una URL de backend válida y el modo demo está desactivado, intentar fetch real
    if (currentConfig.backendUrl && !currentConfig.demoMode) {
      try {
        const response = await fetch(`${currentConfig.backendUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            history: history,
            context: extraContext
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data; // Debería cumplir la estructura { text, statusState, blocks: [...] }
        } else {
          console.warn('Backend Deno devolvió error status:', response.status, '- usando fallback simulado.');
        }
      } catch (err) {
        console.warn('No se pudo conectar al backend real:', err, '- activando modo demo local.');
      }
    }

    // MODO DEMO LOCAL SIMULADO (Reglas simples para flujo interactivo completo)
    return await responderModoDemo(userMessage, history, extraContext);
  }
};

/**
 * Motor local simulado que demuestra el flujo completo de construcción de apps en Forja
 */
async function responderModoDemo(userMessage, history, extraContext) {
  // Simular pequeña latencia natural del agente (400ms - 800ms)
  await new Promise(resolve => setTimeout(resolve, 600));

  const msgLower = (userMessage || '').toLowerCase();
  const contextType = extraContext.actionType || '';

  // CASO 1: Aprobación del Plan de Construcción
  if (contextType === 'approve_plan' || msgLower.includes('aceptar') || msgLower.includes('dale pa') || msgLower.includes('construir')) {
    const appTitle = extraContext.appName || 'App Barbería VIP';
    return {
      statusState: 'trabajando',
      statusText: `Armando tu app '${appTitle}'...`,
      blocks: [
        {
          type: 'text',
          content: `¡Nítido! Manos a la obra. Ya arranqué a forjar la estructura de **${appTitle}**.`
        },
        {
          type: 'project_card',
          id: 'proj_' + Date.now(),
          name: appTitle,
          status: 'En progreso',
          progress: 25,
          updated: 'Ahora mismo'
        },
        {
          type: 'step_list',
          id: 'steps_1',
          steps: [
            { id: 1, title: 'Generando maquetación PWA responsiva', status: 'done' },
            { id: 2, title: 'Configurando persistencia con LocalStorage', status: 'active' },
            { id: 3, title: 'Instalando motor de reservación de citas', status: 'pending' },
            { id: 4, title: 'Desplegando en servidor en vivo (GitHub Pages)', status: 'pending' }
          ]
        }
      ]
    };
  }

  // CASO 2: Rechazo o ajuste del plan
  if (contextType === 'reject_plan' || msgLower.includes('rechazar') || msgLower.includes('cambiar algo')) {
    return {
      statusState: 'reposo',
      statusText: 'Esperando tus ajustes...',
      blocks: [
        {
          type: 'text',
          content: 'Tranquilo, sin estrés. Dime qué detalle o función quieres cambiar y lo ajustamos de una vez antes de empezar.'
        },
        {
          type: 'quick_chips',
          options: ['Cambiar colores de marca', 'Agregar módulo de productos', 'Simplificar formulario', 'Empezar de cero']
        }
      ]
    };
  }

  // CASO 3: El usuario pide una app nueva o selecciona una idea
  if (msgLower.includes('barberia') || msgLower.includes('barbería') || msgLower.includes('citas') ||
      msgLower.includes('colmado') || msgLower.includes('inventario') || msgLower.includes('gastos') ||
      msgLower.includes('tienda') || msgLower.includes('quiero una app') || msgLower.includes('crear app') ||
      msgLower.includes('construir app') || msgLower.includes('idea')) {

    let appName = 'Barbería El Boli';
    if (msgLower.includes('colmado')) appName = 'Colmado Express';
    if (msgLower.includes('gastos')) appName = 'Gestor de Gastos Quisqueya';
    if (msgLower.includes('tienda')) appName = 'Tienda Instagram RD';

    return {
      statusState: 'pensando',
      statusText: 'Analizando requisitos...',
      blocks: [
        {
          type: 'text',
          content: `¡Dime a ver! Me parece excelente idea armar una **${appName}**. Para que quede dura como te gusta, respóndeme estas dos cosas:`
        },
        {
          type: 'text',
          content: `1️⃣ **¿Cómo prefieres gestionar la información?**\n2️⃣ **¿Qué funciones principales le metemos?**`
        },
        {
          type: 'quick_chips',
          options: [
            'Citas + Registro de Clientes',
            'Catálogo con Carrito WhatsApp',
            'Control de Ventas y Fiado',
            'Suscripciones y Pagos en línea'
          ]
        }
      ]
    };
  }

  // CASO 4: Selección de opción rápida (Chip) -> Entrega el Plan de Aprobación
  if (contextType === 'select_option' || msgLower.includes('citas') || msgLower.includes('catálogo') || msgLower.includes('control') || msgLower.includes('suscripciones')) {
    const selectedOption = userMessage;
    return {
      statusState: 'pensando',
      statusText: 'Diseñando el plan de la app...',
      blocks: [
        {
          type: 'text',
          content: `¡Anotado! Opción seleccionada: **${selectedOption}**.\nEstructuré el plan técnico para la app. Revisa los detalles y confirma para forjarla:`
        },
        {
          type: 'approval_card',
          id: 'appr_plan_01',
          appName: 'Barbería VIP PWA',
          title: 'Plan de Construcción: Barbería VIP PWA',
          description: 'Aplicación PWA ultra rápida con módulo de agenda de citas, gestión de servicios y contacto directo por WhatsApp.',
          details: [
            '📱 Layout PWA listo para instalar en celular o PC',
            '📅 Calendario interactivo de citas por barbero',
            '💾 Guardado local en el navegador (LocalStorage)',
            '🚀 Despliegue automático en GitHub Pages'
          ],
          status: 'pending'
        }
      ]
    };
  }

  // CASO 5: Saludo o mensaje general
  return {
    statusState: 'reposo',
    statusText: 'Listo pa\' construir',
    blocks: [
      {
        type: 'text',
        content: `¡Dime a ver, mi hermano! Soy **${currentConfig.agentName}**, tu compañero de código. Puedo armarte una app completa desde cero en minutos.\n\nPrueba pidiéndome algo como:\n• *"Quiero una app para mi barbería"* \n• *"Construye un control de inventario para mi colmado"* \n• O selecciona una idea sugerida en la pestaña **Ideas**.`
      },
      {
        type: 'quick_chips',
        options: [
          'Quiero una app para mi barbería',
          'App de Inventario para Colmado',
          'Gestor de Cuentas y Gastos',
          'Ver sugerencias en Ideas'
        ]
      }
    ]
  };
}
