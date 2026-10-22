/**
 * FORJA PWA - LÓGICA PRINCIPAL DEL CLIENTE ESTILO MUSE (v2.0.0)
 */

// VERSION DE LA APP
const APP_VERSION = '2.0.0';

// ESTADO GLOBAL CON PERSISTENCIA LOCAL
let state = {
  agentName: 'Forja',
  agentStatusText: "Listo pa' construir",
  agentAvatarState: 'reposo',
  activeView: 'chat',
  theme: 'light',
  messages: [],
  projects: [],
  activityLog: [],
  notifications: [],
  onboardingState: { active: false, step: 0, brief: {} },
  attachedFile: null
};

// STORAGE KEYS
const STORAGE_KEY_STATE = 'forja_pwa_state_v2';

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  cargarEstadoLocal();
  inicializarUI();
  registrarServiceWorker();
  initDragToScrolls();
});

// REGISTRO DE SERVICE WORKER
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[ServiceWorker] Registrado:', reg.scope))
      .catch(err => console.error('[ServiceWorker] Error:', err));
  }
}

// CARGAR ESTADO LOCAL
function cargarEstadoLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } else {
      // Historial Inicial por defecto (Dominican Spanish)
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
                'Catálogo interactivo para Tienda',
                'Prefiero describirlo todo en un mensaje'
              ]
            }
          ]
        }
      ];

      // Proyectos de Ejemplo Iniciales
      state.projects = [
        {
          id: 'proj_demo_01',
          name: 'Barbería El Boli VIP',
          status: 'Publicada',
          progress: 100,
          url: 'demo-barberia.html',
          updated: 'Hace 5 min',
          brief: {
            rubro: 'Barbería / Salón',
            objetivo: 'Reservación de citas y catálogo de cortes VIP',
            usuarios: 'Clientes + 3 Barberos',
            funciones: ['Citas online', 'Catálogo con precios', 'Aviso por WhatsApp'],
            estilo: 'Oscuro VIP Elegante',
            integraciones: 'WhatsApp directo + Notificaciones',
            idioma_moneda: 'RD$ DOP'
          }
        }
      ];

      logActividad("Forja v2.0.0 inicializado correctamente.");
    }
  } catch (e) {
    console.error("Error al cargar localStorage:", e);
  }
}

// GUARDAR ESTADO LOCAL
function guardarEstadoLocal() {
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch (e) {
    console.error("Error al guardar estado:", e);
  }
}

// INICIALIZACIÓN DE LA UI
function inicializarUI() {
  document.documentElement.setAttribute('data-theme', state.theme);

  const apiCfg = window.ForjaAPI ? window.ForjaAPI.getConfig() : {};
  if (apiCfg.agentName) state.agentName = apiCfg.agentName;

  actualizarHeaderAgente();
  renderizarMensajes();
  renderizarProyectos();
  renderizarLogActividad();

  // Event Listeners del Composer
  const inputEl = document.getElementById('user-input');
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendUserMessage();
      }
    });

    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 110) + 'px';
    });
  }

  // File Upload listener
  const fileInput = document.getElementById('composer-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        state.attachedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          previewUrl: URL.createObjectURL(file)
        };
        renderizarAttachmentPreview();
      }
    });
  }

  // Floating Scroll Bottom Button
  const threadEl = document.getElementById('chat-thread');
  const scrollBtn = document.getElementById('scroll-bottom-btn');
  if (threadEl && scrollBtn) {
    threadEl.addEventListener('scroll', () => {
      const isUp = threadEl.scrollHeight - threadEl.scrollTop - threadEl.clientHeight > 180;
      scrollBtn.classList.toggle('visible', isUp);
    });
  }

  // Tecla Escape para cerrar modales y drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarDrawer();
      cerrarActivitySheet();
      cerrarAjustes();
      cerrarModalProyecto();
    }
  });
}

// OBTENER HORA FORMATEADA
function obtenerHoraActual() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// LOG DE ACTIVIDAD
function logActividad(texto) {
  const item = {
    id: 'act_' + Date.now(),
    time: obtenerHoraActual(),
    text: texto
  };
  state.activityLog.unshift(item);
  if (state.activityLog.length > 40) state.activityLog.pop();
  guardarEstadoLocal();
  renderizarLogActividad();
}

