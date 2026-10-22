/**
 * FORJA PWA - CAPA API Y MOTOR DEMO CON ONBOARDING GUIADO (v2.0.0)
 * Maneja conexión con backend Deno o flujo local inteligente con entrevista de briefing.
 */

const STORAGE_KEY_CONFIG = 'forja_api_config_v2';

const defaultConfig = {
  backendUrl: '', // Configurable en Ajustes (ej. https://api.forja.dev/v1)
  demoMode: true,
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

  async enviarMensaje(userMessage, history = [], extraContext = {}) {
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
          return await response.json();
        }
      } catch (err) {
        console.warn('Backend no disponible, ejecutando motor demo:', err);
      }
    }

    return await responderModoDemo(userMessage, history, extraContext);
  }
};

/**
 * Preguntas predeterminadas del Onboarding (1 al 8)
 */
const ONBOARDING_STEPS = [
  {
    step: 1,
    id: 'rubro',
    title: 'Tipo de negocio o rubro',
    question: '1️⃣ **¿Para qué tipo de negocio o actividad es la app?**',
    chips: ['Barbería / Salón', 'Colmado / Tienda / POS', 'Escuela / Cursos', 'Restaurante / Menú', 'Consultorio / Salud', 'Prefiero describirlo todo en un mensaje']
  },
  {
    step: 2,
    id: 'objetivo',
    title: 'Objetivo principal',
    question: '2️⃣ **¿Cuál es el objetivo principal y qué quieres automatizar?**',
    chips: ['Reservar citas y agendas', 'Vender productos y carrito WhatsApp', 'Cobros, fiados e inventario', 'Gestión de estudiantes y notas', 'Atender clientes y mensajes']
  },
  {
    step: 3,
    id: 'usuarios',
    title: 'Usuarios y roles',
    question: '3️⃣ **¿Quiénes usarán la app y cuántos usuarios esperas?**',
    chips: ['Solo yo (1 admin)', 'Equipo pequeño (2-5 personas)', 'Clientes + Admin (hasta 100 usuarios)', 'Público general (>500 usuarios)']
  },
  {
    step: 4,
    id: 'funciones',
    title: 'Funciones imprescindibles',
    question: '4️⃣ **¿Qué funciones imprescindibles debe incluir?** (Elige varias o escribe)',
    chips: ['Calendario de citas', 'Catálogo con fotos', 'Inventario y alertas', 'Control de caja y fiados', 'Reportes y gráficos', 'Confirmación por WhatsApp', 'Listo con estas']
  },
  {
    step: 5,
    id: 'estilo',
    title: 'Estilo y colores',
    question: '5️⃣ **¿Cómo quieres que se vea la app?** (Estilo visual y colores)',
    chips: ['Azul moderno y limpio', 'Oscuro VIP elegante', 'Verde eco fresco', 'Cálido y acogedor', 'Usar logo de mi marca']
  },
  {
    step: 6,
    id: 'integraciones',
    title: 'Pagos, WhatsApp y notificaciones',
    question: '6️⃣ **¿Necesitas integración con pagos, WhatsApp o notificaciones?**',
    chips: ['WhatsApp directo + Notificaciones', 'Cobro con tarjeta y transferencia', 'Solo WhatsApp', 'Solo guardado local por ahora', 'Todas las anteriores']
  },
  {
    step: 7,
    id: 'idioma_moneda',
    title: 'Idioma y moneda',
    question: '7️⃣ **¿En qué país/moneda se utilizará?**',
    chips: ['RD$ DOP (República Dominicana)', 'US$ USD (Estados Unidos)', '€ EUR (Europa)', 'Mex$ MXN (México)']
  },
  {
    step: 8,
    id: 'notas',
    title: 'Notas adicionales',
    question: '8️⃣ **¿Algo más que quieras agregar sobre tu proyecto antes de forjarlo?**',
    chips: ['Todo claro, ¡forja la app!', 'Agregar módulo de clientes frecuentes', 'Sin notas adicionales']
  }
];

/**
 * Motor inteligente con flujo de entrevista de Onboarding y simulación
 */
