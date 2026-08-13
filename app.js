// =========================
// NIEBLA IA - MOTOR METEOROLÓGICO REAL
// =========================

const App = {
  ready: false,
  clima: {},
  map: null,
  typing: false,
  localidad: null,
  forecast: []
};

// Localidades de la app
const LOCALIDADES = {
  "Estación Aráoz": {
    lat: -26.83,
    lon: -65.14
  },

  "Tacanas": {
    lat: -26.58,
    lon: -65.33
  },

  "Ranchillos": {
    lat: -26.87,
    lon: -65.15
  },

  "Lastenia": {
    lat: -26.83,
    lon: -65.17
  }
};


// =========================
// SEGURIDAD
// =========================

window.addEventListener("error", e => {
  console.warn("JS Error:", e.message);
});

window.addEventListener("unhandledrejection", e => {
  console.warn("Promise:", e.reason);
});


// =========================
// UI
// =========================

const UI = {

  set(id, value) {
    const el = document.getElementById(id);

    if (el) {
      el.innerHTML = value;
    }
  },

  get(id) {
    return document.getElementById(id);
  },

  show(screen) {

    document
      .querySelectorAll(".pantalla")
      .forEach(p => p.classList.add("oculto"));

    const el = document.getElementById(screen);

    if (el) {
      el.classList.remove("oculto");
    }
  }

};


// =========================
// UTILIDADES
// =========================

const rand = arr => {
  return arr[Math.floor(Math.random() * arr.length)];
};


function escapeHTML(text) {

  return String(text).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

}


function redondear(valor, decimales = 0) {

  if (!Number.isFinite(Number(valor))) {
    return null;
  }

  const factor = 10 ** decimales;

  return Math.round(Number(valor) * factor) / factor;
}


function horaCorta(iso) {

  if (!iso) {
    return "--:--";
  }

  return iso.slice(11, 16);
}


function nombreLocalidadDesdeSelector() {

  const sel = UI.get("selectorLocalidad");

  if (!sel) {
    return "Estación Aráoz";
  }

  const texto =
    (sel.value ||
      sel.options[sel.selectedIndex]?.text ||
      "").trim();

  const nombre = texto.replace(/^📍\s*/, "");

  if (LOCALIDADES[nombre]) {
    return nombre;
  }

  return "Estación Aráoz";
}


function actualizarSeleccionLocalidad(nombre) {

  const sel = UI.get("selectorLocalidad");

  if (!sel) {
    return;
  }

  [...sel.options].forEach(option => {

    const nombreOption =
      option.textContent
        .trim()
        .replace(/^📍\s*/, "");

    option.selected =
      nombreOption === nombre;

  });

}


// =========================
// NAVEGACIÓN
// =========================

function mostrar(id) {

  UI.show(id);

  if (id === "chat") {

    setTimeout(() => {

      const nombre =
        localStorage.getItem("nombreUsuario") ||
        "Usuario";

      saludarBot(nombre);

    }, 200);

  }


  if (id === "mapa" && !App.map) {

    setTimeout(initMapa, 300);

  }


  if (id === "registros") {

    cargarCuriosidades();

  }

}


// =========================
// VOZ
// =========================

function hablar(texto) {

  try {

    if (!("speechSynthesis" in window)) {
      return;
    }

    speechSynthesis.cancel();

    const u =
      new SpeechSynthesisUtterance(texto);

    u.lang = "es-AR";
    u.rate = 1;

    speechSynthesis.speak(u);

  } catch {}

}


// =========================
// NEBULAX
// =========================

function preguntarIA() {

  const input = UI.get("pregunta");

  if (!input) {
    return;
  }

  const text =
    input.value.trim();

  if (!text) {
    return;
  }

  responderIA(text);

  input.value = "";

}


