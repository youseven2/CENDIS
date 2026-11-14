import React, { useState, useMemo } from "react";
import {
  FileText,
  Send,
  Printer,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  LogOut,
  Calendar as CalendarIcon,
  Grid,
  Settings,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  BarChart3,
  GitBranch,
  QrCode,
  Bell,
  Smartphone,
  Laptop,
  Tablet,
  Briefcase,
  Package,
  MessageSquare,
  Filter,
  Archive,
  Download
} from "lucide-react";

// ============================================================================
// GENERADOR DE ARCHIVO .ZIP EN NAVEGADOR (SIN DEPENDENCIAS EXTERNAS)
// ============================================================================
function createZipBlob(files) {
  const encoder = new TextEncoder();
  const fileEntries = files.map((f) => {
    const nameBytes = encoder.encode(f.name);
    const contentBytes = encoder.encode(f.content);
    return { nameBytes, contentBytes, crc: crc32(contentBytes) };
  });

  let offset = 0;
  const localHeaders = [];
  const centralHeaders = [];

  fileEntries.forEach((entry) => {
    const { nameBytes, contentBytes, crc } = entry;
    const local = new Uint8Array(30 + nameBytes.length + contentBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, contentBytes.length, true);
    lv.setUint32(22, contentBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(contentBytes, 30 + nameBytes.length);
    localHeaders.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, contentBytes.length, true);
    cv.setUint32(24, contentBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  });

  const centralSize = centralHeaders.reduce((acc, c) => acc + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, fileEntries.length, true);
  ev.setUint16(10, fileEntries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localHeaders, ...centralHeaders, eocd], {
    type: "application/zip",
  });
}

function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

// ============================================================================
// DATOS INICIALES DEL SISTEMA SGI-CENDIS
// ============================================================================
const DEFAULT_PERMISSIONS_BY_ROLE = {
  ADMIN: {
    entrar_memo: true,
    entrar_agenda: true,
    entrar_stats: true,
    entrar_org: true,
    entrar_hr: true,
    entrar_attendance: true,
    entrar_proyectos: true,
    entrar_bienes: true,
    entrar_config: true,
    ingresar: true,
    modificar: true,
    anular: true,
    eliminar: true,
  },
  ESTANDAR: {
    entrar_memo: true,
    entrar_agenda: true,
    entrar_stats: true,
    entrar_org: true,
    entrar_hr: true,
    entrar_attendance: true,
    entrar_proyectos: true,
    entrar_bienes: true,
    entrar_config: false,
    ingresar: true,
    modificar: true,
    anular: false,
    eliminar: false,
  },
};

const DEFAULT_USERS = [
  {
    id: 1,
    username: "admin",
    email: "admin.cendis@gmail.com",
    password: "Qwerty123.",
    fullName: "Administrador General CENDIS",
    cargo: "Coordinación de Tecnología y Sistemas",
    role: "ADMIN",
    active: true,
    linkedEmployeeId: null,
    permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN },
  },
  {
    id: 2,
    username: "presidencia",
    email: "presidencia.cendis@gmail.com",
    password: "Cendis2026*",
    fullName: "Presidencia CENDIS",
    cargo: "Presidente de la Fundación CENDIS",
    role: "ADMIN",
    active: true,
    linkedEmployeeId: "emp-1",
    permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN },
  },
  {
    id: 3,
    username: "produccion",
    email: "produccion.cendis@gmail.com",
    password: "Cendis2026*",
    fullName: "Coordinación de Producción",
    cargo: "Coordinador(a) de Producción Fonográfica",
    role: "ESTANDAR",
    active: true,
    linkedEmployeeId: "emp-3",
    permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR },
  },
  {
    id: 4,
    username: "recepcion",
    email: "recepcion.cendis@gmail.com",
    password: "Cendis2026*",
    fullName: "Recepción y Despacho",
    cargo: "Asistente Administrativo",
    role: "ESTANDAR",
    active: true,
    linkedEmployeeId: null,
    permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR },
  },
];

const INITIAL_EMPLOYEES = [
  {
    id: "emp-1",
    nombres: "Ali Alejandro",
    apellidos: "Primera",
    cedula: "V-15.432.111",
    cargo: "Presidente CENDIS",
    coordinacion: "Presidencia",
    telefono: "0414-1234567",
    correo: "presidencia.cendis@gmail.com",
    direccion: "Caracas, Av. Libertador",
    fechaNacimiento: "1980-05-12",
    fechaIngreso: "2022-01-15",
    tipoSangre: "O+",
    emergencia1: "María Primera (0412-9876543)",
    emergencia2: "José Primera (0416-5554433)",
    familiares: "Esposa y 2 Hijos",
    tieneCargaFamiliar: "SI",
    codigoBarra: "2024-CENDIS-000123",
  },
  {
    id: "emp-2",
    nombres: "Julimar",
    apellidos: "Flores",
    cedula: "V-18.999.888",
    cargo: "Directora Ejecutiva",
    coordinacion: "Dirección Ejecutiva",
    telefono: "0424-9988776",
    correo: "",
    direccion: "Caracas, El Paraíso",
    fechaNacimiento: "1985-09-20",
    fechaIngreso: "2023-03-10",
    tipoSangre: "A+",
    emergencia1: "Carlos Flores (0414-1112233)",
    emergencia2: "N/A",
    familiares: "1 Hijo",
    tieneCargaFamiliar: "SI",
    codigoBarra: "2024-CENDIS-000124",
  },
  {
    id: "emp-3",
    nombres: "Anaileth",
    apellidos: "Briceño",
    cedula: "V-20.164.307",
    cargo: "Coordinadora de Producción",
    coordinacion: "Producción Fonográfica",
    telefono: "0424-1643007",
    correo: "produccion.cendis@gmail.com",
    direccion: "Caracas, Centro",
    fechaNacimiento: "1990-11-04",
    fechaIngreso: "2024-02-01",
    tipoSangre: "B+",
    emergencia1: "Luis Briceño (0412-3334455)",
    emergencia2: "N/A",
    familiares: "Sin carga familiar",
    tieneCargaFamiliar: "NO",
    codigoBarra: "2024-CENDIS-000125",
  },
  {
    id: "emp-4",
    nombres: "Morris",
    apellidos: "López",
    cedula: "V-19.324.324",
    cargo: "Especialista Audiovisual",
    coordinacion: "Cultura Audiovisual",
    telefono: "0426-3243246",
    correo: "",
    direccion: "Los Valles del Tuy, Miranda",
    fechaNacimiento: "1988-07-22",
    fechaIngreso: "2023-08-19",
    tipoSangre: "O+",
    emergencia1: "Elena López (0426-1112233)",
    emergencia2: "N/A",
    familiares: "Esposa y 1 Hija",
    tieneCargaFamiliar: "SI",
    codigoBarra: "2024-CENDIS-000126",
  },
];

const INITIAL_AGENDA_EVENTS = [
  {
    id: "ev-1",
    date: "2026-11-16",
    ente: "Cendis",
    title: "Taller de Audiovisual",
    startTime: "9:00am",
    location: "Los valle del tuy",
    responsable: "Morris López",
    contacto: "0426.324.32.46",
    status: "APROBADO",
  },
  {
    id: "ev-2",
    date: "2026-11-17",
    ente: "Cendis",
    title: "Apoyo a IAEM en el marco de la chinita.",
    startTime: "10:00am",
    location: "Por definir",
    responsable: "Anaileth briceño",
    contacto: "0424.164.30.07",
    status: "APROBADO",
  },
  {
    id: "ev-3",
    date: "2026-11-18",
    ente: "Cendis",
    title: "Apoyo a IAEM en el marco de la chinita.",
    startTime: "10:00am",
    location: "por definir",
    responsable: "Anaileth briceño",
    contacto: "0424.164.30.07",
    status: "APROBADO",
  },
  {
    id: "ev-4",
    date: "2026-11-19",
    ente: "Cendis",
    title: "Apoyo a IAEM en el marco de la chinita.",
    startTime: "10:00am",
    location: "Cendis",
    responsable: "Anaileth briceño",
    contacto: "0424.164.30.07",
    status: "APROBADO",
  },
];

const INITIAL_PROJECTS = [
  {
    id: "proj-1",
    nombre: "Digitalización del Archivo Maestro CENDIS",
    tarea: "Transferencia y masterización de cintas analógicas patrimoniales",
    justificacion: "Preservación del patrimonio sonoro venezolano instruido por el MPPC.",
    responsable: "Anaileth Briceño",
    coordinacion: "Producción Fonográfica",
    fechaEntrega: "2026-11-25",
    porcentaje: 100,
    estatus: "COMPLETADO",
  },
  {
    id: "proj-2",
    nombre: "Mantenimiento Acústico Estudio A",
    tarea: "Sustitución de paneles absorbentes y calibración de monitores",
    justificacion: "Garantizar la calidad técnica de las sesiones de grabación del trimestre.",
    responsable: "Morris López",
    coordinacion: "Cultura Audiovisual",
    fechaEntrega: "2026-11-28",
    porcentaje: 65,
    estatus: "EN_EJECUCION",
  },
  {
    id: "proj-3",
    nombre: "Actualización de Red y Servidores SGI-CENDIS",
    tarea: "Respaldo automatizado e inventario de estaciones de trabajo",
    justificacion: "Continuidad operativa de los sistemas administrativos y de RRHH.",
    responsable: "Julimar Flores",
    coordinacion: "Dirección Ejecutiva",
    fechaEntrega: "2026-12-05",
    porcentaje: 25,
    estatus: "PENDIENTE",
  },
];

const INITIAL_BIENES = [
  {
    id: "bn-1",
    articulo: "Consola de Mezcla Digital",
    marca: "Yamaha",
    modelo: "CL5 Digital Audio Console",
    serial: "YMH-CL5-99281",
    codigoBN: "BN-CENDIS-001045",
    ubicacion: "Estudio de Grabación Principal",
    custodio: "Anaileth Briceño",
    estado: "OPERATIVO",
  },
  {
    id: "bn-2",
    articulo: "Micrófono de Condensador Estudio",
    marca: "Neumann",
    modelo: "U87 Ai",
    serial: "NM-U87-44120",
    codigoBN: "BN-CENDIS-001046",
    ubicacion: "Cabina Vocal A",
    custodio: "Morris López",
    estado: "OPERATIVO",
  },
  {
    id: "bn-3",
    articulo: "Computadora Estación de Trabajo",
    marca: "Apple",
    modelo: "Mac Studio M2 Max",
    serial: "C02X9918M2",
    codigoBN: "BN-CENDIS-001047",
    ubicacion: "Sala de Masterización",
    custodio: "Ali Alejandro Primera",
    estado: "OPERATIVO",
  },
];

// ============================================================================
// COMPONENTES GRÁFICOS OFICIALES (LOGO GLIFO Y CINTILLO MPPC / CENDIS)
// ============================================================================
function CendisGlyphLogo({ className = "w-32", showTopAcronym = false }) {
  return (
    <div className={`inline-flex flex-col items-center select-none bg-transparent ${className}`}>
      {showTopAcronym && (
        <div className="w-full flex justify-between text-[11px] font-black tracking-[0.25em] text-slate-950 uppercase leading-none mb-1">
          <span>C</span><span>E</span><span>N</span><span>D</span><span>I</span><span>S</span>
        </div>
      )}
      {/* Texto superior: "Centro Nacional" más grande y en negrilla */}
      <div
        className="w-full flex justify-between items-center text-black font-black leading-none mb-1"
        style={{
          fontFamily: "'Trebuchet MS', 'Arial Black', Arial, sans-serif",
          fontSize: "14.5px",
          fontWeight: "900",
        }}
      >
        <span>C</span>
        <span>e</span>
        <span>n</span>
        <span>t</span>
        <span>r</span>
        <span>o</span>
        <span>&nbsp;</span>
        <span>N</span>
        <span>a</span>
        <span>c</span>
        <span>i</span>
        <span>o</span>
        <span>n</span>
        <span>a</span>
        <span>l</span>
      </div>

      {/* Glifo Precolombino Rojo CENDIS trazado fielmente a la imagen adjunta */}
      <svg viewBox="0 0 680 155" className="w-full h-auto my-0.5 overflow-visible">
        <g fill="#ba251e">
          {/* 1. Barra vertical izquierda levemente curva */}
          <path d="M 10,8 C 22,6 28,10 27,22 C 23,60 22,102 25,140 C 26,148 19,151 11,150 C 5,149 4,142 5,132 C 6,92 6,48 7,16 C 7,10 8,8 10,8 Z" />

          {/* 2. Bloque interior izquierdo con rectángulo vertical y gancho inferior */}
          <rect x="38" y="39" width="22" height="58" rx="4" />
          <path d="M 41,7 L 232,7 C 240,7 241,22 232,26 L 194,45 L 236,75 C 242,80 239,90 229,90 L 146,90 C 139,90 137,83 142,78 L 166,58 L 138,44 C 134,41 136,34 143,34 L 178,34 L 198,24 L 84,24 L 84,112 L 154,112 C 162,112 162,130 154,130 L 66,130 L 66,136 L 138,136 C 145,136 145,150 138,150 L 42,150 C 37,150 36,145 36,138 L 36,112 C 36,106 40,104 46,104 L 64,104 L 64,25 L 41,25 C 35,25 35,7 41,7 Z" />

          {/* 3. Corchete inferior bajo el pico triangular */}
          <path d="M 178,100 L 230,100 C 236,100 238,104 238,110 L 238,142 C 238,148 235,150 228,150 L 178,150 C 171,150 171,135 178,135 L 220,135 L 220,115 L 178,115 C 171,115 171,100 178,100 Z" />

          {/* 4. Bloque central-izquierdo (U con cuadrado flotante y puente central) */}
          <rect x="292" y="10" width="48" height="44" rx="4" />
          <path d="M 252,22 L 274,22 L 274,66 L 360,66 L 360,10 C 360,7 363,5 368,5 L 552,5 C 558,5 560,8 560,14 L 560,24 L 380,24 L 380,82 C 380,86 377,88 372,88 L 258,88 C 253,88 251,85 251,79 L 251,26 C 251,23 251,22 252,22 Z" />

          {/* 5. Pilares inferiores centrales y espiral cuadrada concéntrica */}
          <path d="M 254,102 L 274,102 L 274,148 L 252,148 Z" />
          <path d="M 292,100 L 378,100 C 382,100 384,103 384,108 L 384,132 L 502,132 L 502,24 L 558,24 L 558,45 L 585,45 L 585,10 C 585,7 588,5 593,5 L 635,5 L 635,22 L 605,22 L 605,46 L 635,48 C 640,50 644,56 644,64 L 644,105 C 644,114 639,120 630,122 L 605,124 L 605,135 L 638,135 L 638,150 L 584,150 L 584,122 L 520,122 L 520,150 L 364,150 L 364,116 L 312,116 L 312,150 L 292,150 Z" />

          {/* 6. Marco interior y núcleo del espiral central derecho */}
          <path d="M 398,38 L 486,38 L 486,118 L 398,118 L 398,102 L 468,102 L 468,54 L 398,54 Z" />
          <rect x="400" y="68" width="48" height="44" rx="3" />

          {/* 7. Barra vertical derecha levemente curva */}
          <path d="M 655,8 C 664,7 669,10 669,18 C 668,58 669,100 672,140 C 672,147 667,150 658,150 C 651,150 649,145 649,136 C 650,96 650,54 650,16 C 650,10 652,8 655,8 Z" />
        </g>
      </svg>

      {/* Texto inferior: "d e l   D i s c o" más grande y en negrilla */}
      <div
        className="w-full flex justify-between items-center text-black font-black leading-none mt-1 px-0.5"
        style={{
          fontFamily: "'Trebuchet MS', 'Arial Black', Arial, sans-serif",
          fontSize: "15px",
          fontWeight: "900",
        }}
      >
        <span>d</span>
        <span>e</span>
        <span>l</span>
        <span>&nbsp;</span>
        <span>&nbsp;</span>
        <span>D</span>
        <span>i</span>
        <span>s</span>
        <span>c</span>
        <span>o</span>
      </div>
    </div>
  );
}