async function responderModoDemo(userMessage, history, extraContext) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const msgLower = (userMessage || '').toLowerCase();
  const actionType = extraContext.actionType || '';
  let onboarding = extraContext.onboardingState || { active: false, step: 0, brief: {} };

  // CASO A: Acción directa de Aceptar Brief -> Inicia construcción
  if (actionType === 'accept_brief') {
    const brief = extraContext.brief || onboarding.brief || {};
    const appTitle = brief.rubro ? `App ${brief.rubro}` : 'App Personalizada PWA';

    return {
      statusState: 'trabajando',
      statusText: `Forjando '${appTitle}'...`,
      onboardingComplete: true,
      blocks: [
        {
          type: 'text',
          content: `¡Nítido! Brief confirmado. Arranqué a forjar tu app **${appTitle}** basada en tus especificaciones exactas.`
        },
        {
          type: 'project_card',
          id: 'proj_' + Date.now(),
          name: appTitle,
          status: 'En construcción',
          progress: 30,
          updated: 'Ahora mismo',
          brief: brief
        },
        {
          type: 'step_list',
          id: 'steps_build',
          steps: [
            { id: 1, title: 'Generando maquetación responsiva PWA', status: 'done' },
            { id: 2, title: `Configurando reglas para ${brief.rubro || 'negocio'}`, status: 'active' },
            { id: 3, title: `Módulo de funciones: ${(brief.funciones || []).slice(0, 2).join(', ') || 'General'}`, status: 'pending' },
            { id: 4, title: 'Despliegue y enlace listo', status: 'pending' }
          ]
        }
      ]
    };
  }

  // CASO B: Usuario pide ajustar el brief
  if (actionType === 'adjust_brief') {
    return {
      statusState: 'reposo',
      statusText: 'Ajustando el Brief...',
      onboardingState: onboarding,
      blocks: [
        {
          type: 'text',
          content: 'Tranquilo, mi hermano. ¿Qué dato o detalle del brief quieres cambiar? Dime y lo actualizo de una vez.'
        },
        {
          type: 'quick_chips',
          options: ['Cambiar rubro/negocio', 'Agregar más funciones', 'Cambiar colores/estilo', 'Cambiar moneda', 'Ver resumen de nuevo']
        }
      ]
    };
  }

  // CASO C: Opción 'Prefiero describirlo todo en un mensaje'
  if (msgLower.includes('describirlo todo en un mensaje') || msgLower.includes('prefiero describir')) {
    onboarding.active = true;
    onboarding.mode = 'free_description';
    return {
      statusState: 'pensando',
      statusText: 'Escuchando tu idea...',
      onboardingState: onboarding,
      blocks: [
        {
          type: 'text',
          content: '¡Perfecto! Escribe todo en un solo mensaje: para qué es la app, quiénes la usaran, qué funciones quieres y cómo quieres que se vea. Yo extraeré todo de ahí.'
        }
      ]
    };
  }

  // CASO D: Si el usuario envió descripción completa libre
  if (onboarding.mode === 'free_description') {
    // Extraer datos por palabras clave
    const brief = onboarding.brief || {};
    if (msgLower.includes('barber')) brief.rubro = 'Barbería VIP';
    else if (msgLower.includes('colmado') || msgLower.includes('tienda')) brief.rubro = 'Tienda / Colmado';
    else if (msgLower.includes('escuela') || msgLower.includes('colegio')) brief.rubro = 'Escuela';
    else brief.rubro = 'Negocio General';

    brief.objetivo = userMessage.substring(0, 80);
    brief.usuarios = msgLower.includes('cliente') ? 'Clientes + Admin' : 'Equipo Interno';
    brief.funciones = ['Gestión principal', 'WhatsApp', 'Panel Admin'];
    brief.estilo = msgLower.includes('oscuro') ? 'Oscuro VIP' : 'Azul Moderno';
    brief.integraciones = 'WhatsApp y reportes';
    brief.idioma_moneda = 'RD$ DOP';
    brief.notas = 'Extraído de mensaje libre';

    onboarding.brief = brief;
    onboarding.active = false;

    return {
      statusState: 'pensando',
      statusText: 'Brief extraído',
      onboardingState: onboarding,
      blocks: [
        {
          type: 'text',
          content: '¡Entendido perfectamente! Extraje todos los detalles de tu mensaje. Aquí tienes el **Resumen del Brief** pa\' confirmar:'
        },
        {
          type: 'brief_card',
          brief: brief
        }
      ]
    };
  }

  // CASO E: Proceso paso a paso del Onboarding (Pasos 1 al 8)
  if (onboarding.active || msgLower.includes('crear app') || msgLower.includes('construir app') || msgLower.includes('nueva app') || msgLower.includes('barberia') || msgLower.includes('tienda') || msgLower.includes('colmado')) {
    
    if (!onboarding.active) {
      onboarding.active = true;
      onboarding.step = 1;
      onboarding.brief = {};
    } else {
      // Guardar respuesta del paso anterior
      const currentStepObj = ONBOARDING_STEPS.find(s => s.step === onboarding.step);
      if (currentStepObj) {
        if (currentStepObj.id === 'funciones' && onboarding.brief.funciones) {
          if (!userMessage.includes('Listo')) {
            onboarding.brief.funciones.push(userMessage);
          }
        } else {
          onboarding.brief[currentStepObj.id] = userMessage;
        }
      }

      // Si no es multi-selección o tocó 'Listo', avanzar de paso
      if (currentStepObj?.id !== 'funciones' || userMessage.includes('Listo')) {
        onboarding.step += 1;
      }
    }

    // Adaptación dinámica por rubro
    if (onboarding.brief.rubro) {
      const rLower = onboarding.brief.rubro.toLowerCase();
      if (rLower.includes('barber')) {
        ONBOARDING_STEPS[3].chips = ['Citas y agenda', 'Barberos y turnos', 'Galería de cortes', 'Recordatorio WhatsApp', 'Listo con estas'];
      } else if (rLower.includes('colmado') || rLower.includes('tienda')) {
        ONBOARDING_STEPS[3].chips = ['Inventario y Stock', 'Fiados y cuentas', 'POS / Ventas rápida', 'Carrito WhatsApp', 'Listo con estas'];
      }
    }

    // Si ya completamos todos los pasos (paso > 8)
    if (onboarding.step > ONBOARDING_STEPS.length) {
      onboarding.active = false;
      return {
        statusState: 'pensando',
        statusText: 'Entrevista completada',
        onboardingState: onboarding,
        blocks: [
          {
            type: 'text',
            content: '¡Excelente! Terminamos la entrevista. Aquí tienes el **RESUMEN DEL BRIEF** técnico para tu app:'
          },
          {
            type: 'brief_card',
            brief: onboarding.brief
          }
        ]
      };
    }

    // Retornar pregunta actual del paso
    const nextStepObj = ONBOARDING_STEPS.find(s => s.step === onboarding.step);
    return {
      statusState: 'pensando',
      statusText: `Entrevista: Paso ${nextStepObj.step} de ${ONBOARDING_STEPS.length}`,
      onboardingState: onboarding,
      blocks: [
        {
          type: 'text',
          content: nextStepObj.question
        },
        {
          type: 'quick_chips',
          options: nextStepObj.chips
        }
      ]
    };
  }

  // CASO F: Saludo o ayuda general
  return {
    statusState: 'reposo',
    statusText: 'Listo pa\' construir',
    blocks: [
      {
        type: 'text',
        content: `¡Dime a ver! Soy **${currentConfig.agentName}**, tu agente creador de aplicaciones.\n\nPara empezar a forjar una app, ejecutamos primero una breve entrevista guiada para asegurarnos de que quede como la deseas.`
      },
      {
        type: 'quick_chips',
        options: [
          'Quiero construir una app para mi barbería',
          'App de Inventario para Colmado',
          'Prefiero describirlo todo en un mensaje',
          'Ver sugerencias en Ideas'
        ]
      }
    ]
  };
}