function responderIA(texto) {

  const chat =
    UI.get("chatMensajes");

  if (!chat || App.typing) {
    return;
  }

  App.typing = true;

  const q =
    texto.toLowerCase();

  const riesgo =
    App.clima.riesgo ?? 0;

  const temp =
    App.clima.temp;

  const humedad =
    App.clima.humedad;

  const viento =
    App.clima.viento;

  let resp =
    "No entendí 😅";


  if (q.includes("hola")) {

    resp = rand([
      "Hola 😎",
      "Sistema meteorológico activo 🌫️",
      "Nebulax online 🤖"
    ]);

  }

  else if (
    q.includes("niebla") ||
    q.includes("riesgo")
  ) {

    resp =
      `En ${App.localidad || "la zona seleccionada"} ` +
      `el riesgo actual de niebla es ${riesgo}%. ` +
      `${descripcionRiesgo(riesgo)} 🌫️`;

  }

  else if (q.includes("temperatura")) {

    resp =
      `La temperatura actual es de ${temp ?? "--"}°C.`;

  }

  else if (q.includes("humedad")) {

    resp =
      `La humedad relativa actual es de ${humedad ?? "--"}%.`;

  }

  else if (q.includes("viento")) {

    resp =
      `El viento actual es de ${viento ?? "--"} km/h.`;

  }

  else if (
    q.includes("conductor") ||
    q.includes("manejar")
  ) {

    resp =
      `Modo conductor: ${
        riesgo >= 70
          ? "peligro, visibilidad reducida."
          : riesgo >= 40
            ? "precaución."
            : "condiciones normales."
      }`;

  }

  else if (
    q.includes("por qué") ||
    q.includes("porque")
  ) {

    resp = explicarRiesgo();

  }


  chat.innerHTML +=
    `<div class="mensaje-usuario">
      ${escapeHTML(texto)}
    </div>`;


  setTimeout(() => {

    chat.innerHTML +=
      `<div class="mensaje-ia">
        Escribiendo...
      </div>`;

    chat.scrollTop =
      chat.scrollHeight;


    setTimeout(() => {

      if (chat.lastElementChild) {

        chat.lastElementChild.innerHTML =
          escapeHTML(resp);

      }

      hablar(resp);

      App.typing = false;

      chat.scrollTop =
        chat.scrollHeight;

    }, 600);

  }, 250);

}


// =========================
// USUARIO
// =========================

function cargarUsuario() {

  let nombre =
    localStorage.getItem("nombreUsuario");


  if (!nombre) {

    nombre =
      prompt("¿Cómo te llamás?");

    localStorage.setItem(
      "nombreUsuario",
      nombre || "Usuario"
    );

  }


  actualizarBienvenida();

  saludarBot(
    nombre || "Usuario"
  );

}


function saludarBot(nombre) {

  const chat =
    UI.get("chatMensajes");

  if (!chat) {
    return;
  }

  chat.innerHTML = `
    <div class="mensaje-ia">
      🤖 Hola ${escapeHTML(nombre)}, Nebulax está activo.
    </div>
  `;

}


function actualizarBienvenida() {

  const el =
    UI.get("bienvenidaInicio");

  const nombre =
    localStorage.getItem("nombreUsuario") ||
    "Usuario";

  if (el) {

    el.innerText =
      `¡Bienvenido, ${nombre}!`;

  }

}


// =========================
// ⭐ MOTOR DE RIESGO DE NIEBLA
// =========================

