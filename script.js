console.log("VERSION TEST 2026-06-08");
let currentRole = null;

const supabaseClient = window.supabase.createClient(
    'https://kdclsbscslklcypclohj.supabase.co',
    'sb_publishable_-jYliISAOxmckNHeoXMkpQ_7DIP0vp0'
);

let cachedTiposIncidencias = [];

const loginOverlay = document.getElementById('loginOverlay');
const loginErrorMsg = document.getElementById('loginErrorMsg');
const appWrapper = document.getElementById('appWrapper');
const headerControls = document.getElementById('headerControls');
const form = document.getElementById('agendaForm');
const proveedorInput = document.getElementById('proveedor');
const proveedoresList = document.getElementById('proveedoresList');
const fechaInput = document.getElementById('fecha');
const cantSkuInput = document.getElementById('cant_sku');
const cantCajasInput = document.getElementById('cant_cajas');
const horaInicioInput = document.getElementById('hora_inicio');
const horaFinInput = document.getElementById('hora_fin');
const btnSubmit = document.getElementById('btnSubmit');
const hologramModal = document.getElementById('hologramModal');
const hologramMsg = document.getElementById('hologramMsg');
const tipoDestinoGroup = document.getElementById('tipoDestinoGroup');
const tipoDestinoSelect = document.getElementById('tipo_destino');
const puertaManualGroup = document.getElementById('puertaManualGroup');
const puertaManualSel = document.getElementById('puerta_manual');
const btnIncidencia = document.getElementById('btnIncidencia');

const errorModal = document.getElementById('errorModal');
const errorModalTitle = document.getElementById('errorModalTitle');
const errorModalMsg = document.getElementById('errorModalMsg');
const errorBtnOk = document.getElementById('errorBtnOk');
const errorBtnYesNo = document.getElementById('errorBtnYesNo');
const errorBtnYes = document.getElementById('errorBtnYes');
const errorBtnNo = document.getElementById('errorBtnNo');

let modalYesCallback = null;
let modalNoCallback = null;

function showModal(msg, title = 'SISTEMA B100', type = 'ok', onYes = null, onNo = null) {
    if (!errorModal || !errorModalTitle || !errorModalMsg) return;
    errorModalTitle.textContent = title;
    errorModalMsg.textContent = msg;
    if (type === 'yesno') {
        if (errorBtnOk) errorBtnOk.style.display = 'none';
        if (errorBtnYesNo) errorBtnYesNo.style.display = 'flex';
        modalYesCallback = onYes;
        modalNoCallback = onNo;
    } else {
        if (errorBtnOk) errorBtnOk.style.display = 'block';
        if (errorBtnYesNo) errorBtnYesNo.style.display = 'none';
    }
    errorModal.style.display = 'flex';
}

function hideModal() {
    if (errorModal) errorModal.style.display = 'none';
    if (hologramModal) hologramModal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    if (appWrapper) appWrapper.style.display = 'none';
    const dashboardContainer = document.getElementById('dashboardContainer');
    const panelsLayout = document.getElementById('panelsLayout');
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    if (panelsLayout) panelsLayout.style.display = 'none';

    const okBtn = document.getElementById('errorBtnOk');
    const successBtn = document.getElementById('hologramCloseBtn');
    if (okBtn) okBtn.onclick = hideModal;
    if (successBtn) successBtn.onclick = hideModal;

    if (errorBtnYes) {
        errorBtnYes.onclick = () => {
            if (modalYesCallback) modalYesCallback();
            hideModal();
        };
    }
    if (errorBtnNo) {
        errorBtnNo.onclick = () => {
            if (modalNoCallback) modalNoCallback();
            hideModal();
        };
    }

    const btnHome = document.getElementById('btnHome');
    if (btnHome) btnHome.onclick = () => window.location.href = 'https://portal-maestro.vercel.app/';

    checkAutoLogin();
    hideModal();
});

function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

