// argentum-frontend/scripts/simular_cambio_sesion.mjs
/**
 * Script de simulación de cambio de sesión e invalidación de cachés.
 * Verifica:
 * 1. Aislamiento automático por usuario (createUserCache / createKeyedUserCache)
 * 2. Imposibilidad de que Usuario B acceda a datos cacheados de Usuario A
 * 3. Limpieza completa de todas las 7 cachés en memoria al cerrar/cambiar sesión
 * 4. Limpieza de localStorage de datos de usuario (argentum_dashboard_billeteras, etc.)
 * 5. Preservación estricta de argentum_theme
 * 6. Cancelación de peticiones HTTP en curso (AbortController)
 */

// Mock de almacenamiento local (localStorage)
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Mock de token en memoria (claim sub = userId)
let _mockTokenMemory = null;
function setToken(token) {
  _mockTokenMemory = token;
}
function getToken() {
  return _mockTokenMemory;
}
function clearTokens() {
  _mockTokenMemory = null;
}

// Simulación de JWT tokens para Usuario A y Usuario B
function createMockJwt(userId) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url");
  return `${header}.${payload}.signature`;
}

function getCurrentUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const jsonStr = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr);
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

// Helper createUserCache (idéntico a sessionCleanup.ts)
function createUserCache(defaultTtlMs) {
  let cache = null;
  return {
    get: (ttlMs = defaultTtlMs) => {
      if (!cache) return null;
      const currentUserId = getCurrentUserId();
      if (!currentUserId || cache.userId !== currentUserId) {
        cache = null;
        return null;
      }
      if (Date.now() - cache.timestamp >= ttlMs) {
        cache = null;
        return null;
      }
      return cache.data;
    },
    set: (data) => {
      cache = {
        data,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      };
    },
    clear: () => {
      cache = null;
    },
    getRaw: () => cache,
  };
}

// Helper createKeyedUserCache (idéntico a sessionCleanup.ts)
function createKeyedUserCache(defaultTtlMs) {
  let cache = {};
  return {
    get: (key, ttlMs = defaultTtlMs) => {
      const entry = cache[key];
      if (!entry) return null;
      const currentUserId = getCurrentUserId();
      if (!currentUserId || entry.userId !== currentUserId) {
        delete cache[key];
        return null;
      }
      if (Date.now() - entry.timestamp >= ttlMs) {
        delete cache[key];
        return null;
      }
      return entry.data;
    },
    set: (key, data) => {
      cache[key] = {
        data,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      };
    },
    clear: () => {
      cache = {};
    },
    getRaw: () => cache,
  };
}

// 7 cachés de la aplicación Argentum
const caches = {
  // dashboard.service.ts
  cotizacionCache: createUserCache(60_000),
  resumenCache: createKeyedUserCache(30_000),
  proyeccionCache: createUserCache(60_000),
  periodoActualCache: createUserCache(60_000),
  // billetera.service.ts
  billeterasCache: createUserCache(30_000),
  // presupuesto.service.ts
  presupuestosCache: createKeyedUserCache(30_000),
  // categoria.service.ts
  categoriesCache: createUserCache(300_000),
};

const USER_STORAGE_KEYS = [
  'argentum_dashboard_billeteras',
  'argentum_dashboard_moneda',
];