function calcularRiesgoNiebla(datos) {

  const {
    temp,
    humedad,
    dew,
    viento,
    hora,
    weatherCode,
    visibilidad
  } = datos;


  let score = 0;

  const factores = [];


  // HUMEDAD

  if (humedad >= 97) {

    score += 32;

    factores.push(
      "humedad muy alta"
    );

  }

  else if (humedad >= 93) {

    score += 27;

    factores.push(
      "humedad alta"
    );

  }

  else if (humedad >= 88) {

    score += 20;

    factores.push(
      "humedad elevada"
    );

  }

  else if (humedad >= 80) {

    score += 10;

    factores.push(
      "humedad moderada-alta"
    );

  }


  // PUNTO DE ROCÍO

  if (
    Number.isFinite(temp) &&
    Number.isFinite(dew)
  ) {

    const spread =
      temp - dew;


    if (spread <= 0.5) {

      score += 30;

      factores.push(
        "temperatura casi igual al punto de rocío"
      );

    }

    else if (spread <= 1.5) {

      score += 25;

      factores.push(
        "aire muy próximo a saturación"
      );

    }

    else if (spread <= 3) {

      score += 17;

      factores.push(
        "aire próximo a saturación"
      );

    }

    else if (spread <= 5) {

      score += 7;

    }

  }


  // VIENTO

  if (viento <= 3) {

    score += 18;

    factores.push(
      "viento muy débil"
    );

  }

  else if (viento <= 6) {

    score += 13;

    factores.push(
      "viento débil"
    );

  }

  else if (viento <= 10) {

    score += 6;

  }


  // HORARIO

  if (Number.isFinite(hora)) {

    if (hora >= 3 && hora <= 8) {

      score += 10;

      factores.push(
        "horario favorable"
      );

    }

    else if (hora >= 0 && hora < 3) {

      score += 5;

    }

  }


  // VISIBILIDAD

  if (Number.isFinite(visibilidad)) {

    if (visibilidad <= 200) {

      score += 12;

      factores.push(
        "visibilidad muy baja"
      );

    }

    else if (visibilidad <= 500) {

      score += 8;

      factores.push(
        "visibilidad reducida"
      );

    }

    else if (visibilidad <= 1000) {

      score += 4;

    }

  }


  // CÓDIGO METEOROLÓGICO
  // 45 = niebla
  // 48 = niebla con escarcha

  if (
    weatherCode === 45 ||
    weatherCode === 48
  ) {

    score += 20;

    factores.push(
      "el pronóstico meteorológico indica niebla"
    );

  }


  score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );


  if (
    (weatherCode === 45 ||
      weatherCode === 48) &&
    score < 80
  ) {

    score = 80;

  }


  return {
    score,
    factores: [
      ...new Set(factores)
    ]
  };

}


function categoriaRiesgo(riesgo) {

  if (riesgo >= 70) {
    return "ALTO";
  }

  if (riesgo >= 40) {
    return "MODERADO";
  }

  return "BAJO";

}


function descripcionRiesgo(riesgo) {

  if (riesgo >= 70) {

    return "Alta probabilidad de niebla y posible reducción importante de visibilidad.";

  }

  if (riesgo >= 40) {

    return "Existen condiciones favorables para la formación de niebla.";

  }

  return "Las condiciones actuales son poco favorables para la formación de niebla.";

}


function explicarRiesgo() {

  const c =
    App.clima;


  if (
    !c ||
    !Number.isFinite(c.riesgo)
  ) {

    return "Todavía no tengo datos meteorológicos actualizados.";

  }


  const factores =
    c.factores?.length
      ? c.factores.join(", ")
      : "las variables meteorológicas actuales";


  return (
    `El riesgo es ${c.riesgo}% ` +
    `porque se analizaron ${factores}.`
  );

}
// =========================
// PUNTO DE ROCÍO
// =========================

function calcularPuntoRocio(temp, humedad) {

  if (
    !Number.isFinite(temp) ||
    !Number.isFinite(humedad) ||
    humedad <= 0
  ) {
    return null;
  }

  // Fórmula de Magnus
  const a = 17.62;
  const b = 243.12;

  const gamma =
    Math.log(humedad / 100) +
    (a * temp) / (b + temp);

  return (b * gamma) / (a - gamma);
}


// =========================
// 🌦️ CLIMA REAL
// =========================

