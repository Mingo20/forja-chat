/**
 * FORJA PWA - LÓGICA PRINCIPAL DEL CLIENTE ESTILO MUSE
 */

// ESTADO GLOBAL CON PERSISTENCIA LOCAL
let state = {
  agentName: 'Forja',
  agentStatusText: "Listo pa' construir",
  agentAvatarState: 'reposo', // 'reposo' | 'pensando' | 'trabajando' | 'celebrando'
  activeView: 'chat',
  theme: 'light',
  messages: [],
  projects: [],
  activityLog: []
};

// TECLAS DE STORAGE
const STORAGE_KEY_STATE = 'forja_pwa_state_v1';

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  cargarEstadoLocal();
  inicializarUI();
  registrarServiceWorker();
});

// REGISTRO DE SERVICE WORKER
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado con éxito:', reg.scope))
      .catch(err => console.error('Error registrando Service Worker:', err));
  }
}

// CARGAR ESTADO DESDE LOCALSTORAGE
function cargarEstadoLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } else {
      // Historial Inicial por defecto (Mensaje de Bienvenida estilo Muse + Dominican Spanish)
      state.messages = [
        {
          id: 'welcome_msg',
          sender: 'agent',
          timestamp: obtenerHoraActual(),
          blocks: [
            {
              type: 'text',
              content: `¡Dime a ver, mi hermano! Soy **${state.agentName}**, tu compañero inteligente pa' construir aplicaciones completas desde un chat.\n\n¿Qué app o herramienta tienes en mente hoy?`
            },
            {
              type: 'quick_chips',
              options: [
                'Quiero una app para mi barbería',
                'App de Inventario y Fiado para Colmado',
                'Catálogo interactivo para Tienda Instagram',
                'Ver ideas sugeridas'
              ]
            }
          ]
        }
      ];

      // Proyecto Inicial de Ejemplo
      state.projects = [
        {
          id: 'proj_demo_01',
          name: 'Barbería El Boli VIP',
          status: 'Publicada',
          progress: 100,
          url: 'https://mingo20.github.io/forja-chat/demo-barberia.html',
          updated: 'Hace 5 min'
        }
      ];

      logActividad("Forja inicializado en modo PWA.");
    }
  } catch (e) {
    console.error("Error al cargar localStorage:", e);
  }
}

// GUARDAR ESTADO EN LOCALSTORAGE
function guardarEstadoLocal() {
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch (e) {
    console.error("Error al guardar estado:", e);
  }
}

// INICIALIZACIÓN DE LA UI Y EVENT LISTENERS
function inicializarUI() {
  // Aplicar tema
  document.documentElement.setAttribute('data-theme', state.theme);

  // Cargar configuración de API
  const apiCfg = window.ForjaAPI ? window.ForjaAPI.getConfig() : {};
  if (apiCfg.agentName) state.agentName = apiCfg.agentName;

  // Actualizar nombre y avatar
  actualizarHeaderAgente();

  // Renderizar Mensajes y Proyectos
  renderizarMensajes();
  renderizarProyectos();
  renderizarLogActividad();

  // Event Listeners para el Composer
  const inputEl = document.getElementById('user-input');
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendUserMessage();
      }
    });

    // Auto-resize del textarea
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
  }

  // Toggle Menú lateral móvil
  const menuBtn = document.getElementById('menu-toggle-btn');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const sidebarLeft = document.getElementById('sidebar-left');

  if (menuBtn && sidebarLeft) {
    menuBtn.addEventListener('click', () => sidebarLeft.classList.toggle('open'));
  }
  if (closeSidebarBtn && sidebarLeft) {
    closeSidebarBtn.addEventListener('click', () => sidebarLeft.classList.remove('open'));
  }
}

// OBTENER HORA FORMATEADA
function obtenerHoraActual() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// LOG DE ACTIVIDAD CON TIMESTAMP
function logActividad(texto) {
  const item = {
    id: 'act_' + Date.now(),
    time: obtenerHoraActual(),
    text: texto
  };
  state.activityLog.unshift(item);
  if (state.activityLog.length > 30) state.activityLog.pop();
  guardarEstadoLocal();
  renderizarLogActividad();
}

// RENDERIZAR LOG DE ACTIVIDAD
function renderizarLogActividad() {
  const feed = document.getElementById('activity-log-feed');
  const modalList = document.getElementById('modal-activity-log-list');

  const html = state.activityLog.map(item => `
    <div class="activity-item">
      <span class="activity-time">[${item.time}]</span>
      <span class="activity-text">${item.text}</span>
    </div>
  `).join('');

  if (feed) feed.innerHTML = html || '<div style="color: var(--text-muted); font-size:12px;">Sin registros recientes.</div>';
  if (modalList) modalList.innerHTML = html || '<div style="color: var(--text-muted); font-size:12px;">Sin registros recientes.</div>';
}