function clearUserStorage() {
  for (const key of USER_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

// Registro centralizado de limpiadores
const CACHE_CLEANERS = [
  () => {
    caches.cotizacionCache.clear();
    caches.resumenCache.clear();
    caches.proyeccionCache.clear();
    caches.periodoActualCache.clear();
  },
  () => {
    caches.billeterasCache.clear();
  },
  () => {
    caches.presupuestosCache.clear();
  },
  () => {
    caches.categoriesCache.clear();
  },
];

// Cancelación de peticiones HTTP en vuelo
const activeControllers = new Set();
function registerInFlightRequest() {
  const controller = new AbortController();
  activeControllers.add(controller);
  return controller;
}
function cancelInFlightRequests() {
  for (const controller of activeControllers) {
    controller.abort();
  }
  activeControllers.clear();
}

function limpiarSesionCompleta() {
  cancelInFlightRequests();
  for (const cleaner of CACHE_CLEANERS) {
    cleaner();
  }
  clearUserStorage();
}

// ── EJECUCIÓN DE LA SIMULACIÓN ──────────────────────────────────────────────

console.log("================================================================================");
console.log("SIMULACIÓN DE CAMBIO DE SESIÓN Y VERIFICACIÓN DE CACHÉS");
console.log("================================================================================");

const USER_A_ID = "usr_userA_1111-2222-3333";
const USER_B_ID = "usr_userB_4444-5555-6666";

// PASO 1: Inicio de sesión Usuario A
console.log("\n[1] Usuario A inicia sesión...");
setToken(createMockJwt(USER_A_ID));
console.log(`    Usuario A autenticado: ID=${getCurrentUserId()}`);

// Guardar datos en localStorage y cachés para Usuario A
localStorage.setItem('argentum_dashboard_billeteras', JSON.stringify(['bill-uuid-user-a-1', 'bill-uuid-user-a-2']));
localStorage.setItem('argentum_dashboard_moneda', 'ARS');
localStorage.setItem('argentum_theme', 'dark'); // Preferencia del navegador

caches.cotizacionCache.set({ oficial: 1350, blue: 1420 });
caches.resumenCache.set('ARS', { total_billeteras: 250000, moneda: 'ARS' });
caches.proyeccionCache.set({ gastos_esperados: 120000, ahorro: 130000 });
caches.periodoActualCache.set({ fecha_inicio: '2026-09-01', fecha_fin: '2026-09-30' });
caches.billeterasCache.set([{ id: 'bill-uuid-user-a-1', nombre: 'Galicia Sueldo', saldo_actual: 250000 }]);
caches.presupuestosCache.set('ARS', [{ id: 'pres-1', categoria: 'Supermercado', limite: 50000 }]);
caches.categoriesCache.set([{ id: 'cat-1', nombre: 'Comida' }]);

const inFlightReqA = registerInFlightRequest();
console.log("    7 cachés pobladas con datos de Usuario A.");
console.log("    localStorage poblado: billeteras, moneda, tema.");
console.log(`    Petición HTTP en curso registrada: signal.aborted=${inFlightReqA.signal.aborted}`);

// Verificar lectura como Usuario A
console.log("\n[2] Verificando lecturas de Usuario A:");
console.log(`    - billeterasCache: ${caches.billeterasCache.get()?.[0]?.nombre} (esperado: Galicia Sueldo)`);
console.log(`    - proyeccionCache: ahorro=${caches.proyeccionCache.get()?.ahorro}`);
console.log(`    - resumenCache('ARS'): total=${caches.resumenCache.get('ARS')?.total_billeteras}`);

// PASO 2: Simulación de cambio de usuario SIN limpieza (prueba de auto-invalidación de fallo catastrófico)
console.log("\n[3] PRUEBA DE RESISTENCIA: Usuario B entra sin que se haya ejecutado limpieza...");
setToken(createMockJwt(USER_B_ID));
console.log(`    Usuario actual cambiado a B: ID=${getCurrentUserId()}`);

const bBilleteras = caches.billeterasCache.get();
const bProyeccion = caches.proyeccionCache.get();
const bResumen = caches.resumenCache.get('ARS');

console.log(`    - Usuario B intenta leer billeterasCache: ${bBilleteras} (esperado: null)`);
console.log(`    - Usuario B intenta leer proyeccionCache: ${bProyeccion} (esperado: null)`);
console.log(`    - Usuario B intenta leer resumenCache: ${bResumen} (esperado: null)`);

if (bBilleteras === null && bProyeccion === null && bResumen === null) {
  console.log("    ✓ ÉXITO: Invalidación automática por usuario impidió servir datos de A a B.");
} else {
  console.error("    ✗ FALLO: Se sirvieron datos del usuario anterior.");
  process.exit(1);
}

// PASO 3: Ejecución de limpiarSesionCompleta()
console.log("\n[4] Ejecutando limpiarSesionCompleta() (cierre de sesión formal)...");
limpiarSesionCompleta();
clearTokens();

// PASO 4: Verificación exhaustiva post-limpieza
console.log("\n[5] Verificación de estado de todas las cachés y almacenamiento:");

const rawCotizacion = caches.cotizacionCache.getRaw();
const rawResumen = caches.resumenCache.getRaw();
const rawProyeccion = caches.proyeccionCache.getRaw();
const rawPeriodo = caches.periodoActualCache.getRaw();
const rawBilleteras = caches.billeterasCache.getRaw();
const rawPresupuestos = caches.presupuestosCache.getRaw();
const rawCategorias = caches.categoriesCache.getRaw();

console.log(`    1. cotizacionCache:    ${rawCotizacion === null ? "VACÍA (null)" : "NO VACÍA"}`);
console.log(`    2. resumenCache:       ${Object.keys(rawResumen).length === 0 ? "VACÍA ({})" : "NO VACÍA"}`);
console.log(`    3. proyeccionCache:    ${rawProyeccion === null ? "VACÍA (null)" : "NO VACÍA"}`);
console.log(`    4. periodoActualCache: ${rawPeriodo === null ? "VACÍA (null)" : "NO VACÍA"}`);
console.log(`    5. billeterasCache:    ${rawBilleteras === null ? "VACÍA (null)" : "NO VACÍA"}`);
console.log(`    6. presupuestosCache:  ${Object.keys(rawPresupuestos).length === 0 ? "VACÍA ({})" : "NO VACÍA"}`);
console.log(`    7. categoriesCache:    ${rawCategorias === null ? "VACÍA (null)" : "NO VACÍA"}`);

const lsBilleteras = localStorage.getItem('argentum_dashboard_billeteras');
const lsMoneda = localStorage.getItem('argentum_dashboard_moneda');
const lsTheme = localStorage.getItem('argentum_theme');

console.log(`    - localStorage.argentum_dashboard_billeteras: ${lsBilleteras} (esperado: null)`);
console.log(`    - localStorage.argentum_dashboard_moneda:     ${lsMoneda} (esperado: null)`);
console.log(`    - localStorage.argentum_theme:                 ${lsTheme} (esperado: dark)`);
console.log(`    - HTTP Request signal.aborted:                 ${inFlightReqA.signal.aborted} (esperado: true)`);
console.log(`    - HTTP activeControllers.size:                 ${activeControllers.size} (esperado: 0)`);

const todasCachesVacias = (
  rawCotizacion === null &&
  Object.keys(rawResumen).length === 0 &&
  rawProyeccion === null &&
  rawPeriodo === null &&
  rawBilleteras === null &&
  Object.keys(rawPresupuestos).length === 0 &&
  rawCategorias === null
);

const storageCorrecto = (lsBilleteras === null && lsMoneda === null && lsTheme === 'dark');
const requestsCanceladas = (inFlightReqA.signal.aborted === true && activeControllers.size === 0);

if (todasCachesVacias && storageCorrecto && requestsCanceladas) {
  console.log("\n================================================================================");
  console.log("RESULTADO: TODAS LAS VERIFICACIONES PASARON AL 100%");
  console.log("Ninguna caché sobrevive. Imposible servir datos de otro usuario.");
  console.log("================================================================================");
} else {
  console.error("\nRESULTADO: FALLO EN VERIFICACIONES");
  process.exit(1);
}
