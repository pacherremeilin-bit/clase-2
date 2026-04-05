// ============================================================================
// PetCare - Frontend JavaScript
// Backend API: http://127.0.0.1:8000
// ============================================================================

const API_URL = 'http://127.0.0.1:8000';

let appState = {
  isLoggedIn: false,
  userEmail: null,
  servicios: [],
  mascotas: [],
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupForms();
  lockProtectedTabs();
  updateUserUI();
  loadServicios();
  switchTab('inicio');
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const tabName = link.getAttribute('data-tab');

      if (isTabLocked(tabName)) {
        showAlert('Debes iniciar sesión para acceder a esta sección.', 'error', 3000);
        return;
      }

      switchTab(tabName);
    });
  });

  const logoutButton = document.querySelector('.btn-logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
}

function switchTab(name) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

  const targetSection = document.getElementById(name);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  const activeLink = document.querySelector(`.nav-link[data-tab="${name}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  if (name === 'reporte' && appState.isLoggedIn) {
    preFillReporte();
    renderReporte();
  }

  if (name === 'mascotas' && appState.isLoggedIn) {
    loadMascotas();
  }

  if (name === 'servicios') {
    loadServicios();
  }
}

function isTabLocked(tabName) {
  const protectedTabs = ['servicios', 'mascotas', 'reporte'];
  return protectedTabs.includes(tabName) && !appState.isLoggedIn;
}

function setupForms() {
  document.querySelector('.greeting-form')?.addEventListener('submit', handleGreeting);
  document.querySelector('.register-form')?.addEventListener('submit', handleRegister);
  document.querySelector('.login-form')?.addEventListener('submit', handleLogin);
  document.querySelector('.add-service-form')?.addEventListener('submit', handleAddService);
  document.querySelector('.add-pet-form')?.addEventListener('submit', handleRegisterPet);
  document.querySelector('.pet-search-form')?.addEventListener('submit', handleSearchPets);
  document.querySelector('.report-search-form')?.addEventListener('submit', handleReporte);
}

async function handleGreeting(event) {
  event.preventDefault();
  const nombre = document.getElementById('greeting-name').value.trim();

  if (!nombre) {
    showAlert('Ingresa un nombre para saludar.', 'error', 3000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/bienvenido/${encodeURIComponent(nombre)}`);
    const data = await response.json();

    if (response.ok) {
      showAlert(data.mensaje || `Bienvenido, ${nombre}!`, 'success', 3000);
      event.target.reset();
    } else {
      showAlert(data.mensaje || 'Error al saludar.', 'error', 3000);
    }
  } catch (error) {
    showAlert('Error de conexión con el servidor.', 'error', 3000);
    console.error(error);
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const correo = document.getElementById('register-email').value.trim();
  const contrasena = document.getElementById('register-password').value;
  const confirmContrasena = document.getElementById('register-confirm-password').value;

  if (!correo || !contrasena || !confirmContrasena) {
    showAlert('Completa todos los campos de registro.', 'error', 3000);
    return;
  }

  if (contrasena !== confirmContrasena) {
    showAlert('Las contraseñas no coinciden.', 'error', 3000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });
    const data = await response.json();

    if (response.ok) {
      showAlert('Registro exitoso. Ya puedes iniciar sesión.', 'success', 3000);
      event.target.reset();
    } else {
      showAlert(data.mensaje || 'Error en el registro.', 'error', 3000);
    }
  } catch (error) {
    showAlert('Error de conexión con el servidor.', 'error', 3000);
    console.error(error);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const correo = document.getElementById('login-email').value.trim();
  const contrasena = document.getElementById('login-password').value;

  if (!correo || !contrasena) {
    showAlert('Completa el correo y la contraseña.', 'error', 3000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });
    const data = await response.json();

    if (response.ok) {
      appState.isLoggedIn = true;
      appState.userEmail = correo;
      showAlert('Login exitoso. Acceso concedido.', 'success', 3000);
      event.target.reset();
      unlockProtectedTabs();
      updateUserUI();
      await loadServicios();
      await loadMascotas();
      switchTab('servicios');
    } else {
      showAlert(data.mensaje || 'Credenciales incorrectas.', 'error', 3000);
    }
  } catch (error) {
    showAlert('Error de conexión con el servidor.', 'error', 3000);
    console.error(error);
  }
}

async function handleAddService(event) {
  event.preventDefault();

  const nombre = document.getElementById('service-name').value.trim();
  const precio = parseFloat(document.getElementById('service-price').value);

  if (!nombre || Number.isNaN(precio)) {
    showAlert('Completa el nombre y precio del servicio.', 'error', 3000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/agregar-servicio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio })
    });
    const data = await response.json();

    if (response.ok) {
      showAlert('Servicio agregado correctamente.', 'success', 3000);
      event.target.reset();
      await loadServicios();
    } else {
      showAlert(data.mensaje || 'No se pudo agregar el servicio.', 'error', 3000);
    }
  } catch (error) {
    showAlert('Error de conexión con el servidor.', 'error', 3000);
    console.error(error);
  }
}