async function cargarClima() {

  const nombre =
    nombreLocalidadDesdeSelector();

  const coords =
    LOCALIDADES[nombre];

  if (!coords) {
    return;
  }


  App.localidad =
    nombre;

  localStorage.setItem(
    "localidad",
    nombre
  );

  actualizarSeleccionLocalidad(
    nombre
  );


  // API GRATUITA DE OPEN-METEO
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${coords.lat}` +
    `&longitude=${coords.lon}` +
    `&current=` +
    `temperature_2m,` +
    `relative_humidity_2m,` +
    `wind_speed_10m,` +
    `pressure_msl,` +
    `uv_index,` +
    `weather_code,` +
    `is_day` +
    `&hourly=` +
    `temperature_2m,` +
    `relative_humidity_2m,` +
    `dew_point_2m,` +
    `wind_speed_10m,` +
    `pressure_msl,` +
    `visibility,` +
    `uv_index,` +
    `weather_code` +
    `&forecast_days=2` +
    `&timezone=auto`;


  try {

    UI.set(
      "estadoNiebla",
      "🌫️ Analizando..."
    );


    const res =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (!res.ok) {

      throw new Error(
        `HTTP ${res.status}`
      );

    }


    const d =
      await res.json();


    if (
      !d.current ||
      !d.hourly
    ) {

      throw new Error(
        "La API no devolvió datos meteorológicos."
      );

    }


    const current =
      d.current;

    const hourly =
      d.hourly;


    // Buscar la hora actual
    const indice =
      encontrarIndiceHorario(
        hourly.time,
        current.time
      );


    // =========================
    // DATOS ACTUALES
    // =========================

    const temp =
      Number(
        current.temperature_2m
      );


    const humedad =
      Number(
        current.relative_humidity_2m
      );


    const viento =
      Number(
        current.wind_speed_10m
      );


    const presion =
      Number(
        current.pressure_msl
      );


    const uv =
      Number(
        current.uv_index
      );


    const weatherCode =
      Number(
        current.weather_code
      );


    // Punto de rocío
    const dewDesdeAPI =
      Number(
        hourly.dew_point_2m?.[indice]
      );


    const dew =
      Number.isFinite(
        dewDesdeAPI
      )
        ? dewDesdeAPI
        : calcularPuntoRocio(
            temp,
            humedad
          );


    // Visibilidad
    const visibilidad =
      Number(
        hourly.visibility?.[indice]
      );


    // Hora actual
    const horaActual =
      new Date(
        current.time
      ).getHours();


    // =========================
    // 🧠 CALCULAR RIESGO
    // =========================

    const riesgoData =
      calcularRiesgoNiebla({

        temp,
        humedad,
        dew,
        viento,
        hora: horaActual,
        weatherCode,
        visibilidad

      });


    // =========================
    // GUARDAR DATOS
    // =========================

    App.clima = {

      temp:
        redondear(temp),

      humedad:
        redondear(humedad),

      viento:
        redondear(viento),

      presion:
        redondear(presion),

      uv:
        redondear(uv, 1),

      dew:
        redondear(dew, 1),

      visibilidad:
        Number.isFinite(
          visibilidad
        )
          ? Math.round(
              visibilidad
            )
          : null,

      weatherCode,

      riesgo:
        riesgoData.score,

      factores:
        riesgoData.factores,

      actualizado:
        current.time

    };


    // =========================
    // PRONÓSTICO
    // =========================

    App.forecast =
      construirPronostico(
        hourly,
        indice
      );


    // =========================
    // ACTUALIZAR APP
    // =========================

    actualizarDashboard();

    actualizarForecast();

    actualizarConduccion();

    actualizarUltimaActualizacion();


    if (App.map) {

      actualizarMapaConDatosReales();

    }


    console.log(
      "🌫️ NIEBLA IA - DATOS REALES:",
      App.clima
    );


  }

  catch (e) {

    console.warn(
      "Error obteniendo clima:",
      e
    );


    UI.set(
      "estadoNiebla",
      "⚠️ Sin datos meteorológicos"
    );


    UI.set(
      "riesgo",
      "--%"
    );

  }

}


// =========================
// BUSCAR HORA MÁS CERCANA
// =========================

function encontrarIndiceHorario(
  times,
  currentTime
) {

  if (
    !Array.isArray(times) ||
    !times.length
  ) {

    return 0;

  }


  // Primero buscamos coincidencia exacta
  const exacto =
    times.indexOf(
      currentTime
    );


  if (exacto >= 0) {

    return exacto;

  }


  // Si no existe, buscamos la más cercana
  let mejor = 0;

  let diferencia =
    Infinity;


  const objetivo =
    new Date(
      currentTime
    ).getTime();


  times.forEach(
    (t, i) => {

      const diff =
        Math.abs(
          new Date(t).getTime() -
          objetivo
        );


      if (
        diff < diferencia
      ) {

        diferencia =
          diff;

        mejor =
          i;

      }

    }
  );


  return mejor;

}


// =========================
// 📅 CONSTRUIR PRONÓSTICO
// =========================

function construirPronostico(
  hourly,
  indiceActual
) {

  const resultado = [];


  for (
    let i = indiceActual;
    i < Math.min(
      indiceActual + 12,
      hourly.time.length
    );
    i++
  ) {

    const temp =
      Number(
        hourly.temperature_2m?.[i]
      );


    const humedad =
      Number(
        hourly.relative_humidity_2m?.[i]
      );


    const dew =
      Number(
        hourly.dew_point_2m?.[i]
      );


    const viento =
      Number(
        hourly.wind_speed_10m?.[i]
      );


    const visibilidad =
      Number(
        hourly.visibility?.[i]
      );


    const weatherCode =
      Number(
        hourly.weather_code?.[i]
      );


    const hora =
      new Date(
        hourly.time[i]
      ).getHours();


    // Calcular riesgo para cada hora
    const riesgoData =
      calcularRiesgoNiebla({

        temp,
        humedad,
        dew,
        viento,
        hora,
        weatherCode,
        visibilidad

      });


    resultado.push({

      time:
        hourly.time[i],

      temp:
        redondear(temp),

      humedad:
        redondear(humedad),

      dew:
        redondear(dew, 1),

      viento:
        redondear(viento),

      visibilidad:
        Number.isFinite(
          visibilidad
        )
          ? Math.round(
              visibilidad
            )
          : null,

      weatherCode,

      riesgo:
        riesgoData.score,

      categoria:
        categoriaRiesgo(
          riesgoData.score
        )

    });

  }


  return resultado;

}


// =========================
// 📊 ACTUALIZAR DASHBOARD
// =========================

function actualizarDashboard() {

  const c =
    App.clima;


  const riesgo =
    c.riesgo;


  // Temperatura
  UI.set(
    "temp",
    `${c.temp ?? "--"}°C`
  );


  // Humedad
  UI.set(
    "humedad",
    `${c.humedad ?? "--"}%`
  );


  // Viento
  UI.set(
    "viento",
    `${c.viento ?? "--"} km/h`
  );


  // Punto de rocío
  UI.set(
    "puntoRocio",
    c.dew != null
      ? `${c.dew}°C`
      : "--"
  );


  // UV
  UI.set(
    "uv",
    c.uv != null
      ? c.uv
      : "--"
  );


  // Presión
  UI.set(
    "presion",
    c.presion != null
      ? `${c.presion} hPa`
      : "--"
  );


  // Visibilidad
  UI.set(
    "visibilidad",
    c.visibilidad != null
      ? formatearVisibilidad(
          c.visibilidad
        )
      : "--"
  );


  // Localidad
  UI.set(
    "ubicacionActual",
    `📍 ${escapeHTML(
      App.localidad ||
      "Zona seleccionada"
    )}`
  );


  // Estado de niebla
  UI.set(
    "estadoNiebla",
    `${
      riesgo >= 70
        ? "🌫️"
        : riesgo >= 40
          ? "🌁"
          : "☁️"
    } Niebla ${
      categoriaRiesgo(
        riesgo
      ).toLowerCase()
    }`
  );


  // Porcentaje
  UI.set(
    "riesgo",
    `${riesgo}%`
  );


  // Texto ALTO / MODERADO / BAJO
  const estado =
    document.querySelector(
      ".hero-riesgo .estado"
    );


  if (estado) {

    estado.innerText =
      categoriaRiesgo(
        riesgo
      );

  }


  // Barra de riesgo
  const barra =
    document.querySelector(
      ".hero-riesgo .barra"
    );


  if (barra) {

    barra.style.width =
      `${riesgo}%`;

  }


  // Explicación
  const texto =
    document.querySelector(
      ".riesgo-texto"
    );


  if (texto) {

    texto.innerText =
      descripcionRiesgo(
        riesgo
      );

  }


  // Confianza
  const confianza =
    document.querySelector(
      ".hero-riesgo small strong"
    );


  if (confianza) {

    const tieneDatos =
      [
        c.temp,
        c.humedad,
        c.viento,
        c.dew
      ].every(
        Number.isFinite
      );


    confianza.innerText =
      tieneDatos
        ? "Alta"
        : "Media";

  }

}


// =========================
// 👁️ VISIBILIDAD
// =========================

function formatearVisibilidad(
  metros
) {

  if (
    metros >= 1000
  ) {

    return `${
      (
        metros / 1000
      ).toFixed(
        metros >= 10000
          ? 0
          : 1
      )
    } km`;

  }


  return `${Math.round(
    metros
  )} m`;

}


// =========================
// 🕐 ACTUALIZACIÓN
// =========================

function actualizarUltimaActualizacion() {

  const el =
    UI.get(
      "ultimaActualizacion"
    );


  if (
    !el ||
    !App.clima.actualizado
  ) {

    return;

  }


  const hora =
    horaCorta(
      App.clima.actualizado
    );


  el.innerText =
    `a las ${hora}`;

}
// =========================
// 📅 PRONÓSTICO POR HORAS
// =========================

function iconoPorRiesgo(riesgo) {

  if (riesgo >= 70) {
    return "🌫️";
  }

  if (riesgo >= 40) {
    return "🌁";
  }

  return "☁️";
}


function actualizarForecast() {

  const forecast =
    UI.get(
      "forecastContainer"
    );


  if (!forecast) {
    return;
  }


  if (!App.forecast.length) {

    forecast.innerHTML =
      "<p>No hay pronóstico disponible.</p>";

    return;

  }


  forecast.innerHTML =
    App.forecast.map(
      (f, i) => `

        <div
          class="forecast-item"
          title="
            Humedad ${f.humedad}%
            · Viento ${f.viento} km/h
          "
        >

          <div class="hora">
            ${
              i === 0
                ? "Ahora"
                : horaCorta(f.time)
            }
          </div>

          <div class="icono">
            ${iconoPorRiesgo(f.riesgo)}
          </div>

          <div class="temp">
            ${f.temp}°
          </div>

          <small>
            ${f.riesgo}% niebla
          </small>

        </div>

      `
    ).join("");

}


// =========================
// 🚗 MODO CONDUCTOR
// =========================

function actualizarConduccion() {

  const estado =
    UI.get(
      "estadoConduccion"
    );


  const consejo =
    UI.get(
      "consejoConduccion"
    );


  const visibilidad =
    UI.get(
      "visibilidadConduccion"
    );


  const zona =
    UI.get(
      "zonaConduccion"
    );


  const riesgo =
    App.clima.riesgo ?? 0;


  // ESTADO

  if (estado) {

    if (riesgo >= 70) {

      estado.innerText =
        "🔴 Peligro";

    }

    else if (riesgo >= 40) {

      estado.innerText =
        "🟡 Precaución";

    }

    else {

      estado.innerText =
        "🟢 Seguro";

    }

  }


  // CONSEJO

  if (consejo) {

    if (riesgo >= 70) {

      consejo.innerText =
        "Reducí la velocidad, usá luces bajas y aumentá la distancia de seguridad.";

    }

    else if (riesgo >= 40) {

      consejo.innerText =
        "Atención en ruta: pueden aparecer bancos de niebla.";

    }

    else {

      consejo.innerText =
        "Condiciones meteorológicas poco favorables para niebla.";

    }

  }


  // VISIBILIDAD

  if (visibilidad) {

    visibilidad.innerText =
      App.clima.visibilidad != null
        ? formatearVisibilidad(
            App.clima.visibilidad
          )
        : "--";

  }


  // ZONA

  if (zona) {

    zona.innerText =
      `${
        App.localidad || "--"
      } · riesgo ${riesgo}%`;

  }

}


// =========================
// 📊 ESTIMACIÓN CONDUCTOR
// =========================

function verEstimacion() {

  const resultado =
    UI.get(
      "resultadoEstimacion"
    );


  if (!resultado) {
    return;
  }


  const riesgo =
    App.clima.riesgo ?? 0;


  if (riesgo >= 70) {

    resultado.innerText =
      "🔴 Riesgo alto de niebla. Visibilidad potencialmente muy reducida.";

  }

  else if (riesgo >= 40) {

    resultado.innerText =
      "🟡 Riesgo moderado. Pueden formarse bancos de niebla.";

  }

  else {

    resultado.innerText =
      "🟢 Riesgo bajo de niebla con las condiciones actuales.";

  }

}


// =========================
// 📷 CÁMARA
// =========================

function abrirCamara() {

  const input =
    UI.get(
      "camaraInput"
    );


  if (input) {
    input.click();
  }

}


// =========================
// 🗺️ MAPA
// =========================

function initMapa() {

  const el =
    UI.get(
      "mapaContainer"
    );


  if (
    !el ||
    typeof L === "undefined"
  ) {

    return;

  }


  if (App.map) {
    return;
  }


  App.map =
    L.map(
      "mapaContainer"
    ).setView(
      [-26.75, -65.25],
      10
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "OpenStreetMap"
    }
  ).addTo(
    App.map
  );


  cargarMapaReal();

}


// =========================
// 🌫️ DATOS REALES EN MAPA
// =========================

async function cargarMapaReal() {

  if (!App.map) {
    return;
  }


  for (
    const [
      nombre,
      coords
    ]
    of Object.entries(
      LOCALIDADES
    )
  ) {

    try {

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${coords.lat}` +
        `&longitude=${coords.lon}` +
        `&current=` +
        `temperature_2m,` +
        `relative_humidity_2m,` +
        `wind_speed_10m,` +
        `weather_code` +
        `&hourly=` +
        `dew_point_2m,` +
        `visibility` +
        `&forecast_days=1` +
        `&timezone=auto`;


      const res =
        await fetch(
          url,
          {
            cache: "no-store"
          }
        );


      if (!res.ok) {
        continue;
      }


      const d =
        await res.json();


      const current =
        d.current;


      const i =
        encontrarIndiceHorario(
          d.hourly?.time || [],
          current.time
        );


      const temp =
        Number(
          current.temperature_2m
        );


      const humedad =
        Number(
          current.relative_humidity_2m
        );


      const viento =
        Number(
          current.wind_speed_10m
        );


      const dew =
        Number(
          d.hourly?.dew_point_2m?.[i]
        );


      const visibilidad =
        Number(
          d.hourly?.visibility?.[i]
        );


      const hora =
        new Date(
          current.time
        ).getHours();


      const riesgoData =
        calcularRiesgoNiebla({

          temp,
          humedad,
          dew,
          viento,
          hora,
          weatherCode:
            Number(
              current.weather_code
            ),
          visibilidad

        });


      const riesgo =
        riesgoData.score;


      // Marcador

      const color =
        riesgo >= 70
          ? "red"
          : riesgo >= 40
            ? "orange"
            : "green";


      L.circleMarker(
        [
          coords.lat,
          coords.lon
        ],
        {

          radius: 10,

          color,

          fillColor: color,

          fillOpacity: 0.65

        }
      )
        .addTo(
          App.map
        )
        .bindPopup(

          `<strong>
            ${escapeHTML(nombre)}
          </strong>
          <br>
          🌫️ Riesgo de niebla:
          <strong>${riesgo}%</strong>
          <br>
          🌡️ Temperatura:
          ${Math.round(temp)}°C
          <br>
          💧 Humedad:
          ${Math.round(humedad)}%
          <br>
          🌬️ Viento:
          ${Math.round(viento)} km/h`

        );

    }

    catch (e) {

      console.warn(
        `No se pudo actualizar ${nombre}:`,
        e
      );

    }

  }

}