// RENDERIZAR LOG DE ACTIVIDAD Y NOTIFICACIONES
function renderizarLogActividad() {
  const feed = document.getElementById('activity-log-feed');
  if (!feed) return;

  if (!state.activityLog || state.activityLog.length === 0) {
    feed.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted);">
        ${icono('info', { size: 32, style: 'opacity: 0.5; margin-bottom: 8px;' })}
        <p style="font-size: 13px;">No hay registros recientes de actividad.</p>
      </div>
    `;
    return;
  }

  feed.innerHTML = state.activityLog.map(item => `
    <div style="display: flex; gap: 8px; font-size: 12.5px; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
      <span style="color: var(--text-muted); font-weight: 600;">[${item.time}]</span>
      <span style="color: var(--text-primary);">${item.text}</span>
    </div>
  `).join('');
}

// ACTUALIZAR HEADER DEL AGENTE
function actualizarHeaderAgente() {
  const nameEl = document.getElementById('display-agent-name');
  const statusTextEl = document.getElementById('display-status-text');
  const statusDotEl = document.getElementById('display-status-dot');

  if (nameEl) nameEl.textContent = state.agentName;
  if (statusTextEl) statusTextEl.textContent = state.agentStatusText;
  if (statusDotEl) statusDotEl.className = 'status-dot ' + state.agentAvatarState;
}

function setAgentState(avatarState, statusText) {
  state.agentAvatarState = avatarState;
  state.agentStatusText = statusText;
  actualizarHeaderAgente();
}

// CAMBIAR DE VISTA CON TRANSICIONES DE PESTAÑAS (REQ 4)
function switchView(viewName) {
  state.activeView = viewName;

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const topTab = document.getElementById(`tab-btn-${viewName}`);
  if (topTab) topTab.classList.add('active');

  document.querySelectorAll('.bottom-tab-item').forEach(btn => btn.classList.remove('active'));
  const bottomTab = document.getElementById(`b-tab-${viewName}`);
  if (bottomTab) bottomTab.classList.add('active');

  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  const activePanel = document.getElementById(`${viewName}-view`);
  if (activePanel) activePanel.classList.add('active');

  if (viewName === 'chat') {
    scrollChatAlFinal();
  }

  cerrarDrawer();
}

// SCROLL AL FINAL DEL CHAT
function scrollChatAlFinal() {
  setTimeout(() => {
    const thread = document.getElementById('chat-thread');
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, 40);
}

// RENDERIZADOR DE MENSAJES CON BURBUJAS DE ANCHO COMPLETO (REQ 1a)
function renderizarMensajes() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Onboarding banner en la parte superior del chat si está activo
  let onboardingBannerHtml = '';
  if (state.onboardingState && state.onboardingState.active) {
    const step = state.onboardingState.step || 1;
    const totalSteps = 8;
    const pct = Math.round((step / totalSteps) * 100);
    onboardingBannerHtml = `
      <div class="onboarding-banner">
        <div class="onboarding-banner-header">
          <span>Entrevista de Contexto (Brief)</span>
          <span>Paso ${step} de ${totalSteps} (${pct}%)</span>
        </div>
        <div class="onboarding-progress-bg">
          <div class="onboarding-progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }

  const messagesHtml = state.messages.map(msg => {
    const isUser = msg.sender === 'user';
    const blocksHtml = (msg.blocks || []).map(block => renderizarBloque(block, msg.id)).join('');

    return `
      <div class="msg-group ${isUser ? 'user-msg' : 'agent-msg'}" id="msg-${msg.id}">
        <div class="msg-meta">
          <div class="msg-author-time">
            <strong>${isUser ? 'Tú' : state.agentName}</strong> • ${msg.timestamp || ''}
          </div>
          <div class="msg-actions">
            <button class="msg-action-btn" onclick="copiarMensaje('${msg.id}')" title="Copiar mensaje">
              ${icono('copiar', { size: 14 })}
            </button>
            ${!isUser ? `
              <button class="msg-action-btn" onclick="reaccionarMensaje('${msg.id}', 'like')" title="Útil">
                ${icono('like', { size: 14 })}
              </button>
              <button class="msg-action-btn" onclick="reaccionarMensaje('${msg.id}', 'dislike')" title="No útil">
                ${icono('dislike', { size: 14 })}
              </button>
            ` : ''}
          </div>
        </div>
        ${blocksHtml}
      </div>
    `;
  }).join('');

  container.innerHTML = onboardingBannerHtml + messagesHtml;
  scrollChatAlFinal();
}