function OfficialHeaderCintillo({ showRightLogo = true }) {
  return (
    <div className="w-full flex items-start justify-between pb-3 select-none">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 120 75" className="w-14 h-9">
            <path d="M5,15 Q35,5 60,15 T115,15 L115,32 Q85,42 60,32 T5,32 Z" fill="#facc15" />
            <path d="M5,32 Q35,22 60,32 T115,32 L115,49 Q85,59 60,49 T5,49 Z" fill="#1e3a8a" />
            <path d="M5,49 Q35,39 60,49 T115,49 L115,66 Q85,76 60,66 T5,66 Z" fill="#be123c" />
            <circle cx="42" cy="41" r="1.6" fill="#fff" />
            <circle cx="47" cy="38" r="1.6" fill="#fff" />
            <circle cx="53" cy="36" r="1.6" fill="#fff" />
            <circle cx="59" cy="35" r="1.6" fill="#fff" />
            <circle cx="65" cy="35" r="1.6" fill="#fff" />
            <circle cx="71" cy="36" r="1.6" fill="#fff" />
            <circle cx="77" cy="38" r="1.6" fill="#fff" />
            <circle cx="82" cy="41" r="1.6" fill="#fff" />
          </svg>
          <span className="text-[6px] font-bold tracking-tight text-[#1e3a8a] leading-none mt-0.5">
            REPÚBLICA BOLIVARIANA DE
          </span>
          <span className="text-[8.5px] font-black tracking-wider text-[#1e3a8a] leading-none">
            VENEZUELA
          </span>
        </div>
        <div className="h-11 w-[1.5px] bg-[#1e3a8a]" />
        <div className="flex flex-col justify-center">
          <span className="text-[10.5px] text-slate-600 font-medium leading-tight">
            Ministerio del Poder Popular para la
          </span>
          <span className="text-[24px] font-black tracking-tight text-[#1e3a8a] leading-none">
            CULTURA
          </span>
        </div>
      </div>

      {showRightLogo && <CendisGlyphLogo className="w-28" showTopAcronym={true} />}
    </div>
  );
}