// Esta función queda preparada
// para futuras actualizaciones del mapa.

function actualizarMapaConDatosReales() {

  // El mapa se actualiza
  // cuando se vuelve a abrir.

}


// =========================
// 📍 CAMBIAR LOCALIDAD
// =========================

function cambiarLocalidad() {

  const nombre =
    nombreLocalidadDesdeSelector();


  localStorage.setItem(
    "localidad",
    nombre
  );


  // Volver a consultar
  // el clima real.

  cargarClima();

}


// =========================
// ⚙️ AJUSTES
// =========================

function cambiarColor(color) {

  document.documentElement
    .style
    .setProperty(
      "--color",
      color
    );


  document.documentElement
    .style
    .setProperty(
      "--color-principal",
      color
    );


  localStorage.setItem(
    "temaColor",
    color
  );

}


function guardarNombre() {

  const input =
    UI.get(
      "inputNombre"
    );


  if (!input) {
    return;
  }


  const nombre =
    input.value.trim();


  if (!nombre) {
    return;
  }


  localStorage.setItem(
    "nombreUsuario",
    nombre
  );


  actualizarBienvenida();

  saludarBot(
    nombre
  );

}


function abrirAjustes() {

  mostrar(
    "ajustes"
  );

}


// =========================
// 📚 CURIOSIDADES
// =========================