async function handleRegisterPet(event) {
  event.preventDefault();

  const correo = appState.userEmail || document.getElementById('pet-email').value.trim();
  const nombre = document.getElementById('pet-name').value.trim();
  const tipo_servicio = document.getElementById('pet-service').value;
  const fecha = document.getElementById('pet-date').value;

  if (!correo || !nombre || !tipo_servicio || !fecha) {
    showAlert('Completa todos los datos de la mascota.', 'error', 3000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/registrar-mascota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, nombre, tipo_servicio, fecha })
    });
    const data = await response.json();

    if (response.ok) {
      showAlert('Mascota registrada correctamente.', 'success', 3000);
      event.target.reset();
      preFillReporte();
      if (appState.isLoggedIn) {
        await loadMascotas();
      }
    } else {
      showAlert(data.mensaje || 'No se pudo registrar la mascota.', 'error', 3000);
    }
  } catch (error) {
    showAlert('Error de conexión con el servidor.', 'error', 3000);
    console.error(error);
  }
}

async function handleSearchPets(event) {
  event.preventDefault();

  if (!appState.isLoggedIn) {
    showAlert('Debes iniciar sesión para buscar mascotas.', 'error', 3000);
    return;
  }

  const query = document.getElementById('pet-search-input').value.trim().toLowerCase();
  await loadMascotas();
  renderMascotas(query);
}

async function handleReporte(event) {
  event.preventDefault();

  if (!appState.isLoggedIn) {
    showAlert('Debes iniciar sesión para ver el reporte.', 'error', 3000);
    return;
  }

  preFillReporte();
  renderReporte();
}

async function loadServicios() {
  try {
    const response = await fetch(`${API_URL}/servicios`);
    const data = await response.json();

    if (response.ok && Array.isArray(data.servicios)) {
      appState.servicios = data.servicios;
      renderServicios();
      updateServiceSelect();
    }
  } catch (error) {
    console.error('Error cargando servicios:', error);
  }
}

async function loadMascotas() {
  if (!appState.isLoggedIn || !appState.userEmail) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/mascotas/${encodeURIComponent(appState.userEmail)}`);
    const data = await response.json();

    if (response.ok && Array.isArray(data.mascotas)) {
      appState.mascotas = data.mascotas;
      renderMascotas();
    }
  } catch (error) {
    showAlert('Error cargando mascotas.', 'error', 3000);
    console.error(error);
  }
}

function renderServicios() {
  const list = document.getElementById('services-list');
  if (!list) return;

  if (!appState.servicios.length) {
    list.innerHTML = '<li class="service-empty">No hay servicios disponibles.</li>';
    return;
  }

  list.innerHTML = appState.servicios.map(servicio => `
    <li class="service-item">
      <div class="service-info">
        <h4>${escapeHTML(servicio.nombre)}</h4>
        <p class="service-price">$${Number(servicio.precio).toFixed(2)}</p>
      </div>
    </li>
  `).join('');
}

function updateServiceSelect() {
  const select = document.getElementById('pet-service');
  if (!select) return;

  const previousValue = select.value;
  select.innerHTML = '<option value="">Selecciona un servicio</option>';

  appState.servicios.forEach(servicio => {
    const option = document.createElement('option');
    option.value = servicio.nombre;
    option.textContent = `${servicio.nombre} - $${Number(servicio.precio).toFixed(2)}`;
    select.appendChild(option);
  });

  select.value = previousValue || '';
}

function renderMascotas(filter = '') {
  const container = document.getElementById('pet-search-results');
  if (!container) return;

  const mascotas = filter
    ? appState.mascotas.filter(mascota =>
        mascota.nombre.toLowerCase().includes(filter) ||
        mascota.correo.toLowerCase().includes(filter) ||
        (mascota.tipo_servicio || '').toLowerCase().includes(filter)
      )
    : appState.mascotas;

  if (!mascotas.length) {
    container.innerHTML = '<p class="empty-message">No hay mascotas para mostrar.</p>';
    return;
  }

  container.innerHTML = mascotas.map(mascota => `
    <div class="pet-card">
      <div class="pet-header">
        <h3>${escapeHTML(mascota.nombre)}</h3>
        <span class="pet-type">${escapeHTML(mascota.tipo_servicio)}</span>
      </div>
      <div class="pet-details">
        <p><strong>Correo:</strong> ${escapeHTML(mascota.correo)}</p>
        <p><strong>Fecha Registro:</strong> ${escapeHTML(mascota.fecha)}</p>
      </div>
    </div>
  `).join('');
}

function preFillReporte() {
  const reportEmail = document.getElementById('report-email');
  const petEmail = document.getElementById('pet-email');

  if (!appState.isLoggedIn) {
    if (reportEmail) {
      reportEmail.value = '';
      reportEmail.readOnly = false;
    }
    if (petEmail) {
      petEmail.value = '';
      petEmail.readOnly = false;
    }
    return;
  }

  if (reportEmail) {
    reportEmail.value = appState.userEmail;
    reportEmail.readOnly = true;
  }

  if (petEmail) {
    petEmail.value = appState.userEmail;
    petEmail.readOnly = true;
  }
}

async function renderReporte() {
  if (!appState.isLoggedIn || !appState.userEmail) {
    showAlert('Debes iniciar sesión para ver el reporte.', 'error', 3000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reporte/${encodeURIComponent(appState.userEmail)}`);
    const data = await response.json();

    if (!response.ok) {
      showAlert(data.mensaje || 'Error al cargar el reporte.', 'error', 3000);
      return;
    }

    const reportContainer = document.getElementById('report-results');
    if (!reportContainer) return;

    const cantidad = Number(data.cantidad_servicios || 0);
    const total = Number(data.total_gastado || 0);
    const servicios = Array.isArray(data.servicios) ? data.servicios : [];

    const serviciosHtml = servicios.length
      ? servicios.map(servicio => `<span class="service-tag">${escapeHTML(servicio)}</span>`).join(' ')
      : '<p class="empty-message">No se han utilizado servicios.</p>';

    reportContainer.innerHTML = `
      <div class="report-stats">
        <div class="stat-box">
          <div class="stat-number">${cantidad}</div>
          <div class="stat-label">Cantidad de Servicios</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">$${total.toFixed(2)}</div>
          <div class="stat-label">Total Gastado</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Correo</div>
          <div class="stat-email">${escapeHTML(data.correo || appState.userEmail)}</div>
        </div>
      </div>
      <div class="report-services">
        <h3>Servicios Utilizados</h3>
        <div class="services-tags">${serviciosHtml}</div>
      </div>
    `;
  } catch (error) {
    showAlert('Error de conexión con el servidor.', 'error', 3000);
    console.error(error);
  }
}