// ACTUALIZAR HEADER DEL AGENTE (NOMBRE, ESTADO Y CLASES DEL AVATAR)
function actualizarHeaderAgente() {
  const nameEl = document.getElementById('display-agent-name');
  const statusTextEl = document.getElementById('display-status-text');
  const statusDotEl = document.getElementById('display-status-dot');
  const avatarWrapper = document.getElementById('forja-avatar');

  if (nameEl) nameEl.textContent = state.agentName;
  if (statusTextEl) statusTextEl.textContent = state.agentStatusText;

  if (statusDotEl) {
    statusDotEl.className = 'status-dot ' + state.agentAvatarState;
  }

  if (avatarWrapper) {
    avatarWrapper.className = 'forja-avatar-wrapper ' + state.agentAvatarState;
    
    // Toggle elementos SVG internos según el estado
    const ring = avatarWrapper.querySelector('.sparkle-ring');
    const spark = avatarWrapper.querySelector('.spark-icon');
    const burst = avatarWrapper.querySelector('.star-burst');

    if (ring) ring.style.display = (state.agentAvatarState === 'pensando') ? 'block' : 'none';
    if (spark) spark.style.display = (state.agentAvatarState === 'trabajando') ? 'block' : 'none';
    if (burst) burst.style.display = (state.agentAvatarState === 'celebrando') ? 'block' : 'none';
  }
}

// CAMBIAR ESTADO DEL AGENTE
function setAgentState(avatarState, statusText) {
  state.agentAvatarState = avatarState;
  state.agentStatusText = statusText;
  actualizarHeaderAgente();
}

// CAMBIAR DE VISTA (CHAT, PROYECTOS, IDEAS)
function switchView(viewName) {
  state.activeView = viewName;

  // Actualizar botones de pestaña superiores
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const topTab = document.getElementById(`tab-btn-${viewName}`);
  if (topTab) topTab.classList.add('active');

  // Actualizar barra inferior móvil
  document.querySelectorAll('.bottom-tab-item').forEach(btn => btn.classList.remove('active'));
  const bottomTab = document.getElementById(`b-tab-${viewName}`);
  if (bottomTab) bottomTab.classList.add('active');

  // Mostrar panel correspondiente
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  const activePanel = document.getElementById(`${viewName}-view`);
  if (activePanel) activePanel.classList.add('active');

  // Si cambia a chat, hacer scroll abajo
  if (viewName === 'chat') {
    scrollChatAlFinal();
  }
}

// TOGGLE SIDEBAR DERECHA (ARTEFACTOS)
function toggleSidebarRight() {
  const sbRight = document.getElementById('sidebar-right');
  if (sbRight) {
    sbRight.classList.toggle('collapsed');
  }
}

// TOGGLE TEMA CLARO/OSCURO
function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function setTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  guardarEstadoLocal();
}

// SCROLL AL FINAL DEL CHAT
function scrollChatAlFinal() {
  setTimeout(() => {
    const thread = document.getElementById('chat-thread');
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, 50);
}

// RENDERIZADOR DE MENSAJES CON SOPORTE DE BLOQUES RICOS (REQ 3)
function renderizarMensajes() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  container.innerHTML = state.messages.map(msg => {
    const isUser = msg.sender === 'user';
    
    // Renderizar cada bloque del mensaje
    const blocksHtml = (msg.blocks || []).map(block => renderizarBloque(block, msg.id)).join('');

    return `
      <div class="msg-group ${isUser ? 'user-msg' : 'agent-msg'}" id="msg-${msg.id}">
        <div class="msg-avatar">
          ${isUser 
            ? `<div class="user-avatar-circle">TÚ</div>`
            : `<div class="forja-avatar-wrapper ${state.agentAvatarState}" style="width:36px;height:36px;">
                <svg viewBox="0 0 100 100">
                  <rect x="18" y="24" width="64" height="56" rx="20" fill="#0866FF"/>
                  <rect x="26" y="34" width="48" height="28" rx="10" fill="#0F172A"/>
                  <circle cx="38" cy="48" r="5" fill="#38BDF8"/>
                  <circle cx="62" cy="48" r="5" fill="#38BDF8"/>
                </svg>
               </div>`
          }
        </div>

        <div class="msg-body-wrapper">
          <div class="msg-author-time">
            <strong>${isUser ? 'Tú' : state.agentName}</strong> • ${msg.timestamp || ''}
          </div>
          ${blocksHtml}
        </div>
      </div>
    `;
  }).join('');

  scrollChatAlFinal();
}