function cargarCuriosidades() {

  const lista =
    UI.get(
      "listaCuriosidades"
    );


  if (!lista) {
    return;
  }


  const data =
    JSON.parse(
      localStorage.getItem(
        "curiosidades"
      )
    ) || [];


  lista.innerHTML =
    data
      .map(
        c =>
          `<li>
            🌫️ ${escapeHTML(c)}
          </li>`
      )
      .join("");

}


function agregarCuriosidad() {

  const input =
    UI.get(
      "inputCuriosidad"
    );


  if (!input) {
    return;
  }


  const texto =
    input.value.trim();


  if (!texto) {
    return;
  }


  const data =
    JSON.parse(
      localStorage.getItem(
        "curiosidades"
      )
    ) || [];


  data.push(
    texto
  );


  localStorage.setItem(
    "curiosidades",
    JSON.stringify(data)
  );


  input.value = "";


  cargarCuriosidades();

}


// =========================
// 🎤 RECONOCIMIENTO DE VOZ
// =========================

function escuchar() {

  const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SR) {

    alert(
      "El reconocimiento de voz no está soportado en este navegador."
    );

    return;

  }


  const rec =
    new SR();


  rec.lang =
    "es-AR";


  UI.set(
    "textoEscuchado",
    "🎤 Escuchando..."
  );


  rec.start();


  rec.onresult =
    e => {

      const texto =
        e.results[0][0]
          .transcript;


      UI.set(
        "textoEscuchado",
        "Vos: " +
        escapeHTML(texto)
      );


      responderIA(
        texto
      );

    };


  rec.onerror =
    () => {

      UI.set(
        "textoEscuchado",
        "No pude reconocer la voz."
      );

    };

}