function updateUserUI() {
  const userName = document.querySelector('.user-badge .user-name');
  const logoutButton = document.querySelector('.btn-logout');

  if (userName) {
    userName.textContent = appState.isLoggedIn ? appState.userEmail : 'Usuario';
  }

  if (logoutButton) {
    logoutButton.style.display = appState.isLoggedIn ? 'block' : 'none';
  }

  if (appState.isLoggedIn) {
    unlockProtectedTabs();
    preFillReporte();
  } else {
    lockProtectedTabs();
  }
}

function unlockProtectedTabs() {
  document.querySelectorAll('.nav-link[data-tab="servicios"], .nav-link[data-tab="mascotas"], .nav-link[data-tab="reporte"]')
    .forEach(link => {
      link.style.opacity = '1';
      link.style.pointerEvents = 'auto';
      link.style.cursor = 'pointer';
    });
}

function lockProtectedTabs() {
  document.querySelectorAll('.nav-link[data-tab="servicios"], .nav-link[data-tab="mascotas"], .nav-link[data-tab="reporte"]')
    .forEach(link => {
      link.style.opacity = '0.5';
      link.style.pointerEvents = 'none';
      link.style.cursor = 'not-allowed';
    });
}

function logout() {
  appState.isLoggedIn = false;
  appState.userEmail = null;
  appState.mascotas = [];

  updateUserUI();

  const petSearchResults = document.getElementById('pet-search-results');
  const reportResults = document.getElementById('report-results');
  if (petSearchResults) petSearchResults.innerHTML = '';
  if (reportResults) reportResults.innerHTML = '';

  document.querySelectorAll('form').forEach(form => form.reset());
  preFillReporte();
  switchTab('acceso');
  showAlert('Has cerrado sesión.', 'success', 2000);
}

function showAlert(message, type = 'info', duration = 3000) {
  let alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    alertContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 320px;
    `;
    document.body.appendChild(alertContainer);
  }

  const alert = document.createElement('div');
  alert.style.cssText = `
    padding: 14px 18px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(0,0,0,0.15);
    transition: opacity 0.2s ease;
  `;

  if (type === 'success') alert.style.backgroundColor = '#16a34a';
  else if (type === 'error') alert.style.backgroundColor = '#dc2626';
  else alert.style.backgroundColor = '#2563eb';

  alert.textContent = message;
  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 250);
  }, duration);
}

function escapeHTML(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}