// RENDERIZADOR DE BLOQUES INDIVIDUALES
function renderizarBloque(block, msgId) {
  if (!block) return '';

  switch (block.type) {
    case 'text':
      let formattedText = (block.content || '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      return `<div class="bubble-text rich-block"><p>${formattedText}</p></div>`;

    case 'brief_card':
      const b = block.brief || {};
      return `
        <div class="card-brief rich-block">
          <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:var(--primary); font-size:15px;">
            ${icono('app', { size: 20 })}
            <span>Resumen del Brief del Proyecto</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">🏢 Rubro / Negocio</span>
            <span class="brief-value">${b.rubro || 'Por definir'}</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">🎯 Objetivo Principal</span>
            <span class="brief-value">${b.objetivo || 'Automatización general'}</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">👥 Usuarios y Roles</span>
            <span class="brief-value">${b.usuarios || 'Clientes + Admin'}</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">⚡ Funciones Clave</span>
            <span class="brief-value">${Array.isArray(b.funciones) ? b.funciones.join(', ') : (b.funciones || 'Básicas')}</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">🎨 Estilo Visual</span>
            <span class="brief-value">${b.estilo || 'Azul Moderno'}</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">💳 Integraciones</span>
            <span class="brief-value">${b.integraciones || 'WhatsApp'}</span>
          </div>
          <div class="brief-item">
            <span class="brief-label">🌐 Moneda / País</span>
            <span class="brief-value">${b.idioma_moneda || 'RD$ DOP'}</span>
          </div>

          <div style="display:flex; gap:10px; margin-top:8px;">
            <button class="btn-approve" onclick="aceptarBriefYConstruir('${msgId}')">
              ${icono('check', { size: 16 })} Aceptar Brief y Construir
            </button>
            <button class="btn-reject" onclick="ajustarBrief('${msgId}')">
              ${icono('editar', { size: 16 })} Ajustar
            </button>
          </div>
        </div>
      `;

    case 'project_card':
      return `
        <div class="card-project rich-block">
          <div class="card-project-header">
            <div class="card-project-title">
              ${icono('app', { size: 18 })}
              <span>${block.name}</span>
            </div>
            <span class="badge-status ${block.progress === 100 ? 'completed' : 'in-progress'}">
              ${block.status || 'En progreso'}
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

    case 'quick_chips':
      return `
        <div class="quick-chips-wrapper rich-block">
          ${(block.options || []).map(opt => `
            <button class="chip-btn" onclick="seleccionarChipOption('${opt.replace(/'/g, "\\'")}')">
              ${opt}
            </button>
          `).join('')}
        </div>
      `;

    case 'step_list':
      return `
        <div class="card-step-list rich-block">
          ${(block.steps || []).map(step => `
            <div class="step-item ${step.status || 'pending'}">
              ${step.status === 'done' ? icono('check-circulo', { size: 16 }) : step.status === 'active' ? icono('cohete', { size: 16 }) : icono('reloj', { size: 16 })}
              <span>${step.title}</span>
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

  if (!text && !state.attachedFile) return;

  let contentText = text;
  if (state.attachedFile) {
    contentText += `\n📎 [Archivo adjunto: ${state.attachedFile.name}]`;
  }

  if (inputEl && !customText) {
    inputEl.value = '';
    inputEl.style.height = 'auto';
  }

  state.attachedFile = null;
  renderizarAttachmentPreview();

  const userMsg = {
    id: 'usr_' + Date.now(),
    sender: 'user',
    timestamp: obtenerHoraActual(),
    blocks: [{ type: 'text', content: contentText }]
  };

  state.messages.push(userMsg);
  guardarEstadoLocal();
  renderizarMensajes();

  setAgentState('pensando', 'Pensando...');
  logActividad(`Usuario envió: "${contentText.substring(0, 30)}..."`);

  try {
    const reqContext = {
      ...extraContext,
      onboardingState: state.onboardingState
    };

    const response = await window.ForjaAPI.enviarMensaje(contentText, state.messages, reqContext);

    if (response.onboardingState) {
      state.onboardingState = response.onboardingState;
    }

    if (response.statusState) {
      setAgentState(response.statusState, response.statusText || "Listo pa' construir");
    }

    const agentMsg = {
      id: 'agt_' + Date.now(),
      sender: 'agent',
      timestamp: obtenerHoraActual(),
      blocks: response.blocks || []
    };

    state.messages.push(agentMsg);
    guardarEstadoLocal();
    renderizarMensajes();

    if (response.statusState === 'trabajando') {
      ejecutarSimulacionConstruccion(agentMsg.id, response.blocks);
    }

  } catch (err) {
    console.error("Error al procesar mensaje:", err);
    setAgentState('reposo', "Listo pa' construir");
  }
}

// ACEPTAR BRIEF Y FORJAR APP
function aceptarBriefYConstruir(msgId) {
  handleSendUserMessage('¡Acepto el brief! Empieza a forjar la app.', { actionType: 'accept_brief' });
}

// AJUSTAR BRIEF
function ajustarBrief(msgId) {
  handleSendUserMessage('Quiero hacer un ajuste en el brief.', { actionType: 'adjust_brief' });
}

// SELECCIONAR OPCTION CHIP
function seleccionarChipOption(texto) {
  handleSendUserMessage(texto);
}

// SIMULACIÓN DE CONSTRUCCIÓN Y CREACIÓN DEL PROYECTO REAL
function ejecutarSimulacionConstruccion(msgId, blocks = []) {
  let progress = 30;
  const projectBlock = blocks.find(b => b.type === 'project_card');
  const appName = projectBlock ? projectBlock.name : 'App Forjada VIP';

  const timer = setInterval(() => {
    progress += 25;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      setAgentState('celebrando', '¡App Forjada con éxito!');

      // Crear nuevo proyecto en state.projects
      const newProj = {
        id: 'proj_' + Date.now(),
        name: appName,
        status: 'Publicada',
        progress: 100,
        url: 'demo-barberia.html',
        updated: 'Ahora mismo',
        brief: state.onboardingState.brief || {}
      };

      state.projects.unshift(newProj);
      guardarEstadoLocal();
      renderizarProyectos();

      logActividad(`Proyecto '${appName}' forjado y publicado en demo-barberia.html.`);

      // Agregar mensaje final con enlace
      state.messages.push({
        id: 'agt_ready_' + Date.now(),
        sender: 'agent',
        timestamp: obtenerHoraActual(),
        blocks: [
          {
            type: 'text',
            content: `🎉 **¡Listo, mi hermano!** La app **${appName}** ya está forjada y publicada en vivo. Puedes abrirla directamente en la pestaña **Proyectos** o tocando el enlace abajo.`
          },
          {
            type: 'project_card',
            id: newProj.id,
            name: newProj.name,
            status: 'Publicada',
            progress: 100,
            updated: 'Hace un instante'
          }
        ]
      });

      renderizarMensajes();
      setTimeout(() => setAgentState('reposo', "Listo pa' construir"), 3000);
    } else {
      setAgentState('trabajando', `Forjando... ${progress}%`);
    }
  }, 1200);
}

// RENDERIZAR PROYECTOS EN PESTAÑA PROYECTOS Y SIDEBAR
function renderizarProyectos() {
  const sidebarList = document.getElementById('sidebar-projects-list');
  const grid = document.getElementById('proyectos-grid');

  if (sidebarList) {
    sidebarList.innerHTML = state.projects.map(p => `
      <div class="project-item" onclick="abrirDetalleProyecto('${p.id}')">
        <span>${icono('app', { size: 16 })} ${p.name}</span>
        <span style="font-size:11px; color:var(--success); font-weight:600;">${p.progress}%</span>
      </div>
    `).join('');
  }

  if (grid) {
    if (state.projects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px; color: var(--text-muted);">
          ${icono('app', { size: 40, style: 'opacity: 0.5; margin-bottom: 12px;' })}
          <h3>Aún no has forjado ninguna app</h3>
          <p style="font-size: 13.5px; margin-top: 6px;">Habla con Forja en el chat para crear tu primera aplicación.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.projects.map(p => `
      <div class="card-project" onclick="abrirDetalleProyecto('${p.id}')" style="cursor: pointer;">
        <div class="card-project-header">
          <div class="card-project-title">
            ${icono('app', { size: 18 })}
            <span>${p.name}</span>
          </div>
          <span class="badge-status completed">${p.status}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <span style="font-size:12px; color:var(--text-muted);">${p.updated}</span>
          <a href="${p.url}" target="_blank" onclick="event.stopPropagation()" class="card-link-chip" style="font-size:12px; padding:6px 12px;">
            ${icono('enlace', { size: 14 })} Abrir App
          </a>
        </div>
      </div>
    `).join('');
  }
}

// ABRIR MODAL DE DETALLE DEL PROYECTO CON BOTÓN 'PEDIR MODIFICACIÓN' (REQ 7)
function abrirDetalleProyecto(projId) {
  const p = state.projects.find(item => item.id === projId);
  if (!p) return;

  const modalHtml = `
    <div class="sheet-overlay open" id="modal-project-detail" onclick="cerrarModalProyecto()">
      <div class="sheet-modal" onclick="event.stopPropagation()">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <div class="sheet-title">
            ${icono('app', { size: 22 })}
            <span>${p.name}</span>
          </div>
          <button class="icon-btn" onclick="cerrarModalProyecto()">${icono('cerrar')}</button>
        </div>

        <div style="font-size:13.5px; color:var(--text-secondary); display:flex; flex-direction:column; gap:10px;">
          <p><strong>Estado:</strong> <span class="badge-status completed">${p.status}</span></p>
          <p><strong>Actualizado:</strong> ${p.updated}</p>
          ${p.brief ? `
            <div style="background:var(--bg-app); padding:12px; border-radius:var(--radius-md);">
              <p style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Detalles del Brief:</p>
              <p>• Rubro: ${p.brief.rubro || 'N/A'}</p>
              <p>• Objetivo: ${p.brief.objetivo || 'N/A'}</p>
              <p>• Estilo: ${p.brief.estilo || 'N/A'}</p>
            </div>
          ` : ''}
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
          <a href="${p.url}" target="_blank" class="btn-approve" style="text-decoration:none;">
            ${icono('enlace', { size: 16 })} Abrir Aplicación
          </a>
          <button class="btn-approve" style="background-color:var(--bg-app); color:var(--text-primary); border:1px solid var(--border-color);" onclick="pedirModificacionProyecto('${p.name}')">
            ${icono('editar', { size: 16 })} Pedir Modificación en Chat
          </button>
          <button class="btn-reject" onclick="eliminarProyecto('${p.id}')">
            ${icono('borrar', { size: 16 })} Eliminar Proyecto
          </button>
        </div>
      </div>
    </div>
  `;

  let existingModal = document.getElementById('modal-project-detail');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function cerrarModalProyecto() {
  const modal = document.getElementById('modal-project-detail');
  if (modal) modal.remove();
}

function pedirModificacionProyecto(nombreApp) {
  cerrarModalProyecto();
  switchView('chat');
  const inputEl = document.getElementById('user-input');
  if (inputEl) {
    inputEl.value = `Quiero pedir una modificación para mi app '${nombreApp}': `;
    inputEl.focus();
  }
}

function eliminarProyecto(projId) {
  if (confirm("¿Seguro que deseas eliminar este proyecto?")) {
    state.projects = state.projects.filter(p => p.id !== projId);
    guardarEstadoLocal();
    renderizarProyectos();
    cerrarModalProyecto();
    logActividad("Proyecto eliminado.");
  }
}

// INICIAR EVENTOS DRAG-TO-SCROLL PARA CAROUSELES (REQ 2)
function initDragToScrolls() {
  const carousels = document.querySelectorAll('.horizontal-carousel');
  carousels.forEach(carousel => {
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => isDown = false);
    carousel.addEventListener('mouseup', () => isDown = false);

    carousel.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.8;
      carousel.scrollLeft = scrollLeft - walk;
    });
  });
}

// FUNCIONES PARA USAR IDEAS DIRECTAS
function usarIdeaDirecta(texto) {
  switchView('chat');
  handleSendUserMessage(texto);
}

// ATTACHMENT PREVIEW
function renderizarAttachmentPreview() {
  const container = document.getElementById('attachment-preview-container');
  if (!container) return;

  if (state.attachedFile) {
    container.innerHTML = `
      <div class="attachment-chip">
        ${icono('adjuntar', { size: 14 })}
        <span>${state.attachedFile.name}</span>
        <button class="icon-btn" onclick="quitarAttachment()" style="padding:2px;">${icono('cerrar', { size: 12 })}</button>
      </div>
    `;
  } else {
    container.innerHTML = '';
  }
}

function quitarAttachment() {
  state.attachedFile = null;
  renderizarAttachmentPreview();
}

// COPIAR MENSAJE
function copiarMensaje(msgId) {
  const msg = state.messages.find(m => m.id === msgId);
  if (msg && msg.blocks && msg.blocks[0]) {
    const text = msg.blocks[0].content || '';
    navigator.clipboard.writeText(text).then(() => alert("Mensaje copiado al portapapeles."));
  }
}

// REACCIONAR MENSAJE
function reaccionarMensaje(msgId, tipo) {
  logActividad(`Reacción ${tipo === 'like' ? 'útil' : 'no útil'} registrada.`);
  alert(tipo === 'like' ? "¡Gracias por tus comentarios positivos!" : "Tomaremos en cuenta tu comentario para mejorar.");
}

// DRAWER Y SHEETS
function abrirDrawer() {
  const drawer = document.getElementById('sidebar-left');
  const overlay = document.getElementById('drawer-overlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function cerrarDrawer() {
  const drawer = document.getElementById('sidebar-left');
  const overlay = document.getElementById('drawer-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function abrirActivitySheet() {
  const sheet = document.getElementById('activity-sheet-overlay');
  if (sheet) sheet.classList.add('open');
}

function cerrarActivitySheet() {
  const sheet = document.getElementById('activity-sheet-overlay');
  if (sheet) sheet.classList.remove('open');
}

function abrirAjustes() {
  const sheet = document.getElementById('settings-sheet-overlay');
  const nameInput = document.getElementById('setting-agent-name');
  const urlInput = document.getElementById('setting-backend-url');

  if (nameInput) nameInput.value = state.agentName;
  if (urlInput && window.ForjaAPI) {
    urlInput.value = window.ForjaAPI.getConfig().backendUrl || '';
  }

  if (sheet) sheet.classList.add('open');
}

function cerrarAjustes() {
  const sheet = document.getElementById('settings-sheet-overlay');
  if (sheet) sheet.classList.remove('open');
}

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
  cerrarAjustes();
  logActividad("Ajustes de Forja guardados.");
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function setTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  guardarEstadoLocal();
}

function borrarHistorialLocal() {
  if (confirm("¿Seguro que deseas borrar todo el historial local y proyectos?")) {
    localStorage.removeItem(STORAGE_KEY_STATE);
    location.reload();
  }
}

function iniciarNuevoChat() {
  state.messages = [
    {
      id: 'welcome_' + Date.now(),
      sender: 'agent',
      timestamp: obtenerHoraActual(),
      blocks: [
        {
          type: 'text',
          content: `¡Dime a ver! Iniciamos una nueva conversación. ¿Qué aplicación te gustaría forjar ahora?`
        },
        {
          type: 'quick_chips',
          options: [
            'App para Barbería',
            'Inventario para Colmado',
            'Catálogo de Tienda',
            'Prefiero describirlo todo en un mensaje'
          ]
        }
      ]
    }
  ];
  state.onboardingState = { active: false, step: 0, brief: {} };
  guardarEstadoLocal();
  renderizarMensajes();
  switchView('chat');
  cerrarDrawer();
}

window.iniciarNuevoChat = iniciarNuevoChat;
window.switchView = switchView;
window.abrirAjustes = abrirAjustes;
window.cerrarAjustes = cerrarAjustes;
window.guardarAjustes = guardarAjustes;
window.abrirActivitySheet = abrirActivitySheet;
window.cerrarActivitySheet = cerrarActivitySheet;
window.abrirDrawer = abrirDrawer;
window.cerrarDrawer = cerrarDrawer;
window.toggleTheme = toggleTheme;
window.usarIdeaDirecta = usarIdeaDirecta;