// =========================
// 🚀 INICIO DE LA APP
// =========================

window.onload =
  async () => {

    // Mostrar inicio

    UI.show(
      "inicio"
    );


    // Usuario

    cargarUsuario();


    // Color guardado

    const color =
      localStorage.getItem(
        "temaColor"
      );


    if (color) {

      cambiarColor(
        color
      );

    }


    // Nombre guardado

    const input =
      UI.get(
        "inputNombre"
      );


    if (input) {

      input.value =
        localStorage.getItem(
          "nombreUsuario"
        ) || "";

    }


    // Localidad guardada

    const localidadGuardada =
      localStorage.getItem(
        "localidad"
      );


    const localidadInicial =
      localidadGuardada &&
      LOCALIDADES[
        localidadGuardada
      ]

        ? localidadGuardada

        : "Estación Aráoz";


    App.localidad =
      localidadInicial;


    actualizarSeleccionLocalidad(
      localidadInicial
    );


    // Selector de localidad

    const sel =
      UI.get(
        "selectorLocalidad"
      );


    if (sel) {

      sel.addEventListener(
        "change",
        cambiarLocalidad
      );

    }


    // ⭐ CARGAR CLIMA REAL

    await cargarClima();


    App.ready =
      true;

  };
  function abrirMenu() {
    document.getElementById("sidebar").classList.add("menu-abierto");
    document.getElementById("overlay").classList.add("overlay-activo");
}

function cerrarMenu() {
    document.getElementById("sidebar").classList.remove("menu-abierto");
    document.getElementById("overlay").classList.remove("overlay-activo");
}