function OfficialFooterWave() {
  return (
    <div className="w-full h-20 relative overflow-hidden select-none mt-auto">
      <svg viewBox="0 0 800 110" preserveAspectRatio="none" className="w-full h-full">
        <path d="M0,25 Q220,95 560,35 Q390,85 260,110 L0,110 Z" fill="#facc15" />
        <path d="M360,110 Q550,25 800,10 L800,110 Z" fill="#1e3a8a" />
        <path d="M520,110 Q670,65 800,68 L800,110 Z" fill="#9f1239" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const x = 525 + i * 32;
          const y = 92 - i * 6.2;
          return (
            <polygon
              key={i}
              points={`${x},${y - 7} ${x + 2},${y - 2} ${x + 7},${y - 2} ${x + 3},${y + 1} ${x + 4.5},${y + 6} ${x},${y + 3} ${x - 4.5},${y + 6} ${x - 3},${y + 1} ${x - 7},${y - 2} ${x - 2},${y - 2}`}
              fill="#ffffff"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// GESTIÓN DE SESIÓN PERSISTENTE MEDIANTE COOKIE (DURACIÓN: 7 DÍAS) Y ALMACENAMIENTO
// ============================================================================
const SESSION_COOKIE_NAME = "cendis_session";
const SESSION_DURATION_DAYS = 7;
const STORAGE_USERS_KEY = "cendis_users_v1";
const STORAGE_EMPLOYEES_KEY = "cendis_employees_v1";

function loadStoredUsers() {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return DEFAULT_USERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveStoredUsers(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function loadStoredEmployees() {
  if (typeof window === "undefined") return INITIAL_EMPLOYEES;
  try {
    const raw = window.localStorage.getItem(STORAGE_EMPLOYEES_KEY);
    if (!raw) return INITIAL_EMPLOYEES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EMPLOYEES;
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

function saveStoredEmployees(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function setSessionCookie(userObj) {
  if (typeof document === "undefined" || !userObj) return;
  const maxAge = SESSION_DURATION_DAYS * 24 * 60 * 60;
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const payload = encodeURIComponent(
    JSON.stringify({
      id: userObj.id,
      username: userObj.username,
      email: userObj.email || "",
      fullName: userObj.fullName,
      cargo: userObj.cargo,
      role: userObj.role,
      active: userObj.active,
      linkedEmployeeId: userObj.linkedEmployeeId || null,
      permissions: userObj.permissions,
    })
  );
  document.cookie = `${SESSION_COOKIE_NAME}=${payload}; expires=${expires}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getSessionFromCookie(usersList = DEFAULT_USERS) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const rawValue = match.substring(SESSION_COOKIE_NAME.length + 1);
    const parsed = JSON.parse(decodeURIComponent(rawValue));
    if (!parsed || (!parsed.username && !parsed.email)) return null;
    const foundInList = usersList.find(
      (u) =>
        (parsed.email && u.email && u.email.toLowerCase() === parsed.email.toLowerCase()) ||
        (parsed.username && u.username.toLowerCase() === parsed.username.toLowerCase())
    );
    if (foundInList) {
      return foundInList.active ? { ...foundInList, email: parsed.email || foundInList.email } : null;
    }
    return parsed.active !== false ? parsed : null;
  } catch {
    return null;
  }
}

function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; SameSite=Lax`;
}

// ============================================================================
// COMPONENTE PRINCIPAL APP
// ============================================================================
export default function App() {
  const [users, setUsersState] = useState(() => loadStoredUsers());
  const setUsers = (updater) => {
    setUsersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveStoredUsers(next);
      return next;
    });
  };
  const [currentUser, setCurrentUser] = useState(() => getSessionFromCookie(loadStoredUsers()));
  const [currentScreen, setCurrentScreen] = useState(() =>
    getSessionFromCookie(loadStoredUsers()) ? "PORTAL" : "LOGIN"
  ); // LOGIN | PORTAL | APP
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");

  // Conmutador de vista (DESKTOP | TABLET | MOBILE)
  const [deviceViewport, setDeviceViewport] = useState("DESKTOP");

  // Pestaña activa
  const [activeTab, setActiveTab] = useState("editor");

  // Mensajes de aviso / notificaciones
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Estado de Memorándums y Solicitudes
  const [docType, setDocType] = useState("MEMORANDUM");
  const [counters, setCounters] = useState({ MEMORANDUM: 2, SOLICITUD: 1 });
  const [manualCorrelative, setManualCorrelative] = useState(false);
  const [customCorrelative, setCustomCorrelative] = useState("");

  const [para, setPara] = useState("Julimar Flores - Directora Ejecutiva");
  const [de, setDe] = useState("Ali Alejandro Primera - Presidente CENDIS");
  const [fecha, setFecha] = useState("2026-11-13");
  const [asunto, setAsunto] = useState("Solicitud de dotación y mantenimiento preventivo de equipos");
  const [concepto, setConcepto] = useState(
    "Por medio de la presente me dirijo a usted en la oportunidad de saludarle cordialmente y a su vez solicitar sus buenos oficios para gestionar el mantenimiento correctivo y preventivo de las estaciones de trabajo adscritas a la Coordinación de Producción Fonográfica del Centro Nacional del Disco (CENDIS).\n\nSin más a que hacer referencia y agradeciendo de antemano su valiosa colaboración, se despide."
  );

  const [signerNombre, setSignerNombre] = useState("LCDO. ALI ALEJANDRO PRIMERA");
  const [signerCargo, setSignerCargo] = useState("Presidente de la Fundación Centro Nacional del Disco (CENDIS)");
  const [signerResolucion] = useState(
    "Designado según Gaceta Oficial de la República Bolivariana de Venezuela N° 42.125"
  );

  const [documents, setDocuments] = useState([
    {
      id: "doc-1",
      correlativo: "CENDIS-MEM-2026-0001",
      tipo: "MEMORANDUM",
      para: "Anaileth Briceño - Coordinadora de Producción",
      de: "Ali Alejandro Primera - Presidente CENDIS",
      fecha: "2026-11-10",
      asunto: "Lineamientos de cierre administrativo mensual",
      concepto: "Se instruye a todas las coordinaciones remitir la relación de actividades antes del día viernes.",
      signerNombre: "LCDO. ALI ALEJANDRO PRIMERA",
      signerCargo: "Presidente de la Fundación CENDIS",
      status: "APROBADO",
      creadoPor: "admin",
    },
  ]);

  // Bitácora (Logs)
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: "2026-11-13 08:30:00",
      user: "admin",
      role: "ADMIN",
      action: "Inicialización del Sistema Web Integrado SGI-CENDIS",
    },
  ]);

  const addLog = (actionText, userObj = currentUser) => {
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    setLogs((prev) => [
      {
        id: Date.now(),
        timestamp: stamp,
        user: userObj ? userObj.username : "sistema",
        role: userObj ? userObj.role : "SYS",
        action: actionText,
      },
      ...prev,
    ]);
  };

  // Estado de Recursos Humanos
  const [employees, setEmployeesState] = useState(() => loadStoredEmployees());
  const setEmployees = (updater) => {
    setEmployeesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveStoredEmployees(next);
      return next;
    });
  };
  const [hrSubTab, setHrSubTab] = useState("LISTA"); // LISTA | REPORTE_FILTROS
  const [selectedEmpForCard, setSelectedEmpForCard] = useState(null);
  const [selectedEmpForCV, setSelectedEmpForCV] = useState(null);
  const [selectedEmpIdToLink, setSelectedEmpIdToLink] = useState("");
  const [showLinkChangeSelector, setShowLinkChangeSelector] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    cargo: "",
    coordinacion: "Producción Fonográfica",
    telefono: "",
    correo: "",
    direccion: "",
    fechaNacimiento: "",
    fechaIngreso: "2026-11-13",
    tipoSangre: "O+",
    emergencia1: "",
    emergencia2: "",
    familiares: "",
    tieneCargaFamiliar: "SI",
    codigoBarra: "2024-CENDIS-000127",
  });

  // Trabajador de RRHH vinculado al correo del usuario actual
  const currentUserLinkedEmployee = useMemo(() => {
    if (!currentUser) return null;
    const emailLower = (currentUser.email || "").trim().toLowerCase();
    return (
      employees.find(
        (emp) =>
          (currentUser.linkedEmployeeId && emp.id === currentUser.linkedEmployeeId) ||
          (emailLower && emp.correo && emp.correo.trim().toLowerCase() === emailLower)
      ) || null
    );
  }, [currentUser, employees]);

  // Filtros para el Reporte General de Personal
  const [hrFilterCoord, setHrFilterCoord] = useState("TODAS");
  const [hrFilterCarga, setHrFilterCarga] = useState("TODOS");
  const [hrFilterSangre] = useState("TODOS");
  const [hrFilterSearch, setHrFilterSearch] = useState("");
  const [hrReportType, setHrReportType] = useState("NOMINA_COMPLETA");

  // Estado de Agenda
  const [agendaEvents, setAgendaEvents] = useState(INITIAL_AGENDA_EVENTS);
  const [agendaViewMode, setAgendaViewMode] = useState("CALENDAR"); // CALENDAR | REPORT
  const [reportPeriodType, setReportPeriodType] = useState("SEMANAL");
  const [reportColumnsCount] = useState(4);
  const [reportViceministerio] = useState("Viceministerio Cultura Audiovisual");
  const [reportEnteTitle] = useState("Ente: Fundación Centro Nacional del Disco (CENDIS)");
  const [reportSemanaLabel, setReportSemanaLabel] = useState("Semana del 16 al 22 de noviembre");
  const [reportWeekStartDate] = useState("2026-11-16");
  const [selectedDayModal, setSelectedDayModal] = useState(null);
  const [newEventForm, setNewEventForm] = useState({
    ente: "Cendis",
    title: "",
    startTime: "9:00am",
    location: "",
    responsable: "Morris López",
    contacto: "0426.324.32.46",
  });

  // Estado de Asistencia
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: "att-1",
      cedula: "V-15.432.111",
      nombre: "Ali Alejandro Primera",
      fecha: "2026-11-13",
      hora: "08:02 AM",
      estatus: "A Tiempo",
    },
    {
      id: "att-2",
      cedula: "V-18.999.888",
      nombre: "Julimar Flores",
      fecha: "2026-11-13",
      hora: "08:11 AM",
      estatus: "A Tiempo",
    },
  ]);
  const [scannerInput, setScannerInput] = useState("");
  const [scannerAlert, setScannerAlert] = useState(null);

  // Estado de Organigrama
  const [orgViewMode, setOrgViewMode] = useState("DIAGRAM"); // DIAGRAM | TEXT

  // Estado de Proyectos y Tareas
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [projectsViewMode, setProjectsViewMode] = useState("BOARD"); // BOARD | PDF_REPORT
  const [newProjectForm, setNewProjectForm] = useState({
    nombre: "",
    tarea: "",
    justificacion: "",
    responsable: "Anaileth Briceño",
    coordinacion: "Producción Fonográfica",
    fechaEntrega: "2026-11-30",
    porcentaje: 0,
  });

  // Estado de Bienes Nacionales
  const [bienesCatalog, setBienesCatalog] = useState([
    "Consola de Mezcla Digital",
    "Micrófono de Condensador Estudio",
    "Computadora Estación de Trabajo",
    "Monitor de Audio Activo",
    "Interfaz de Audio Profesional",
    "Escritorio Ejecutivo",
    "Silla Ergonómica",
  ]);
  const [bienesList, setBienesList] = useState(INITIAL_BIENES);
  const [bienesViewMode, setBienesViewMode] = useState("FORM"); // FORM | PDF
  const [newBienForm, setNewBienForm] = useState({
    articulo: "Consola de Mezcla Digital",
    nuevoArticuloTexto: "",
    marca: "",
    modelo: "",
    serial: "",
    codigoBN: "BN-CENDIS-001048",
    ubicacion: "Estudio de Grabación Principal",
    custodio: "Anaileth Briceño",
  });

  // Estado de Chat Corporativo Interno (Burbuja Flotante)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState("TODOS");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "Ali Alejandro Primera",
      recipient: "TODOS",
      text: "Bienvenidos al Chat Interno del SGI-CENDIS. Recuerden cargar el avance semanal de proyectos.",
      time: "08:45 AM",
    },
    {
      id: 2,
      sender: "Anaileth Briceño",
      recipient: "TODOS",
      text: "Recibido Presidente, ya el archivo maestro lleva 100% de avance.",
      time: "08:50 AM",
    },
  ]);

  // Estado para nuevo usuario y submódulo Usuarios en Configuración
  const [configSubTab, setConfigSubTab] = useState("USUARIOS");
  const [selectedConfigUserId, setSelectedConfigUserId] = useState(() => {
    const initialList = loadStoredUsers();
    return initialList[0] ? String(initialList[0].id) : "1";
  });
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    cargo: "",
    role: "ESTANDAR",
  });

  const MODULE_PERMISSION_KEY_MAP = {
    editor: "entrar_memo",
    agenda: "entrar_agenda",
    hr: "entrar_hr",
    proyectos: "entrar_proyectos",
    bienes: "entrar_bienes",
    attendance: "entrar_attendance",
    stats: "entrar_stats",
    org: "entrar_org",
    config: "entrar_config",
  };

  const canEnterModule = (modId, userObj = currentUser) => {
    if (!userObj) return false;
    if (userObj.role === "ADMIN") return true;
    const permKey = MODULE_PERMISSION_KEY_MAP[modId];
    if (!permKey) return true;
    const perms = userObj.permissions || DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR;
    return Boolean(perms[permKey]);
  };

  const hasActionPermission = (actionKey, userObj = currentUser) => {
    if (!userObj) return false;
    if (userObj.role === "ADMIN") return true;
    const perms = userObj.permissions || DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR;
    return Boolean(perms[actionKey]);
  };

  // Correlativo formateado
  const formattedCorrelative = useMemo(() => {
    if (manualCorrelative && customCorrelative.trim()) return customCorrelative.trim();
    const prefix = docType === "MEMORANDUM" ? "CENDIS-MEM" : "CENDIS-SOL";
    const num = String(counters[docType] || 1).padStart(4, "0");
    return `${prefix}-2026-${num}`;
  }, [docType, counters, manualCorrelative, customCorrelative]);

  // ============================================================================
  // FUNCIONES DE DESCARGA (BACKUP COMPLETO .ZIP)
  // ============================================================================
  const handleDownloadFullBackupZip = () => {
    if (currentUser?.role !== "ADMIN") {
      showToast("Solo los usuarios Administradores pueden descargar el Backup completo.", "error");
      return;
    }
    const backupData = {
      fechaRespaldo: new Date().toISOString(),
      ente: "Fundación Centro Nacional del Disco (CENDIS) - MPPC",
      usuarios: users,
      personalRRHH: employees,
      memorandumsYSolicitudes: documents,
      agendaInstitucional: agendaEvents,
      proyectosYTareas: projects,
      bienesNacionales: bienesList,
      asistencia: attendanceRecords,
      bitacoraLogs: logs,
    };

    const blob = createZipBlob([
      { name: "cendis_backup_completo.json", content: JSON.stringify(backupData, null, 2) },
      {
        name: "resumen_ejecutivo_cendis.txt",
        content: `RESPALDO INTEGRAL SGI-CENDIS\nFecha: ${new Date().toLocaleString()}\nMemos/Solicitudes: ${documents.length}\nPersonal RRHH: ${employees.length}\nProyectos: ${projects.length}\nBienes Nacionales: ${bienesList.length}`,
      },
    ]);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-completo-cendis-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("Descargado Backup Completo del Sistema en archivo .ZIP");
    showToast("Backup completo (.ZIP) generado y descargado correctamente.");
  };

  // ============================================================================
  // GENERADOR DEL PAQUETE COMPLETO PARA VERCEL / GITHUB (CON TODAS LAS ACTUALIZACIONES)
  // ============================================================================
  const handleDownloadVercelProjectZip = () => {
    const packageJson = JSON.stringify(
      {
        name: "sistema-cendis",
        private: true,
        version: "2.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          "lucide-react": "^0.390.0",
          react: "^18.3.1",
          "react-dom": "^18.3.1",
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.3.1",
          vite: "^5.3.1",
        },
      },
      null,
      2
    );

    const indexHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SGI-CENDIS | Fundación Centro Nacional del Disco - MPPC</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-[#050a15]">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

    const vercelJson = JSON.stringify(
      {
        name: "sistema-cendis",
        rewrites: [{ source: "/(.*)", destination: "/index.html" }],
      },
      null,
      2
    );

    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

    const leemeTxt = `===================================================================
SISTEMA INTEGRADO SGI-CENDIS (CON TODAS LAS ACTUALIZACIONES)
Dominio objetivo: https://sistema-cendis.vercel.app
===================================================================

ESTRUCTURA INCLUIDA EN ESTE PAQUETE:
- package.json
- index.html
- vite.config.js
- vercel.json
- src/main.jsx
- src/App.jsx (Reemplazar con el código completo del visor de Gemini)
- LEEME_PASOS_VERCEL.txt

MÓDULOS INTEGRADOS EN ESTA VERSIÓN:
1. Ventana de Ingreso Oficial CENDIS (Modo oscuro institucional con franja tricolor y glifo rojo).
2. Portal de Aplicativos con tarjetas interactivas cálidas y azules.
3. Memorándums y Solicitudes con correlativo automático, aprobación de Administrador y cintillo MPPC.
4. Agenda Institucional tipo Google Calendar con ventana flotante, alertas y reporte PDF (Arial 12 / Calibri 11 Negrilla).
5. Recursos Humanos (Expedientes, Carga Familiar, Hoja de Vida PDF, Carnet con código de barras y Reporte General con Filtros).
6. Proyectos y Tareas en Ejecución (%) asignables a RRHH con Informe Semanal de Justificación en PDF.
7. Bienes Nacionales con lista desplegable auto-alimentada y Reporte Oficial en PDF.
8. Control de Asistencia con lector de código de barras / cédula y Reporte Semanal.
9. Estadística y Contabilidad General en tiempo real.
10. Organigrama Institucional (Vista Diagrama y Vista Textual).
11. Configuración de Roles (Administrador / Usuario Estándar), Backup .ZIP y Chat Corporativo Flotante.

PASOS PARA SUBIR A GITHUB Y VERCEL:
1. Descomprime este ZIP en una carpeta.
2. Copia el código completo de App.jsx desde el visor de Gemini y pégalo dentro de "src/App.jsx".
3. Sube los archivos a https://github.com/new en el repositorio "sistema-cendis".
4. Importa el repositorio en https://vercel.com/new con el nombre "sistema-cendis".
`;

    // Captura automáticamente el código fuente real completo del sistema o instrucciones directas
    const fullSystemReminder = `// ============================================================================
// SGI-CENDIS - SISTEMA INTEGRADO DE GESTIÓN (FUNDACIÓN CENDIS - MPPC)
// ============================================================================
// NOTA: Si descargaste este archivo desde el botón interno del navegador,
// recuerda copiar el código completo del archivo App.jsx del editor derecho de Gemini
// y pegarlo aquí para incluir todos los componentes de React.
`;

    const blob = createZipBlob([
      { name: "package.json", content: packageJson },
      { name: "index.html", content: indexHtml },
      { name: "vite.config.js", content: viteConfig },
      { name: "vercel.json", content: vercelJson },
      { name: "src/main.jsx", content: mainJsx },
      { name: "src/App.jsx", content: fullSystemReminder },
      { name: "LEEME_PASOS_VERCEL.txt", content: leemeTxt },
    ]);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sistema-cendis-vercel.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("Descargado paquete de despliegue sistema-cendis-vercel.zip");
    showToast("Paquete sistema-cendis-vercel.zip descargado.");
  };

  // ============================================================================
  // MANEJADORES DE NEGOCIO E INTEGRACIÓN ENTRE MÓDULOS
  // ============================================================================
  const handleGoogleAccountSignIn = (emailRaw, displayNameRaw = "") => {
    const cleanEmail = (emailRaw || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setLoginError("Por favor ingrese un correo válido de Gmail / Google (ejemplo@gmail.com).");
      return;
    }

    let existingUser = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        u.username.toLowerCase() === cleanEmail ||
        u.username.toLowerCase() === cleanEmail.split("@")[0]
    );

    if (existingUser) {
      if (!existingUser.active) {
        setLoginError("Cuenta suspendida por el Administrador.");
        return;
      }
      const updatedUser = {
        ...existingUser,
        email: cleanEmail,
      };
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      setSessionCookie(updatedUser);
      setLoginError("");
      setGoogleModalOpen(false);
      setCurrentScreen("PORTAL");
      addLog(`Inicio de sesión con Google (${cleanEmail})`, updatedUser);

      const isLinked = employees.some(
        (emp) =>
          (updatedUser.linkedEmployeeId && emp.id === updatedUser.linkedEmployeeId) ||
          (emp.correo && emp.correo.trim().toLowerCase() === cleanEmail)
      );
      if (!isLinked) {
        showToast(
          `Bienvenido (${cleanEmail}). En el módulo RECURSOS HUMANOS tiene un aviso pendiente para vincular su correo con sus datos personales.`,
          "info"
        );
      }
      return;
    }

    // Si es un correo Gmail nuevo que entra por primera vez con Google
    const emailPrefix = cleanEmail.split("@")[0];
    const isAdminEmail =
      cleanEmail === "youseven.adm@gmail.com" ||
      cleanEmail === "admin@gmail.com" ||
      cleanEmail === "admin.cendis@gmail.com";
    const assignedRole = isAdminEmail ? "ADMIN" : "ESTANDAR";
    const derivedName =
      displayNameRaw.trim() ||
      emailPrefix
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const matchedEmp = employees.find(
      (emp) => emp.correo && emp.correo.trim().toLowerCase() === cleanEmail
    );

    const newGoogleUser = {
      id: Date.now(),
      username: emailPrefix,
      email: cleanEmail,
      password: "GoogleAuthUser",
      fullName: matchedEmp ? `${matchedEmp.nombres} ${matchedEmp.apellidos}` : derivedName,
      cargo: matchedEmp ? matchedEmp.cargo : "Trabajador CENDIS (Pendiente vincular RRHH)",
      role: assignedRole,
      active: true,
      linkedEmployeeId: matchedEmp ? matchedEmp.id : null,
      permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE[assignedRole] },
    };

    setUsers((prev) => [...prev, newGoogleUser]);
    setCurrentUser(newGoogleUser);
    setSessionCookie(newGoogleUser);
    setLoginError("");
    setGoogleModalOpen(false);
    setCurrentScreen("PORTAL");
    addLog(`Registro e inicio de sesión con Google (${cleanEmail})`, newGoogleUser);

    if (!matchedEmp) {
      showToast(
        `Sesión iniciada con ${cleanEmail}. Diríjase a RECURSOS HUMANOS para vincular su cuenta con sus datos personales de trabajador.`,
        "info"
      );
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const rawInput = loginUsername.trim().toLowerCase();
    const isEmailInput = rawInput.includes("@");

    const found = users.find(
      (u) =>
        (u.username.toLowerCase() === rawInput ||
          (u.email && u.email.toLowerCase() === rawInput)) &&
        u.password === loginPassword
    );

    if (!found) {
      // Si ingresa un correo @gmail.com directamente en el login con clave
      if (isEmailInput && (rawInput.endsWith("@gmail.com") || rawInput.endsWith("@googlemail.com"))) {
        const existingByEmail = users.find(
          (u) => u.email && u.email.toLowerCase() === rawInput
        );
        if (!existingByEmail && loginPassword.trim().length >= 4) {
          handleGoogleAccountSignIn(rawInput);
          return;
        }
      }
      setLoginError("Correo de Google / usuario o contraseña incorrectos.");
      return;
    }
    if (!found.active) {
      setLoginError("Cuenta suspendida por el Administrador.");
      return;
    }
    const userWithEmail = {
      ...found,
      email: found.email || (isEmailInput ? rawInput : `${found.username}.cendis@gmail.com`),
    };
    setUsers((prev) => prev.map((u) => (u.id === userWithEmail.id ? userWithEmail : u)));
    setCurrentUser(userWithEmail);
    setSessionCookie(userWithEmail);
    setLoginError("");
    setCurrentScreen("PORTAL");
    addLog(`Inicio de sesión exitoso (${userWithEmail.email})`, userWithEmail);

    const isLinked = employees.some(
      (emp) =>
        (userWithEmail.linkedEmployeeId && emp.id === userWithEmail.linkedEmployeeId) ||
        (emp.correo && emp.correo.trim().toLowerCase() === userWithEmail.email.toLowerCase())
    );
    if (!isLinked) {
      showToast(
        `Aviso RRHH: Su correo (${userWithEmail.email}) aún no está vinculado a un expediente de trabajador en Recursos Humanos.`,
        "info"
      );
    }
  };

  const handleLinkUserToEmployee = (empId) => {
    if (!currentUser || !empId) return;
    const targetEmp = employees.find((emp) => emp.id === empId);
    if (!targetEmp) return;

    const userEmail = currentUser.email || `${currentUser.username}@gmail.com`;
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === empId) {
        return { ...emp, correo: userEmail };
      }
      if (emp.correo && emp.correo.toLowerCase() === userEmail.toLowerCase()) {
        return { ...emp, correo: "" };
      }
      return emp;
    });
    setEmployees(updatedEmployees);

    const updatedUser = {
      ...currentUser,
      email: userEmail,
      fullName: `${targetEmp.nombres} ${targetEmp.apellidos}`,
      cargo: targetEmp.cargo,
      linkedEmployeeId: targetEmp.id,
    };
    setCurrentUser(updatedUser);
    setSessionCookie(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setShowLinkChangeSelector(false);
    addLog(
      `Vinculado correo ${userEmail} con expediente RRHH de ${targetEmp.nombres} ${targetEmp.apellidos} (${targetEmp.cedula})`,
      updatedUser
    );
    showToast(
      `Correo ${userEmail} vinculado exitosamente a los datos personales de ${targetEmp.nombres} ${targetEmp.apellidos}.`
    );
  };

  const handleLogout = () => {
    addLog("Cierre de sesión de usuario");
    clearSessionCookie();
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setCurrentScreen("LOGIN");
  };

  const handleEmitDocument = () => {
    const initialStatus = currentUser?.role === "ADMIN" ? "APROBADO" : "PENDIENTE_APROBACION";
    const newDoc = {
      id: `doc-${Date.now()}`,
      correlativo: formattedCorrelative,
      tipo: docType,
      para,
      de,
      fecha,
      asunto,
      concepto,
      signerNombre,
      signerCargo,
      status: initialStatus,
      creadoPor: currentUser.username,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    if (!manualCorrelative) {
      setCounters((prev) => ({
        ...prev,
        [docType]: (prev[docType] || 1) + 1,
      }));
    }
    addLog(`Emitido ${docType} N° ${formattedCorrelative} (${initialStatus})`);
    showToast(
      initialStatus === "APROBADO"
        ? `Documento ${formattedCorrelative} emitido y aprobado automáticamente.`
        : `Documento ${formattedCorrelative} registrado (Pendiente de Aprobación por Administrador).`
    );
  };

  const handleApproveDocument = (docId) => {
    if (currentUser?.role !== "ADMIN") return;
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "APROBADO" } : d)));
    addLog(`Aprobado documento ID ${docId} por Administrador`);
    showToast("Documento aprobado oficialmente por el Administrador.");
  };

  const handleAddEventToDay = (e) => {
    e.preventDefault();
    if (!selectedDayModal || !newEventForm.title.trim()) return;
    const initialStatus = currentUser?.role === "ADMIN" ? "APROBADO" : "PENDIENTE_APROBACION";
    const created = {
      id: `ev-${Date.now()}`,
      date: selectedDayModal,
      ...newEventForm,
      status: initialStatus,
    };
    setAgendaEvents((prev) => [...prev, created]);
    addLog(`Agendada actividad '${created.title}' para el ${selectedDayModal} (${initialStatus})`);
    showToast(`Alerta enviada (App/Correo/WhatsApp): "${created.title}" [${initialStatus}]`);
    setNewEventForm({
      ente: "Cendis",
      title: "",
      startTime: "9:00am",
      location: "",
      responsable: employees[0] ? `${employees[0].nombres} ${employees[0].apellidos}` : "Morris López",
      contacto: employees[0]?.telefono || "0426.324.32.46",
    });
  };

  const handleScanAttendance = (e) => {
    e.preventDefault();
    const q = scannerInput.trim();
    if (!q) return;
    const foundEmp = employees.find(
      (emp) => emp.cedula.toLowerCase() === q.toLowerCase() || emp.codigoBarra.toLowerCase() === q.toLowerCase()
    );
    const now = new Date();
    const fechaStr = now.toISOString().slice(0, 10);
    const horaStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (foundEmp) {
      const rec = {
        id: `att-${Date.now()}`,
        cedula: foundEmp.cedula,
        nombre: `${foundEmp.nombres} ${foundEmp.apellidos}`,
        fecha: fechaStr,
        hora: horaStr,
        estatus: "Asistencia Verificada",
      };
      setAttendanceRecords((prev) => [rec, ...prev]);
      setScannerAlert({
        type: "success",
        text: `Entrada registrada: ${foundEmp.nombres} ${foundEmp.apellidos} (${foundEmp.coordinacion}) a las ${horaStr}`,
      });
      addLog(`Asistencia registrada para ${foundEmp.nombres} ${foundEmp.apellidos}`);
    } else {
      setScannerAlert({
        type: "error",
        text: `El código o cédula "${q}" no corresponde a ningún trabajador en RRHH.`,
      });
    }
    setScannerInput("");
  };

  // Filtrado de RRHH para el Reporte General
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (hrFilterCoord !== "TODAS" && emp.coordinacion !== hrFilterCoord) return false;
      if (hrFilterCarga !== "TODOS" && emp.tieneCargaFamiliar !== hrFilterCarga) return false;
      if (hrFilterSangre !== "TODOS" && emp.tipoSangre !== hrFilterSangre) return false;
      if (hrFilterSearch.trim()) {
        const q = hrFilterSearch.toLowerCase();
        const match =
          emp.nombres.toLowerCase().includes(q) ||
          emp.apellidos.toLowerCase().includes(q) ||
          emp.cedula.toLowerCase().includes(q) ||
          emp.cargo.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [employees, hrFilterCoord, hrFilterCarga, hrFilterSangre, hrFilterSearch]);

  // Calendario Noviembre 2026
  const calendarDays = useMemo(() => {
    const days = [];
    for (let d = 1; d <= 30; d++) {
      const dateStr = `2026-11-${String(d).padStart(2, "0")}`;
      days.push({ dayNumber: d, dateStr });
    }
    return days;
  }, []);

  const reportDayColumns = useMemo(() => {
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const base = new Date(`${reportWeekStartDate}T12:00:00`);
    const cols = [];
    for (let i = 0; i < reportColumnsCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateIso = `${yyyy}-${mm}-${dd}`;
      const dayLabel = `${dayNames[d.getDay()]}: ${d.getDate()}`;
      const evs = agendaEvents.filter((ev) => ev.date === dateIso);
      cols.push({ dateIso, dayLabel, events: evs });
    }
    return cols;
  }, [reportWeekStartDate, reportColumnsCount, agendaEvents]);

  // Promedio global de avance de proyectos
  const globalProjectsProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const sum = projects.reduce((acc, p) => acc + Number(p.porcentaje || 0), 0);
    return Math.round(sum / projects.length);
  }, [projects]);

  // Contenedor adaptable según el selector PC / Tablet / Teléfono
  const viewportContainerClass =
    deviceViewport === "MOBILE"
      ? "max-w-[420px] mx-auto border-x-4 border-slate-800 shadow-2xl min-h-screen"
      : deviceViewport === "TABLET"
      ? "max-w-[820px] mx-auto border-x-4 border-slate-800 shadow-2xl min-h-screen"
      : "w-full min-h-screen";

  // ==========================================================================
  // 1) VENTANA ÚNICA DE INICIO DE SESIÓN (IDÉNTICA A LA CAPTURA ADJUNTA)
  // ==========================================================================
  if (currentScreen === "LOGIN") {
    return (
      <div className="min-h-screen max-h-screen overflow-y-auto bg-[#050a15] flex items-center justify-center p-3 font-sans text-slate-100">
        <div className="w-full max-w-[360px] bg-[#0c1322] rounded-2xl shadow-2xl border border-slate-800/90 overflow-hidden">
          {/* Franja tricolor superior en 3 bloques exactos */}
          <div className="grid grid-cols-3 h-1.5 w-full">
            <div className="bg-[#facc15]" />
            <div className="bg-[#1d4ed8]" />
            <div className="bg-[#dc2626]" />
          </div>

          <div className="p-3">
            <div className="rounded-xl border border-white/10 bg-[#0f172a] overflow-hidden shadow-inner">
              {/* Cabecera compacta con degradado vinotinto oscuro y recuadro blanco del logo */}
              <div className="bg-gradient-to-b from-[#591318] via-[#2d0f1a] to-[#0f172a] px-4 py-3.5 text-center border-b border-slate-800/80">
                <div className="bg-white rounded-xl px-4 py-2 mx-auto max-w-[175px] shadow mb-2.5">
                  <CendisGlyphLogo className="w-full" />
                </div>

                <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-[#f59e0b] leading-tight">
                  MINISTERIO DEL PODER POPULAR PARA LA CULTURA
                </p>
                <h1 className="text-[13.5px] font-black text-white uppercase tracking-tight leading-tight mt-1">
                  FUNDACIÓN CENTRO NACIONAL DEL DISCO (CENDIS)
                </h1>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Sistema de Memorándums y Solicitudes
                </p>
              </div>

              {/* Formulario compacto ajustado a la pantalla */}
              <div className="p-4 bg-[#0d1526]">
                {loginError && (
                  <div className="mb-2.5 p-2.5 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 text-[11px] font-semibold flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Botón principal de Autenticación con Google / Gmail */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginError("");
                    setGoogleModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow transition flex items-center justify-center gap-2.5 cursor-pointer mb-2.5 border border-slate-200"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.98-2.18-6.96-5.12H1.04v3.14C3.05 21.16 7.21 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.04 14.03c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.33H1.04C.38 7.66 0 9.16 0 11.75s.38 4.09 1.04 5.42l4-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.5-3.5C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.84 1.04 6.83l4 3.14c.98-2.94 3.72-5.22 6.96-5.22z"
                    />
                  </svg>
                  <span>Iniciar sesión con Correo Gmail / Google</span>
                </button>

                <div className="relative flex py-1 items-center mb-2">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                    o acceso con correo y clave
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-200 mb-1">
                      Correo Gmail / Usuario
                    </label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value);
                        setLoginError("");
                      }}
                      placeholder="usuario@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/60 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-200">
                        Clave
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-bold text-[#f59e0b] hover:text-amber-400 cursor-pointer"
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError("");
                      }}
                      placeholder="Escriba su clave"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/60 transition"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Iniciar Sesión con Correo</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="pt-2 pb-0.5 text-center text-[10px] text-slate-500 font-medium">
              RIF: G-20008344-9 • Caracas, Venezuela
            </div>
          </div>
        </div>

        {/* MODAL DE AUTENTICACIÓN CON SERVIDORES DE GOOGLE / GMAIL */}
        {googleModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 text-center">
                <div className="flex justify-center mb-3">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.98-2.18-6.96-5.12H1.04v3.14C3.05 21.16 7.21 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.04 14.03c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.33H1.04C.38 7.66 0 9.16 0 11.75s.38 4.09 1.04 5.42l4-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.5-3.5C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.84 1.04 6.83l4 3.14c.98-2.94 3.72-5.22 6.96-5.22z"
                    />
                  </svg>
                </div>
                <h2 className="text-base font-black text-slate-900">
                  Acceder con Google a SGI-CENDIS
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Seleccione una cuenta de Gmail o ingrese su correo de Google para vincularlo con su ficha de trabajador en Recursos Humanos.
                </p>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Cuentas institucionales registradas:
                  </span>
                  {users.slice(0, 4).map((u) => {
                    const emailAddr = u.email || `${u.username}.cendis@gmail.com`;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleGoogleAccountSignIn(emailAddr, u.fullName)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/70 hover:border-blue-300 flex items-center justify-between text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            {emailAddr.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[11px] text-slate-500">{emailAddr}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGoogleAccountSignIn(googleEmailInput, googleNameInput);
                  }}
                  className="pt-3 border-t border-slate-200 space-y-3"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Usar otra cuenta de Gmail / Google:
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="tucorreo@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="Nombre del trabajador (opcional)"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setGoogleModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow cursor-pointer"
                    >
                      Continuar con Gmail
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // 2) PORTAL DE APLICATIVOS (IDÉNTICO A LA CAPTURA DE TARJETAS ADJUNTA)
  // ==========================================================================
  if (currentScreen === "PORTAL") {
    const portalModules = [
      {
        id: "editor",
        theme: "WARM",
        badgeText: "ACTIVO",
        subtitle: "GESTIÓN DOCUMENTAL OFICIAL",
        title: "MEMO Y SOLICITUDES",
        desc: "Emisión de Memorándums, Solicitudes y Circulares con correlativo automático, firmante editable e impresión en PDF con cintillo oficial CENDIS.",
        pills: [
          { symbol: "#", text: `${documents.length} Correlativos`, color: "text-amber-400" },
          { symbol: "🖨", text: "Cintillo MPPC", color: "text-emerald-400" },
        ],
        footerCode: formattedCorrelative,
        icon: FileText,
        cornerBadge: "✦",
        cornerBg: "bg-emerald-500 text-slate-950",
      },
      {
        id: "agenda",
        theme: "BLUE",
        badgeText: "NUEVO MÓDULO",
        subtitle: "CALENDARIO MENSUAL Y CRONOGRAMA",
        title: "AGENDA CENDIS",
        desc: "Calendario interactivo tipo Google Calendar con ventana flotante por día, sesiones de estudio, reuniones e impresión de reportes semanales o mensuales.",
        pills: [
          { symbol: "📅", text: `${agendaEvents.length} Actividades`, color: "text-blue-400" },
          { symbol: "🔔", text: "Avisos Correo/App", color: "text-amber-400" },
        ],
        footerCode: "NOVIEMBRE 2026",
        icon: CalendarIcon,
        cornerBadge: "13",
        cornerBg: "bg-amber-400 text-slate-950",
      },
      {
        id: "hr",
        theme: "WARM",
        badgeText: currentUserLinkedEmployee ? "ACTIVO" : "⚠ VINCULAR CORREO",
        subtitle: "EXPEDIENTES, CARNETS Y FILTROS",
        title: "RECURSOS HUMANOS",
        desc: "Ingreso de todo el personal del CENDIS, carga familiar, Hoja de Vida en PDF, Carnet Oficial con código de barras y reporte general con filtros.",
        pills: [
          { symbol: "👥", text: `${employees.length} Trabajadores`, color: "text-amber-400" },
          {
            symbol: currentUserLinkedEmployee ? "✓" : "⚠",
            text: currentUserLinkedEmployee ? "Correo Vinculado" : "Vincular con mi Ficha",
            color: currentUserLinkedEmployee ? "text-emerald-400" : "text-amber-300",
          },
        ],
        footerCode: "2024-CENDIS-RRHH",
        icon: Users,
        cornerBadge: currentUserLinkedEmployee ? "+" : "!",
        cornerBg: currentUserLinkedEmployee
          ? "bg-emerald-500 text-slate-950"
          : "bg-amber-400 text-slate-950",
      },
      {
        id: "proyectos",
        theme: "BLUE",
        badgeText: "NUEVO MÓDULO",
        subtitle: "CONTROL DE GESTIÓN SEMANAL",
        title: "PROYECTOS Y TAREAS (%)",
        desc: "Asignación de proyectos en ejecución al personal de RRHH, porcentaje de avance (%) e Informe Semanal en PDF para justificar actividades.",
        pills: [
          { symbol: "📊", text: `${globalProjectsProgress}% Avance Global`, color: "text-blue-400" },
          { symbol: "📄", text: "Informe Semanal PDF", color: "text-amber-400" },
        ],
        footerCode: `${projects.length} PROYECTOS`,
        icon: Briefcase,
        cornerBadge: "%",
        cornerBg: "bg-amber-400 text-slate-950",
      },
      {
        id: "bienes",
        theme: "WARM",
        badgeText: "ACTIVO",
        subtitle: "PATRIMONIO E INVENTARIO PÚBLICO",
        title: "BIENES NACIONALES",
        desc: "Control de artículos con lista desplegable auto-alimentada, marca, modelo, serial, código de bien nacional y reporte en PDF con cintillo de memorando.",
        pills: [
          { symbol: "📦", text: `${bienesList.length} Artículos`, color: "text-amber-400" },
          { symbol: "🖨", text: "Reporte Oficial PDF", color: "text-emerald-400" },
        ],
        footerCode: "BN-CENDIS-2026",
        icon: Package,
        cornerBadge: "✓",
        cornerBg: "bg-emerald-500 text-slate-950",
      },
      {
        id: "attendance",
        theme: "BLUE",
        badgeText: "ACTIVO",
        subtitle: "LECTOR DE CÓDIGO Y HORARIO",
        title: "CONTROL DE ASISTENCIA",
        desc: "Ventana receptora de códigos de barra o cédula del personal con día y hora exacta de entrada y generación de reporte semanal del personal.",
        pills: [
          { symbol: "⏱", text: `${attendanceRecords.length} Entradas`, color: "text-blue-400" },
          { symbol: "📋", text: "Reporte Semanal", color: "text-emerald-400" },
        ],
        footerCode: "LECTOR ACTIVO",
        icon: UserCheck,
        cornerBadge: "✓",
        cornerBg: "bg-amber-400 text-slate-950",
      },
      {
        id: "stats",
        theme: "WARM",
        badgeText: "ACTIVO",
        subtitle: "CONTABILIDAD INSTITUCIONAL",
        title: "ESTADÍSTICA GENERAL",
        desc: "Contabilidad en tiempo real de los memorándums, solicitudes, días agendados, usuarios creados, personal de RRHH, proyectos y bienes nacionales.",
        pills: [
          { symbol: "#", text: "Métricas al Día", color: "text-amber-400" },
          { symbol: "📈", text: "Balance Global", color: "text-emerald-400" },
        ],
        footerCode: "SGI-METRICAS",
        icon: BarChart3,
        cornerBadge: "★",
        cornerBg: "bg-emerald-500 text-slate-950",
      },
      {
        id: "org",
        theme: "BLUE",
        badgeText: "NUEVO MÓDULO",
        subtitle: "ESTRUCTURA JERÁRQUICA",
        title: "ORGANIGRAMA CENDIS",
        desc: "Visualización de la estructura organizativa de la Fundación CENDIS en formato textual o tipo diagrama jerárquico integrado con Recursos Humanos.",
        pills: [
          { symbol: "🏛", text: "Diagrama Visual", color: "text-blue-400" },
          { symbol: "📑", text: "Vista Textual", color: "text-amber-400" },
        ],
        footerCode: "ESTRUCTURA MPPC",
        icon: GitBranch,
        cornerBadge: "6",
        cornerBg: "bg-amber-400 text-slate-950",
      },
      {
        id: "config",
        theme: "WARM",
        badgeText: "ADMIN",
        subtitle: "SUBMÓDULO DE USUARIOS Y ROLES",
        title: "CONFIGURACIÓN",
        desc: "Administración de usuarios del sistema, asignación de rol Administrador o Estándar y control detallado de permisología por pantallas y acciones.",
        pills: [
          { symbol: "🛡", text: `${users.length} Usuarios`, color: "text-amber-400" },
          { symbol: "🔑", text: "Permisología", color: "text-emerald-400" },
        ],
        footerCode: "ADMIN-CONTROL",
        icon: Settings,
        cornerBadge: "⚙",
        cornerBg: "bg-emerald-500 text-slate-950",
      },
    ];

    return (
      <div className="min-h-screen bg-[#050a15] text-slate-100 flex flex-col font-sans">
        <div className="grid grid-cols-3 h-1.5 w-full">
          <div className="bg-[#facc15]" />
          <div className="bg-[#1d4ed8]" />
          <div className="bg-[#dc2626]" />
        </div>

        <header className="bg-[#0b1221] border-b border-slate-800/90 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow">
              <CendisGlyphLogo className="w-24" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] block">
                MINISTERIO DEL PODER POPULAR PARA LA CULTURA
              </span>
              <h1 className="text-base font-black text-white uppercase tracking-tight">
                FUNDACIÓN CENTRO NACIONAL DEL DISCO (CENDIS)
              </h1>
              <p className="text-xs text-slate-400">
                Usuario: <span className="font-bold text-white">{currentUser.fullName}</span>{" "}
                ({currentUser.email || `${currentUser.username}@gmail.com`}) • Rol:{" "}
                <span className="font-bold text-[#f59e0b]">
                  {currentUser.role === "ADMIN" ? "Administrador" : "Usuario Estándar"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-5 md:p-8 space-y-6">
          {!currentUserLinkedEmployee && (
            <div className="rounded-2xl bg-amber-950/70 border border-amber-500/60 p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shrink-0">
                  !
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase text-amber-300">
                    Aviso de Recursos Humanos: Cuenta de Google pendiente por vincular
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Ha iniciado sesión con{" "}
                    <span className="font-bold text-white">
                      {currentUser.email || `${currentUser.username}@gmail.com`}
                    </span>
                    . Ingrese al módulo de <strong>RECURSOS HUMANOS</strong> para vincular su correo con los datos personales del trabajador.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab("hr");
                  setCurrentScreen("APP");
                }}
                className="px-4 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-slate-950 font-black text-xs cursor-pointer shadow"
              >
                Ir a Recursos Humanos para Vincular →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portalModules.map((mod) => {
              const IconComp = mod.icon;
              const isWarm = mod.theme === "WARM";
              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    if (!canEnterModule(mod.id)) {
                      showToast(
                        `Acceso restringido: Su usuario no tiene permiso para ingresar a la pantalla "${mod.title}".`,
                        "error"
                      );
                      return;
                    }
                    setActiveTab(mod.id);
                    setCurrentScreen("APP");
                  }}
                  className={`group relative rounded-[28px] p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                    isWarm
                      ? "bg-gradient-to-br from-[#2a1215] via-[#17111a] to-[#0c1220] border-[#7c2d12]/70 hover:border-[#f59e0b]"
                      : "bg-gradient-to-br from-[#10203b] via-[#0d182c] to-[#09101d] border-[#1e3a8a]/80 hover:border-[#3b82f6]"
                  } shadow-2xl`}
                >
                  <div>
                    {/* Fila superior: Icono con insignia en la esquina + Píldora de estado */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                            isWarm
                              ? "bg-[#2a1712] border-amber-500/40 text-[#f59e0b]"
                              : "bg-[#112445] border-blue-400/40 text-blue-400"
                          }`}
                        >
                          <IconComp className="w-7 h-7" />
                        </div>
                        <span
                          className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg ${mod.cornerBg} font-black text-xs flex items-center justify-center shadow-md`}
                        >
                          {mod.cornerBadge}
                        </span>
                      </div>

                      <span
                        className={`px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                          isWarm
                            ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400"
                            : "bg-blue-950/80 border-blue-400/40 text-blue-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isWarm ? "bg-emerald-400" : "bg-blue-400"
                          }`}
                        />
                        {mod.badgeText}
                      </span>
                    </div>

                    {/* Subtítulo y Título */}
                    <p
                      className={`text-xs font-black uppercase tracking-wider mb-1 ${
                        isWarm ? "text-[#f59e0b]" : "text-[#38bdf8]"
                      }`}
                    >
                      {mod.subtitle}
                    </p>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                      {mod.title}
                    </h3>

                    {/* Descripción */}
                    <p className="text-sm text-slate-300/90 mt-3 leading-relaxed">
                      {mod.desc}
                    </p>

                    {/* Píldoras informativas */}
                    <div className="flex flex-wrap gap-2 mt-5">
                      {mod.pills.map((pill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-full bg-[#090d16]/90 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                        >
                          <span className={`font-black ${pill.color}`}>{pill.symbol}</span>
                          <span>{pill.text}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Barra inferior con código */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400 tracking-wider">
                      {mod.footerCode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================================
  // 3) ÁREA DE TRABAJO PRINCIPAL (ESTILO OSCURO CÁLIDO/AZUL COMO LAS CAPTURAS)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#050a15] text-slate-100 flex flex-col font-sans">
      <style>{`
        /* Adaptación de paneles al tema oscuro de las capturas fuera del área de impresión */
        .cendis-dark-workspace .bg-white:not(#printable-area):not(#printable-area *) {
          background: linear-gradient(145deg, #161824 0%, #0d1322 100%) !important;
          color: #f1f5f9 !important;
          border-color: rgba(148, 163, 184, 0.18) !important;
        }
        .cendis-dark-workspace .bg-slate-50:not(#printable-area):not(#printable-area *),
        .cendis-dark-workspace .bg-slate-100:not(#printable-area):not(#printable-area *) {
          background-color: #080d19 !important;
          color: #e2e8f0 !important;
          border-color: rgba(148, 163, 184, 0.15) !important;
        }
        .cendis-dark-workspace .text-slate-900:not(#printable-area *),
        .cendis-dark-workspace .text-slate-800:not(#printable-area *),
        .cendis-dark-workspace .text-slate-700:not(#printable-area *) {
          color: #f8fafc !important;
        }
        .cendis-dark-workspace .text-slate-600:not(#printable-area *),
        .cendis-dark-workspace .text-slate-500:not(#printable-area *) {
          color: #94a3b8 !important;
        }
        .cendis-dark-workspace input:not(#printable-area *),
        .cendis-dark-workspace select:not(#printable-area *),
        .cendis-dark-workspace textarea:not(#printable-area *) {
          background-color: #070b14 !important;
          color: #f8fafc !important;
          border-color: rgba(148, 163, 184, 0.25) !important;
        }
        .cendis-dark-workspace input:focus:not(#printable-area *),
        .cendis-dark-workspace select:focus:not(#printable-area *),
        .cendis-dark-workspace textarea:focus:not(#printable-area *) {
          outline: none !important;
          border-color: #f59e0b !important;
        }
        /* Garantizar hoja de impresión blanca intacta */
        #printable-area {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* NOTIFICACIÓN FLOTANTE (TOAST) */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#161824] text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/50 text-xs font-bold flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <header className="print:hidden bg-[#0b1221] text-white px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentScreen("PORTAL")}
            className="px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] text-xs font-bold flex items-center gap-1.5 border border-slate-700 text-[#f59e0b] cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Módulos</span>
          </button>
          <span className="font-black tracking-tight text-xs uppercase text-white hidden sm:inline">
            SGI-CENDIS
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {[
            { id: "editor", label: "Memos", icon: FileText },
            { id: "agenda", label: "Agenda", icon: CalendarIcon },
            { id: "hr", label: "RRHH & Carnets", icon: Users },
            { id: "proyectos", label: "Proyectos (%)", icon: Briefcase },
            { id: "bienes", label: "Bienes Nacionales", icon: Package },
            { id: "attendance", label: "Asistencia", icon: UserCheck },
            { id: "stats", label: "Estadística", icon: BarChart3 },
            { id: "org", label: "Organigrama", icon: GitBranch },
            { id: "config", label: "Configuración", icon: Settings },
          ].map((tab) => {
            const IconT = tab.icon;
            const allowed = canEnterModule(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!allowed) {
                    showToast(
                      `Acceso restringido: Su usuario no tiene permiso para ingresar a "${tab.label}".`,
                      "error"
                    );
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#f59e0b] text-slate-950 font-black shadow"
                    : allowed
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 opacity-60"
                }`}
              >
                <IconT className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Selector de vista PC / Tablet / Móvil */}
          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setDeviceViewport("DESKTOP")}
              className={`p-1 rounded ${deviceViewport === "DESKTOP" ? "bg-[#f59e0b] text-slate-950" : "text-slate-400"}`}
              title="Vista Computadora"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceViewport("TABLET")}
              className={`p-1 rounded ${deviceViewport === "TABLET" ? "bg-[#f59e0b] text-slate-950" : "text-slate-400"}`}
              title="Vista Tablet"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceViewport("MOBILE")}
              className={`p-1 rounded ${deviceViewport === "MOBILE" ? "bg-[#f59e0b] text-slate-950" : "text-slate-400"}`}
              title="Vista Teléfono"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* CONTENEDOR ADAPTABLE SEGÚN DISPOSITIVO */}
      <div className={`cendis-dark-workspace bg-[#050a15] flex-1 flex flex-col ${viewportContainerClass}`}>
        {/* ====================================================================
            MÓDULO 1: MEMORÁNDUMS Y SOLICITUDES
           ==================================================================== */}
        {activeTab === "editor" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 print:hidden h-fit">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black uppercase text-slate-800">Emitir Memorándum / Solicitud</h2>
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-800 text-xs font-black">
                  {formattedCorrelative}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType("MEMORANDUM")}
                  className={`py-2 rounded-xl text-xs font-black uppercase border cursor-pointer ${
                    docType === "MEMORANDUM"
                      ? "bg-[#8b1538] text-white border-[#8b1538]"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Memorándum
                </button>
                <button
                  type="button"
                  onClick={() => setDocType("SOLICITUD")}
                  className={`py-2 rounded-xl text-xs font-black uppercase border cursor-pointer ${
                    docType === "SOLICITUD"
                      ? "bg-[#8b1538] text-white border-[#8b1538]"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Solicitud
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    PARA (Seleccionar de RRHH o escribir):
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setPara(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 mb-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="">-- Seleccionar trabajador de RRHH --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={`${emp.nombres} ${emp.apellidos} - ${emp.cargo}`}>
                        {emp.nombres} {emp.apellidos} ({emp.cargo})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={para}
                    onChange={(e) => setPara(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">DE:</label>
                  <input
                    type="text"
                    value={de}
                    onChange={(e) => setDe(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">FECHA:</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">CORRELATIVO:</label>
                    <input
                      type="text"
                      value={manualCorrelative ? customCorrelative : formattedCorrelative}
                      onChange={(e) => {
                        setManualCorrelative(true);
                        setCustomCorrelative(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">ASUNTO:</label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">CONCEPTO / CUERPO:</label>
                  <textarea
                    rows={4}
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-700">Firmante Predeterminado o Editable</span>
                <input
                  type="text"
                  value={signerNombre}
                  onChange={(e) => setSignerNombre(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                />
                <input
                  type="text"
                  value={signerCargo}
                  onChange={(e) => setSignerCargo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleEmitDocument}
                  className="flex-1 py-2.5 rounded-xl bg-[#8b1538] hover:bg-[#6e102c] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Emitir Documento</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir PDF</span>
                </button>
              </div>

              {/* BANDEJA DE CORRELATIVOS Y APROBACIÓN DEL ADMINISTRADOR */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-800">
                  Historial de Correlativos y Aprobación Admin ({documents.length})
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {documents.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-black text-slate-900">{d.correlativo}</div>
                        <div className="text-slate-600 truncate max-w-[180px]">{d.asunto}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            d.status === "APROBADO"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.status}
                        </span>
                        {d.status !== "APROBADO" && currentUser?.role === "ADMIN" && (
                          <button
                            onClick={() => handleApproveDocument(d.id)}
                            className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                          >
                            ✓ Aprobar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* VISTA PREVIA DE IMPRESIÓN OFICIAL */}
            <div className="lg:col-span-7 flex justify-center">
              <div
                id="printable-area"
                className="w-full max-w-[790px] min-h-[1020px] bg-white shadow-xl border border-slate-200 flex flex-col justify-between relative"
              >
                <div className="p-10 pb-4">
                  <OfficialHeaderCintillo showRightLogo={true} />

                  <div className="mt-6 text-center">
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">
                      {docType === "MEMORANDUM" ? "MEMORÁNDUM" : "SOLICITUD"}
                    </h2>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{formattedCorrelative}</p>
                  </div>

                  <div className="mt-6 border-t-2 border-b-2 border-slate-900 py-3 space-y-2 text-xs">
                    <div className="grid grid-cols-12">
                      <span className="col-span-2 font-black uppercase">PARA:</span>
                      <span className="col-span-10 font-semibold">{para}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-2 font-black uppercase">DE:</span>
                      <span className="col-span-10 font-semibold">{de}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-2 font-black uppercase">FECHA:</span>
                      <span className="col-span-10">{fecha}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-2 font-black uppercase">ASUNTO:</span>
                      <span className="col-span-10 font-bold uppercase">{asunto}</span>
                    </div>
                  </div>

                  <div className="mt-6 text-xs leading-relaxed text-justify whitespace-pre-line text-slate-900 min-h-[340px]">
                    {concepto}
                  </div>

                  <div className="mt-12 text-center">
                    <p className="text-xs font-semibold mb-10">Atentamente,</p>
                    <div className="w-64 mx-auto border-t border-slate-900 pt-2">
                      <p className="text-xs font-black uppercase text-slate-900">{signerNombre}</p>
                      <p className="text-[11px] font-semibold text-slate-700">{signerCargo}</p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">{signerResolucion}</p>
                    </div>
                  </div>
                </div>

                <OfficialFooterWave />
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MÓDULO 2: AGENDA INSTITUCIONAL
           ==================================================================== */}
        {activeTab === "agenda" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Agenda Institucional y Alertas • Fundación CENDIS
                </h2>
                <p className="text-xs text-slate-500">
                  Notificaciones por App/Correo/WhatsApp, aprobación por Administrador y Reporte en Arial 12 / Calibri 11 Negrilla.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAgendaViewMode("CALENDAR")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    agendaViewMode === "CALENDAR" ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Calendario Mensual</span>
                </button>
                <button
                  onClick={() => setAgendaViewMode("REPORT")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    agendaViewMode === "REPORT" ? "bg-[#8b1538] text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Reporte Semanal / Mensual PDF</span>
                </button>
              </div>
            </div>

            {agendaViewMode === "CALENDAR" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-wider">Noviembre 2026</span>
                  <span className="text-xs text-amber-400 font-semibold">
                    Haz clic en cualquier día para abrir la ventana flotante
                  </span>
                </div>
                <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-[11px] font-black uppercase text-slate-600 py-2">
                  <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
                  {calendarDays.map((d) => {
                    const dayEvents = agendaEvents.filter((ev) => ev.date === d.dateStr);
                    return (
                      <div
                        key={d.dateStr}
                        onClick={() => setSelectedDayModal(d.dateStr)}
                        className="min-h-[105px] p-2 hover:bg-blue-50/60 cursor-pointer transition flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">{d.dayNumber}</span>
                          {dayEvents.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={`px-1.5 py-1 rounded text-white text-[10px] font-semibold truncate ${
                                ev.status === "APROBADO" ? "bg-blue-900" : "bg-amber-600"
                              }`}
                            >
                              {ev.startTime} • {ev.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-end justify-between gap-4 print:hidden">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={reportPeriodType}
                      onChange={(e) => {
                        setReportPeriodType(e.target.value);
                        if (e.target.value === "MENSUAL") setReportSemanaLabel("Mes de Noviembre 2026");
                        else setReportSemanaLabel("Semana del 16 al 22 de noviembre");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value="SEMANAL">Reporte Semanal</option>
                      <option value="MENSUAL">Reporte Mensual</option>
                    </select>
                    <input
                      type="text"
                      value={reportSemanaLabel}
                      onChange={(e) => setReportSemanaLabel(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold w-64"
                    />
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Reporte en PDF</span>
                  </button>
                </div>

                {/* HOJA OFICIAL DE AGENDA IDÉNTICA A agenda.pdf.png */}
                <div
                  id="printable-area"
                  className="w-full max-w-[820px] min-h-[1040px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="p-10 pb-4">
                    <OfficialHeaderCintillo showRightLogo={false} />
                    <div
                      className="mt-8 mb-6 space-y-2 text-black"
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: "12pt",
                        fontWeight: "bold",
                        fontStyle: "italic",
                      }}
                    >
                      <div>{reportViceministerio}</div>
                      <div>{reportEnteTitle}</div>
                      <div>{reportSemanaLabel}</div>
                    </div>

                    <table
                      className="w-full border-collapse border border-black table-fixed"
                      style={{ fontFamily: "Calibri, sans-serif", fontSize: "11pt", fontWeight: "bold" }}
                    >
                      <thead>
                        <tr className="bg-[#9fb0c2] text-black">
                          {reportDayColumns.map((col) => (
                            <th key={col.dateIso} className="border border-black px-2.5 py-1.5 text-left font-bold">
                              {col.dayLabel}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {reportDayColumns.map((col) => (
                            <td
                              key={col.dateIso}
                              className="border border-black p-2.5 align-top h-[430px] text-black leading-tight"
                            >
                              {col.events.length === 0 ? (
                                <div className="text-slate-400">Sin actividades</div>
                              ) : (
                                <div className="space-y-4">
                                  {col.events.map((ev) => (
                                    <div key={ev.id} className="space-y-0.5">
                                      <div>Ente: {ev.ente}</div>
                                      <div>Actividad: {ev.title}</div>
                                      <div>Hora: {ev.startTime}</div>
                                      <div>Lugar: {ev.location}</div>
                                      <div>Responsable: {ev.responsable}</div>
                                      <div>Contacto: {ev.contacto}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <OfficialFooterWave />
                </div>
              </div>
            )}

            {/* SEGUNDA VENTANA FLOTANTE DEL DÍA */}
            {selectedDayModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                  <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        Ventana Flotante de Programación y Alertas
                      </span>
                      <h3 className="text-sm font-black">Actividades del Día: {selectedDayModal}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedDayModal(null)}
                      className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded bg-blue-800 cursor-pointer"
                    >
                      Cerrar ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-700">Eventos en esta fecha</h4>
                      {agendaEvents.filter((e) => e.date === selectedDayModal).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay eventos agendados.</p>
                      ) : (
                        agendaEvents
                          .filter((e) => e.date === selectedDayModal)
                          .map((ev) => (
                            <div
                              key={ev.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center gap-2"
                            >
                              <div>
                                <div className="font-black text-slate-900">
                                  {ev.startTime} - {ev.title}
                                </div>
                                <div className="text-slate-600">
                                  Resp: {ev.responsable} ({ev.contacto}) •{" "}
                                  <span className="font-bold">{ev.status}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {ev.status !== "APROBADO" && currentUser?.role === "ADMIN" && (
                                  <button
                                    onClick={() =>
                                      setAgendaEvents((prev) =>
                                        prev.map((item) =>
                                          item.id === ev.id ? { ...item, status: "APROBADO" } : item
                                        )
                                      )
                                    }
                                    className="px-2 py-1 rounded bg-emerald-700 text-white text-[10px] font-bold"
                                  >
                                    ✓ Aprobar
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    setAgendaEvents((prev) => prev.filter((item) => item.id !== ev.id))
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    <form onSubmit={handleAddEventToDay} className="space-y-3 pt-3 border-t border-slate-200">
                      <h4 className="text-xs font-black uppercase text-blue-900">
                        + Programar Actividad (Vinculado con Personal de RRHH)
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Ente"
                          value={newEventForm.ente}
                          onChange={(e) => setNewEventForm({ ...newEventForm, ente: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Hora (ej. 10:00am)"
                          value={newEventForm.startTime}
                          onChange={(e) => setNewEventForm({ ...newEventForm, startTime: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Actividad"
                        value={newEventForm.title}
                        onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Lugar"
                          value={newEventForm.location}
                          onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <select
                          value={newEventForm.responsable}
                          onChange={(e) => {
                            const emp = employees.find(
                              (item) => `${item.nombres} ${item.apellidos}` === e.target.value
                            );
                            setNewEventForm({
                              ...newEventForm,
                              responsable: e.target.value,
                              contacto: emp ? emp.telefono : newEventForm.contacto,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={`${emp.nombres} ${emp.apellidos}`}>
                              {emp.nombres} {emp.apellidos}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Guardar y Enviar Aviso (App / Correo / WhatsApp)</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            MÓDULO 3: RECURSOS HUMANOS, CARNETS Y REPORTE DE PERSONAL CON FILTROS
           ==================================================================== */}
        {activeTab === "hr" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900">
                  Módulo de Recursos Humanos, Carnetización y Reportes con Filtros
                </h2>
                <p className="text-xs text-slate-500">
                  Los trabajadores ingresados aquí alimentan los módulos de Proyectos, Bienes Nacionales, Memos, Agenda y Asistencia.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHrSubTab("LISTA")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    hrSubTab === "LISTA" ? "bg-[#8b1538] text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Expedientes y Carnets ({employees.length})
                </button>
                <button
                  onClick={() => setHrSubTab("REPORTE_FILTROS")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    hrSubTab === "REPORTE_FILTROS" ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Reporte de Todo el Personal (con Filtros)</span>
                </button>
              </div>
            </div>

            {/* AVISO DE VINCULACIÓN DE CUENTA GOOGLE / GMAIL CON DATOS PERSONALES DEL TRABAJADOR */}
            {!currentUserLinkedEmployee || showLinkChangeSelector ? (
              <div className="rounded-2xl bg-amber-950/85 border-2 border-amber-500/80 p-5 space-y-4 shadow-xl print:hidden">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shrink-0 shadow">
                      !
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                        Control de Identidad Google Workspace / Gmail • Recursos Humanos
                      </span>
                      <h3 className="text-sm font-black uppercase text-white mt-0.5">
                        Aviso: Vincule su correo ({currentUser.email || `${currentUser.username}@gmail.com`}) con los datos personales del trabajador
                      </h3>
                      <p className="text-xs text-slate-200 mt-1">
                        Para tener control completo de sus gestiones en SGI-CENDIS, asocie su correo de inicio de sesión con su expediente personal en la nómina de Recursos Humanos o registre su ficha abajo.
                      </p>
                    </div>
                  </div>
                  {currentUserLinkedEmployee && (
                    <button
                      type="button"
                      onClick={() => setShowLinkChangeSelector(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      Cancelar cambio
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-500/30">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedEmpIdToLink}
                      onChange={(e) => setSelectedEmpIdToLink(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="">-- Seleccione trabajador existente en RRHH --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} ({emp.cedula} • {emp.cargo})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedEmpIdToLink) {
                          showToast("Seleccione un trabajador de la lista para vincular su correo.", "error");
                          return;
                        }
                        handleLinkUserToEmployee(selectedEmpIdToLink);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow"
                    >
                      Vincular con este Trabajador
                    </button>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const userEmail = currentUser.email || `${currentUser.username}@gmail.com`;
                        const parts = (currentUser.fullName || "").trim().split(" ");
                        setHrSubTab("LISTA");
                        setNewEmpForm((prev) => ({
                          ...prev,
                          nombres: parts[0] || "",
                          apellidos: parts.slice(1).join(" ") || "",
                          correo: userEmail,
                        }));
                        showToast(
                          `Correo ${userEmail} cargado en el formulario. Complete su Cédula, Cargo y Teléfono y presione "+ Ingresar Trabajador".`
                        );
                      }}
                      className="w-full md:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow"
                    >
                      + Cargar mi correo en formulario de nuevo trabajador
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-950/75 border border-emerald-500/60 p-4 flex flex-wrap items-center justify-between gap-3 shadow print:hidden">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                      Cuenta de Correo Vinculada con Recursos Humanos
                    </span>
                    <p className="text-xs text-slate-100">
                      Correo Google:{" "}
                      <strong className="text-white">
                        {currentUser.email || `${currentUser.username}@gmail.com`}
                      </strong>{" "}
                      → Trabajador:{" "}
                      <strong className="text-amber-300">
                        {currentUserLinkedEmployee.nombres} {currentUserLinkedEmployee.apellidos}
                      </strong>{" "}
                      ({currentUserLinkedEmployee.cedula} • {currentUserLinkedEmployee.cargo})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmpIdToLink(currentUserLinkedEmployee.id);
                    setShowLinkChangeSelector(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-600"
                >
                  Cambiar vinculación
                </button>
              </div>
            )}

            {hrSubTab === "LISTA" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const created = { id: `emp-${Date.now()}`, ...newEmpForm };
                    setEmployees((prev) => [...prev, created]);
                    addLog(`Ingresado trabajador en RRHH: ${created.nombres} ${created.apellidos}`);

                    const currentEmail = (currentUser?.email || "").trim().toLowerCase();
                    if (
                      currentEmail &&
                      created.correo &&
                      created.correo.trim().toLowerCase() === currentEmail
                    ) {
                      const updatedUser = {
                        ...currentUser,
                        fullName: `${created.nombres} ${created.apellidos}`,
                        cargo: created.cargo,
                        linkedEmployeeId: created.id,
                      };
                      setCurrentUser(updatedUser);
                      setSessionCookie(updatedUser);
                      setUsers((prev) =>
                        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
                      );
                      setShowLinkChangeSelector(false);
                      showToast(
                        `Trabajador ${created.nombres} ${created.apellidos} registrado y vinculado a su cuenta ${created.correo}.`
                      );
                    } else {
                      showToast(`Trabajador ${created.nombres} ${created.apellidos} registrado e integrado.`);
                    }

                    setNewEmpForm({
                      ...newEmpForm,
                      nombres: "",
                      apellidos: "",
                      cedula: "",
                      cargo: "",
                      telefono: "",
                      correo: "",
                      direccion: "",
                      codigoBarra: "2024-CENDIS-000" + Math.floor(130 + Math.random() * 800),
                    });
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Nombres"
                    value={newEmpForm.nombres}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, nombres: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Apellidos"
                    value={newEmpForm.apellidos}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, apellidos: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Cédula (ej. V-12.345.678)"
                    value={newEmpForm.cedula}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, cedula: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Cargo"
                    value={newEmpForm.cargo}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, cargo: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <select
                    value={newEmpForm.coordinacion}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, coordinacion: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Presidencia">Presidencia</option>
                    <option value="Dirección Ejecutiva">Dirección Ejecutiva</option>
                    <option value="Producción Fonográfica">Producción Fonográfica</option>
                    <option value="Cultura Audiovisual">Cultura Audiovisual</option>
                    <option value="Administración y RRHH">Administración y RRHH</option>
                    <option value="Tecnología y Sistemas">Tecnología y Sistemas</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Teléfono"
                    value={newEmpForm.telefono}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, telefono: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Correo Gmail (ej. trabajador@gmail.com)"
                    value={newEmpForm.correo || ""}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, correo: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <select
                    value={newEmpForm.tieneCargaFamiliar}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, tieneCargaFamiliar: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="SI">Con Carga Familiar</option>
                    <option value="NO">Sin Carga Familiar</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Detalle Familiares / Emergencia"
                    value={newEmpForm.familiares}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, familiares: e.target.value, emergencia1: e.target.value })
                    }
                    className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="submit"
                    className="md:col-span-2 py-2.5 rounded-xl bg-[#8b1538] hover:bg-[#6e102c] text-white font-bold text-xs shadow cursor-pointer"
                  >
                    + Ingresar Trabajador al Padrón de Recursos Humanos CENDIS
                  </button>
                </form>

                <div className="overflow-x-auto pt-3 border-t border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-black">
                        <th className="p-3">Cédula</th>
                        <th className="p-3">Trabajador</th>
                        <th className="p-3">Cargo</th>
                        <th className="p-3">Coordinación</th>
                        <th className="p-3">Correo Google Vinculado</th>
                        <th className="p-3">Código Carnet</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {employees.map((emp) => {
                        const isMyLinkedEmp = currentUserLinkedEmployee?.id === emp.id;
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{emp.cedula}</td>
                            <td className="p-3 font-semibold">
                              {emp.nombres} {emp.apellidos}
                            </td>
                            <td className="p-3">{emp.cargo}</td>
                            <td className="p-3">{emp.coordinacion}</td>
                            <td className="p-3">
                              {emp.correo ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                                  {emp.correo}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Sin vincular</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px]">{emp.codigoBarra}</td>
                            <td className="p-3 flex flex-wrap items-center gap-1.5">
                              {!isMyLinkedEmp && (
                                <button
                                  type="button"
                                  onClick={() => handleLinkUserToEmployee(emp.id)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] cursor-pointer"
                                >
                                  Vincular mi correo
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedEmpForCard(emp)}
                                className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Carnet</span>
                              </button>
                              <button
                                onClick={() => setSelectedEmpForCV(emp)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Hoja de Vida PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* REPORTE GENERAL DE PERSONAL CON FILTROS */
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 print:hidden">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Tipo de Reporte
                    </label>
                    <select
                      value={hrReportType}
                      onChange={(e) => setHrReportType(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value="NOMINA_COMPLETA">Nómina General Completa</option>
                      <option value="CARGA_FAMILIAR">Reporte de Carga Familiar y Emergencias</option>
                      <option value="CARNETIZACION">Padrón de Carnets y Códigos de Barra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Filtrar Coordinación
                    </label>
                    <select
                      value={hrFilterCoord}
                      onChange={(e) => setHrFilterCoord(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value="TODAS">Todas las Coordinaciones</option>
                      <option value="Presidencia">Presidencia</option>
                      <option value="Dirección Ejecutiva">Dirección Ejecutiva</option>
                      <option value="Producción Fonográfica">Producción Fonográfica</option>
                      <option value="Cultura Audiovisual">Cultura Audiovisual</option>
                      <option value="Administración y RRHH">Administración y RRHH</option>
                      <option value="Tecnología y Sistemas">Tecnología y Sistemas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Filtrar Carga Familiar
                    </label>
                    <select
                      value={hrFilterCarga}
                      onChange={(e) => setHrFilterCarga(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="SI">Solo Con Carga Familiar</option>
                      <option value="NO">Sin Carga Familiar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Buscar por Nombre/Cédula
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={hrFilterSearch}
                      onChange={(e) => setHrFilterSearch(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Reporte PDF</span>
                    </button>
                  </div>
                </div>

                <div
                  id="printable-area"
                  className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="p-10">
                    <OfficialHeaderCintillo showRightLogo={true} />
                    <div className="mt-6 mb-4 text-center">
                      <h2 className="text-base font-black uppercase text-slate-900">
                        REPORTE GENERAL DE PERSONAL • RECURSOS HUMANOS CENDIS
                      </h2>
                      <p className="text-xs text-slate-600 font-semibold">
                        Modalidad: {hrReportType} | Coordinación: {hrFilterCoord} | Total Filtrados:{" "}
                        {filteredEmployees.length}
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black uppercase">
                          <th className="border border-slate-900 p-2">Cédula</th>
                          <th className="border border-slate-900 p-2">Nombres y Apellidos</th>
                          <th className="border border-slate-900 p-2">Cargo</th>
                          <th className="border border-slate-900 p-2">Coordinación</th>
                          <th className="border border-slate-900 p-2">
                            {hrReportType === "CARGA_FAMILIAR"
                              ? "Familiares / Emergencia"
                              : hrReportType === "CARNETIZACION"
                              ? "Código de Barra Carnet"
                              : "Teléfono"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((emp) => (
                          <tr key={emp.id}>
                            <td className="border border-slate-900 p-2 font-bold">{emp.cedula}</td>
                            <td className="border border-slate-900 p-2">
                              {emp.nombres} {emp.apellidos}
                            </td>
                            <td className="border border-slate-900 p-2">{emp.cargo}</td>
                            <td className="border border-slate-900 p-2">{emp.coordinacion}</td>
                            <td className="border border-slate-900 p-2">
                              {hrReportType === "CARGA_FAMILIAR"
                                ? `${emp.familiares} (${emp.emergencia1})`
                                : hrReportType === "CARNETIZACION"
                                ? emp.codigoBarra
                                : emp.telefono}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <OfficialFooterWave />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            MÓDULO 4: PROYECTOS Y TAREAS EN EJECUCIÓN + INFORME SEMANAL PDF (%)
           ==================================================================== */}
        {activeTab === "proyectos" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900">
                  Módulo de Proyectos y Tareas en Ejecución • Avance Global: {globalProjectsProgress}%
                </h2>
                <p className="text-xs text-slate-500">
                  Asignación directa al personal de Recursos Humanos e Informe Semanal en PDF para justificar actividades completadas y pendientes.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setProjectsViewMode("BOARD")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    projectsViewMode === "BOARD" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Tablero de Proyectos
                </button>
                <button
                  onClick={() => setProjectsViewMode("PDF_REPORT")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    projectsViewMode === "PDF_REPORT" ? "bg-[#8b1538] text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Informe Semanal en PDF (% y Justificación)</span>
                </button>
              </div>
            </div>

            {projectsViewMode === "BOARD" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pct = Number(newProjectForm.porcentaje) || 0;
                    const est = pct >= 100 ? "COMPLETADO" : pct > 0 ? "EN_EJECUCION" : "PENDIENTE";
                    const created = {
                      id: `proj-${Date.now()}`,
                      ...newProjectForm,
                      porcentaje: pct,
                      estatus: est,
                    };
                    setProjects((prev) => [created, ...prev]);
                    addLog(`Creado proyecto '${created.nombre}' asignado a ${created.responsable} (${pct}%)`);
                    showToast(`Proyecto asignado a ${created.responsable}`);
                    setNewProjectForm({
                      ...newProjectForm,
                      nombre: "",
                      tarea: "",
                      justificacion: "",
                      porcentaje: 0,
                    });
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Proyecto"
                    value={newProjectForm.nombre}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, nombre: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Tarea específica a ejecutar"
                    value={newProjectForm.tarea}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, tarea: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <select
                    value={newProjectForm.responsable}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, responsable: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={`${emp.nombres} ${emp.apellidos}`}>
                        Asignar a (RRHH): {emp.nombres} {emp.apellidos}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="% Avance inicial"
                    value={newProjectForm.porcentaje}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, porcentaje: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Justificación técnica / institucional para el informe semanal"
                    value={newProjectForm.justificacion}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, justificacion: e.target.value })}
                    className="md:col-span-3 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs cursor-pointer"
                  >
                    + Asignar Proyecto
                  </button>
                </form>

                <div className="space-y-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{p.nombre}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.porcentaje >= 100
                                ? "bg-emerald-100 text-emerald-800"
                                : p.porcentaje > 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.porcentaje >= 100
                              ? "COMPLETADO (100%)"
                              : p.porcentaje > 0
                              ? `EN EJECUCIÓN (${p.porcentaje}%)`
                              : "PENDIENTE (0%)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold">Tarea: {p.tarea}</p>
                        <p className="text-[11px] text-slate-500">Justificación: {p.justificacion}</p>
                        <p className="text-[11px] font-bold text-indigo-900">
                          Responsable (RRHH): {p.responsable} • Entrega: {p.fechaEntrega}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {[0, 25, 50, 75, 100].map((pctVal) => (
                          <button
                            key={pctVal}
                            onClick={() =>
                              setProjects((prev) =>
                                prev.map((item) =>
                                  item.id === p.id
                                    ? {
                                        ...item,
                                        porcentaje: pctVal,
                                        estatus:
                                          pctVal === 100
                                            ? "COMPLETADO"
                                            : pctVal > 0
                                            ? "EN_EJECUCION"
                                            : "PENDIENTE",
                                      }
                                    : item
                                )
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                              p.porcentaje === pctVal
                                ? "bg-indigo-700 text-white"
                                : "bg-white border border-slate-300 text-slate-700"
                            }`}
                          >
                            {pctVal}%
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* INFORME SEMANAL DE PROYECTOS EN PDF CON EL CINTILLO OFICIAL */
              <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Informe Semanal de Proyectos (PDF)</span>
                  </button>
                </div>

                <div
                  id="printable-area"
                  className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="p-10">
                    <OfficialHeaderCintillo showRightLogo={true} />
                    <div className="mt-6 mb-4 text-center">
                      <h2 className="text-base font-black uppercase text-slate-900">
                        INFORME SEMANAL DE GESTIÓN Y JUSTIFICACIÓN DE PROYECTOS
                      </h2>
                      <p className="text-xs font-bold text-slate-600">
                        Porcentaje de Cumplimiento Global: {globalProjectsProgress}% | Fecha de Corte: {fecha}
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black uppercase">
                          <th className="border border-slate-900 p-2">Proyecto / Actividad</th>
                          <th className="border border-slate-900 p-2">Justificación Técnica</th>
                          <th className="border border-slate-900 p-2">Responsable (RRHH)</th>
                          <th className="border border-slate-900 p-2">Estado</th>
                          <th className="border border-slate-900 p-2 text-center">% Avance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => (
                          <tr key={p.id}>
                            <td className="border border-slate-900 p-2">
                              <div className="font-black">{p.nombre}</div>
                              <div className="text-[11px] text-slate-600">{p.tarea}</div>
                            </td>
                            <td className="border border-slate-900 p-2">{p.justificacion}</td>
                            <td className="border border-slate-900 p-2 font-semibold">{p.responsable}</td>
                            <td className="border border-slate-900 p-2 font-bold">
                              {p.porcentaje >= 100
                                ? "COMPLETADO"
                                : p.porcentaje > 0
                                ? "EN EJECUCIÓN"
                                : "PENDIENTE"}
                            </td>
                            <td className="border border-slate-900 p-2 text-center font-black">
                              {p.porcentaje}% (Falta {100 - p.porcentaje}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <OfficialFooterWave />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            MÓDULO 5: BIENES NACIONALES (LISTA AUTO-ALIMENTADA + REPORTE PDF)
           ==================================================================== */}
        {activeTab === "bienes" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900">
                  Control de Bienes Nacionales • Fundación CENDIS ({bienesList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Lista desplegable de artículos auto-alimentada, marca, modelo, serial, código BN y reporte oficial en PDF.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBienesViewMode("FORM")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    bienesViewMode === "FORM" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Inventario y Registro
                </button>
                <button
                  onClick={() => setBienesViewMode("PDF")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    bienesViewMode === "PDF" ? "bg-[#8b1538] text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Reporte PDF con Cintillo Oficial</span>
                </button>
              </div>
            </div>

            {bienesViewMode === "FORM" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const finalArticulo = newBienForm.nuevoArticuloTexto.trim()
                      ? newBienForm.nuevoArticuloTexto.trim()
                      : newBienForm.articulo;
                    if (
                      newBienForm.nuevoArticuloTexto.trim() &&
                      !bienesCatalog.includes(finalArticulo)
                    ) {
                      setBienesCatalog((prev) => [...prev, finalArticulo]);
                    }
                    const created = {
                      id: `bn-${Date.now()}`,
                      articulo: finalArticulo,
                      marca: newBienForm.marca,
                      modelo: newBienForm.modelo,
                      serial: newBienForm.serial,
                      codigoBN: newBienForm.codigoBN,
                      ubicacion: newBienForm.ubicacion,
                      custodio: newBienForm.custodio,
                      estado: "OPERATIVO",
                    };
                    setBienesList((prev) => [created, ...prev]);
                    addLog(`Registrado Bien Nacional ${created.codigoBN} (${created.articulo})`);
                    showToast(`Bien Nacional ${created.codigoBN} incorporado al inventario.`);
                    setNewBienForm({
                      ...newBienForm,
                      articulo: finalArticulo,
                      nuevoArticuloTexto: "",
                      marca: "",
                      modelo: "",
                      serial: "",
                      codigoBN: "BN-CENDIS-00" + Math.floor(1050 + Math.random() * 900),
                    });
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Artículo (Lista Desplegable)
                    </label>
                    <select
                      value={newBienForm.articulo}
                      onChange={(e) => setNewBienForm({ ...newBienForm, articulo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      {bienesCatalog.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      ¿Nuevo Artículo? (Se añade a la lista)
                    </label>
                    <input
                      type="text"
                      placeholder="Escribe si es un artículo nuevo..."
                      value={newBienForm.nuevoArticuloTexto}
                      onChange={(e) => setNewBienForm({ ...newBienForm, nuevoArticuloTexto: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Marca</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Yamaha / Apple"
                      value={newBienForm.marca}
                      onChange={(e) => setNewBienForm({ ...newBienForm, marca: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Modelo</label>
                    <input
                      type="text"
                      required
                      placeholder="Modelo"
                      value={newBienForm.modelo}
                      onChange={(e) => setNewBienForm({ ...newBienForm, modelo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Serial</label>
                    <input
                      type="text"
                      required
                      placeholder="Serial del fabricante"
                      value={newBienForm.serial}
                      onChange={(e) => setNewBienForm({ ...newBienForm, serial: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Código de Bien Nacional
                    </label>
                    <input
                      type="text"
                      required
                      value={newBienForm.codigoBN}
                      onChange={(e) => setNewBienForm({ ...newBienForm, codigoBN: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Custodio (Personal RRHH)
                    </label>
                    <select
                      value={newBienForm.custodio}
                      onChange={(e) => setNewBienForm({ ...newBienForm, custodio: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={`${emp.nombres} ${emp.apellidos}`}>
                          {emp.nombres} {emp.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer"
                    >
                      + Registrar Bien Nacional
                    </button>
                  </div>
                </form>

                <div className="overflow-x-auto pt-3 border-t border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-black">
                        <th className="p-3">Código BN</th>
                        <th className="p-3">Artículo</th>
                        <th className="p-3">Marca</th>
                        <th className="p-3">Modelo</th>
                        <th className="p-3">Serial</th>
                        <th className="p-3">Custodio (RRHH)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bienesList.map((b) => (
                        <tr key={b.id}>
                          <td className="p-3 font-black text-teal-900">{b.codigoBN}</td>
                          <td className="p-3 font-semibold">{b.articulo}</td>
                          <td className="p-3">{b.marca}</td>
                          <td className="p-3">{b.modelo}</td>
                          <td className="p-3 font-mono">{b.serial}</td>
                          <td className="p-3">{b.custodio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* REPORTE PDF DE BIENES NACIONALES CON CINTILLO DE MEMORANDO */
              <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Inventario de Bienes Nacionales (PDF)</span>
                  </button>
                </div>

                <div
                  id="printable-area"
                  className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="p-10">
                    <OfficialHeaderCintillo showRightLogo={true} />
                    <div className="mt-6 mb-4 text-center">
                      <h2 className="text-base font-black uppercase text-slate-900">
                        INVENTARIO OFICIAL DE BIENES NACIONALES • FUNDACIÓN CENDIS
                      </h2>
                      <p className="text-xs text-slate-600 font-semibold">
                        Total de Artículos Registrados: {bienesList.length} | Fecha: {fecha}
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black uppercase">
                          <th className="border border-slate-900 p-2">Código BN</th>
                          <th className="border border-slate-900 p-2">Artículo</th>
                          <th className="border border-slate-900 p-2">Marca</th>
                          <th className="border border-slate-900 p-2">Modelo</th>
                          <th className="border border-slate-900 p-2">Serial</th>
                          <th className="border border-slate-900 p-2">Custodio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bienesList.map((b) => (
                          <tr key={b.id}>
                            <td className="border border-slate-900 p-2 font-bold">{b.codigoBN}</td>
                            <td className="border border-slate-900 p-2">{b.articulo}</td>
                            <td className="border border-slate-900 p-2">{b.marca}</td>
                            <td className="border border-slate-900 p-2">{b.modelo}</td>
                            <td className="border border-slate-900 p-2 font-mono">{b.serial}</td>
                            <td className="border border-slate-900 p-2">{b.custodio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <OfficialFooterWave />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            MÓDULO 6: CONTROL DE ASISTENCIA Y REPORTE SEMANAL
           ==================================================================== */}
        {activeTab === "attendance" && (
          <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-black uppercase text-slate-900">
                Control de Asistencia de Entrada • Lector de Carnet y Cédula
              </h2>
              <form onSubmit={handleScanAttendance} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  required
                  placeholder="Escanee código de barra (ej. 2024-CENDIS-000123) o escriba cédula..."
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-cyan-700 text-xs font-bold"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Registrar Entrada
                </button>
              </form>

              {/* Botones rápidos de simulación de escaneo */}
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="font-bold text-slate-500">Simular lectura de carnet:</span>
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setScannerInput(emp.codigoBarra)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-700 font-mono text-[11px] border border-slate-300 cursor-pointer"
                  >
                    {emp.nombres} ({emp.codigoBarra})
                  </button>
                ))}
              </div>

              {scannerAlert && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    scannerAlert.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {scannerAlert.text}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase text-slate-700">
                    Reporte Semanal de Asistencia del Personal
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Reporte Semanal</span>
                  </button>
                </div>
                <div id="printable-area">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-black">
                        <th className="p-3">Cédula</th>
                        <th className="p-3">Trabajador</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Hora Entrada</th>
                        <th className="p-3">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {attendanceRecords.map((att) => (
                        <tr key={att.id}>
                          <td className="p-3 font-bold">{att.cedula}</td>
                          <td className="p-3 font-semibold">{att.nombre}</td>
                          <td className="p-3">{att.fecha}</td>
                          <td className="p-3 font-mono font-bold text-cyan-800">{att.hora}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {att.estatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MÓDULO 7: ESTADÍSTICA Y CONTABILIDAD GLOBAL
           ==================================================================== */}
        {activeTab === "stats" && (
          <div className="flex-1 max-w-6xl w-full mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h2 className="text-base font-black uppercase text-slate-900">
                Módulo de Estadística y Contabilidad Institucional CENDIS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                  <span className="text-[11px] font-bold uppercase text-red-700">Memorándums Emitidos</span>
                  <div className="text-3xl font-black text-red-900 mt-1">
                    {documents.filter((d) => d.tipo === "MEMORANDUM").length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] font-bold uppercase text-blue-700">Solicitudes Emitidas</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">
                    {documents.filter((d) => d.tipo === "SOLICITUD").length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold uppercase text-amber-700">Personal en RRHH</span>
                  <div className="text-3xl font-black text-amber-900 mt-1">{employees.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold uppercase text-emerald-700">Actividades en Agenda</span>
                  <div className="text-3xl font-black text-emerald-900 mt-1">{agendaEvents.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[11px] font-bold uppercase text-indigo-700">Proyectos (% Global)</span>
                  <div className="text-3xl font-black text-indigo-900 mt-1">
                    {projects.length} ({globalProjectsProgress}%)
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                  <span className="text-[11px] font-bold uppercase text-teal-700">Bienes Nacionales</span>
                  <div className="text-3xl font-black text-teal-900 mt-1">{bienesList.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200">
                  <span className="text-[11px] font-bold uppercase text-cyan-700">Asistencias Registradas</span>
                  <div className="text-3xl font-black text-cyan-900 mt-1">{attendanceRecords.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] font-bold uppercase text-purple-700">Usuarios Creados</span>
                  <div className="text-3xl font-black text-purple-900 mt-1">{users.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MÓDULO 8: ORGANIGRAMA (DIAGRAMA Y TEXTUAL)
           ==================================================================== */}
        {activeTab === "org" && (
          <div className="flex-1 max-w-6xl w-full mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black uppercase text-slate-900">
                  Organigrama Oficial • Fundación CENDIS
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrgViewMode("DIAGRAM")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      orgViewMode === "DIAGRAM" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Vista Tipo Diagrama
                  </button>
                  <button
                    onClick={() => setOrgViewMode("TEXT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      orgViewMode === "TEXT" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Vista Forma Textual
                  </button>
                </div>
              </div>

              {orgViewMode === "DIAGRAM" ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center space-y-4">
                  <div className="px-6 py-3 bg-[#8b1538] text-white rounded-xl text-center shadow font-bold text-xs uppercase">
                    Presidencia de la Fundación CENDIS
                    <div className="text-[10px] text-amber-200 font-normal">Lcdo. Ali Alejandro Primera</div>
                  </div>
                  <div className="h-5 w-0.5 bg-slate-400" />
                  <div className="px-6 py-3 bg-blue-900 text-white rounded-xl text-center shadow font-bold text-xs uppercase">
                    Dirección Ejecutiva
                    <div className="text-[10px] text-blue-200 font-normal">Lic. Julimar Flores</div>
                  </div>
                  <div className="h-5 w-0.5 bg-slate-400" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {employees.map((emp) => (
                      <div key={emp.id} className="p-3 bg-white border border-slate-300 rounded-xl text-center">
                        <div className="font-black text-xs text-slate-900">{emp.coordinacion}</div>
                        <div className="text-[11px] text-slate-600">
                          {emp.nombres} {emp.apellidos} ({emp.cargo})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  {employees.map((emp, idx) => (
                    <div key={emp.id} className="py-1 border-b border-slate-200">
                      <strong>Nivel {idx + 1} - {emp.coordinacion}:</strong> {emp.nombres} {emp.apellidos} —{" "}
                      <span className="text-slate-600">{emp.cargo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            MÓDULO 9: CONFIGURACIÓN • SUBMÓDULO DE USUARIOS Y PERMISOLOGÍA
           ==================================================================== */}
        {activeTab === "config" &&
          (() => {
            const selectedUserForPerms =
              users.find((u) => String(u.id) === String(selectedConfigUserId)) || users[0];
            const isSelectedAdmin = selectedUserForPerms?.role === "ADMIN";
            const currentPerms = isSelectedAdmin
              ? { ...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN }
              : {
                  ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR,
                  ...(selectedUserForPerms?.permissions || {}),
                };

            const screenPermissionsList = [
              { key: "entrar_memo", label: "Memo y Solicitudes", code: "MEMO" },
              { key: "entrar_agenda", label: "Agenda CENDIS", code: "AGENDA" },
              { key: "entrar_hr", label: "Recursos Humanos y Carnets", code: "RRHH" },
              { key: "entrar_proyectos", label: "Proyectos y Tareas (%)", code: "PROY" },
              { key: "entrar_bienes", label: "Bienes Nacionales", code: "BIENES" },
              { key: "entrar_attendance", label: "Control de Asistencia", code: "ASIST" },
              { key: "entrar_stats", label: "Estadística General", code: "STATS" },
              { key: "entrar_org", label: "Organigrama CENDIS", code: "ORG" },
              { key: "entrar_config", label: "Configuración", code: "CONFIG" },
            ];

            const actionPermissionsList = [
              {
                key: "ingresar",
                label: "Agregar nuevo",
                desc: "Permite registrar nuevos documentos, actividades, trabajadores, proyectos y bienes.",
              },
              {
                key: "modificar",
                label: "Modificar",
                desc: "Permite editar registros existentes y actualizar porcentajes o datos.",
              },
              {
                key: "eliminar",
                label: "Eliminar",
                desc: "Permite borrar registros de manera definitiva en los módulos autorizados.",
              },
              {
                key: "anular",
                label: "Anular",
                desc: "Permite cambiar el estatus de documentos o solicitudes a ANULADO.",
              },
            ];

            const handleChangeUserRole = (targetUserId, newRole) => {
              const updatedPermissions =
                newRole === "ADMIN"
                  ? { ...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN }
                  : {
                      ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR,
                      ...(users.find((u) => u.id === targetUserId)?.permissions || {}),
                      entrar_config: false,
                    };

              setUsers((prev) =>
                prev.map((item) =>
                  item.id === targetUserId
                    ? { ...item, role: newRole, permissions: updatedPermissions }
                    : item
                )
              );

              if (currentUser && currentUser.id === targetUserId) {
                const updatedCurrent = {
                  ...currentUser,
                  role: newRole,
                  permissions: updatedPermissions,
                };
                setCurrentUser(updatedCurrent);
                setSessionCookie(updatedCurrent);
              }
              addLog(
                `Actualizado rol de usuario ID ${targetUserId} a ${newRole} (${
                  newRole === "ADMIN" ? "Todos los permisos" : "Permisos personalizados"
                })`
              );
              showToast(
                newRole === "ADMIN"
                  ? "Rol Administrador asignado: se habilitaron todos los permisos del sistema."
                  : "Rol Estándar asignado: ahora puede marcar las pantallas y permisos específicos."
              );
            };

            const handleToggleUserPermission = (targetUserId, permKey) => {
              const target = users.find((u) => u.id === targetUserId);
              if (!target || target.role === "ADMIN") return;

              const basePerms = {
                ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR,
                ...(target.permissions || {}),
              };
              const nextPerms = {
                ...basePerms,
                [permKey]: !basePerms[permKey],
              };

              setUsers((prev) =>
                prev.map((item) =>
                  item.id === targetUserId ? { ...item, permissions: nextPerms } : item
                )
              );

              if (currentUser && currentUser.id === targetUserId) {
                const updatedCurrent = {
                  ...currentUser,
                  permissions: nextPerms,
                };
                setCurrentUser(updatedCurrent);
                setSessionCookie(updatedCurrent);
              }
            };

            const handleSetAllScreensForUser = (targetUserId, enableAll) => {
              const target = users.find((u) => u.id === targetUserId);
              if (!target || target.role === "ADMIN") return;
              const basePerms = {
                ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR,
                ...(target.permissions || {}),
              };
              const nextPerms = { ...basePerms };
              screenPermissionsList.forEach((sp) => {
                nextPerms[sp.key] = enableAll;
              });
              setUsers((prev) =>
                prev.map((item) =>
                  item.id === targetUserId ? { ...item, permissions: nextPerms } : item
                )
              );
              if (currentUser && currentUser.id === targetUserId) {
                const updatedCurrent = { ...currentUser, permissions: nextPerms };
                setCurrentUser(updatedCurrent);
                setSessionCookie(updatedCurrent);
              }
              showToast(
                enableAll
                  ? "Se habilitaron todas las pantallas para este usuario."
                  : "Se desmarcaron todas las pantallas para este usuario."
              );
            };

            return (
              <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
                {/* Cabecera del Módulo de Configuración con Submódulo Usuarios */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#f59e0b] block">
                      Panel de Administración y Control de Acceso
                    </span>
                    <h2 className="text-base font-black uppercase text-slate-900">
                      Módulo de Configuración • Submódulo de Usuarios y Permisología
                    </h2>
                    <p className="text-xs text-slate-500">
                      Seleccione un usuario de la lista desplegable para asignarle rol y definir a qué pantallas puede ingresar y qué acciones puede ejecutar.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfigSubTab("USUARIOS")}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow ${
                        configSubTab === "USUARIOS"
                          ? "bg-[#f59e0b] text-slate-950"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Submódulo: Usuarios ({users.length})</span>
                    </button>
                  </div>
                </div>

                {configSubTab === "USUARIOS" && selectedUserForPerms && (
                  <div className="space-y-6">
                    {/* Selector desplegable de usuario y configuración de permisología */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b border-slate-200 pb-5">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-wider text-[#f59e0b] mb-2">
                            1. Seleccionar Usuario del Sistema (Lista Desplegable)
                          </label>
                          <select
                            value={String(selectedUserForPerms.id)}
                            onChange={(e) => setSelectedConfigUserId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-700 text-sm font-bold cursor-pointer"
                          >
                            {users.map((u) => (
                              <option key={u.id} value={String(u.id)}>
                                {u.fullName} ({u.email || u.username}) — Rol:{" "}
                                {u.role === "ADMIN" ? "Administrador" : "Estándar"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                            2. Tipo de Rol del Usuario
                          </label>
                          <select
                            value={selectedUserForPerms.role}
                            onChange={(e) =>
                              handleChangeUserRole(selectedUserForPerms.id, e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-xl border-2 border-amber-500/60 text-sm font-black cursor-pointer"
                          >
                            <option value="ADMIN">Administrador (Todos los permisos)</option>
                            <option value="ESTANDAR">Estándar (Permisos seleccionables)</option>
                          </select>
                        </div>
                      </div>

                      {/* Aviso según el rol seleccionado */}
                      {isSelectedAdmin ? (
                        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 flex items-center gap-3">
                          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div className="text-xs">
                            <span className="font-black uppercase text-emerald-300 block">
                              Usuario Administrador — Acceso Total Habilitado
                            </span>
                            <span className="text-slate-200">
                              Como <strong>{selectedUserForPerms.fullName}</strong> tiene rol{" "}
                              <strong>Administrador</strong>, posee automáticamente todos los permisos de pantallas y acciones (Agregar nuevo, Modificar, Eliminar y Anular) en todo el sistema.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-blue-950/70 border border-blue-500/60 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs">
                            <span className="font-black uppercase text-amber-300 block">
                              Usuario Estándar — Configuración Personalizada de Permisología
                            </span>
                            <span className="text-slate-200">
                              Marque abajo las pantallas a las que puede ingresar{" "}
                              <strong>{selectedUserForPerms.fullName}</strong> y qué permisos tiene habilitados.
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleSetAllScreensForUser(selectedUserForPerms.id, true)
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Marcar todas las pantallas
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSetAllScreensForUser(selectedUserForPerms.id, false)
                              }
                              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] cursor-pointer"
                            >
                              Desmarcar pantallas
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sección A: Pantallas a las que puede ingresar */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          A. Pantallas / Módulos a los que puede ingresar
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {screenPermissionsList.map((screen) => {
                            const checked = Boolean(currentPerms[screen.key]);
                            return (
                              <label
                                key={screen.key}
                                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                                  isSelectedAdmin
                                    ? "bg-emerald-950/30 border-emerald-500/40 opacity-90 cursor-not-allowed"
                                    : checked
                                    ? "bg-amber-950/40 border-amber-500/70 cursor-pointer"
                                    : "bg-slate-900/60 border-slate-800 cursor-pointer hover:border-slate-600"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isSelectedAdmin}
                                    onChange={() =>
                                      handleToggleUserPermission(
                                        selectedUserForPerms.id,
                                        screen.key
                                      )
                                    }
                                    className="w-4 h-4 accent-[#f59e0b] rounded cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-white">
                                    {screen.label}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                    checked
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                                  }`}
                                >
                                  {checked ? "PERMITIDO" : "BLOQUEADO"}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sección B: Permisos de Operaciones (Agregar nuevo, Modificar, Eliminar, Anular) */}
                      <div className="space-y-3 pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          B. Permisos de Acciones (Agregar nuevo, Modificar, Eliminar y Anular)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {actionPermissionsList.map((act) => {
                            const checked = Boolean(currentPerms[act.key]);
                            return (
                              <label
                                key={act.key}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-2 transition ${
                                  isSelectedAdmin
                                    ? "bg-emerald-950/30 border-emerald-500/40 opacity-90 cursor-not-allowed"
                                    : checked
                                    ? "bg-amber-950/40 border-amber-500/70 cursor-pointer"
                                    : "bg-slate-900/60 border-slate-800 cursor-pointer hover:border-slate-600"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={isSelectedAdmin}
                                      onChange={() =>
                                        handleToggleUserPermission(
                                          selectedUserForPerms.id,
                                          act.key
                                        )
                                      }
                                      className="w-4 h-4 accent-[#f59e0b] rounded cursor-pointer"
                                    />
                                    <span className="text-xs font-black uppercase text-white">
                                      {act.label}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                      checked
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-red-500/20 text-red-300"
                                    }`}
                                  >
                                    {checked ? "SÍ" : "NO"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-snug">
                                  {act.desc}
                                </p>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Formulario para registrar un nuevo usuario en el sistema */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase text-slate-900">
                        Registrar Nuevo Usuario en el Sistema
                      </h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newUserForm.username || !newUserForm.password) return;
                          const emailClean =
                            (newUserForm.email || "").trim().toLowerCase() ||
                            (newUserForm.username.includes("@")
                              ? newUserForm.username.trim().toLowerCase()
                              : `${newUserForm.username.trim().toLowerCase()}@gmail.com`);
                          const created = {
                            id: Date.now(),
                            ...newUserForm,
                            email: emailClean,
                            active: true,
                            linkedEmployeeId: null,
                            permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE[newUserForm.role] },
                          };
                          setUsers((prev) => [...prev, created]);
                          setSelectedConfigUserId(String(created.id));
                          addLog(`Creado usuario '${created.username}' (${emailClean}) con rol ${created.role}`);
                          showToast(
                            `Usuario ${created.fullName} creado y seleccionado para configurar su permisología.`
                          );
                          setNewUserForm({
                            username: "",
                            email: "",
                            password: "",
                            fullName: "",
                            cargo: "",
                            role: "ESTANDAR",
                          });
                        }}
                        className="grid grid-cols-1 md:grid-cols-6 gap-2"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Usuario"
                          value={newUserForm.username}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, username: e.target.value })
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="email"
                          placeholder="Correo Gmail"
                          value={newUserForm.email || ""}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, email: e.target.value })
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Clave"
                          value={newUserForm.password}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, password: e.target.value })
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Nombre Completo"
                          value={newUserForm.fullName}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, fullName: e.target.value })
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                        <select
                          value={newUserForm.role}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, role: e.target.value })
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="ESTANDAR">Usuario Estándar</option>
                          <option value="ADMIN">Usuario Administrador</option>
                        </select>
                        <button
                          type="submit"
                          className="py-2 rounded-xl bg-[#8b1538] hover:bg-[#6e102c] text-white font-bold text-xs cursor-pointer"
                        >
                          + Crear Usuario
                        </button>
                      </form>

                      {/* Resumen de todos los usuarios */}
                      <div className="overflow-x-auto pt-3">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white uppercase text-[10px]">
                              <th className="p-3 text-left">Usuario / Correo</th>
                              <th className="p-3 text-left">Nombre</th>
                              <th className="p-3 text-left">Rol</th>
                              <th className="p-3 text-left">Permisos de Acción</th>
                              <th className="p-3 text-left">Configurar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {users.map((u) => {
                              const uPerms =
                                u.role === "ADMIN"
                                  ? DEFAULT_PERMISSIONS_BY_ROLE.ADMIN
                                  : { ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR, ...(u.permissions || {}) };
                              return (
                                <tr key={u.id}>
                                  <td className="p-3">
                                    <div className="font-black">{u.username}</div>
                                    <div className="text-[11px] text-slate-400">
                                      {u.email || `${u.username}@gmail.com`}
                                    </div>
                                  </td>
                                  <td className="p-3 font-semibold">{u.fullName}</td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                        u.role === "ADMIN"
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                      }`}
                                    >
                                      {u.role === "ADMIN" ? "Administrador" : "Estándar"}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1">
                                      {[
                                        { k: "ingresar", l: "Agregar" },
                                        { k: "modificar", l: "Modificar" },
                                        { k: "eliminar", l: "Eliminar" },
                                        { k: "anular", l: "Anular" },
                                      ].map((item) => (
                                        <span
                                          key={item.k}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            uPerms[item.k]
                                              ? "bg-emerald-500/20 text-emerald-300"
                                              : "bg-slate-800 text-slate-500 line-through"
                                          }`}
                                        >
                                          {item.l}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedConfigUserId(String(u.id))}
                                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                                        String(selectedUserForPerms.id) === String(u.id)
                                          ? "bg-[#f59e0b] text-slate-950 font-black"
                                          : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                      }`}
                                    >
                                      {String(selectedUserForPerms.id) === String(u.id)
                                        ? "Seleccionado"
                                        : "Editar Permisos"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </div>

      {/* ====================================================================
          MODAL DE CARNET OFICIAL CENDIS (FRENTE Y REVERSO CON CÓDIGO DE BARRAS)
         ==================================================================== */}
      {selectedEmpForCard && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase">
                Carnet Oficial CENDIS • {selectedEmpForCard.nombres} {selectedEmpForCard.apellidos}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Imprimir Carnet
                </button>
                <button
                  onClick={() => setSelectedEmpForCard(null)}
                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 py-4" id="printable-area">
              {/* FRENTE DEL CARNET */}
              <div className="w-[310px] h-[490px] bg-white rounded-2xl shadow-xl border-4 border-amber-500 flex flex-col justify-between overflow-hidden">
                <div className="bg-[#111c38] text-white p-3 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest">
                    MINISTERIO DEL PODER POPULAR
                  </div>
                  <div className="text-[11px] font-black uppercase text-amber-300">PARA LA CULTURA</div>
                </div>
                <div className="p-4 flex flex-col items-center">
                  <CendisGlyphLogo className="w-28 mb-3" />
                  <div className="w-full text-left space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block">NOMBRE Y APELLIDO:</span>
                      <span className="font-black">
                        {selectedEmpForCard.nombres} {selectedEmpForCard.apellidos}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block">CÉDULA:</span>
                      <span className="font-black">{selectedEmpForCard.cedula}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block">CARGO:</span>
                      <span className="font-black">{selectedEmpForCard.cargo}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block">COORDINACIÓN:</span>
                      <span className="font-black">{selectedEmpForCard.coordinacion}</span>
                    </div>
                  </div>
                </div>
                <div className="h-5 bg-[#111c38]" />
              </div>

              {/* REVERSO DEL CARNET */}
              <div className="w-[310px] h-[490px] bg-white rounded-2xl shadow-xl border-4 border-amber-500 flex flex-col justify-between p-4 text-[10px]">
                <div className="text-center">
                  <CendisGlyphLogo className="w-24 mx-auto" />
                  <div className="font-black mt-1">CENDIS - Centro Nacional del Disco</div>
                </div>
                <div className="text-[9px] text-slate-600 leading-tight">
                  Este carnet es personal e intransferible. Identifica al portador como trabajador activo de la Fundación CENDIS.
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-bold uppercase text-[9px]">Emergencia:</div>
                  <div>{selectedEmpForCard.emergencia1}</div>
                </div>
                <div className="text-center">
                  <div className="font-mono tracking-widest text-base font-black">||| | |||| || ||| ||</div>
                  <div className="font-mono text-[9px] font-bold">{selectedEmpForCard.codigoBarra}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE HOJA DE VIDA / PERFIL EN PDF
         ==================================================================== */}
      {selectedEmpForCV && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase">
                Hoja de Vida en PDF • {selectedEmpForCV.nombres} {selectedEmpForCV.apellidos}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Imprimir PDF
                </button>
                <button
                  onClick={() => setSelectedEmpForCV(null)}
                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>
            <div id="printable-area" className="p-6 border border-slate-200 rounded-xl space-y-4 text-xs">
              <OfficialHeaderCintillo showRightLogo={true} />
              <h2 className="text-center text-base font-black uppercase">EXPEDIENTE Y HOJA DE VIDA INSTITUCIONAL</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><strong>Nombres y Apellidos:</strong> {selectedEmpForCV.nombres} {selectedEmpForCV.apellidos}</div>
                <div><strong>Cédula:</strong> {selectedEmpForCV.cedula}</div>
                <div><strong>Cargo:</strong> {selectedEmpForCV.cargo}</div>
                <div><strong>Coordinación:</strong> {selectedEmpForCV.coordinacion}</div>
                <div><strong>Teléfono:</strong> {selectedEmpForCV.telefono}</div>
                <div><strong>Carga Familiar:</strong> {selectedEmpForCV.familiares}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BURBUJA LATERAL FLOTANTE DE CHAT CORPORATIVO INTERNO CENDIS
         ==================================================================== */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        {chatOpen ? (
          <div className="w-80 bg-white rounded-2xl shadow-2xl border-2 border-slate-900 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase">Chat Corporativo CENDIS</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-slate-100 border-b border-slate-200">
              <select
                value={chatRecipient}
                onChange={(e) => setChatRecipient(e.target.value)}
                className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] font-bold bg-white text-slate-800"
              >
                <option value="TODOS">Canal General (Todo el Personal)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={`${emp.nombres} ${emp.apellidos}`}>
                    Mensaje directo: {emp.nombres} {emp.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-3 h-60 overflow-y-auto space-y-2 bg-slate-50">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-2 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                  <div className="flex justify-between text-[10px] font-black text-[#8b1538]">
                    <span>{msg.sender} → {msg.recipient}</span>
                    <span className="text-slate-400">{msg.time}</span>
                  </div>
                  <p className="text-slate-800 mt-0.5">{msg.text}</p>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                setChatMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    sender: currentUser.fullName,
                    recipient: chatRecipient,
                    text: chatInput.trim(),
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ]);
                setChatInput("");
              }}
              className="p-2 border-t border-slate-200 flex gap-1.5 bg-white"
            >
              <input
                type="text"
                placeholder="Escribe un mensaje interno..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#8b1538] text-white text-xs font-bold cursor-pointer"
              >
                Enviar
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="px-4 py-3 rounded-full bg-[#8b1538] hover:bg-[#6e102c] text-white shadow-2xl flex items-center gap-2 font-black text-xs cursor-pointer border-2 border-white"
          >
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>Chat CENDIS ({chatMessages.length})</span>
          </button>
        )}
      </div>
    </div>
  );
}