document.getElementById('btnLogin').addEventListener('click', () => {
    const u = document.getElementById('userInput').value.trim();
    const p = document.getElementById('passInput').value.trim();
    loginErrorMsg.style.display = 'none';
    if (u === 'supervisor' && p === 'recepcion') initSession(u, 'supervisor');
    else if (u === 'prov' && p === 'recepcion') initSession(u, 'proveedor');
    else if (u === 'operario' && p === 'recepcion') initSession(u, 'operario');
    else loginErrorMsg.style.display = 'block';
});

function initSession(user, role) {
    currentRole = role;
    console.log("LOGIN OK");
    console.log("ROL ASIGNADO:", currentRole);

    localStorage.setItem('b100_role', role);
    localStorage.setItem('b100_user', user);

    document.body.className = role === 'supervisor'
        ? 'supervisor-mode'
        : role === 'operario'
            ? 'operario-mode'
            : 'provider-mode';

    loginOverlay.style.display = 'none';
    appWrapper.style.display = 'flex';

    if (headerControls) headerControls.style.display = 'flex';
    initIncidentModule();
    applyRoleUI();
    initApp();
}

function checkAutoLogin() {
    loginOverlay.style.display = 'flex';
    appWrapper.style.display = 'none';
}

function applyRoleUI() {
    const roleText = document.getElementById('roleText');
    const operarioView = document.getElementById('operarioView');
    const panelsLayout = document.getElementById('panelsLayout');
    const puertaSelect = document.getElementById('puerta_manual');
    const cancelContainer = document.getElementById('cancelContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');

    if (roleText) {
        if (currentRole === 'supervisor') roleText.textContent = 'SUPERVISOR';
        else if (currentRole === 'operario') roleText.textContent = 'OPERARIO';
        else roleText.textContent = 'PROVEEDOR';
    }

    if (currentRole === 'operario') {
        if (dashboardContainer) {
            dashboardContainer.style.display = 'flex';
            dashboardContainer.style.justifyContent = 'center';
            dashboardContainer.style.alignItems = 'center';
            dashboardContainer.style.width = '100%';
        }
        if (panelsLayout) panelsLayout.style.display = 'none';
        loadIncidentCategories();
    } else {
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (panelsLayout) panelsLayout.style.display = 'flex';
        initSupervisorManagement();
    }

    if (puertaSelect) {
        puertaSelect.querySelectorAll('option').forEach(opt => {
            if (currentRole === 'proveedor' && (opt.value === 'Puerta 8' || opt.value === 'Puerta 9')) {
                opt.style.display = 'none'; opt.disabled = true;
            } else {
                opt.style.display = 'block'; opt.disabled = false;
            }
        });
    }

    if (currentRole === 'proveedor') {
        if (cancelContainer) cancelContainer.style.display = 'none';
        if (tipoDestinoGroup) tipoDestinoGroup.style.display = 'none';
        if (puertaManualGroup) puertaManualGroup.style.display = 'none';
    } else {
        if (cancelContainer) cancelContainer.style.display = 'flex';
        if (tipoDestinoGroup) tipoDestinoGroup.style.display = 'block';
        if (puertaManualGroup) puertaManualGroup.style.display = 'block';
    }

    if (btnIncidencia) btnIncidencia.style.display = 'none';
}

async function initApp() {
    try {
        initMainAutocomplete();
        setupRealtimeSubscription();
    } catch (err) { console.error(err); }
}

function initMainAutocomplete() {
    const input = document.getElementById('proveedor');
    const results = document.getElementById('mainAutocompleteResults');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const term = input.value.trim();
        if (term.length < 3) {
            results.style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(() => fetchMainProviders(term), 300);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}

async function fetchMainProviders(term) {
    const input = document.getElementById('proveedor');
    const resultsDiv = document.getElementById('mainAutocompleteResults');
    if (!input || !resultsDiv) return;

    resultsDiv.innerHTML = '<div style="padding:10px; font-size:0.7rem; color:var(--primary-color);">Cargando...</div>';
    resultsDiv.style.display = 'block';

    const { data } = await supabaseClient
        .from('maestros_proveedores')
        .select('nombre, codigo')
        .ilike('nombre', `%${term}%`)
        .limit(10);

    resultsDiv.innerHTML = '';
    if (data && data.length > 0) {
        data.forEach(m => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `<strong>${m.nombre}</strong>`;
            item.onclick = () => {
                input.value = m.nombre;
                document.getElementById('mainSelectedProvCode').value = m.codigo;
                resultsDiv.style.display = 'none';
            };
            resultsDiv.appendChild(item);
        });
    } else {
        resultsDiv.innerHTML = '<div style="padding:10px; font-size:0.7rem; color:var(--text-muted);">Sin resultados. Use entrada manual.</div>';
    }
}