// RENDERIZADOR DE UN BLOQUE INDIVIDUAL (TEXT, PROJECT, APPROVAL, CHIPS, STEPS, BOARD)
function renderizarBloque(block, msgId) {
  if (!block) return '';

  switch (block.type) {
    case 'text':
      // Formatear texto plano a HTML básico (bold, listas, salto de línea)
      let formattedText = (block.content || '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      return `<div class="bubble-text rich-block"><p>${formattedText}</p></div>`;

    case 'project_card':
      return `
        <div class="card-project rich-block">
          <div class="card-project-header">
            <div class="card-project-title">📱 ${block.name}</div>
            <span class="badge-status ${block.progress === 100 ? 'completed' : 'in-progress'}">
              ${block.status || (block.progress === 100 ? 'Listo' : 'En Construcción')}
            </span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${block.progress || 0}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted);">
            <span>Progreso: ${block.progress || 0}%</span>
            <span>${block.updated || 'Actualizado'}</span>
          </div>
        </div>
      `;

    case 'approval_card':
      const isApproved = block.status === 'approved';
      const isRejected = block.status === 'rejected';

      return `
        <div class="card-approval rich-block">
          <div class="approval-header">
            <span>⚙️ ${block.title || 'Plan de Aprobación'}</span>
          </div>
          <p style="font-size:13.5px; color:var(--text-secondary);">${block.description || ''}</p>
          
          <ul class="approval-details-list">
            ${(block.details || []).map(d => `<li>• ${d}</li>`).join('')}
          </ul>

          <div class="approval-actions">
            ${isApproved 
              ? `<button class="btn-approve" disabled style="background-color:var(--success);">✓ Plan Aprobado</button>`
              : isRejected
              ? `<button class="btn-reject" disabled>Plan Rechazado</button>`
              : `
                <button class="btn-approve" onclick="aprobarPlan('${msgId}', '${block.id}', '${block.appName || 'App'}')">✓ Aceptar y Construir</button>
                <button class="btn-reject" onclick="rechazarPlan('${msgId}', '${block.id}')">✕ Ajustar</button>
              `
            }
          </div>
        </div>
      `;

    case 'quick_chips':
      return `
        <div class="quick-chips-wrapper rich-block">
          ${(block.options || []).map(opt => `
            <button class="chip-btn" onclick="seleccionarChipOption('${opt.replace(/'/g, "\\'")}')">${opt}</button>
          `).join('')}
        </div>
      `;

    case 'link_chip':
      return `
        <div class="rich-block">
          <a href="${block.url || '#'}" target="_blank" class="card-link-chip">
            <span>🚀 ${block.label || 'Abrir App'}</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      `;

    case 'step_list':
      return `
        <div class="card-step-list rich-block">
          ${(block.steps || []).map(step => `
            <div class="step-item ${step.status || (step.done ? 'done' : 'pending')}">
              <div class="step-icon">
                ${step.status === 'done' || step.done ? '✓' : step.status === 'active' ? '⚙️' : '○'}
              </div>
              <span>${step.title}</span>
            </div>
          `).join('')}
        </div>
      `;

    case 'simple_board':
      return `
        <div class="card-simple-board rich-block">
          ${(block.columns || []).map(col => `
            <div class="board-col">
              <div class="board-col-header">${col.header}</div>
              ${(col.items || []).map(item => `<div class="board-item">${item}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      `;

    default:
      return '';
  }
}

// MANEJO DE ENVÍO DE MENSAJE DEL USUARIO
async function handleSendUserMessage(customText, extraContext = {}) {
  const inputEl = document.getElementById('user-input');
  const text = customText || (inputEl ? inputEl.value.trim() : '');

  if (!text) return;

  if (inputEl && !customText) {
    inputEl.value = '';
    inputEl.style.height = 'auto';
  }

  // 1. Agregar mensaje del usuario a la lista
  const userMsg = {
    id: 'usr_' + Date.now(),
    sender: 'user',
    timestamp: obtenerHoraActual(),
    blocks: [
      { type: 'text', content: text }
    ]
  };

  state.messages.push(userMsg);
  guardarEstadoLocal();
  renderizarMensajes();

  // Cambiar estado a 'pensando'
  setAgentState('pensando', 'Pensando...');
  logActividad(`Usuario envió: "${text.substring(0, 30)}..."`);

  // 2. Consultar Capa API (Backend Deno o Modo Demo Local)
  try {
    const response = await window.ForjaAPI.enviarMensaje(text, state.messages, extraContext);

    // Actualizar estado del agente según la respuesta
    if (response.statusState) {
      setAgentState(response.statusState, response.statusText || "Listo pa' construir");
    }

    // 3. Agregar respuesta del Agente
    const agentMsg = {
      id: 'agt_' + Date.now(),
      sender: 'agent',
      timestamp: obtenerHoraActual(),
      blocks: response.blocks || []
    };

    state.messages.push(agentMsg);
    guardarEstadoLocal();
    renderizarMensajes();

    // Si el mensaje fue inicio de proceso de construcción en Modo Demo, simular timer de progreso
    if (response.statusState === 'trabajando') {
      ejecutarSimulacionConstruccion(agentMsg.id, extraContext.appName || 'App Barbería VIP');
    }

  } catch (err) {
    console.error("Error al procesar respuesta del agente:", err);
    setAgentState('reposo', "Listo pa' construir");
  }
}

// APROBAR PLAN DE CONSTRUCCIÓN (TARJETA DE APROBACIÓN)
function aprobarPlan(msgId, approvalId, appName) {
  // Buscar mensaje y actualizar tarjeta a 'approved'
  const msg = state.messages.find(m => m.id === msgId);
  if (msg) {
    const card = msg.blocks.find(b => b.type === 'approval_card');
    if (card) card.status = 'approved';
  }

  logActividad(`Plan aprobado para la app: ${appName}`);
  handleSendUserMessage('¡Aceptado! Dale pa\' \'llante con la construcción.', {
    actionType: 'approve_plan',
    appName: appName
  });
}

// RECHAZAR PLAN
function rechazarPlan(msgId, approvalId) {
  const msg = state.messages.find(m => m.id === msgId);
  if (msg) {
    const card = msg.blocks.find(b => b.type === 'approval_card');
    if (card) card.status = 'rejected';
  }

  logActividad(`Plan rechazado o enviado a ajuste.`);
  handleSendUserMessage('Quiero hacerle algunos ajustes al plan.', {
    actionType: 'reject_plan'
  });
}

// SELECCIONAR CHIP OPCIÓN
function seleccionarChipOption(optionText) {
  logActividad(`Opción seleccionada: ${optionText}`);
  handleSendUserMessage(optionText, { actionType: 'select_option' });
}

// USAR IDEA DIRECTA DESDE PESTAÑA IDEAS
function usarIdeaDirecta(ideaText) {
  switchView('chat');
  handleSendUserMessage(ideaText);
}

// SIMULACIÓN DE PROGRESO DE CONSTRUCCIÓN REAL-TIME (MODO DEMO SIMULADO)
function ejecutarSimulacionConstruccion(msgId, appName) {
  logActividad(`Iniciando construcción en segundo plano de: ${appName}`);

  let progress = 25;
  const interval = setInterval(() => {
    progress += 25;

    // Actualizar progreso en la tarjeta del proyecto en el chat
    const msg = state.messages.find(m => m.id === msgId);
    if (msg) {
      const projBlock = msg.blocks.find(b => b.type === 'project_card');
      if (projBlock) projBlock.progress = progress;

      const stepBlock = msg.blocks.find(b => b.type === 'step_list');
      if (stepBlock && stepBlock.steps) {
        if (progress >= 50) {
          stepBlock.steps[1].status = 'done';
          stepBlock.steps[2].status = 'active';
        }
        if (progress >= 75) {
          stepBlock.steps[2].status = 'done';
          stepBlock.steps[3].status = 'active';
        }
        if (progress >= 100) {
          stepBlock.steps[3].status = 'done';
        }
      }
    }

    renderizarMensajes();

    if (progress >= 100) {
      clearInterval(interval);

      // Estado Celebración y Entrega
      setAgentState('celebrando', '¡App Lista y Publicada!');
      logActividad(`¡App ${appName} completada con éxito y publicada!`);

      const targetUrl = 'https://mingo20.github.io/forja-chat/demo-barberia.html';

      // Agregar a proyectos guardados
      const nuevoProyecto = {
        id: 'proj_' + Date.now(),
        name: appName,
        status: 'Publicada',
        progress: 100,
        url: targetUrl,
        updated: 'Recién creada'
      };

      state.projects.unshift(nuevoProyecto);

      // Mensaje final con enlace etiquetado
      const completionMsg = {
        id: 'agt_complete_' + Date.now(),
        sender: 'agent',
        timestamp: obtenerHoraActual(),
        blocks: [
          {
            type: 'text',
            content: `¡Quedó picante esa app! 🚀 Tu **${appName}** está lista y desplegada en vivo. Aquí tienes el enlace directo pa' probarla:`
          },
          {
            type: 'link_chip',
            label: `Probar ${appName} en vivo`,
            url: targetUrl
          },
          {
            type: 'text',
            content: `Cualquier ajuste o nueva función que quieras agregarle, me avisas y le damos de una vez.`
          }
        ]
      };

      state.messages.push(completionMsg);
      guardarEstadoLocal();
      renderizarMensajes();
      renderizarProyectos();

      // Actualizar vista previa en el panel derecho (artefacto activo)
      const previewBox = document.getElementById('active-artifact-preview');
      if (previewBox) {
        previewBox.innerHTML = `
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">📱 ${appName}</div>
          <a href="${targetUrl}" target="_blank" class="card-link-chip" style="font-size:12px; padding:8px 12px;">Probar Demo en Vivo</a>
        `;
      }
    }
  }, 1200);
}

// RENDERIZAR PROYECTOS EN LA PESTAÑA PROYECTOS Y SIDEBAR
function renderizarProyectos() {
  const sidebarList = document.getElementById('sidebar-projects-list');
  const grid = document.getElementById('proyectos-grid');

  if (sidebarList) {
    sidebarList.innerHTML = state.projects.map(p => `
      <div class="project-item" onclick="switchView('proyectos')">
        <span>📱 ${p.name}</span>
        <span style="font-size:11px; color:var(--success); font-weight:600;">${p.progress}%</span>
      </div>
    `).join('');
  }

  if (grid) {
    grid.innerHTML = state.projects.map(p => `
      <div class="card-project">
        <div class="card-project-header">
          <div class="card-project-title">📱 ${p.name}</div>
          <span class="badge-status completed">${p.status}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <span style="font-size:12px; color:var(--text-muted);">${p.updated}</span>
          <a href="${p.url}" target="_blank" class="card-link-chip" style="font-size:12px; padding:6px 12px;">Abrir App</a>
        </div>
      </div>
    `).join('');
  }
}

// ABRIR MODAL ACTIVIDAD
function abrirModalActividad() {
  const modal = document.getElementById('modal-activity');
  const statusText = document.getElementById('modal-status-text');
  if (statusText) statusText.textContent = state.agentStatusText;
  if (modal) modal.classList.add('open');
}

// ABRIR MODAL AJUSTES
function abrirAjustes() {
  const modal = document.getElementById('modal-settings');
  const nameInput = document.getElementById('setting-agent-name');
  const urlInput = document.getElementById('setting-backend-url');

  if (nameInput) nameInput.value = state.agentName;
  if (urlInput && window.ForjaAPI) {
    urlInput.value = window.ForjaAPI.getConfig().backendUrl || '';
  }

  if (modal) modal.classList.add('open');
}

// CERRAR MODAL
function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// GUARDAR AJUSTES
function guardarAjustes() {
  const nameInput = document.getElementById('setting-agent-name');
  const urlInput = document.getElementById('setting-backend-url');

  if (nameInput && nameInput.value.trim()) {
    state.agentName = nameInput.value.trim();
  }

  if (urlInput && window.ForjaAPI) {
    window.ForjaAPI.updateConfig({
      backendUrl: urlInput.value.trim(),
      agentName: state.agentName
    });
  }

  actualizarHeaderAgente();
  guardarEstadoLocal();
  cerrarModal('modal-settings');
  logActividad("Ajustes guardados.");
}

// BORRAR HISTORIAL LOCAL
function borrarHistorialLocal() {
  if (confirm("¿Seguro que quieres borrar todo el historial y proyectos locales?")) {
    localStorage.removeItem(STORAGE_KEY_STATE);
    location.reload();
  }
}

// INICIAR NUEVO CHAT
function iniciarNuevoChat() {
  state.messages = [
    {
      id: 'welcome_' + Date.now(),
      sender: 'agent',
      timestamp: obtenerHoraActual(),
      blocks: [
        {
          type: 'text',
          content: `¡Dime a ver! Iniciamos un nuevo hilo. ¿Qué aplicación te gustaría construir ahora?`
        },
        {
          type: 'quick_chips',
          options: [
            'App para Barbería',
            'Inventario para Colmado',
            'Gestor de Gastos',
            'Catálogo de Tienda'
          ]
        }
      ]
    }
  ];
  guardarEstadoLocal();
  renderizarMensajes();
  switchView('chat');
}