function setupRealtimeSubscription() {
    supabaseClient
        .channel('public:agenda_b100')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda_b100' }, (payload) => {
            console.log('Realtime update received:', payload);
            const mgmtDate = document.getElementById('supMgmtDate');
            if (mgmtDate && mgmtDate.value) {
                fetchMgmtAgenda(mgmtDate.value);
            }
            const datePicker = document.getElementById('opDatePicker');
            const searchInput = document.getElementById('opSearchInput');
            if (datePicker && datePicker.value) {
                fetchOperarioAgenda(datePicker.value, searchInput ? searchInput.value : '');
            }
        })
        .subscribe();
}

async function findFreeDoor(fecha, startMin, endMin, role, manualDoor = 'auto') {
    const { data: existing } = await supabaseClient.from('agenda_b100').select('*').eq('fecha', fecha).neq('estado', 'Cancelado').neq('estado', 'Eliminado');
    const forbidden = role === 'proveedor' ? ['Puerta 8', 'Puerta 9'] : [];
    const groupB = ['Puerta 2', 'Puerta 3', 'Puerta 4', 'Puerta 7', 'Puerta 10'];
    if (manualDoor !== 'auto') {
        if (groupB.includes(manualDoor) && startMin < 510) return null;
        const col = existing.find(a => a.puerta === manualDoor && Math.max(startMin, timeToMinutes(a.hora_inicio)) < Math.min(endMin, timeToMinutes(a.hora_fin)));
        return col ? null : manualDoor;
    }
    for (let d = 1; d <= 10; d++) {
        const dName = `Puerta ${d}`;
        if (forbidden.includes(dName)) continue;
        if (groupB.includes(dName) && startMin < 510) continue;
        if (!existing.find(a => a.puerta === dName && Math.max(startMin, timeToMinutes(a.hora_inicio)) < Math.min(endMin, timeToMinutes(a.hora_fin)))) return dName;
    }
    return null;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.disabled = true; btnSubmit.innerHTML = 'AGENDANDO...';
    try {
        const p = proveedorInput.value.trim();
        const f = fechaInput.value;
        const hS = horaInicioInput.value;
        const hE = horaFinInput.value;
        if (!hS || !hE) { showModal('SELECCIONE HORARIOS'); btnSubmit.disabled = false; return; }
        const sM = timeToMinutes(hS), eM = timeToMinutes(hE);
        const door = await findFreeDoor(f, sM, eM, currentRole, (currentRole === 'supervisor' ? puertaManualSel.value : 'auto'));
        if (!door) { showModal('NO HAY PUERTAS DISPONIBLES'); btnSubmit.disabled = false; return; }
        const workload = (parseInt(cantSkuInput.value) * 4.5) + (parseInt(cantCajasInput.value) * 1.36) + 15;
        let per = Math.max(1, Math.round((workload / (eM - sM)) * 10) / 10);
        await supabaseClient.from('agenda_b100').insert({
            fecha: f, proveedor: p, puerta: door, hora_inicio: hS, hora_fin: hE,
            cant_sku: parseInt(cantSkuInput.value) || 0, cant_cajas: parseInt(cantCajasInput.value) || 0,
            estado: 'Agendado', tipo_destino: (currentRole === 'supervisor' ? tipoDestinoSelect.value : 'CDS'), personal_requerido: per
        });
        hologramMsg.textContent = `CITADO EN ${door} - ${hE}`; hologramModal.style.display = 'flex';

        form.reset();
        document.getElementById('mainSelectedProvCode').value = '';
        proveedorInput.value = '';

        const mgmtDate = document.getElementById('supMgmtDate');
        if (mgmtDate && mgmtDate.value === f) fetchMgmtAgenda(f);

    } catch (err) { console.error(err); }
    btnSubmit.disabled = false; btnSubmit.innerHTML = 'AGENDAR CITA';
});

document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('b100_user');
    localStorage.removeItem('b100_role');
    window.location.reload();
};

function initSupervisorManagement() {
    const mgmtDatePicker = document.getElementById('supMgmtDate');
    if (mgmtDatePicker) {
        if (!mgmtDatePicker.value) mgmtDatePicker.value = new Date().toISOString().split('T')[0];
        mgmtDatePicker.onchange = (e) => {
            if (e.target.value) fetchMgmtAgenda(e.target.value);
        };
        fetchMgmtAgenda(mgmtDatePicker.value);
    }
}

async function fetchMgmtAgenda(date) {
    const container = document.getElementById('supMgmtResults');
    container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--primary-color);">CONSULTANDO BASE...</div>';

    const { data, error } = await supabaseClient
        .from('agenda_b100')
        .select('*')
        .eq('fecha', date)
        .neq('estado', 'Eliminado')
        .order('hora_inicio', { ascending: true });

    if (error) { container.innerHTML = 'Error'; return; }
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.7rem;">Sin citas para esta fecha.</div>';
        return;
    }
    renderManagementList(data);
}

function renderManagementList(appointments) {
    const container = document.getElementById('supMgmtResults');
    container.innerHTML = '';

    appointments.forEach(app => {
        const st = (app.estado || 'Agendado').toLowerCase();
        const row = document.createElement('div');
        row.className = `mgmt-row row-${st.replace(' ', '-')}`;

        const isCancelled = st === 'cancelado';
        const isReceived = st === 'recepcionado';
        const isOC = st === 'ingreso packing list' || st === 'packing';

        row.innerHTML = `
            <div class="mgmt-info">
                <span class="mgmt-name">${app.proveedor}</span>
                <span class="mgmt-meta"><i class="fas fa-clock"></i> ${app.hora_inicio} | ${app.puerta}</span>
            </div>
            <div class="mgmt-actions">
                <button class="btn-status ${isOC ? 'active-oc' : ''}" 
                        onclick="toggleStatus('${app.id_cita || app.id}', '${app.estado}', 'Packing')" 
                        ${isReceived || isCancelled ? 'disabled' : ''} title="Recibió Packing List">
                    <i class="fas fa-file-signature"></i>
                </button>
                <button class="btn-status ${isReceived ? 'active-rec' : ''}" 
                        onclick="toggleStatus('${app.id_cita || app.id}', '${app.estado}', 'Recepcionado')" 
                        ${isCancelled ? 'disabled' : ''} title="Recepcionado">
                    <i class="fas fa-warehouse"></i>
                </button>
                <button class="btn-status ${isCancelled ? 'active-can' : ''}" 
                        onclick="toggleStatus('${app.id_cita || app.id}', '${app.estado}', 'Cancelado')" title="Cancelado">
                    <i class="fas fa-ban"></i>
                </button>
                <button class="btn-status" style="border-color:var(--danger-color); color:var(--danger-color);" 
                        onclick="confirmDelete('${app.id_cita || app.id}')" title="Eliminar Permanentemente">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(row);
    });
}

async function toggleStatus(id, currentStatus, targetStatus) {
    const nextStatus = (currentStatus === targetStatus) ? 'Agendado' : targetStatus;
    await updateGenericStatus(id, nextStatus);
    const date = document.getElementById('supMgmtDate').value;
    fetchMgmtAgenda(date);
}

async function confirmDelete(id) {
    showModal('¿CONFIRMA ELIMINACIÓN PERMANENTE?', 'BORRADO DE REGISTRO', 'yesno', async () => {
        const { error } = await supabaseClient.from('agenda_b100').delete().eq('id_cita', id);
        if (error) await supabaseClient.from('agenda_b100').delete().eq('id', id);
        hideModal();
        const date = document.getElementById('supMgmtDate').value;
        fetchMgmtAgenda(date);
    });
}

function initOperarioPanel() {
    const datePicker = document.getElementById('opDatePicker');
    const searchInput = document.getElementById('opSearchInput');
    const btnSearch = document.getElementById('btnOpSearch');

    if (datePicker) {
        datePicker.onchange = (e) => {
            const fecha = e.target.value;
            if (fecha) fetchOperarioAgenda(fecha, searchInput ? searchInput.value : '');
        };
    }

    if (btnSearch) {
        btnSearch.onclick = () => {
            const fecha = datePicker.value;
            if (fecha) {
                fetchOperarioAgenda(fecha, searchInput ? searchInput.value : '');
            } else {
                alert("Por favor, selecciona una fecha primero.");
            }
        };
    }
}

async function fetchOperarioAgenda(date, search = '') {
    const res = document.getElementById('panelsLayout');
    if (!res) return;
    res.style.display = 'flex';
    res.innerHTML = '<div style="text-align:center; padding:20px; color:var(--primary-color);">SINCRONIZANDO...</div>';

    let query = supabaseClient
        .from('agenda_b100')
        .select('id_cita, id, proveedor, hora_inicio, hora_fin, puerta, estado')
        .eq('fecha', date)
        .not('estado', 'in', '("Eliminado","Cancelado")')
        .order('hora_inicio', { ascending: true });

    if (search && search.trim().length > 0) {
        query = query.ilike('proveedor', `%${search.trim()}%`);
    }

    const { data: scheduled, error } = await query;

    if (error) {
        console.error('ERROR SUPABASE:', error);
        res.innerHTML = '<div style="text-align:center; padding:40px; color:var(--danger-color);">Error de sincronización.</div>';
        return;
    }

    if (!scheduled || scheduled.length === 0) {
        res.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Sin registros.</div>';
        return;
    }

    renderOperarioList(scheduled);
}

function renderOperarioList(appointments) {
    const res = document.getElementById('opResults') || document.getElementById('panelsLayout');
    res.innerHTML = '';

    appointments.forEach(app => {
        const st = (app.estado || 'Agendado').toLowerCase();
        const row = document.createElement('div');
        row.className = `mgmt-row row-${st.replace(' ', '-')}`;

        const isCancelled = st === 'cancelado';
        const isReceived = st === 'recepcionado';
        const isOC = st === 'ingreso packing list' || st === 'packing';

        row.innerHTML = `
            <div class="mgmt-info">
                <span class="mgmt-name">${app.proveedor}</span>
                <span class="mgmt-meta"><i class="fas fa-clock"></i> ${app.hora_inicio} - ${app.hora_fin} | ${app.puerta}</span>
            </div>
            <div class="mgmt-actions">
                <button class="btn-status ${isOC ? 'active-oc' : ''}" 
                        onclick="toggleStatus('${app.id_cita || app.id}', '${app.estado}', 'Packing')" 
                        ${isReceived || isCancelled ? 'disabled' : ''} title="Ingreso Packing List">
                    <i class="fas fa-file-invoice"></i>
                </button>
                <button class="btn-status ${isReceived ? 'active-rec' : ''}" 
                        onclick="toggleStatus('${app.id_cita || app.id}', '${app.estado}', 'Recepcionado')" 
                        ${isCancelled ? 'disabled' : ''} title="Recepcionado">
                    <i class="fas fa-warehouse"></i>
                </button>
                <button class="btn-status ${isCancelled ? 'active-can' : ''}" 
                        onclick="toggleStatus('${app.id_cita || app.id}', '${app.estado}', 'Cancelado')" title="Cancelar">
                    <i class="fas fa-ban"></i>
                </button>
            </div>
        `;
        res.appendChild(row);
    });
}

async function updateGenericStatus(id, newStatus) {
    const { error } = await supabaseClient.from('agenda_b100').update({ estado: newStatus }).eq('id_cita', id);
    if (error) {
        await supabaseClient.from('agenda_b100').update({ estado: newStatus }).eq('id', id);
    }
}

let searchTimeout;

function initIncidentModule() {
    console.log("🔥 initIncidentModule EJECUTADO");
    console.log("ROL:", currentRole);

    const incDate = document.getElementById('incDate');
    const btnSend = document.getElementById('btnSendIncident');

    if (currentRole === 'operario' || currentRole === 'supervisor') {
        loadIncidentCategories();
        initIncAutocomplete();
    }

    if (incDate) {
        incDate.onchange = (e) => {
            const date = e.target.value;
            document.getElementById('incProveedorSearch').value = '';
            document.getElementById('selectedIdCita').value = '';
            document.getElementById('selectedProvName').value = '';
            document.getElementById('selectedHCita').value = '';
            document.getElementById('selectedHFinCita').value = '';
            document.getElementById('selectedProvCodigo').value = '';

            if (date) {
                document.getElementById('incAutocompleteResults').style.display = 'none';
            }
        };
    }

    if (btnSend) {
        btnSend.onclick = submitIncident;
    }
}

function initIncAutocomplete() {
    console.log("🚀 initIncAutocomplete EJECUTADO");
    const input = document.getElementById('incProveedorSearch');
    const resultsDiv = document.getElementById('incAutocompleteResults');

    if (!input || !resultsDiv) return;

    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    const freshInput = document.getElementById('incProveedorSearch');

    let debounceTimer;
    let activeRequest = 0;

    freshInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const term = this.value.trim();
        const date = document.getElementById('incDate').value;

        if (!date) {
            resultsDiv.style.display = 'none';
            return;
        }

        if (term.length === 1) {
            resultsDiv.innerHTML = '<div style="padding:10px;font-size:0.7rem;color:#888;text-align:center;">✏️ Escribe 1 letra más para filtrar...</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        const termSnapshot = term;
        activeRequest++;
        const myRequest = activeRequest;

        debounceTimer = setTimeout(() => {
            if (myRequest === activeRequest) {
                fetchProvidersAutocomplete(termSnapshot);
            }
        }, 300);
    });

    freshInput.addEventListener('mousedown', function (e) {
        const date = document.getElementById('incDate').value;
        if (!date) return;
        if (resultsDiv.style.display !== 'block') {
            e.preventDefault();
            fetchProvidersAutocomplete(this.value.trim());
            this.focus();
        }
    });

    document.addEventListener('click', function (e) {
        if (!freshInput.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.style.display = 'none';
        }
    });

    freshInput.addEventListener('keydown', function (e) {
        if (resultsDiv.style.display !== 'block') return;
        const items = resultsDiv.querySelectorAll('.autocomplete-item');
        const activeItem = resultsDiv.querySelector('.autocomplete-item.active');
        let index = -1;
        if (activeItem) items.forEach((item, i) => { if (item === activeItem) index = i; });

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (index < items.length - 1) {
                if (activeItem) activeItem.classList.remove('active');
                items[index + 1].classList.add('active');
                items[index + 1].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index > 0) {
                if (activeItem) activeItem.classList.remove('active');
                items[index - 1].classList.add('active');
                items[index - 1].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeItem) activeItem.click();
        } else if (e.key === 'Escape') {
            resultsDiv.style.display = 'none';
        }
    });
}

async function fetchProvidersAutocomplete(term) {
    const resultsDiv = document.getElementById('incAutocompleteResults');
    const date = document.getElementById('incDate').value;
    if (!date) return;

    resultsDiv.innerHTML = '<div style="padding:10px; font-size:0.7rem; color:var(--primary-color);">🔍 Buscando...</div>';
    resultsDiv.style.display = 'block';

    try {
        let query = supabaseClient
            .from('agenda_b100')
            .select('id_cita, id, proveedor, hora_inicio, hora_fin, puerta, estado')
            .eq('fecha', date)
            .order('hora_inicio', { ascending: true });

        if (term && term.trim().length > 0) {
            query = query.ilike('proveedor', `%${term.trim()}%`);
        }
        const { data: scheduled, error } = await query;
        if (error) throw error;

        const scheduledFiltrado = (scheduled || []);
        resultsDiv.innerHTML = '';

        if (scheduledFiltrado && scheduledFiltrado.length > 0) {
            const headerInfo = document.createElement('div');
            headerInfo.style.cssText = `padding: 6px 10px; font-size: 0.6rem; color: #0ff; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3);`;
            headerInfo.textContent = term ? `📋 ${scheduledFiltrado.length} "coindicencias para ${term}"` : `📋 ${scheduledFiltrado.length} proveedores hoy`;
            resultsDiv.appendChild(headerInfo);

            scheduledFiltrado.forEach(s => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style.cssText = `padding: 10px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; display: flex; justify-content: space-between; align-items: center;`;

                let proveedorDisplay = s.proveedor;
                if (term && term.trim().length > 0) {
                    const escapedTerm = term.trim().replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
                    const regex = new RegExp(`(${escapedTerm})`, 'gi');
                    proveedorDisplay = s.proveedor.replace(regex, '<span style="background: rgba(0,255,255,0.3); color: #fff; padding: 2px 4px; border-radius: 3px;">$1</span>');
                }

                item.innerHTML = `
                    <div style="flex: 1;">
                        <strong style="font-size:0.85rem;">${proveedorDisplay}</strong>
                    </div>`;

                item.onclick = async () => {
                    document.getElementById('incProveedorSearch').value = s.proveedor;
                    document.getElementById('selectedIdCita').value = s.id_cita || s.id || '';
                    const { data: provData } = await supabaseClient
                        .from('maestros_proveedores')
                        .select('codigo')
                        .eq('nombre', s.proveedor)
                        .single();

                    if (provData) {
                        document.getElementById('selectedProvCodigo').value = provData.codigo || '';
                    }

                    document.getElementById('selectedProvName').value = s.proveedor;
                    document.getElementById('selectedHCita').value = s.hora_inicio || '';
                    document.getElementById('selectedHFinCita').value = s.hora_fin || '';
                    document.getElementById('selectedPuerta').value = s.puerta || '';
                    resultsDiv.style.display = 'none';
                };
                resultsDiv.appendChild(item);
            });
        } else {
            resultsDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">No hay proveedores</div>`;
        }
    } catch (err) {
        console.error('❌ ERROR:', err);
        resultsDiv.innerHTML = `<div style="padding: 12px; color: #ff6b6b; text-align: center;">Error: ${err.message}</div>`;
    }
}

function selectProv(name, idCita, hCita, hFinCita, codigo) {
    document.getElementById('incProveedorSearch').value = name;
    document.getElementById('selectedIdCita').value = idCita || '';
    document.getElementById('selectedProvName').value = name;
    document.getElementById('selectedHCita').value = hCita || '';
    document.getElementById('selectedHFinCita').value = hFinCita || '';
    document.getElementById('selectedProvCodigo').value = codigo || '';
    document.getElementById('incAutocompleteResults').style.display = 'none';
}

async function loadIncidentCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('tipos_incidencias')
            .select('*')
            .order('nombre_incidencia', { ascending: true });

        cachedTiposIncidencias = (data || []).filter(item =>
            !item.nombre_incidencia.toLowerCase().includes('no vino')
        );

        const sel = document.getElementById('incTipo');
        if (!sel) return;
        sel.innerHTML = '<option value="">Seleccione incidencia...</option>';

        cachedTiposIncidencias.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.nombre_incidencia;
            opt.textContent = item.nombre_incidencia;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error('Error loading incident types:', err);
    }
}

async function submitIncident(event) {
    if (event) event.preventDefault();

    const inputFecha = document.getElementById('incDate');
    const inputProveedor = document.getElementById('selectedProvName');
    const selectIncidencia = document.getElementById('incTipo');
    const inputHoraLlegada = document.getElementById('incHoraLlegada');

    const inputIdCita = document.getElementById('selectedIdCita');
    const inputCodigoProv = document.getElementById('selectedProvCodigo');
    const inputHoraCita = document.getElementById('selectedHCita');

    const fechaValor = inputFecha && inputFecha.value ? inputFecha.value : new Date().toISOString().split('T')[0];
    const proveedorNombre = inputProveedor ? inputProveedor.value : '';
    const idCitaValor = (inputIdCita && inputIdCita.value !== "") ? parseInt(inputIdCita.value) : null;
    const codigoProvValor = (inputCodigoProv && inputCodigoProv.value !== "") ? parseInt(inputCodigoProv.value) : null;
    const horaCitaValor = inputHoraCita && inputHoraCita.value ? inputHoraCita.value : '08:00';
    const horaLlegadaValor = (inputHoraLlegada && inputHoraLlegada.value !== "") ? inputHoraLlegada.value : null;

    let tipoIncidencia = '';
    if (selectIncidencia) {
        tipoIncidencia = selectIncidencia.value;
    }

    if (!proveedorNombre) {
        alert("Por favor, busca y selecciona un proveedor válido de la agenda del día.");
        return;
    }
    if (!tipoIncidencia) {
        alert("Por favor, seleccione el tipo de incidencia.");
        return;
    }

    let hrAtraso = "00:00:00";
    let hrPerdida = "00:00:00";
    const incidenciaNormalizada = tipoIncidencia.toLowerCase();

    if (incidenciaNormalizada.includes("tarde") || incidenciaNormalizada.includes("atraso")) {
        if (horaLlegadaValor) {
            hrAtraso = calcularDiferenciaLogistica(horaCitaValor, horaLlegadaValor);
        }
    } else if (incidenciaNormalizada.includes("no vino") || incidenciaNormalizada.includes("faltó")) {
        hrPerdida = "08:00:00";
    }

    try {
        const { error } = await supabaseClient
            .from('incidencias_proveedores')
            .insert([
                {
                    fecha: fechaValor,
                    proveedor: proveedorNombre,
                    codigo: codigoProvValor,
                    incidencias: tipoIncidencia,
                    motivos: tipoIncidencia,
                    hr_atraso: hrAtraso,
                    hr_perdida: hrPerdida,
                    tipo: "ATRASO"
                }
            ]);

        if (error) throw error;

        showNeonToast("¡Incidencia registrada con éxito!");
        setTimeout(() => {
            fetchProvidersAutocomplete('');
        }, 500);

        document.getElementById('incProveedorSearch').value = '';
        document.getElementById('selectedProvName').value = '';
        document.getElementById('selectedHCita').value = '';
        document.getElementById('selectedHFinCita').value = '';
        document.getElementById('incAutocompleteResults').innerHTML = '';
        document.getElementById('incAutocompleteResults').style.display = 'none';
        document.getElementById('incTipo').selectedIndex = 0;
    }
    catch (err) {
        console.error(err);
    }
}

function calcularDiferenciaLogistica(horaCita, horaLlegada) {
    if (!horaCita || !horaLlegada) return "00:00:00";
    const [hCita, mCita] = horaCita.split(':').map(Number);
    const [hLlegada, mLlegada] = horaLlegada.split(':').map(Number);
    const totalMinutosCita = (hCita * 60) + mCita;
    const totalMinutosLlegada = (hLlegada * 60) + mLlegada;
    const diferenciaMinutos = totalMinutosLlegada - totalMinutosCita;
    if (diferenciaMinutos <= 0) return "00:00:00";
    const horasAtraso = Math.floor(diferenciaMinutos / 60);
    const minutosAtraso = diferenciaMinutos % 60;
    return `${String(horasAtraso).padStart(2, '0')}:${String(minutosAtraso).padStart(2, '0')}:00`;
}

function showNeonToast(message) {
    let toast = document.getElementById('neon-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'neon-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

window.onload = () => {
    initApp();
    initIncidentModule();
    const mainForm = document.getElementById('agendaForm');
    if (mainForm) mainForm.reset();
    const incFormSearch = document.getElementById('incProveedorSearch');
    if (incFormSearch) incFormSearch.value = '';
};