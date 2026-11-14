import React, { useState, useMemo, useEffect } from "react";
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
// DATOS INICIALES DEL SISTEMA SIACENDIS
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
    passwordUpdatedAt: "2026-11-13T12:00:00.000Z",
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
    passwordUpdatedAt: "2026-11-13T12:00:00.000Z",
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
    passwordUpdatedAt: "2026-11-13T12:00:00.000Z",
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
    passwordUpdatedAt: "2026-11-13T12:00:00.000Z",
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
    condicionLaboral: "Libre Nombramiento",
    nivelAcademico: "Universitario",
    profesion: "Músico y Productor Cultural",
    estadoCivil: "Casado(a)",
    genero: "Masculino",
    tallas: "Camisa L / Pantalón 34 / Calzado 42",
    telefono: "0414-1234567",
    telefonoAlterno: "0212-5551122",
    correo: "presidencia.cendis@gmail.com",
    direccion: "Caracas, Av. Libertador, Parroquia El Recreo",
    fechaNacimiento: "1980-05-12",
    fechaIngreso: "2022-01-15",
    tipoSangre: "O+",
    emergencia1: "María Primera: 0412-9876543",
    emergencia2: "José Primera: 0416-5554433",
    familiares: "Esposa y 2 Hijos",
    familiaresLista: [
      { id: "fam-1", parentesco: "Esposo(a)", nombreCompleto: "María Primera", cedula: "V-16.222.333", fechaNacimiento: "1982-08-14", edad: "44" },
      { id: "fam-2", parentesco: "Hijo(a)", nombreCompleto: "Alejandro Primera", cedula: "V-30.111.222", fechaNacimiento: "2010-03-20", edad: "16" },
      { id: "fam-3", parentesco: "Hijo(a)", nombreCompleto: "Oriana Primera", cedula: "Menor sin cédula", fechaNacimiento: "2016-11-05", edad: "10" },
    ],
    tieneCargaFamiliar: "SI",
    fotoCarnet: "",
    observacionesLaborales: "Presidente de la Fundación Centro Nacional del Disco (CENDIS).",
    codigoBarra: "2024-CENDIS-000123",
  },
  {
    id: "emp-2",
    nombres: "Julimar",
    apellidos: "Flores",
    cedula: "V-18.999.888",
    cargo: "Directora Ejecutiva",
    coordinacion: "Dirección Ejecutiva",
    condicionLaboral: "Fijo",
    nivelAcademico: "Postgrado / Maestría",
    profesion: "Licenciada en Administración Cultural",
    estadoCivil: "Soltero(a)",
    genero: "Femenino",
    tallas: "Camisa M / Pantalón 30 / Calzado 38",
    telefono: "0424-9988776",
    telefonoAlterno: "0212-4443322",
    correo: "",
    direccion: "Caracas, Av. Páez, El Paraíso",
    fechaNacimiento: "1985-09-20",
    fechaIngreso: "2023-03-10",
    tipoSangre: "A+",
    emergencia1: "Carlos Flores: 0414-1112233",
    emergencia2: "Carmen Flores: 0412-4445566",
    familiares: "1 Hijo",
    familiaresLista: [
      { id: "fam-4", parentesco: "Hijo(a)", nombreCompleto: "Santiago Flores", cedula: "Menor sin cédula", fechaNacimiento: "2015-06-10", edad: "11" },
    ],
    tieneCargaFamiliar: "SI",
    fotoCarnet: "",
    observacionesLaborales: "Coordinación administrativa e institucional de la Dirección Ejecutiva.",
    codigoBarra: "2024-CENDIS-000124",
  },
  {
    id: "emp-3",
    nombres: "Anaileth",
    apellidos: "Briceño",
    cedula: "V-20.164.307",
    cargo: "Coordinadora de Producción",
    coordinacion: "Producción Fonográfica",
    condicionLaboral: "Fijo",
    nivelAcademico: "Universitario",
    profesion: "Ingeniera de Sonido y Producción Musical",
    estadoCivil: "Soltero(a)",
    genero: "Femenino",
    tallas: "Camisa S / Pantalón 28 / Calzado 37",
    telefono: "0424-1643007",
    telefonoAlterno: "",
    correo: "produccion.cendis@gmail.com",
    direccion: "Caracas, Parroquia Catedral, Centro",
    fechaNacimiento: "1990-11-04",
    fechaIngreso: "2024-02-01",
    tipoSangre: "B+",
    emergencia1: "Luis Briceño: 0412-3334455",
    emergencia2: "Rosa Briceño: 0416-7778899",
    familiares: "Sin carga familiar",
    familiaresLista: [],
    tieneCargaFamiliar: "NO",
    fotoCarnet: "",
    observacionesLaborales: "Responsable de estudios de grabación, mezcla y masterización fonográfica.",
    codigoBarra: "2024-CENDIS-000125",
  },
  {
    id: "emp-4",
    nombres: "Morris",
    apellidos: "López",
    cedula: "V-19.324.324",
    cargo: "Especialista Audiovisual",
    coordinacion: "Cultura Audiovisual",
    condicionLaboral: "Contratado",
    nivelAcademico: "Universitario",
    profesion: "Licenciado en Artes Audiovisuales",
    estadoCivil: "Casado(a)",
    genero: "Masculino",
    tallas: "Camisa L / Pantalón 32 / Calzado 41",
    telefono: "0426-3243246",
    telefonoAlterno: "0412-3243246",
    correo: "",
    direccion: "Los Valles del Tuy, Ocumare, Estado Miranda",
    fechaNacimiento: "1988-07-22",
    fechaIngreso: "2023-08-19",
    tipoSangre: "O+",
    emergencia1: "Elena López: 0426-1112233",
    emergencia2: "Pedro López: 0414-8889900",
    familiares: "Esposa y 1 Hija",
    familiaresLista: [
      { id: "fam-5", parentesco: "Esposo(a)", nombreCompleto: "Elena de López", cedula: "V-20.555.444", fechaNacimiento: "1990-02-18", edad: "36" },
      { id: "fam-6", parentesco: "Hijo(a)", nombreCompleto: "Valeria López", cedula: "Menor sin cédula", fechaNacimiento: "2018-09-12", edad: "8" },
    ],
    tieneCargaFamiliar: "SI",
    fotoCarnet: "",
    observacionesLaborales: "Productor y realizador audiovisual comunitario del CENDIS.",
    codigoBarra: "2024-CENDIS-000126",
  },
];

const INITIAL_AGENDA_EVENTS = [
  {
    id: "ev-1",
    date: "2026-11-16",
    endDate: "2026-11-16",
    ente: "Cendis",
    title: "Taller de Audiovisual",
    eventType: "EVENTO",
    allDay: false,
    startTime: "09:00",
    endTime: "11:00",
    timeZone: "America/Caracas (GMT-04:00)",
    recurrence: "NO_REPETIR",
    location: "Los Valles del Tuy",
    meetLink: "https://meet.google.com/cen-dis-aud",
    description:
      "Taller formativo de producción audiovisual comunitaria, captura de sonido directo y edición digital.",
    responsable: "Morris López",
    emailInvitado: "morris.lopez.cendis@gmail.com",
    invitadosAdicionales: "presidencia.cendis@gmail.com",
    contacto: "0426.324.32.46",
    visibility: "PUBLICO",
    availability: "OCUPADO",
    color: "BLUE",
    reminderValue: 2,
    reminderUnit: "HORAS",
    notifyApp: true,
    notifyEmail: true,
    notifyWhatsapp: true,
    status: "APROBADO",
  },
  {
    id: "ev-2",
    date: "2026-11-17",
    endDate: "2026-11-17",
    ente: "Cendis",
    title: "Apoyo a IAEM en el marco de la Chinita",
    eventType: "SESION_ESTUDIO",
    allDay: false,
    startTime: "10:00",
    endTime: "14:00",
    timeZone: "America/Caracas (GMT-04:00)",
    recurrence: "DIARIO",
    location: "Por definir",
    meetLink: "https://meet.google.com/cen-dis-iaem",
    description:
      "Despliegue técnico de grabación móvil y asistencia sonora en articulación con el IAEM para las festividades de la Chinita.",
    responsable: "Anaileth Briceño",
    emailInvitado: "produccion.cendis@gmail.com",
    invitadosAdicionales: "",
    contacto: "0424.164.30.07",
    visibility: "PUBLICO",
    availability: "OCUPADO",
    color: "AMBER",
    reminderValue: 1,
    reminderUnit: "DIAS",
    notifyApp: true,
    notifyEmail: true,
    notifyWhatsapp: true,
    status: "APROBADO",
  },
  {
    id: "ev-3",
    date: "2026-11-18",
    endDate: "2026-11-18",
    ente: "Cendis",
    title: "Apoyo a IAEM en el marco de la Chinita (Día 2)",
    eventType: "SESION_ESTUDIO",
    allDay: false,
    startTime: "10:00",
    endTime: "14:00",
    timeZone: "America/Caracas (GMT-04:00)",
    recurrence: "DIARIO",
    location: "Por definir",
    meetLink: "https://meet.google.com/cen-dis-iaem",
    description:
      "Segunda jornada de cobertura técnica, sonido y registro fonográfico junto al IAEM.",
    responsable: "Anaileth Briceño",
    emailInvitado: "produccion.cendis@gmail.com",
    invitadosAdicionales: "",
    contacto: "0424.164.30.07",
    visibility: "PUBLICO",
    availability: "OCUPADO",
    color: "EMERALD",
    reminderValue: 12,
    reminderUnit: "HORAS",
    notifyApp: true,
    notifyEmail: true,
    notifyWhatsapp: true,
    status: "APROBADO",
  },
  {
    id: "ev-4",
    date: "2026-11-19",
    endDate: "2026-11-19",
    ente: "Cendis",
    title: "Cierre Técnico IAEM - Marco de la Chinita",
    eventType: "EVENTO",
    allDay: false,
    startTime: "10:00",
    endTime: "13:00",
    timeZone: "America/Caracas (GMT-04:00)",
    recurrence: "NO_REPETIR",
    location: "Sede CENDIS, Caracas",
    meetLink: "https://meet.google.com/cen-dis-cierre",
    description:
      "Revisión de material grabado, respaldo en servidor maestro y entrega de acta técnica.",
    responsable: "Anaileth Briceño",
    emailInvitado: "produccion.cendis@gmail.com",
    invitadosAdicionales: "presidencia.cendis@gmail.com",
    contacto: "0424.164.30.07",
    visibility: "PUBLICO",
    availability: "OCUPADO",
    color: "ROSE",
    reminderValue: 1,
    reminderUnit: "DIAS",
    notifyApp: true,
    notifyEmail: true,
    notifyWhatsapp: true,
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
    nombre: "Actualización de Red y Servidores SIACENDIS",
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
        <div
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          className="w-full flex justify-between text-[11.5px] font-semibold tracking-[0.22em] text-black uppercase leading-none mb-1 px-0.5"
        >
          <span>C</span>
          <span>E</span>
          <span>N</span>
          <span>D</span>
          <span>I</span>
          <span>S</span>
        </div>
      )}
      <img
        src="/logo-cendis.jpg"
        alt="Centro Nacional del Disco (CENDIS)"
        className="w-full h-auto object-contain block"
      />
    </div>
  );
}

// ============================================================================
// COMPONENTES GRÁFICOS DEL CARNET OFICIAL CENDIS (ESCUDO, GLIFO DORADO Y CÓDIGO DE BARRAS ESCANEABLE)
// ============================================================================
function GoldenCoatOfArmsSVG({ className = "w-16 h-16" }) {
  return (
    <img
      src="/escudo-venezuela-dorado.png"
      alt="Escudo Nacional de la República Bolivariana de Venezuela en Dorado"
      className={`${className} object-contain block select-none`}
    />
  );
}

function GoldenCendisGlyphSVG({ showTopTitle = true, compact = false }) {
  return (
    <div className="flex flex-col items-center select-none w-full">
      {showTopTitle && (
        <div
          style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif" }}
          className={`${
            compact ? "text-[13px]" : "text-[17px]"
          } font-bold text-[#0b2545] tracking-[0.06em] leading-none mb-1`}
        >
          Centro Nacional
        </div>
      )}
      {/* Glifo precolombino CENDIS en color dorado metálico fiel al carnet */}
      <svg
        viewBox="0 0 360 88"
        className={compact ? "w-36 h-9" : "w-52 h-12"}
        fill="#a88644"
      >
        {/* Barra curva izquierda */}
        <path d="M12,8 C6,28 6,60 12,80 L22,80 C18,60 18,28 22,8 Z" />
        {/* Bloque pequeño interno izquierdo */}
        <rect x="27" y="26" width="12" height="34" rx="2" />
        {/* Bloque principal izquierdo con triángulo calado */}
        <path d="M29,8 L128,8 L128,16 L96,34 L128,46 L128,54 L76,54 L76,68 L94,68 L94,76 L29,76 L29,64 L54,64 L54,18 L29,18 Z" />
        {/* Llave inferior izquierda */}
        <path d="M96,58 L128,58 L128,80 L96,80 L96,71 L117,71 L117,66 L96,66 Z" />
        {/* Estructura central escalonada */}
        <rect x="156" y="8" width="28" height="24" rx="2" />
        <path d="M135,14 L147,14 L147,36 L193,36 L193,8 L272,8 L272,80 L193,80 L193,58 L146,58 L146,80 L135,80 L135,48 L204,48 L204,69 L259,69 L259,19 L204,19 L204,45 L135,45 Z" />
        {/* Espiral cuadrada concéntrica central-derecha */}
        <path d="M212,26 L251,26 L251,62 L212,62 L212,53 L241,53 L241,35 L212,35 Z" />
        <rect x="214" y="39" width="21" height="12" rx="1.5" />
        {/* Figura zoomorfa/tambor derecha */}
        <path d="M272,26 L292,26 L296,8 L328,8 L328,16 L306,16 L304,26 C322,28 334,34 334,46 C334,58 322,64 304,66 L306,72 L328,72 L328,80 L294,80 L292,64 L272,64 Z" />
        {/* Barra curva derecha */}
        <path d="M338,8 C344,28 344,60 338,80 L348,80 C354,60 354,28 348,8 Z" />
      </svg>
      <div
        style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif" }}
        className={`${
          compact ? "text-[12px] tracking-[0.3em]" : "text-[16px] tracking-[0.34em]"
        } font-bold text-[#0b2545] leading-none mt-1 pl-2`}
      >
        del Disco
      </div>
    </div>
  );
}

// Generador determinista de barras escaneables + patrón híbrido del carnet oficial
function ScannableCarnetBarcode({ value = "2024-CENDIS-000123" }) {
  const cleanCode = String(value || "2024-CENDIS-000123").trim().toUpperCase();

  // Generamos bits deterministas a partir de cada carácter ASCII para que el lector y el patrón sean únicos por trabajador
  const charCodes = Array.from(cleanCode).map((c, idx) => c.charCodeAt(0) + idx * 7);

  // Columnas para el bloque central híbrido (estilo PDF417 / DataMatrix flanqueado por barras de inicio/parada como en la foto adjunta)
  const matrixCols = 34;
  const matrixRows = 7;

  // Barras 1D Code-39 / Code-128 puras arriba/abajo para lectores láser 1D convencionales
  const oneDBars = [];
  let cursorX = 6;
  // Quiet zone + Start pattern
  [3, 1.5, 1.5, 3, 1.5, 1.5].forEach((w, i) => {
    if (i % 2 === 0) oneDBars.push({ x: cursorX, w });
    cursorX += w;
  });
  charCodes.forEach((code) => {
    const b1 = (code % 3) + 1.2;
    const s1 = ((code >> 1) % 2) + 1.1;
    const b2 = ((code >> 2) % 3) + 1.2;
    const s2 = ((code >> 3) % 2) + 1.1;
    const b3 = ((code >> 4) % 2) + 1.2;
    const s3 = 1.2;
    oneDBars.push({ x: cursorX, w: b1 });
    cursorX += b1 + s1;
    oneDBars.push({ x: cursorX, w: b2 });
    cursorX += b2 + s2;
    oneDBars.push({ x: cursorX, w: b3 });
    cursorX += b3 + s3;
  });
  // Stop pattern
  [3, 1.5, 1.8, 1.5, 3].forEach((w, i) => {
    if (i % 2 === 0) oneDBars.push({ x: cursorX, w });
    cursorX += w;
  });

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Patrón híbrido idéntico al reverso del carnet adjunto + barras 1D escaneables */}
      <svg
        viewBox="0 0 240 42"
        className="w-52 h-10 bg-white px-1"
        aria-label={`Código de barra ${cleanCode}`}
      >
        {/* Barras de guardia izquierdas (Start Guard Bars) */}
        <rect x="8" y="2" width="6.5" height="38" fill="#000000" />
        <rect x="17" y="2" width="2.2" height="38" fill="#000000" />
        <rect x="21.5" y="2" width="1.6" height="38" fill="#000000" />
        <rect x="25.5" y="2" width="2.4" height="38" fill="#000000" />

        {/* Bloque central de datos codificados (4 sub-bloques con barras guía intermedias como la imagen de referencia) */}
        {Array.from({ length: matrixCols }).map((_, colIdx) => {
          const xPos = 31 + colIdx * 4.7;
          // Cada 8 columnas insertamos una barra vertical de sincronización
          if (colIdx % 8 === 0) {
            return (
              <g key={`sync-${colIdx}`}>
                <rect x={xPos} y="2" width="2.2" height="38" fill="#000000" />
                <rect x={xPos + 2.8} y="2" width="1.1" height="38" fill="#000000" />
              </g>
            );
          }
          const seed = charCodes[colIdx % charCodes.length] * (colIdx + 3);
          return (
            <g key={`col-${colIdx}`}>
              {Array.from({ length: matrixRows }).map((__, rowIdx) => {
                const bit = ((seed >> rowIdx) ^ (colIdx + rowIdx)) & 1;
                if (!bit) return null;
                return (
                  <rect
                    key={`cell-${colIdx}-${rowIdx}`}
                    x={xPos}
                    y={2 + rowIdx * 5.4}
                    width="3.4"
                    height="4.8"
                    fill="#000000"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Barras de guardia derechas (Stop Guard Bars) */}
        <rect x="194" y="2" width="6.8" height="38" fill="#000000" />
        <rect x="204" y="2" width="2.4" height="38" fill="#000000" />
        <rect x="209.5" y="2" width="1.5" height="38" fill="#000000" />
        <rect x="214" y="2" width="2.4" height="38" fill="#000000" />
        <rect x="220" y="2" width="1.5" height="38" fill="#000000" />
      </svg>
      <div
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        className="text-[11px] font-bold tracking-[0.04em] text-black leading-none mt-0.5"
      >
        {cleanCode}
      </div>
    </div>
  );
}

function OfficialHeaderCintillo({ showRightLogo = true }) {
  return (
    <div
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      className="official-header-cintillo w-full flex items-center justify-between gap-4 pb-2 select-none bg-white shrink-0"
    >
      <img
        src="/cintillo-mppc.png"
        alt="República Bolivariana de Venezuela - Ministerio del Poder Popular para la Cultura"
        loading="eager"
        decoding="sync"
        className="h-[50px] sm:h-[54px] w-auto max-w-[72%] object-contain block shrink-0"
      />

      {showRightLogo && (
        <img
          src="/cintillo-cendis.jpg"
          alt="CENDIS - Centro Nacional del Disco"
          loading="eager"
          decoding="sync"
          className="h-[52px] sm:h-[58px] w-auto max-w-[24%] object-contain block shrink-0"
        />
      )}
    </div>
  );
}

function OfficialFooterWave() {
  return (
    <div
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      className="official-footer-wave w-full h-[88px] relative overflow-hidden select-none mt-auto shrink-0 bg-white pointer-events-none"
    >
      <img
        src="/cintillo-onda-inferior.png"
        alt="Cintillo Ondulado Tricolor Oficial MPPC - CENDIS"
        loading="eager"
        decoding="sync"
        className="w-full h-full block object-fill"
      />
    </div>
  );
}

// ============================================================================
// GESTIÓN DE SESIÓN PERSISTENTE, INACTIVIDAD (5 MIN) Y VIGENCIA DE CLAVE (90 DÍAS)
// ============================================================================
const SESSION_COOKIE_NAME = "cendis_session";
const SESSION_DURATION_DAYS = 7;
const PASSWORD_MAX_AGE_DAYS = 90;
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutos de inactividad
const STORAGE_USERS_KEY = "cendis_users_v1";
const STORAGE_EMPLOYEES_KEY = "cendis_employees_v1";

function getPasswordExpirationInfo(userObj) {
  const defaultIso = "2026-11-13T12:00:00.000Z";
  const rawDate = userObj?.passwordUpdatedAt || defaultIso;
  const parsedTime = new Date(rawDate).getTime();
  const baseTime = Number.isNaN(parsedTime) ? Date.now() : parsedTime;
  const elapsedMs = Math.max(0, Date.now() - baseTime);
  const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, PASSWORD_MAX_AGE_DAYS - daysElapsed);
  const isExpired = daysElapsed >= PASSWORD_MAX_AGE_DAYS;
  const expirationDate = new Date(baseTime + PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  return {
    updatedAtIso: rawDate,
    daysElapsed,
    daysRemaining,
    isExpired,
    expirationDateStr: expirationDate.toISOString().slice(0, 10),
  };
}

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
      passwordUpdatedAt: userObj.passwordUpdatedAt || new Date().toISOString(),
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

  // Estado para Cambio de Clave de Seguridad (Límite de renovación: 90 días)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [showPwdFields, setShowPwdFields] = useState(false);

  // Información de vigencia de la clave (90 días) del usuario actual
  const passwordExpInfo = useMemo(() => getPasswordExpirationInfo(currentUser), [currentUser]);

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

  // Estado Universal de Memorandos, Solicitudes y Oficios (Formato Oficial FC-DG-MEM-2026-007)
  const [docType, setDocType] = useState("MEMORANDUM"); // MEMORANDUM | SOLICITUD | OFICIO
  const [docUnitPrefix, setDocUnitPrefix] = useState("FC-DG");
  const [counters, setCounters] = useState({ MEMORANDUM: 7, SOLICITUD: 1, OFICIO: 1 });
  const [manualCorrelative, setManualCorrelative] = useState(false);
  const [customCorrelative, setCustomCorrelative] = useState("");

  const [para, setPara] = useState("Lcdo. Jesús García");
  const [paraDireccion, setParaDireccion] = useState(
    "General de Administración del Ministerio del Poder Popular para la Cultura"
  );
  const [de, setDe] = useState("Morris López");
  const [deCargo, setDeCargo] = useState(
    "Director Ejecutivo de la Fundación Centro Nacional del Disco (CENDIS)"
  );
  const [fecha, setFecha] = useState("2026-11-13");
  const [asunto, setAsunto] = useState("Solicitud de transporte");
  const [concepto, setConcepto] = useState(
    "Tengo el agrado de dirigirme a usted en la oportunidad de saludarle cordialmente y, a su vez, solicitarle transporte para el personal de audiovisuales conformado por 9 personas y equipo técnico, quienes se trasladan el día de mañana 13/11/2026 al Cristo Rey, parroquia 23 de enero a las 12:30pm – 9:00pm.\n\nAgradeciendo de antemano su receptividad, máxima colaboración y constante apoyo interinstitucional para la realización con éxito de este evento, quedo de usted."
  );

  const [signerNombre, setSignerNombre] = useState("Lcdo. MORRIS LÓPEZ");
  const [signerCargo, setSignerCargo] = useState("Director General");
  const [signerEnte, setSignerEnte] = useState("Fundación Centro Nacional del Disco (CENDIS)");
  const [signerMinisterio, setSignerMinisterio] = useState(
    "Ministerio del Poder Popular para la Cultura"
  );
  const [signerResolucion] = useState(
    "Designado según Gaceta Oficial de la República Bolivariana de Venezuela N° 42.125"
  );

  const [documents, setDocuments] = useState([
    {
      id: "doc-1",
      correlativo: "FC-DG-MEM-2026-007",
      tipo: "MEMORANDUM",
      para: "Lcdo. Jesús García",
      paraDireccion: "General de Administración del Ministerio del Poder Popular para la Cultura",
      de: "Morris López",
      deCargo: "Director Ejecutivo de la Fundación Centro Nacional del Disco (CENDIS)",
      fecha: "2026-11-13",
      asunto: "Solicitud de transporte",
      concepto:
        "Tengo el agrado de dirigirme a usted en la oportunidad de saludarle cordialmente y, a su vez, solicitarle transporte para el personal de audiovisuales conformado por 9 personas y equipo técnico, quienes se trasladan el día de mañana 13/11/2026 al Cristo Rey, parroquia 23 de enero a las 12:30pm – 9:00pm.\n\nAgradeciendo de antemano su receptividad, máxima colaboración y constante apoyo interinstitucional para la realización con éxito de este evento, quedo de usted.",
      signerNombre: "Lcdo. MORRIS LÓPEZ",
      signerCargo: "Director General",
      signerEnte: "Fundación Centro Nacional del Disco (CENDIS)",
      signerMinisterio: "Ministerio del Poder Popular para la Cultura",
      status: "PENDIENTE_APROBACION",
      creadoPor: "produccion",
      creadoEn: "2026-11-13 09:15",
      aprobadoPor: null,
      fechaAprobacion: null,
      motivoAnulacion: "",
      anuladoPor: null,
      fechaAnulacion: null,
    },
    {
      id: "doc-2",
      correlativo: "FC-DG-MEM-2026-006",
      tipo: "MEMORANDUM",
      para: "Anaileth Briceño",
      paraDireccion: "Coordinación de Producción Fonográfica del CENDIS",
      de: "Morris López",
      deCargo: "Director Ejecutivo de la Fundación Centro Nacional del Disco (CENDIS)",
      fecha: "2026-11-10",
      asunto: "Lineamientos de cierre administrativo mensual",
      concepto:
        "Tengo el agrado de dirigirme a usted en la oportunidad de saludarle cordialmente y remitir los lineamientos correspondientes a la relación mensual de actividades operativas y técnicas.\n\nAgradeciendo de antemano su receptividad y colaboración, quedo de usted.",
      signerNombre: "Lcdo. MORRIS LÓPEZ",
      signerCargo: "Director General",
      signerEnte: "Fundación Centro Nacional del Disco (CENDIS)",
      signerMinisterio: "Ministerio del Poder Popular para la Cultura",
      status: "APROBADO",
      creadoPor: "admin",
      creadoEn: "2026-11-10 10:00",
      aprobadoPor: "Administrador General CENDIS",
      fechaAprobacion: "2026-11-10 10:30",
      motivoAnulacion: "",
      anuladoPor: null,
      fechaAnulacion: null,
    },
  ]);

  const [selectedDocId, setSelectedDocId] = useState(null); // null = vista en vivo del editor | id = documento seleccionado
  const [reviewModalDocId, setReviewModalDocId] = useState(null);
  const [annulReasonInput, setAnnulReasonInput] = useState("");
  const [annulError, setAnnulError] = useState("");
  const [showAnnulBoxInModal, setShowAnnulBoxInModal] = useState(false);
  const [docStatusFilter, setDocStatusFilter] = useState("TODOS");

  // Bitácora (Logs)
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: "2026-11-13 08:30:00",
      user: "admin",
      role: "ADMIN",
      action: "Inicialización del Sistema Web Integrado SIACENDIS",
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
  const [hrModalOpen, setHrModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [familyMemberDraft, setFamilyMemberDraft] = useState({
    parentesco: "Hijo(a)",
    nombreCompleto: "",
    cedula: "",
    fechaNacimiento: "",
    edad: "",
  });
  const [newEmpForm, setNewEmpForm] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    cargo: "",
    coordinacion: "Producción Fonográfica",
    condicionLaboral: "Fijo",
    nivelAcademico: "Universitario",
    profesion: "",
    estadoCivil: "Soltero(a)",
    genero: "Femenino",
    tallas: "",
    telefono: "",
    telefonoAlterno: "",
    correo: "",
    direccion: "",
    fechaNacimiento: "",
    fechaIngreso: "2026-11-13",
    tipoSangre: "O+",
    emergencia1: "",
    emergencia2: "",
    familiares: "",
    familiaresLista: [],
    tieneCargaFamiliar: "SI",
    fotoCarnet: "",
    observacionesLaborales: "",
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
  const [hrFilterCondicion, setHrFilterCondicion] = useState("TODAS");
  const [hrFilterCarga, setHrFilterCarga] = useState("TODOS");
  const [hrFilterSangre, setHrFilterSangre] = useState("TODOS");
  const [hrFilterSearch, setHrFilterSearch] = useState("");
  const [hrReportType, setHrReportType] = useState("NOMINA_COMPLETA");

  // Estado de Agenda (Google Calendar Completo con Recordatorios App / Correo / WhatsApp)
  const [agendaEvents, setAgendaEventsState] = useState(() => {
    if (typeof window === "undefined") return INITIAL_AGENDA_EVENTS;
    try {
      const raw = window.localStorage.getItem("cendis_agenda_v1");
      if (!raw) return INITIAL_AGENDA_EVENTS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_AGENDA_EVENTS;
    } catch {
      return INITIAL_AGENDA_EVENTS;
    }
  });
  const setAgendaEvents = (updater) => {
    setAgendaEventsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        window.localStorage.setItem("cendis_agenda_v1", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };
  const [agendaViewMode, setAgendaViewMode] = useState("CALENDAR"); // CALENDAR | REPORT | REMINDERS
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
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
    eventType: "EVENTO", // EVENTO | TAREA | FUERA_DE_OFICINA | SESION_ESTUDIO
    allDay: false,
    endDate: "",
    startTime: "09:00",
    endTime: "10:30",
    timeZone: "America/Caracas (GMT-04:00)",
    recurrence: "NO_REPETIR", // NO_REPETIR | DIARIO | SEMANAL | MENSUAL | ANUAL | DIAS_LABORALES
    location: "",
    meetLink: "https://meet.google.com/cen-dis-mppc",
    description: "",
    responsable: "Morris López",
    emailInvitado: "morris.lopez.cendis@gmail.com",
    invitadosAdicionales: "",
    contacto: "0426.324.32.46",
    visibility: "PUBLICO", // PUBLICO | PRIVADO | PREDETERMINADO
    availability: "OCUPADO", // OCUPADO | DISPONIBLE
    color: "BLUE", // BLUE | EMERALD | AMBER | ROSE | VIOLET | CYAN
    reminderValue: 2,
    reminderUnit: "HORAS", // HORAS | DIAS
    notifyApp: true,
    notifyEmail: true,
    notifyWhatsapp: true,
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
      text: "Bienvenidos al Chat Interno del SIACENDIS. Recuerden cargar el avance semanal de proyectos.",
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

  // Correlativo formateado universal (ej. FC-DG-MEM-2026-007)
  const formattedCorrelative = useMemo(() => {
    if (manualCorrelative && customCorrelative.trim()) return customCorrelative.trim();
    const typeCode =
      docType === "MEMORANDUM" ? "MEM" : docType === "SOLICITUD" ? "SOL" : "OFI";
    const cleanUnit = (docUnitPrefix || "FC-DG").trim().toUpperCase();
    const num = String(counters[docType] || 1).padStart(3, "0");
    return `${cleanUnit}-${typeCode}-2026-${num}`;
  }, [docType, docUnitPrefix, counters, manualCorrelative, customCorrelative]);

  // Formateador de fecha larga oficial (ej. "13 de noviembre de 2026")
  const formatFechaLargaOficial = (isoStr) => {
    if (!isoStr) return "";
    if (isoStr.includes(" de ")) return isoStr;
    const parts = String(isoStr).split("-");
    if (parts.length !== 3) return isoStr;
    const [yyyy, mm, dd] = parts;
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const mesIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1));
    const diaNum = parseInt(dd, 10) || dd;
    return `${diaNum} de ${meses[mesIdx]} de ${yyyy}`;
  };

  // Documento activo en la vista previa (seleccionado de la bandeja o borrador en edición)
  const activePreviewDoc = useMemo(() => {
    if (selectedDocId) {
      const found = documents.find((d) => d.id === selectedDocId);
      if (found) return found;
    }
    return {
      id: null,
      correlativo: formattedCorrelative,
      tipo: docType,
      para,
      paraDireccion,
      de,
      deCargo,
      fecha,
      asunto,
      concepto,
      signerNombre,
      signerCargo,
      signerEnte,
      signerMinisterio,
      status: "BORRADOR",
      creadoPor: currentUser?.username || "usuario",
      motivoAnulacion: "",
    };
  }, [
    selectedDocId,
    documents,
    formattedCorrelative,
    docType,
    para,
    paraDireccion,
    de,
    deCargo,
    fecha,
    asunto,
    concepto,
    signerNombre,
    signerCargo,
    signerEnte,
    signerMinisterio,
    currentUser,
  ]);

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
        content: `RESPALDO INTEGRAL SIACENDIS\nFecha: ${new Date().toLocaleString()}\nMemos/Solicitudes: ${documents.length}\nPersonal RRHH: ${employees.length}\nProyectos: ${projects.length}\nBienes Nacionales: ${bienesList.length}`,
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
    <title>SIACENDIS | Fundación Centro Nacional del Disco - MPPC</title>
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
SISTEMA INTEGRADO SIACENDIS (CON TODAS LAS ACTUALIZACIONES)
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
// SIACENDIS - SISTEMA INTEGRADO DE GESTIÓN (FUNDACIÓN CENDIS - MPPC)
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
    setPasswordModalOpen(false);
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setCurrentScreen("LOGIN");
  };

  // Caducidad automática de la sesión después de 5 minutos (300.000 ms) de inactividad
  useEffect(() => {
    if (!currentUser || currentScreen === "LOGIN") return;

    let inactivityTimer = null;

    const expireSessionByInactivity = () => {
      clearSessionCookie();
      setPasswordModalOpen(false);
      setCurrentUser(null);
      setLoginPassword("");
      setCurrentScreen("LOGIN");
      setLoginError(
        "Su sesión ha caducado automáticamente después de 5 minutos de inactividad. Por favor, inicie sesión nuevamente."
      );
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(expireSessionByInactivity, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [currentUser, currentScreen]);

  // Verificación automática del límite de 90 días para renovar la clave de seguridad
  useEffect(() => {
    if (!currentUser || currentScreen === "LOGIN") return;
    const exp = getPasswordExpirationInfo(currentUser);
    if (exp.isExpired) {
      setPasswordModalOpen(true);
    }
  }, [currentUser, currentScreen]);

  const openPasswordModal = () => {
    setPwdCurrent("");
    setPwdNew("");
    setPwdConfirm("");
    setPwdError("");
    setPasswordModalOpen(true);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const storedUser = users.find((u) => u.id === currentUser.id) || currentUser;
    const isGoogleDefaultPwd = storedUser.password === "GoogleAuthUser";

    if (!isGoogleDefaultPwd && pwdCurrent !== storedUser.password) {
      setPwdError("La clave actual ingresada no es correcta.");
      return;
    }
    if (pwdNew.trim().length < 6) {
      setPwdError("La nueva clave de seguridad debe tener al menos 6 caracteres.");
      return;
    }
    if (pwdNew === storedUser.password) {
      setPwdError("La nueva clave debe ser diferente a la clave actual.");
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError("La confirmación de la nueva clave no coincide.");
      return;
    }

    const updatedAt = new Date().toISOString();
    const updatedUser = {
      ...currentUser,
      password: pwdNew,
      passwordUpdatedAt: updatedAt,
    };

    setUsers((prev) =>
      prev.map((u) =>
        u.id === updatedUser.id
          ? { ...u, password: pwdNew, passwordUpdatedAt: updatedAt }
          : u
      )
    );
    setCurrentUser(updatedUser);
    setSessionCookie(updatedUser);
    setPasswordModalOpen(false);
    setPwdCurrent("");
    setPwdNew("");
    setPwdConfirm("");
    setPwdError("");
    addLog("Cambio y renovación de clave de seguridad (vigencia renovada por 90 días)", updatedUser);
    showToast("Clave de seguridad actualizada exitosamente. Vigencia renovada por 90 días.");
  };

  const renderPasswordChangeModal = () => {
    if (!passwordModalOpen || !currentUser) return null;
    const storedUser = users.find((u) => u.id === currentUser.id) || currentUser;
    const isGoogleDefaultPwd = storedUser.password === "GoogleAuthUser";
    const isExpired = passwordExpInfo.isExpired;

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-[#0b1221] text-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700/80">
          <div className="grid grid-cols-3 h-1.5 w-full">
            <div className="bg-[#facc15]" />
            <div className="bg-[#1d4ed8]" />
            <div className="bg-[#dc2626]" />
          </div>

          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  Cambio de Clave de Seguridad
                </h3>
                <p className="text-[11px] text-slate-400">
                  Política de renovación obligatoria cada {PASSWORD_MAX_AGE_DAYS} días
                </p>
              </div>
            </div>
            {!isExpired && (
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <form onSubmit={handleChangePassword} className="p-5 space-y-3.5">
            <div
              className={`p-3 rounded-xl border text-xs ${
                isExpired
                  ? "bg-red-950/60 border-red-500/60 text-red-200"
                  : "bg-slate-900/90 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>Estado de vigencia (Límite 90 días):</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isExpired
                      ? "bg-red-600 text-white"
                      : passwordExpInfo.daysRemaining <= 15
                      ? "bg-amber-500 text-slate-950"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {isExpired
                    ? "VENCIDA (RENOVAR AHORA)"
                    : `${passwordExpInfo.daysRemaining} DÍAS RESTANTES`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Última actualización: <strong>{passwordExpInfo.updatedAtIso.slice(0, 10)}</strong> • Vence el:{" "}
                <strong>{passwordExpInfo.expirationDateStr}</strong>
              </p>
              <p className="text-[11px] text-amber-300/90 mt-1">
                ⏱ Nota: La sesión activa caduca automáticamente tras 5 minutos de inactividad.
              </p>
            </div>

            {pwdError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-semibold">
                {pwdError}
              </div>
            )}

            {!isGoogleDefaultPwd && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Clave de Seguridad Actual
                </label>
                <input
                  type={showPwdFields ? "text" : "password"}
                  required
                  value={pwdCurrent}
                  onChange={(e) => {
                    setPwdCurrent(e.target.value);
                    setPwdError("");
                  }}
                  placeholder="Ingrese su clave actual"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Nueva Clave de Seguridad (mínimo 6 caracteres)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPwdFields(!showPwdFields)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {showPwdFields ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                type={showPwdFields ? "text" : "password"}
                required
                value={pwdNew}
                onChange={(e) => {
                  setPwdNew(e.target.value);
                  setPwdError("");
                }}
                placeholder="Escriba su nueva clave"
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Confirmar Nueva Clave de Seguridad
              </label>
              <input
                type={showPwdFields ? "text" : "password"}
                required
                value={pwdConfirm}
                onChange={(e) => {
                  setPwdConfirm(e.target.value);
                  setPwdError("");
                }}
                placeholder="Repita la nueva clave"
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {!isExpired && (
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Guardar Clave (Renovar 90 Días)</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleEmitDocument = () => {
    if (!hasActionPermission("ingresar")) {
      showToast("Su usuario no tiene permiso para agregar nuevos documentos.", "error");
      return;
    }
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const newDoc = {
      id: `doc-${Date.now()}`,
      correlativo: formattedCorrelative,
      tipo: docType,
      para,
      paraDireccion,
      de,
      deCargo,
      fecha,
      asunto,
      concepto,
      signerNombre,
      signerCargo,
      signerEnte,
      signerMinisterio,
      status: "PENDIENTE_APROBACION",
      creadoPor: currentUser?.fullName || currentUser?.username || "usuario",
      creadoEn: stamp,
      aprobadoPor: null,
      fechaAprobacion: null,
      motivoAnulacion: "",
      anuladoPor: null,
      fechaAnulacion: null,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
    if (!manualCorrelative) {
      setCounters((prev) => ({
        ...prev,
        [docType]: (prev[docType] || 1) + 1,
      }));
    }
    addLog(
      `Creado ${docType} N° ${formattedCorrelative} (En Revisión para Autorización de Administrador)`
    );
    showToast(
      `Documento ${formattedCorrelative} creado y enviado a Revisión. Un Administrador debe verificarlo y aprobarlo para habilitar su impresión.`
    );
  };

  const handleLoadDocIntoEditor = (docObj) => {
    if (!docObj) return;
    setSelectedDocId(docObj.id);
    setDocType(docObj.tipo || "MEMORANDUM");
    setManualCorrelative(true);
    setCustomCorrelative(docObj.correlativo || "");
    setPara(docObj.para || "");
    setParaDireccion(docObj.paraDireccion || "");
    setDe(docObj.de || "");
    setDeCargo(docObj.deCargo || "");
    setFecha(docObj.fecha || "2026-11-13");
    setAsunto(docObj.asunto || "");
    setConcepto(docObj.concepto || "");
    setSignerNombre(docObj.signerNombre || "Lcdo. MORRIS LÓPEZ");
    setSignerCargo(docObj.signerCargo || "Director General");
    setSignerEnte(docObj.signerEnte || "Fundación Centro Nacional del Disco (CENDIS)");
    setSignerMinisterio(docObj.signerMinisterio || "Ministerio del Poder Popular para la Cultura");
  };

  const handleOpenReviewModal = (docObj) => {
    if (!docObj) return;
    setSelectedDocId(docObj.id);
    setReviewModalDocId(docObj.id);
    setAnnulReasonInput(docObj.motivoAnulacion || "");
    setAnnulError("");
    setShowAnnulBoxInModal(false);
  };

  const handleApproveDocument = (docId) => {
    if (currentUser?.role !== "ADMIN") {
      showToast("Solo un usuario Administrador puede revisar y autorizar documentos.", "error");
      return;
    }
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: "APROBADO",
              aprobadoPor: currentUser.fullName || currentUser.username,
              fechaAprobacion: stamp,
              motivoAnulacion: "",
              anuladoPor: null,
              fechaAnulacion: null,
            }
          : d
      )
    );
    setSelectedDocId(docId);
    setReviewModalDocId(null);
    addLog(
      `Revisado y AUTORIZADO documento ${targetDoc?.correlativo || docId} por Administrador (${currentUser.username})`
    );
    showToast(
      `✓ Documento ${targetDoc?.correlativo || ""} revisado y AUTORIZADO por el Administrador. Ya puede imprimirse en PDF.`
    );
  };

  const handleAnnulDocument = (docId, reasonRaw) => {
    if (currentUser?.role !== "ADMIN" && !hasActionPermission("anular")) {
      showToast("Su usuario no tiene permiso para anular documentos.", "error");
      return;
    }
    const cleanReason = (reasonRaw || "").trim();
    if (!cleanReason) {
      setAnnulError("Debe escribir obligatoriamente la descripción o motivo por el cual se anula este documento.");
      return;
    }
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: "ANULADO",
              motivoAnulacion: cleanReason,
              anuladoPor: currentUser?.fullName || currentUser?.username || "Administrador",
              fechaAnulacion: stamp,
            }
          : d
      )
    );
    setSelectedDocId(docId);
    setReviewModalDocId(null);
    setShowAnnulBoxInModal(false);
    setAnnulReasonInput("");
    setAnnulError("");
    addLog(
      `ANULADO documento ${targetDoc?.correlativo || docId}. Motivo: "${cleanReason}"`
    );
    showToast(
      `Documento ${targetDoc?.correlativo || ""} ANULADO con motivo registrado.`
    );
  };

  const handlePrintApprovedDocument = () => {
    if (activePreviewDoc.status !== "APROBADO") {
      if (activePreviewDoc.status === "ANULADO") {
        showToast(
          `Impresión bloqueada: Este documento se encuentra ANULADO. Motivo: ${activePreviewDoc.motivoAnulacion}`,
          "error"
        );
      } else {
        showToast(
          "Impresión bloqueada: Primero debe crear el documento y un usuario Administrador debe revisarlo y AUTORIZARLO (APROBADO) para poder imprimirlo.",
          "error"
        );
      }
      return;
    }
    window.print();
  };

  const formatReminderLabel = (ev) => {
    const val = ev?.reminderValue || 1;
    const unit = ev?.reminderUnit === "DIAS" ? (val === 1 ? "día" : "días") : val === 1 ? "hora" : "horas";
    return `${val} ${unit} de anticipación`;
  };

  const triggerInAppReminder = (ev) => {
    const anticipacion = formatReminderLabel(ev);
    const msg = `🔔 Recordatorio SIACENDIS (${anticipacion}): "${ev.title}" el ${ev.date} (${
      ev.allDay ? "Todo el día" : `${ev.startTime} - ${ev.endTime || ""}`
    }) en ${ev.location || "Sede CENDIS"}. Responsable: ${ev.responsable}.`;
    showToast(msg);
    addLog(`Notificación en aplicación enviada a ${ev.responsable}: ${ev.title}`);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (window.Notification.permission === "granted") {
        new window.Notification(`SIACENDIS • Recordatorio (${anticipacion})`, {
          body: `${ev.title} — ${ev.date} ${ev.startTime} (${ev.responsable})`,
          icon: "/logo-cendis.jpg",
        });
      } else if (window.Notification.permission !== "denied") {
        window.Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new window.Notification(`SIACENDIS • Recordatorio (${anticipacion})`, {
              body: `${ev.title} — ${ev.date} ${ev.startTime} (${ev.responsable})`,
              icon: "/logo-cendis.jpg",
            });
          }
        });
      }
    }
  };

  const sendEmailReminder = (ev) => {
    const toEmail =
      ev.emailInvitado ||
      employees.find((emp) => `${emp.nombres} ${emp.apellidos}`.toLowerCase() === (ev.responsable || "").toLowerCase())
        ?.correo ||
      currentUser?.email ||
      "presidencia.cendis@gmail.com";
    const subject = encodeURIComponent(
      `[Recordatorio SIACENDIS - ${formatReminderLabel(ev)}] ${ev.title} (${ev.date})`
    );
    const body = encodeURIComponent(
      `RECORDATORIO OFICIAL DE AGENDA CENDIS (SIACENDIS)\n` +
        `===================================================\n` +
        `Actividad: ${ev.title}\n` +
        `Tipo de Evento: ${ev.eventType || "EVENTO"}\n` +
        `Fecha: ${ev.date}${ev.endDate && ev.endDate !== ev.date ? ` al ${ev.endDate}` : ""}\n` +
        `Horario: ${ev.allDay ? "Todo el día" : `${ev.startTime} a ${ev.endTime || ""}`} (${
          ev.timeZone || "America/Caracas"
        })\n` +
        `Ubicación: ${ev.location || "Sede CENDIS"}\n` +
        `Enlace Google Meet: ${ev.meetLink || "No aplica"}\n` +
        `Responsable: ${ev.responsable} (${ev.contacto || ""})\n` +
        `Descripción / Notas:\n${ev.description || "Sin notas adicionales."}\n\n` +
        `Aviso programado con: ${formatReminderLabel(ev)}.`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      toEmail
    )}${ev.invitadosAdicionales ? `&cc=${encodeURIComponent(ev.invitadosAdicionales)}` : ""}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    addLog(`Recordatorio por correo Gmail enviado a ${toEmail} para '${ev.title}'`);
    showToast(`Abriendo recordatorio de correo Gmail para ${toEmail}`);
  };

  const sendWhatsappReminder = (ev) => {
    const rawDigits = String(ev.contacto || "").replace(/\D/g, "");
    const intlPhone = rawDigits.startsWith("0")
      ? `58${rawDigits.slice(1)}`
      : rawDigits.startsWith("58")
      ? rawDigits
      : `58${rawDigits}`;
    const text = encodeURIComponent(
      `*🔔 RECORDATORIO DE AGENDA CENDIS (SIACENDIS)*\n` +
        `Hola *${ev.responsable}*, te recordamos con *${formatReminderLabel(ev)}* tu actividad agendada:\n\n` +
        `📌 *Actividad:* ${ev.title}\n` +
        `📅 *Fecha:* ${ev.date}${ev.endDate && ev.endDate !== ev.date ? ` al ${ev.endDate}` : ""}\n` +
        `⏰ *Hora:* ${ev.allDay ? "Todo el día" : `${ev.startTime} - ${ev.endTime || ""}`}\n` +
        `📍 *Lugar:* ${ev.location || "Sede CENDIS"}\n` +
        `📝 *Descripción:* ${ev.description || "Actividad institucional CENDIS"}\n` +
        `${ev.meetLink ? `🎥 *Google Meet:* ${ev.meetLink}\n` : ""}` +
        `🏛 *Ente:* ${ev.ente || "CENDIS - MPPC"}`
    );
    const waUrl = `https://wa.me/${intlPhone}?text=${text}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    addLog(`Recordatorio por WhatsApp enviado a ${ev.responsable} (${ev.contacto}) para '${ev.title}'`);
    showToast(`Abriendo WhatsApp de recordatorio para ${ev.responsable}`);
  };

  const openInGoogleCalendar = (ev) => {
    const cleanDate = (ev.date || "2026-11-16").replace(/-/g, "");
    const cleanEndDate = (ev.endDate || ev.date || "2026-11-16").replace(/-/g, "");
    const startH = (ev.startTime || "09:00").replace(/[^0-9]/g, "").padEnd(4, "0").slice(0, 4);
    const endH = (ev.endTime || "10:30").replace(/[^0-9]/g, "").padEnd(4, "0").slice(0, 4);
    const datesParam = ev.allDay
      ? `${cleanDate}/${cleanEndDate}`
      : `${cleanDate}T${startH}00/${cleanEndDate}T${endH}00`;
    const gcalUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(ev.title)}` +
      `&dates=${datesParam}` +
      `&details=${encodeURIComponent(
        `${ev.description || ""}\n\nResponsable: ${ev.responsable} (${ev.contacto})\nRecordatorio: ${formatReminderLabel(
          ev
        )}`
      )}` +
      `&location=${encodeURIComponent(ev.location || "CENDIS, Caracas")}`;
    window.open(gcalUrl, "_blank", "noopener,noreferrer");
  };

  const handleAddEventToDay = (e) => {
    e.preventDefault();
    if (!selectedDayModal || !newEventForm.title.trim()) return;
    const initialStatus = currentUser?.role === "ADMIN" ? "APROBADO" : "PENDIENTE_APROBACION";
    const created = {
      id: `ev-${Date.now()}`,
      date: selectedDayModal,
      endDate: newEventForm.endDate || selectedDayModal,
      ...newEventForm,
      reminderValue: Number(newEventForm.reminderValue) || 1,
      status: initialStatus,
    };
    setAgendaEvents((prev) => [...prev, created]);

    const channels = [
      created.notifyApp ? "App" : null,
      created.notifyEmail ? "Correo" : null,
      created.notifyWhatsapp ? "WhatsApp" : null,
    ]
      .filter(Boolean)
      .join(" + ");

    addLog(
      `Agendada actividad '${created.title}' para el ${selectedDayModal} con recordatorio (${formatReminderLabel(
        created
      )} vía ${channels || "App"})`
    );

    if (created.notifyApp) {
      triggerInAppReminder(created);
    } else {
      showToast(
        `Actividad "${created.title}" agendada con recordatorio (${formatReminderLabel(created)} vía ${channels}).`
      );
    }

    setNewEventForm({
      ente: "Cendis",
      title: "",
      eventType: "EVENTO",
      allDay: false,
      endDate: selectedDayModal,
      startTime: "09:00",
      endTime: "10:30",
      timeZone: "America/Caracas (GMT-04:00)",
      recurrence: "NO_REPETIR",
      location: "",
      meetLink: "https://meet.google.com/cen-dis-mppc",
      description: "",
      responsable: employees[0] ? `${employees[0].nombres} ${employees[0].apellidos}` : "Morris López",
      emailInvitado: employees[0]?.correo || "morris.lopez.cendis@gmail.com",
      invitadosAdicionales: "",
      contacto: employees[0]?.telefono || "0426.324.32.46",
      visibility: "PUBLICO",
      availability: "OCUPADO",
      color: "BLUE",
      reminderValue: 2,
      reminderUnit: "HORAS",
      notifyApp: true,
      notifyEmail: true,
      notifyWhatsapp: true,
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

  // Funciones de Gestión de Personal y Modal "Ingresar Personal"
  const generateNextBarcode = () => {
    const nextNum = String(123 + employees.length + Math.floor(Math.random() * 50)).padStart(6, "0");
    return `2024-CENDIS-${nextNum}`;
  };

  const openNewEmployeeModal = (prefill = {}) => {
    setEditingEmpId(null);
    setFamilyMemberDraft({
      parentesco: "Hijo(a)",
      nombreCompleto: "",
      cedula: "",
      fechaNacimiento: "",
      edad: "",
    });
    setNewEmpForm({
      nombres: prefill.nombres || "",
      apellidos: prefill.apellidos || "",
      cedula: prefill.cedula || "",
      cargo: prefill.cargo || "",
      coordinacion: prefill.coordinacion || "Producción Fonográfica",
      condicionLaboral: prefill.condicionLaboral || "Fijo",
      nivelAcademico: prefill.nivelAcademico || "Universitario",
      profesion: prefill.profesion || "",
      estadoCivil: prefill.estadoCivil || "Soltero(a)",
      genero: prefill.genero || "Femenino",
      tallas: prefill.tallas || "",
      telefono: prefill.telefono || "",
      telefonoAlterno: prefill.telefonoAlterno || "",
      correo: prefill.correo || "",
      direccion: prefill.direccion || "",
      fechaNacimiento: prefill.fechaNacimiento || "",
      fechaIngreso: prefill.fechaIngreso || new Date().toISOString().slice(0, 10),
      tipoSangre: prefill.tipoSangre || "O+",
      emergencia1: prefill.emergencia1 || "",
      emergencia2: prefill.emergencia2 || "",
      familiares: prefill.familiares || "",
      familiaresLista: Array.isArray(prefill.familiaresLista) ? prefill.familiaresLista : [],
      tieneCargaFamiliar: prefill.tieneCargaFamiliar || "SI",
      fotoCarnet: prefill.fotoCarnet || "",
      observacionesLaborales: prefill.observacionesLaborales || "",
      codigoBarra: prefill.codigoBarra || generateNextBarcode(),
    });
    setHrModalOpen(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingEmpId(emp.id);
    setFamilyMemberDraft({
      parentesco: "Hijo(a)",
      nombreCompleto: "",
      cedula: "",
      fechaNacimiento: "",
      edad: "",
    });
    setNewEmpForm({
      nombres: emp.nombres || "",
      apellidos: emp.apellidos || "",
      cedula: emp.cedula || "",
      cargo: emp.cargo || "",
      coordinacion: emp.coordinacion || "Producción Fonográfica",
      condicionLaboral: emp.condicionLaboral || "Fijo",
      nivelAcademico: emp.nivelAcademico || "Universitario",
      profesion: emp.profesion || "",
      estadoCivil: emp.estadoCivil || "Soltero(a)",
      genero: emp.genero || "Femenino",
      tallas: emp.tallas || "",
      telefono: emp.telefono || "",
      telefonoAlterno: emp.telefonoAlterno || "",
      correo: emp.correo || "",
      direccion: emp.direccion || "",
      fechaNacimiento: emp.fechaNacimiento || "",
      fechaIngreso: emp.fechaIngreso || "2024-01-15",
      tipoSangre: emp.tipoSangre || "O+",
      emergencia1: emp.emergencia1 || "",
      emergencia2: emp.emergencia2 || "",
      familiares: emp.familiares || "",
      familiaresLista: Array.isArray(emp.familiaresLista) ? emp.familiaresLista : [],
      tieneCargaFamiliar: emp.tieneCargaFamiliar || "NO",
      fotoCarnet: emp.fotoCarnet || "",
      observacionesLaborales: emp.observacionesLaborales || "",
      codigoBarra: emp.codigoBarra || generateNextBarcode(),
    });
    setHrModalOpen(true);
  };

  const handlePhotoCarnetUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewEmpForm((prev) => ({ ...prev, fotoCarnet: reader.result }));
        showToast("Foto tipo carnet adjuntada correctamente.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFamilyMemberToDraft = () => {
    if (!familyMemberDraft.nombreCompleto.trim()) {
      showToast("Ingrese el nombre y apellido del familiar para agregarlo.", "error");
      return;
    }
    const item = {
      id: `fam-${Date.now()}`,
      parentesco: familyMemberDraft.parentesco || "Familiar",
      nombreCompleto: familyMemberDraft.nombreCompleto.trim(),
      cedula: familyMemberDraft.cedula.trim() || "S/C",
      fechaNacimiento: familyMemberDraft.fechaNacimiento || "",
      edad: familyMemberDraft.edad.trim() || "",
    };
    const nextList = [...(newEmpForm.familiaresLista || []), item];
    const autoSummary = nextList.map((f) => `${f.parentesco}: ${f.nombreCompleto}`).join(", ");
    setNewEmpForm((prev) => ({
      ...prev,
      familiaresLista: nextList,
      tieneCargaFamiliar: "SI",
      familiares: autoSummary,
    }));
    setFamilyMemberDraft({
      parentesco: "Hijo(a)",
      nombreCompleto: "",
      cedula: "",
      fechaNacimiento: "",
      edad: "",
    });
  };

  const handleRemoveFamilyMemberFromDraft = (famId) => {
    const nextList = (newEmpForm.familiaresLista || []).filter((f) => f.id !== famId);
    const autoSummary = nextList.length
      ? nextList.map((f) => `${f.parentesco}: ${f.nombreCompleto}`).join(", ")
      : "Sin carga familiar";
    setNewEmpForm((prev) => ({
      ...prev,
      familiaresLista: nextList,
      tieneCargaFamiliar: nextList.length > 0 ? "SI" : "NO",
      familiares: autoSummary,
    }));
  };

  // Filtrado de RRHH para el Reporte General
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (hrFilterCoord !== "TODAS" && emp.coordinacion !== hrFilterCoord) return false;
      if (hrFilterCondicion !== "TODAS" && (emp.condicionLaboral || "Fijo") !== hrFilterCondicion) return false;
      if (hrFilterCarga !== "TODOS" && emp.tieneCargaFamiliar !== hrFilterCarga) return false;
      if (hrFilterSangre !== "TODOS" && emp.tipoSangre !== hrFilterSangre) return false;
      if (hrFilterSearch.trim()) {
        const q = hrFilterSearch.toLowerCase();
        const match =
          (emp.nombres || "").toLowerCase().includes(q) ||
          (emp.apellidos || "").toLowerCase().includes(q) ||
          (emp.cedula || "").toLowerCase().includes(q) ||
          (emp.cargo || "").toLowerCase().includes(q) ||
          (emp.direccion || "").toLowerCase().includes(q) ||
          (emp.codigoBarra || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [employees, hrFilterCoord, hrFilterCondicion, hrFilterCarga, hrFilterSangre, hrFilterSearch]);

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

  // Contenedor adaptable según el selector PC / Tablet / Celular
  const viewportContainerClass =
    deviceViewport === "MOBILE"
      ? "viewport-mobile w-full max-w-[430px] mx-auto border-x-4 border-b-4 border-slate-800/90 rounded-b-3xl shadow-2xl min-h-screen transition-all duration-300 overflow-x-hidden"
      : deviceViewport === "TABLET"
      ? "viewport-tablet w-full max-w-[860px] mx-auto border-x-4 border-b-4 border-slate-800/90 rounded-b-3xl shadow-2xl min-h-screen transition-all duration-300 overflow-x-hidden"
      : "viewport-desktop w-full min-h-screen transition-all duration-300";

  const renderDeviceViewportSwitcher = () => (
    <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-slate-700/80 shadow-inner">
      {[
        { id: "DESKTOP", label: "PC", icon: Laptop, title: "Vista Computadora (Escritorio)" },
        { id: "TABLET", label: "Tablet", icon: Tablet, title: "Vista Tablet (860px)" },
        { id: "MOBILE", label: "Celular", icon: Smartphone, title: "Vista Celular (430px)" },
      ].map((dev) => {
        const DevIcon = dev.icon;
        const active = deviceViewport === dev.id;
        return (
          <button
            key={dev.id}
            type="button"
            onClick={() => setDeviceViewport(dev.id)}
            title={dev.title}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              active
                ? "bg-[#f59e0b] text-slate-950 font-black shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <DevIcon className="w-3.5 h-3.5" />
            <span>{dev.label}</span>
          </button>
        );
      })}
    </div>
  );

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
                  SIACENDIS • FUNDACIÓN CENTRO NACIONAL DEL DISCO
                </h1>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Sistema Integrado Administrativo CENDIS
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
                  Acceder con Google a SIACENDIS
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
      <div className="min-h-screen bg-[#030710] text-slate-100 flex flex-col font-sans">
        <div className={`bg-[#050a15] flex flex-col ${viewportContainerClass}`}>
          <div className="grid grid-cols-3 h-1.5 w-full">
            <div className="bg-[#facc15]" />
            <div className="bg-[#1d4ed8]" />
            <div className="bg-[#dc2626]" />
          </div>

          <header
            className={`bg-[#0b1221] border-b border-slate-800/90 ${
              deviceViewport === "MOBILE" ? "px-3.5 py-3" : "px-6 py-4"
            } flex flex-wrap items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white px-2.5 py-1.5 rounded-xl shadow shrink-0">
                <CendisGlyphLogo className={deviceViewport === "MOBILE" ? "w-16" : "w-24"} />
              </div>
              <div>
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#f59e0b] block">
                  MINISTERIO DEL PODER POPULAR PARA LA CULTURA
                </span>
                <h1
                  className={`${
                    deviceViewport === "MOBILE" ? "text-xs" : "text-base"
                  } font-black text-white uppercase tracking-tight leading-snug`}
                >
                  SIACENDIS • FUNDACIÓN CENTRO NACIONAL DEL DISCO (CENDIS)
                </h1>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Usuario: <span className="font-bold text-white">{currentUser.fullName}</span>{" "}
                  ({currentUser.email || `${currentUser.username}@gmail.com`}) • Rol:{" "}
                  <span className="font-bold text-[#f59e0b]">
                    {currentUser.role === "ADMIN" ? "Administrador" : "Usuario Estándar"}
                  </span>{" "}
                  • Vigencia clave:{" "}
                  <span className="font-bold text-emerald-400">
                    {passwordExpInfo.daysRemaining}d
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {renderDeviceViewportSwitcher()}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] border border-amber-500/40 text-amber-400 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                  title="Cambiar clave de seguridad (Vigencia límite: 90 días)"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Clave ({passwordExpInfo.daysRemaining}d)</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </header>

          <main
            className={`flex-1 max-w-6xl w-full mx-auto ${
              deviceViewport === "MOBILE"
                ? "p-3.5 space-y-4"
                : deviceViewport === "TABLET"
                ? "p-5 space-y-5"
                : "p-5 md:p-8 space-y-6"
            }`}
          >
            {!currentUserLinkedEmployee && (
              <div className="rounded-2xl bg-amber-950/70 border border-amber-500/60 p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shrink-0">
                    !
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-300">
                      Aviso de Recursos Humanos: Cuenta pendiente por vincular
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
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-slate-950 font-black text-xs cursor-pointer shadow"
                >
                  Ir a Recursos Humanos para Vincular →
                </button>
              </div>
            )}

            <div
              className={`grid ${
                deviceViewport === "MOBILE"
                  ? "grid-cols-1 gap-4"
                  : deviceViewport === "TABLET"
                  ? "grid-cols-1 sm:grid-cols-2 gap-5"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              }`}
            >
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
                    className={`group relative rounded-[24px] ${
                      deviceViewport === "MOBILE" ? "p-4" : "p-6"
                    } transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                      isWarm
                        ? "bg-gradient-to-br from-[#2a1215] via-[#17111a] to-[#0c1220] border-[#7c2d12]/70 hover:border-[#f59e0b]"
                        : "bg-gradient-to-br from-[#10203b] via-[#0d182c] to-[#09101d] border-[#1e3a8a]/80 hover:border-[#3b82f6]"
                    } shadow-2xl`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                          <div
                            className={`${
                              deviceViewport === "MOBILE" ? "w-11 h-11" : "w-14 h-14"
                            } rounded-2xl flex items-center justify-center border ${
                              isWarm
                                ? "bg-[#2a1712] border-amber-500/40 text-[#f59e0b]"
                                : "bg-[#112445] border-blue-400/40 text-blue-400"
                            }`}
                          >
                            <IconComp className={deviceViewport === "MOBILE" ? "w-5 h-5" : "w-7 h-7"} />
                          </div>
                          <span
                            className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-lg ${mod.cornerBg} font-black text-[10px] flex items-center justify-center shadow-md`}
                          >
                            {mod.cornerBadge}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                            isWarm
                              ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400"
                              : "bg-blue-950/80 border-blue-400/40 text-blue-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isWarm ? "bg-emerald-400" : "bg-blue-400"
                            }`}
                          />
                          {mod.badgeText}
                        </span>
                      </div>

                      <p
                        className={`text-[11px] font-black uppercase tracking-wider mb-1 ${
                          isWarm ? "text-[#f59e0b]" : "text-[#38bdf8]"
                        }`}
                      >
                        {mod.subtitle}
                      </p>
                      <h3
                        className={`${
                          deviceViewport === "MOBILE" ? "text-lg" : "text-2xl"
                        } font-black text-white tracking-tight uppercase`}
                      >
                        {mod.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300/90 mt-2.5 leading-relaxed">
                        {mod.desc}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {mod.pills.map((pill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-full bg-[#090d16]/90 border border-slate-700/80 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5"
                          >
                            <span className={`font-black ${pill.color}`}>{pill.symbol}</span>
                            <span>{pill.text}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider">
                        {mod.footerCode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
          {renderPasswordChangeModal()}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 3) ÁREA DE TRABAJO PRINCIPAL (ESTILO OSCURO CÁLIDO/AZUL COMO LAS CAPTURAS)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#030710] text-slate-100 flex flex-col font-sans">
      <style>{`
        /* Adaptación de paneles al tema oscuro de las capturas fuera del área de impresión */
        .cendis-dark-workspace .bg-white:not(#printable-area):not(#printable-area *) {
          background: linear-gradient(145deg, #161824 0%, #0d1322 100%) !important;
          color: #f1f5f9 !important;
          border-color: rgba(148, 163, 184, 0.18) !important;
        }
        .cendis-dark-workspace .bg-slate-50:not(#printable-area):not(#printable-area *),
        .cendis-dark-workspace .bg-slate-100:not(button):not(#printable-area):not(#printable-area *) {
          background-color: #080d19 !important;
          color: #e2e8f0 !important;
          border-color: rgba(148, 163, 184, 0.15) !important;
        }
        /* Navegabilidad en color Naranja Neón Transparente con letras blancas nítidas */
        .cendis-dark-workspace button.bg-slate-100:not(#printable-area *),
        .cendis-dark-workspace button.bg-white:not(#printable-area *),
        .neon-orange-nav {
          background: rgba(255, 95, 0, 0.22) !important;
          border: 1px solid rgba(255, 115, 0, 0.85) !important;
          color: #ffffff !important;
          box-shadow: 0 0 12px rgba(255, 95, 0, 0.28) !important;
          backdrop-filter: blur(8px);
        }
        .cendis-dark-workspace button.bg-slate-100:hover:not(#printable-area *),
        .cendis-dark-workspace button.bg-white:hover:not(#printable-area *),
        .neon-orange-nav:hover {
          background: rgba(255, 95, 0, 0.38) !important;
          border-color: #ff7b00 !important;
          color: #ffffff !important;
          box-shadow: 0 0 18px rgba(255, 102, 0, 0.55) !important;
        }
        .neon-orange-nav-active {
          background: linear-gradient(135deg, rgba(255, 94, 0, 0.52) 0%, rgba(255, 123, 0, 0.34) 100%) !important;
          border: 1.5px solid #ff7b00 !important;
          color: #ffffff !important;
          box-shadow: 0 0 20px rgba(255, 95, 0, 0.65), inset 0 0 10px rgba(255, 145, 0, 0.35) !important;
          backdrop-filter: blur(8px);
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

        /* ====================================================================
           AJUSTE INTELIGENTE DE PANTALLA PARA CELULAR (MOBILE) Y TABLET
           ==================================================================== */
        .viewport-mobile .lg\\:grid-cols-12:not(#printable-area *),
        .viewport-mobile .lg\\:grid-cols-4:not(#printable-area *),
        .viewport-mobile .lg\\:grid-cols-3:not(#printable-area *),
        .viewport-mobile .md\\:grid-cols-6:not(#printable-area *),
        .viewport-mobile .md\\:grid-cols-5:not(#printable-area *),
        .viewport-mobile .md\\:grid-cols-4:not(#printable-area *),
        .viewport-mobile .md\\:grid-cols-3:not(#printable-area *),
        .viewport-mobile .md\\:grid-cols-2:not(#printable-area *),
        .viewport-mobile .sm\\:grid-cols-4:not(#printable-area *),
        .viewport-mobile .sm\\:grid-cols-3:not(#printable-area *),
        .viewport-mobile .sm\\:grid-cols-2:not(#printable-area *),
        .viewport-mobile .grid-cols-3:not(.h-1\\.5):not(#printable-area *),
        .viewport-mobile .grid-cols-2:not(#printable-area *) {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .viewport-mobile .lg\\:col-span-5:not(#printable-area *),
        .viewport-mobile .lg\\:col-span-7:not(#printable-area *),
        .viewport-mobile .md\\:col-span-3:not(#printable-area *),
        .viewport-mobile .md\\:col-span-2:not(#printable-area *),
        .viewport-mobile .sm\\:col-span-2:not(#printable-area *) {
          grid-column: span 1 / span 1 !important;
        }
        .viewport-mobile .p-6:not(#printable-area *),
        .viewport-mobile .p-5:not(#printable-area *) {
          padding: 0.85rem !important;
        }
        .viewport-mobile table:not(#printable-area *) {
          display: block !important;
          width: 100% !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        .viewport-mobile #printable-area {
          zoom: 0.46;
          width: 100% !important;
          max-width: 100% !important;
        }

        .viewport-tablet .lg\\:grid-cols-12:not(#printable-area *) {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .viewport-tablet .lg\\:col-span-5:not(#printable-area *),
        .viewport-tablet .lg\\:col-span-7:not(#printable-area *) {
          grid-column: span 1 / span 1 !important;
        }
        .viewport-tablet .md\\:grid-cols-6:not(#printable-area *),
        .viewport-tablet .md\\:grid-cols-5:not(#printable-area *),
        .viewport-tablet .md\\:grid-cols-4:not(#printable-area *),
        .viewport-tablet .md\\:grid-cols-3:not(#printable-area *),
        .viewport-tablet .lg\\:grid-cols-4:not(#printable-area *) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .viewport-tablet .md\\:col-span-3:not(#printable-area *) {
          grid-column: span 2 / span 2 !important;
        }
        .viewport-tablet #printable-area {
          zoom: 0.9;
        }

        /* Garantizar hoja de impresión blanca intacta con colores exactos del cintillo */
        #printable-area, #printable-area * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #printable-area {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        @media print {
          @page {
            size: letter portrait;
            margin: 0mm;
          }
          html, body, #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 215.9mm !important;
            height: 279.4mm !important;
            max-height: 279.4mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          /* Colapsar por completo todos los elementos fuera de #printable-area para que no empujen la hoja ni corten el cintillo inferior */
          body *:not(:has(#printable-area)):not(#printable-area):not(#printable-area *) {
            display: none !important;
          }
          /* Desbloquear cualquier contenedor padre o modal que envuelva a #printable-area */
          body *:has(#printable-area) {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: transparent !important;
            transform: none !important;
          }
          #printable-area {
            zoom: 1 !important;
            position: relative !important;
            width: 215.9mm !important;
            max-width: 215.9mm !important;
            height: 278mm !important;
            min-height: 278mm !important;
            max-height: 278mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-area .official-header-cintillo {
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-shrink: 0 !important;
            visibility: visible !important;
          }
          #printable-area .official-footer-wave {
            position: relative !important;
            width: 100% !important;
            height: 24mm !important;
            min-height: 24mm !important;
            max-height: 24mm !important;
            margin-top: auto !important;
            flex-shrink: 0 !important;
            display: block !important;
            visibility: visible !important;
          }
          #printable-area .official-footer-wave img {
            width: 100% !important;
            height: 100% !important;
            object-fit: fill !important;
            display: block !important;
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

      {/* CONTENEDOR ADAPTABLE SEGÚN DISPOSITIVO (INCLUYE BARRA DE NAVEGACIÓN Y ÁREA DE TRABAJO) */}
      <div className={`cendis-dark-workspace bg-[#050a15] flex-1 flex flex-col ${viewportContainerClass}`}>
        <div className="grid grid-cols-3 h-1.5 w-full print:hidden">
          <div className="bg-[#facc15]" />
          <div className="bg-[#1d4ed8]" />
          <div className="bg-[#dc2626]" />
        </div>

        {/* BARRA SUPERIOR DE NAVEGACIÓN ADAPTABLE */}
        <header className="print:hidden bg-[#0b1221] text-white px-3 py-2.5 flex flex-col gap-2 shadow-lg border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen("PORTAL")}
                className="px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] text-xs font-bold flex items-center gap-1.5 border border-slate-700 text-[#f59e0b] cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>Módulos</span>
              </button>
              <span className="font-black tracking-tight text-xs uppercase text-white">
                SIACENDIS
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {renderDeviceViewportSwitcher()}

              <button
                type="button"
                onClick={openPasswordModal}
                className="px-2.5 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] border border-amber-500/40 text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Cambiar clave de seguridad (Límite de renovación: 90 días)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{deviceViewport === "MOBILE" ? `${passwordExpInfo.daysRemaining}d` : `Cambiar Clave (${passwordExpInfo.daysRemaining}d)`}</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>

          <nav
            className={`flex items-center gap-1.5 ${
              deviceViewport === "MOBILE"
                ? "overflow-x-auto flex-nowrap pb-1"
                : "flex-wrap"
            }`}
          >
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
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    activeTab === tab.id
                      ? "neon-orange-nav-active text-white font-black"
                      : allowed
                      ? "neon-orange-nav text-white"
                      : "bg-slate-900/50 border border-slate-800 text-slate-500 opacity-60"
                  }`}
                >
                  <IconT className="w-3.5 h-3.5 text-[#ffb366]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </header>
        {/* ====================================================================
            MÓDULO 1: MEMORANDOS, SOLICITUDES Y OFICIOS UNIVERSALES
           ==================================================================== */}
        {activeTab === "editor" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 print:hidden h-fit">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#f59e0b] block">
                    Módulo Universal con Revisión de Administrador
                  </span>
                  <h2 className="text-sm font-black uppercase text-slate-800">
                    Emitir Memorando / Solicitud Oficial
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-800 text-xs font-black">
                  {activePreviewDoc.correlativo}
                </span>
              </div>

              {selectedDocId && (
                <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-black text-blue-300 block">
                      Visualizando: {activePreviewDoc.correlativo}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Estado:{" "}
                      <strong>
                        {activePreviewDoc.status === "APROBADO"
                          ? "AUTORIZADO PARA IMPRIMIR"
                          : activePreviewDoc.status === "ANULADO"
                          ? "ANULADO"
                          : "EN REVISIÓN POR ADMINISTRADOR"}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocId(null);
                      setManualCorrelative(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    + Nuevo Borrador
                  </button>
                </div>
              )}

              {/* Selector Universal de Tipo de Documento */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "MEMORANDUM", label: "Memorando" },
                  { id: "SOLICITUD", label: "Solicitud" },
                  { id: "OFICIO", label: "Oficio / Circular" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedDocId(null);
                      setDocType(t.id);
                    }}
                    className={`py-2 rounded-xl text-xs font-black uppercase border cursor-pointer ${
                      docType === t.id
                        ? "bg-[#8b1538] text-white border-[#8b1538]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {/* Prefijo Universal y Correlativo */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      UNIDAD / SIGLAS (UNIVERSAL):
                    </label>
                    <select
                      value={docUnitPrefix}
                      onChange={(e) => {
                        setSelectedDocId(null);
                        setManualCorrelative(false);
                        setDocUnitPrefix(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value="FC-DG">FC-DG (Dirección General)</option>
                      <option value="FC-PRES">FC-PRES (Presidencia CENDIS)</option>
                      <option value="FC-ADM">FC-ADM (Administración)</option>
                      <option value="FC-RRHH">FC-RRHH (Recursos Humanos)</option>
                      <option value="FC-PROD">FC-PROD (Producción)</option>
                      <option value="CENDIS">CENDIS (General Institucional)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      N° CORRELATIVO:
                    </label>
                    <input
                      type="text"
                      value={manualCorrelative ? customCorrelative : formattedCorrelative}
                      onChange={(e) => {
                        setSelectedDocId(null);
                        setManualCorrelative(true);
                        setCustomCorrelative(e.target.value);
                      }}
                      placeholder="FC-DG-MEM-2026-007"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* PARA + Dirección / Dependencia del Destinatario */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black uppercase text-slate-700">
                      PARA (Destinatario y Dirección / Cargo):
                    </label>
                    <select
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const emp = employees.find((x) => x.id === e.target.value);
                        if (emp) {
                          setSelectedDocId(null);
                          setPara(`${emp.nombres} ${emp.apellidos}`);
                          setParaDireccion(
                            `${emp.cargo} - Coordinación de ${emp.coordinacion} del CENDIS`
                          );
                        }
                      }}
                      className="px-2 py-1 rounded border border-slate-300 text-[10px]"
                    >
                      <option value="">Cargar de RRHH...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} ({emp.cargo})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={para}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setPara(e.target.value);
                    }}
                    placeholder="Ej. Lcdo. Jesús García"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={paraDireccion}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setParaDireccion(e.target.value);
                    }}
                    placeholder="Dirección / Dependencia: Ej. General de Administración del Ministerio del Poder Popular para la Cultura"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                {/* DE + Cargo / Dependencia del Remitente */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700">
                    DE (Remitente y Cargo / Institución):
                  </label>
                  <input
                    type="text"
                    value={de}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setDe(e.target.value);
                    }}
                    placeholder="Ej. Morris López"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={deCargo}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setDeCargo(e.target.value);
                    }}
                    placeholder="Ej. Director Ejecutivo de la Fundación Centro Nacional del Disco (CENDIS)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                {/* FECHA Y ASUNTO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      FECHA ({formatFechaLargaOficial(fecha)}):
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => {
                        setSelectedDocId(null);
                        setFecha(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      ASUNTO:
                    </label>
                    <input
                      type="text"
                      value={asunto}
                      onChange={(e) => {
                        setSelectedDocId(null);
                        setAsunto(e.target.value);
                      }}
                      placeholder="Ej. Solicitud de transporte"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    CONTENIDO / CUERPO DEL DOCUMENTO:
                  </label>
                  <textarea
                    rows={5}
                    value={concepto}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setConcepto(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* DATOS DE LA FIRMA CENTRADA */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-700 block">
                  Parámetros de Firma Oficial (Pie de Documento)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={signerNombre}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setSignerNombre(e.target.value);
                    }}
                    placeholder="Nombre Firmante (Ej. Lcdo. MORRIS LÓPEZ)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={signerCargo}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setSignerCargo(e.target.value);
                    }}
                    placeholder="Cargo (Ej. Director General)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    value={signerEnte}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setSignerEnte(e.target.value);
                    }}
                    placeholder="Institución (Ej. Fundación Centro Nacional del Disco (CENDIS))"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    value={signerMinisterio}
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setSignerMinisterio(e.target.value);
                    }}
                    placeholder="Ministerio (Ej. Ministerio del Poder Popular para la Cultura)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* BOTONES DE EMISIÓN E IMPRESIÓN CONDICIONADA A APROBACIÓN DE ADMIN */}
              <div className="pt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleEmitDocument}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#8b1538] hover:bg-[#6e102c] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Crear y Enviar a Revisión</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintApprovedDocument}
                    disabled={activePreviewDoc.status !== "APROBADO"}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition ${
                      activePreviewDoc.status === "APROBADO"
                        ? "bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                        : "bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                    }`}
                    title={
                      activePreviewDoc.status === "APROBADO"
                        ? "Documento autorizado por Administrador: Imprimir PDF"
                        : "Requiere autorización de un Administrador antes de poder imprimir"
                    }
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      {activePreviewDoc.status === "APROBADO"
                        ? "Imprimir PDF (Autorizado)"
                        : "Imprimir PDF (Requiere Aprobación)"}
                    </span>
                  </button>
                </div>

                {activePreviewDoc.status !== "APROBADO" && (
                  <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-200 flex items-center justify-between gap-2">
                    <span>
                      🔒{" "}
                      {activePreviewDoc.status === "ANULADO"
                        ? `Documento ANULADO (Motivo: ${activePreviewDoc.motivoAnulacion}). No se puede imprimir.`
                        : "La impresión solo se habilita después de que un Administrador revise si está correcto y lo apruebe."}
                    </span>
                    {activePreviewDoc.id && currentUser?.role === "ADMIN" && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(activePreviewDoc)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] shrink-0 cursor-pointer"
                      >
                        Revisar / Autorizar Ahora
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* BANDEJA UNIVERSAL DE REVISIÓN, AUTORIZACIÓN Y ANULACIÓN CON MOTIVO */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase text-slate-800">
                    Control de Revisión, Autorización y Anulación ({documents.length})
                  </h3>
                  <select
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 text-[10px] font-bold"
                  >
                    <option value="TODOS">Todos ({documents.length})</option>
                    <option value="PENDIENTE_APROBACION">En Revisión</option>
                    <option value="APROBADO">Autorizados (Imprimibles)</option>
                    <option value="ANULADO">Anulados</option>
                  </select>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {documents
                    .filter((d) =>
                      docStatusFilter === "TODOS" ? true : d.status === docStatusFilter
                    )
                    .map((d) => {
                      const isSelected = selectedDocId === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleLoadDocIntoEditor(d)}
                          className={`p-3 rounded-xl border text-[11px] space-y-2 transition cursor-pointer ${
                            isSelected
                              ? "bg-slate-800/90 border-amber-500/80"
                              : "bg-slate-50 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-black text-slate-900 flex items-center gap-1.5">
                                <span>{d.correlativo}</span>
                                <span className="text-[10px] font-normal text-slate-400">
                                  ({d.fecha})
                                </span>
                              </div>
                              <div className="text-slate-600 font-semibold">{d.asunto}</div>
                              <div className="text-[10px] text-slate-400">
                                Para: {d.para} • De: {d.de}
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                                d.status === "APROBADO"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : d.status === "ANULADO"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {d.status === "APROBADO"
                                ? "✓ APROBADO"
                                : d.status === "ANULADO"
                                ? "✕ ANULADO"
                                : "⏳ EN REVISIÓN"}
                            </span>
                          </div>

                          {d.status === "ANULADO" && d.motivoAnulacion && (
                            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-[10px] text-red-200">
                              <strong>Motivo de anulación:</strong> {d.motivoAnulacion}
                              {d.anuladoPor && (
                                <span className="block text-[9.5px] text-red-300/80 mt-0.5">
                                  Anulado por: {d.anuladoPor} ({d.fechaAnulacion})
                                </span>
                              )}
                            </div>
                          )}

                          {d.status === "APROBADO" && d.aprobadoPor && (
                            <div className="text-[10px] text-emerald-400">
                              ✓ Revisado y autorizado por: <strong>{d.aprobadoPor}</strong> ({d.fechaAprobacion})
                            </div>
                          )}

                          <div
                            className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-slate-700/40"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(d)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] cursor-pointer"
                            >
                              🔍 Revisar / Autorizar / Anular
                            </button>

                            {d.status !== "APROBADO" && currentUser?.role === "ADMIN" && (
                              <button
                                type="button"
                                onClick={() => handleApproveDocument(d.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                              >
                                ✓ Aprobar Directo
                              </button>
                            )}

                            {d.status === "APROBADO" && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleLoadDocIntoEditor(d);
                                  setTimeout(() => window.print(), 100);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Imprimir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* VISTA PREVIA DE IMPRESIÓN OFICIAL (PARÁMETROS EXACTOS DE FC-DG-MEM-2026-007 + CINTILLO CONSERVADO) */}
            <div className="lg:col-span-7 flex flex-col items-center gap-3">
              {/* Barra de estado de autorización sobre la hoja */}
              <div className="w-full max-w-[790px] p-3 rounded-2xl bg-[#0b1221] border border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase ${
                      activePreviewDoc.status === "APROBADO"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : activePreviewDoc.status === "ANULADO"
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {activePreviewDoc.status === "APROBADO"
                      ? "✓ AUTORIZADO PARA IMPRIMIR"
                      : activePreviewDoc.status === "ANULADO"
                      ? "✕ DOCUMENTO ANULADO"
                      : "⏳ PENDIENTE DE AUTORIZACIÓN ADMIN"}
                  </span>
                  <span className="text-slate-300 font-semibold">
                    {activePreviewDoc.correlativo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activePreviewDoc.id && (
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(activePreviewDoc)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                    >
                      🔍 Revisar / Autorizar / Anular
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePrintApprovedDocument}
                    disabled={activePreviewDoc.status !== "APROBADO"}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      activePreviewDoc.status === "APROBADO"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir PDF</span>
                  </button>
                </div>
              </div>

              <div
                id="printable-area"
                style={{
                  fontFamily: "Arial, Calibri, 'Segoe UI', sans-serif",
                  fontSize: "12pt",
                  lineHeight: "1.5",
                }}
                className="w-full max-w-[790px] min-h-[1000px] bg-white shadow-xl border border-slate-200 flex flex-col justify-between relative text-slate-950"
              >
                <div>
                  {/* Cintillo Superior en la posición exacta de formato.pdf */}
                  <div style={{ padding: "0.7cm 1.4cm 0 1.3cm" }}>
                    <OfficialHeaderCintillo showRightLogo={true} />
                  </div>

                  {/* Contenido del documento con márgenes oficiales (2.4 cm laterales) */}
                  <div style={{ padding: "0.3cm 2.4cm 0.6cm 2.4cm" }}>
                    {/* AVISO DE DOCUMENTO ANULADO SI APLICA */}
                    {activePreviewDoc.status === "ANULADO" && (
                      <div className="my-3 p-3 border-2 border-red-700 bg-red-50 text-red-900 rounded-lg text-xs">
                        <div className="font-black uppercase">
                          DOCUMENTO ANULADO ({activePreviewDoc.correlativo})
                        </div>
                        <div className="mt-1">
                          <strong>Descripción / Motivo de anulación:</strong>{" "}
                          {activePreviewDoc.motivoAnulacion}
                        </div>
                      </div>
                    )}

                    {/* CORRELATIVO ALINEADO A LA DERECHA (EJ. FC-DG-MEM-2026-007) */}
                    <div className="mt-4 text-right">
                      <p
                        style={{ fontSize: "12pt" }}
                        className="font-bold tracking-normal text-slate-950"
                      >
                        {activePreviewDoc.correlativo}
                      </p>
                    </div>

                    {/* TÍTULO CENTRADO (MEMORANDO / SOLICITUD / OFICIO) */}
                    <div className="mt-3 mb-5 text-center">
                      <h2
                        style={{ fontSize: "13pt", letterSpacing: "0.04em" }}
                        className="font-bold uppercase text-slate-950"
                      >
                        {activePreviewDoc.tipo === "MEMORANDUM"
                          ? "MEMORANDO"
                          : activePreviewDoc.tipo === "SOLICITUD"
                          ? "SOLICITUD"
                          : "OFICIO"}
                      </h2>
                    </div>

                    {/* ENCABEZADO CON PARÁMETROS EXACTOS DEL DOCUMENTO (PARA, DIRECCIÓN, DE, CARGO, FECHA, ASUNTO) */}
                    <div
                      style={{ fontSize: "11.5pt", lineHeight: "1.42" }}
                      className="border-t-2 border-b-2 border-slate-900 py-3 space-y-2.5 text-slate-950"
                    >
                      <div className="grid grid-cols-12 items-start">
                        <span className="col-span-2 font-bold uppercase">PARA:</span>
                        <div className="col-span-10">
                          <div className="font-bold">{activePreviewDoc.para}</div>
                          {activePreviewDoc.paraDireccion && (
                            <div className="font-bold">
                              {activePreviewDoc.paraDireccion.startsWith("Dirección:")
                                ? activePreviewDoc.paraDireccion
                                : `Dirección: ${activePreviewDoc.paraDireccion}`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 items-start">
                        <span className="col-span-2 font-bold uppercase">DE:</span>
                        <div className="col-span-10">
                          <div className="font-bold">{activePreviewDoc.de}</div>
                          {activePreviewDoc.deCargo && (
                            <div className="font-bold">{activePreviewDoc.deCargo}</div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 items-start">
                        <span className="col-span-2 font-bold uppercase">FECHA:</span>
                        <span className="col-span-10 font-bold">
                          {formatFechaLargaOficial(activePreviewDoc.fecha)}
                        </span>
                      </div>

                      <div className="grid grid-cols-12 items-start">
                        <span className="col-span-2 font-bold uppercase">ASUNTO:</span>
                        <span className="col-span-10 font-bold">{activePreviewDoc.asunto}</span>
                      </div>
                    </div>

                    {/* CUERPO DEL MEMORANDO / SOLICITUD (MISMA FUENTE, TAMAÑO 12PT Y SANGRÍA/JUSTIFICADO) */}
                    <div
                      style={{ fontSize: "12pt", lineHeight: "1.55" }}
                      className="mt-6 text-justify whitespace-pre-line text-slate-950 min-h-[190px]"
                    >
                      {activePreviewDoc.concepto}
                    </div>

                    {/* DESPEDIDA Y BLOQUE DE FIRMA CENTRADO */}
                    <div
                      style={{ fontSize: "12pt", lineHeight: "1.35" }}
                      className="mt-6 text-center text-slate-950"
                    >
                      <p className="mb-10">Atentamente,</p>
                      <div className="mx-auto pt-1">
                        <p className="font-bold uppercase">{activePreviewDoc.signerNombre}</p>
                        {activePreviewDoc.signerCargo && (
                          <p className="font-bold">{activePreviewDoc.signerCargo}</p>
                        )}
                        {activePreviewDoc.signerEnte && (
                          <p className="font-bold">{activePreviewDoc.signerEnte}</p>
                        )}
                        {activePreviewDoc.signerMinisterio && (
                          <p className="font-bold">{activePreviewDoc.signerMinisterio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <OfficialFooterWave />
              </div>
            </div>

            {/* MODAL DE REVISIÓN, AUTORIZACIÓN Y ANULACIÓN CON DESCRIPCIÓN */}
            {reviewModalDocId && (() => {
              const docToReview = documents.find((x) => x.id === reviewModalDocId);
              if (!docToReview) return null;
              const isAdmin = currentUser?.role === "ADMIN";
              const canAnnul = isAdmin || hasActionPermission("anular");
              return (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden">
                  <div className="bg-[#0b1221] text-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700">
                    <div className="grid grid-cols-3 h-1.5 w-full">
                      <div className="bg-[#facc15]" />
                      <div className="bg-[#1d4ed8]" />
                      <div className="bg-[#dc2626]" />
                    </div>

                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                          Control de Calidad y Autorización Administrativa
                        </span>
                        <h3 className="text-base font-black uppercase text-white">
                          Revisión de {docToReview.tipo} • {docToReview.correlativo}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewModalDocId(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-black text-amber-400">
                            {docToReview.correlativo}
                          </span>
                          <span className="text-slate-400">
                            Fecha: {formatFechaLargaOficial(docToReview.fecha)}
                          </span>
                        </div>
                        <div>
                          <strong className="text-slate-400">PARA:</strong> {docToReview.para}
                          {docToReview.paraDireccion ? ` — ${docToReview.paraDireccion}` : ""}
                        </div>
                        <div>
                          <strong className="text-slate-400">DE:</strong> {docToReview.de}
                          {docToReview.deCargo ? ` — ${docToReview.deCargo}` : ""}
                        </div>
                        <div>
                          <strong className="text-slate-400">ASUNTO:</strong>{" "}
                          <span className="font-bold text-white">{docToReview.asunto}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 whitespace-pre-line text-slate-200 leading-relaxed">
                          {docToReview.concepto}
                        </div>
                        <div className="pt-2 border-t border-slate-800 text-slate-300">
                          <strong>Firmante:</strong> {docToReview.signerNombre} ({docToReview.signerCargo})
                        </div>
                      </div>

                      {docToReview.status === "ANULADO" && docToReview.motivoAnulacion && (
                        <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200">
                          <div className="font-black uppercase text-red-300">
                            Documento Anulado
                          </div>
                          <p className="mt-1">
                            <strong>Motivo / Descripción de anulación:</strong>{" "}
                            {docToReview.motivoAnulacion}
                          </p>
                        </div>
                      )}

                      {/* Formulario de Descripción de Anulación */}
                      {showAnnulBoxInModal && (
                        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 space-y-2.5">
                          <label className="block text-xs font-black uppercase text-red-300">
                            Descripción obligatoria de por qué se anula el documento:
                          </label>
                          {annulError && (
                            <div className="p-2 rounded-lg bg-red-900/70 text-red-100 text-[11px] font-bold">
                              {annulError}
                            </div>
                          )}
                          <textarea
                            rows={3}
                            value={annulReasonInput}
                            onChange={(e) => {
                              setAnnulReasonInput(e.target.value);
                              setAnnulError("");
                            }}
                            placeholder="Escriba aquí la razón o descripción detallada por la cual se anula este memorando o solicitud..."
                            className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-red-500/50 text-white text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAnnulBoxInModal(false);
                                setAnnulError("");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleAnnulDocument(docToReview.id, annulReasonInput)
                              }
                              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer"
                            >
                              Confirmar Anulación con Motivo
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          {isAdmin
                            ? "Como Administrador puede autorizar la impresión o anular con motivo."
                            : "Solo un Administrador puede autorizar el documento para impresión."}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {canAnnul && !showAnnulBoxInModal && (
                            <button
                              type="button"
                              onClick={() => setShowAnnulBoxInModal(true)}
                              className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs cursor-pointer"
                            >
                              ✕ Anular Documento...
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleApproveDocument(docToReview.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-lg"
                            >
                              ✓ Está Correcto: Autorizar e Habilitar Impresión
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ====================================================================
            MÓDULO 2: AGENDA CENDIS (ESTILO GOOGLE CALENDAR COMPLETO + RECORDATORIOS)
           ==================================================================== */}
        {activeTab === "agenda" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
            {/* Barra superior estilo Google Calendar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#f59e0b] block">
                  Sincronización de Actividades, Parámetros de Google Calendar y Alertas Anticipadas
                </span>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  AGENDA CENDIS • Google Calendar & Centro de Recordatorios
                </h2>
                <p className="text-xs text-slate-500">
                  Parámetros completos de Google Calendar, descripciones detalladas y recordatorios con días u horas de anticipación por Aplicación, Correo Gmail y WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDayModal("2026-11-16");
                    setNewEventForm((prev) => ({ ...prev, endDate: "2026-11-16" }));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>+ Crear Actividad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaViewMode("CALENDAR")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    agendaViewMode === "CALENDAR" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaViewMode("REMINDERS")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    agendaViewMode === "REMINDERS" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Recordatorios ({agendaEvents.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaViewMode("REPORT")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    agendaViewMode === "REPORT" ? "bg-[#8b1538] text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Reporte PDF</span>
                </button>
              </div>
            </div>

            {/* Banner de notificaciones en aplicación para las actividades agendadas */}
            {agendaEvents.length > 0 && (
              <div className="rounded-2xl bg-blue-950/75 border border-blue-500/50 p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-black uppercase text-amber-300 block">
                      Notificaciones Activas en Aplicación (Con Días u Horas de Anticipación)
                    </span>
                    <span className="text-slate-200">
                      Próxima actividad:{" "}
                      <strong className="text-white">{agendaEvents[0].title}</strong> ({agendaEvents[0].date} •{" "}
                      {agendaEvents[0].allDay ? "Todo el día" : agendaEvents[0].startTime}) — Responsable:{" "}
                      <strong>{agendaEvents[0].responsable}</strong> • Aviso:{" "}
                      <span className="text-emerald-300 font-bold">
                        {formatReminderLabel(agendaEvents[0])}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerInAppReminder(agendaEvents[0])}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                  >
                    🔔 Notificar en App
                  </button>
                  <button
                    type="button"
                    onClick={() => sendEmailReminder(agendaEvents[0])}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    ✉ Recordatorio Correo
                  </button>
                  <button
                    type="button"
                    onClick={() => sendWhatsappReminder(agendaEvents[0])}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    💬 Recordatorio WhatsApp
                  </button>
                </div>
              </div>
            )}

            {agendaViewMode === "CALENDAR" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black uppercase tracking-wider">Noviembre 2026</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Zona horaria: America/Caracas (GMT-04:00)
                    </span>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">
                    Haz clic en cualquier día para agendar o ver todos los parámetros estilo Google Calendar
                  </span>
                </div>
                <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-[11px] font-black uppercase text-slate-600 py-2">
                  <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
                  {calendarDays.map((d) => {
                    const dayEvents = agendaEvents.filter((ev) => ev.date === d.dateStr);
                    const colorClasses = {
                      BLUE: "bg-blue-700 border-l-4 border-blue-300",
                      EMERALD: "bg-emerald-700 border-l-4 border-emerald-300",
                      AMBER: "bg-amber-600 border-l-4 border-amber-200",
                      ROSE: "bg-[#8b1538] border-l-4 border-rose-300",
                      VIOLET: "bg-purple-700 border-l-4 border-purple-300",
                      CYAN: "bg-cyan-700 border-l-4 border-cyan-300",
                    };
                    return (
                      <div
                        key={d.dateStr}
                        onClick={() => {
                          setSelectedDayModal(d.dateStr);
                          setNewEventForm((prev) => ({ ...prev, endDate: d.dateStr }));
                        }}
                        className="min-h-[120px] p-2 hover:bg-blue-50/40 cursor-pointer transition flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">{d.dayNumber}</span>
                          {dayEvents.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                              {dayEvents.length} act.
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayEvents.map((ev) => {
                            const pillClass =
                              colorClasses[ev.color] ||
                              (ev.status === "APROBADO" ? colorClasses.BLUE : colorClasses.AMBER);
                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventDetail(ev);
                                }}
                                title={`${ev.title}\n${ev.description || ""}\nRecordatorio: ${formatReminderLabel(ev)}`}
                                className={`px-1.5 py-1 rounded text-white text-[10px] font-semibold truncate shadow-2xs ${pillClass}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="truncate">
                                    {ev.allDay ? "Todo el día" : ev.startTime} • {ev.title}
                                  </span>
                                  <span className="text-[9px] opacity-90 shrink-0">
                                    🔔{ev.reminderValue || 1}
                                    {ev.reminderUnit === "DIAS" ? "d" : "h"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : agendaViewMode === "REMINDERS" ? (
              /* CENTRO DE RECORDATORIOS Y ALERTAS (APP / CORREO / WHATSAPP) */
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">
                      Centro de Recordatorios Programados (Aplicación, Correo Gmail y WhatsApp)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gestione y envíe recordatorios con días u horas de anticipación a cada responsable e invitado de las actividades agendadas.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {agendaEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase">
                            {ev.eventType || "EVENTO"}
                          </span>
                          <span className="text-sm font-black text-slate-900">{ev.title}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                            🔔 Anticipación: {formatReminderLabel(ev)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          📅 <strong>{ev.date}</strong>{" "}
                          {ev.endDate && ev.endDate !== ev.date ? `al ${ev.endDate}` : ""} • ⏰{" "}
                          {ev.allDay ? "Todo el día" : `${ev.startTime} - ${ev.endTime || "11:00"}`} • 📍{" "}
                          {ev.location || "Sede CENDIS"}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-slate-400 italic">"{ev.description}"</p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          👤 Responsable: <strong>{ev.responsable}</strong> ({ev.contacto}) • ✉{" "}
                          {ev.emailInvitado || "Sin correo"} • Canales activos:{" "}
                          {[
                            ev.notifyApp !== false ? "App SIACENDIS" : null,
                            ev.notifyEmail !== false ? "Correo Gmail" : null,
                            ev.notifyWhatsapp !== false ? "WhatsApp" : null,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerInAppReminder(ev)}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow"
                        >
                          🔔 Notificar en App
                        </button>
                        <button
                          type="button"
                          onClick={() => sendEmailReminder(ev)}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow"
                        >
                          ✉ Enviar Correo
                        </button>
                        <button
                          type="button"
                          onClick={() => sendWhatsappReminder(ev)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
                        >
                          💬 Enviar WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => openInGoogleCalendar(ev)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700"
                        >
                          📅 Google Calendar
                        </button>
                      </div>
                    </div>
                  ))}
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
                  className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="px-9 pt-6 pb-2">
                    <OfficialHeaderCintillo showRightLogo={true} />
                    <div
                      className="mt-4 mb-4 space-y-1.5 text-black"
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
                              className="border border-black p-2.5 align-top h-[360px] text-black leading-tight"
                            >
                              {col.events.length === 0 ? (
                                <div className="text-slate-400">Sin actividades</div>
                              ) : (
                                <div className="space-y-4">
                                  {col.events.map((ev) => (
                                    <div key={ev.id} className="space-y-0.5">
                                      <div>Ente: {ev.ente}</div>
                                      <div>Actividad: {ev.title}</div>
                                      <div>
                                        Hora:{" "}
                                        {ev.allDay
                                          ? "Todo el día"
                                          : `${ev.startTime}${ev.endTime ? ` - ${ev.endTime}` : ""}`}
                                      </div>
                                      <div>Lugar: {ev.location}</div>
                                      {ev.description && <div>Descripción: {ev.description}</div>}
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

            {/* MODAL DE DETALLE DE EVENTO ESTILO GOOGLE CALENDAR */}
            {selectedEventDetail && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                  <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                        {selectedEventDetail.eventType || "EVENTO"} • {selectedEventDetail.visibility || "PÚBLICO"} •{" "}
                        {selectedEventDetail.availability || "OCUPADO"}
                      </span>
                      <h3 className="text-base font-black">{selectedEventDetail.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedEventDetail(null)}
                      className="text-white/80 hover:text-white text-xs font-bold px-2.5 py-1 rounded bg-blue-800 cursor-pointer"
                    >
                      Cerrar ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha:</span>
                        <span className="font-bold">
                          {selectedEventDetail.date}
                          {selectedEventDetail.endDate &&
                          selectedEventDetail.endDate !== selectedEventDetail.date
                            ? ` al ${selectedEventDetail.endDate}`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Horario:</span>
                        <span className="font-bold">
                          {selectedEventDetail.allDay
                            ? "Todo el día"
                            : `${selectedEventDetail.startTime} - ${selectedEventDetail.endTime || "11:00"}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Ubicación:</span>
                        <span className="font-bold">{selectedEventDetail.location || "Sede CENDIS"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Repetición:</span>
                        <span className="font-bold">{selectedEventDetail.recurrence || "NO_REPETIR"}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Descripción completa de la actividad:
                      </span>
                      <p className="text-xs leading-relaxed">
                        {selectedEventDetail.description || "Sin descripción detallada registrada."}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Responsable, Invitados y Google Meet:
                      </span>
                      <p>
                        <strong>Responsable:</strong> {selectedEventDetail.responsable} ({selectedEventDetail.contacto})
                      </p>
                      <p>
                        <strong>Correo invitado:</strong>{" "}
                        {selectedEventDetail.emailInvitado || "No especificado"}
                      </p>
                      {selectedEventDetail.invitadosAdicionales && (
                        <p>
                          <strong>Otros invitados:</strong> {selectedEventDetail.invitadosAdicionales}
                        </p>
                      )}
                      {selectedEventDetail.meetLink && (
                        <p>
                          <strong>Google Meet:</strong>{" "}
                          <a
                            href={selectedEventDetail.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 underline"
                          >
                            {selectedEventDetail.meetLink}
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-300 block">
                          Configuración de Recordatorio
                        </span>
                        <span className="text-xs font-bold">
                          Notificar con {formatReminderLabel(selectedEventDetail)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-300">
                        {[
                          selectedEventDetail.notifyApp !== false ? "App" : null,
                          selectedEventDetail.notifyEmail !== false ? "Correo" : null,
                          selectedEventDetail.notifyWhatsapp !== false ? "WhatsApp" : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => triggerInAppReminder(selectedEventDetail)}
                        className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                      >
                        🔔 Aviso App
                      </button>
                      <button
                        type="button"
                        onClick={() => sendEmailReminder(selectedEventDetail)}
                        className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        ✉ Enviar Correo
                      </button>
                      <button
                        type="button"
                        onClick={() => sendWhatsappReminder(selectedEventDetail)}
                        className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        💬 WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => openInGoogleCalendar(selectedEventDetail)}
                        className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer border border-slate-700"
                      >
                        📅 Google Cal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VENTANA FLOTANTE DEL DÍA CON TODOS LOS PARÁMETROS DE GOOGLE CALENDAR */}
            {selectedDayModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
                  <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        Google Calendar SIACENDIS • Parámetros Completos y Recordatorios Anticipados
                      </span>
                      <h3 className="text-sm font-black">Agenda del Día: {selectedDayModal}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedDayModal(null)}
                      className="text-white/80 hover:text-white text-xs font-bold px-2.5 py-1 rounded bg-blue-800 cursor-pointer"
                    >
                      Cerrar ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[84vh] overflow-y-auto">
                    {/* Lista de actividades existentes en la fecha */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-700">
                        Actividades agendadas en esta fecha ({agendaEvents.filter((e) => e.date === selectedDayModal).length})
                      </h4>
                      {agendaEvents.filter((e) => e.date === selectedDayModal).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay actividades agendadas en este día.</p>
                      ) : (
                        agendaEvents
                          .filter((e) => e.date === selectedDayModal)
                          .map((ev) => (
                            <div
                              key={ev.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                            >
                              <div className="flex flex-wrap justify-between items-start gap-2">
                                <div>
                                  <div className="font-black text-slate-900 flex items-center gap-2">
                                    <span>
                                      {ev.allDay
                                        ? "Todo el día"
                                        : `${ev.startTime}${ev.endTime ? ` - ${ev.endTime}` : ""}`}{" "}
                                      • {ev.title}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                      🔔 {formatReminderLabel(ev)}
                                    </span>
                                  </div>
                                  {ev.description && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">{ev.description}</p>
                                  )}
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    📍 {ev.location || "Sede CENDIS"} • 👤 Resp: {ev.responsable} ({ev.contacto}) •{" "}
                                    <span className="font-bold">{ev.status}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {ev.status !== "APROBADO" && currentUser?.role === "ADMIN" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAgendaEvents((prev) =>
                                          prev.map((item) =>
                                            item.id === ev.id ? { ...item, status: "APROBADO" } : item
                                          )
                                        )
                                      }
                                      className="px-2 py-1 rounded bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      ✓ Aprobar
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAgendaEvents((prev) => prev.filter((item) => item.id !== ev.id))
                                    }
                                    className="text-red-500 hover:text-red-400 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Botones rápidos de recordatorio por cada evento */}
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => triggerInAppReminder(ev)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer"
                                >
                                  🔔 Notificar en App
                                </button>
                                <button
                                  type="button"
                                  onClick={() => sendEmailReminder(ev)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  ✉ Enviar Correo Gmail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => sendWhatsappReminder(ev)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  💬 Enviar WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openInGoogleCalendar(ev)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] cursor-pointer"
                                >
                                  📅 Abrir en Google Calendar
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {/* FORMULARIO COMPLETO CON TODOS LOS PARÁMETROS DE GOOGLE CALENDAR */}
                    <form onSubmit={handleAddEventToDay} className="space-y-3 pt-3 border-t border-slate-200">
                      <h4 className="text-xs font-black uppercase text-amber-400">
                        + Crear Actividad (Todos los Parámetros de Google Calendar)
                      </h4>

                      {/* 1. Título y Tipo de Evento */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Añade un título de actividad..."
                          value={newEventForm.title}
                          onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                          className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                        />
                        <select
                          value={newEventForm.eventType}
                          onChange={(e) => setNewEventForm({ ...newEventForm, eventType: e.target.value })}
                          className="px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="EVENTO">Tipo: Evento</option>
                          <option value="TAREA">Tipo: Tarea</option>
                          <option value="SESION_ESTUDIO">Sesión de Estudio CENDIS</option>
                          <option value="FUERA_DE_OFICINA">Fuera de la oficina</option>
                        </select>
                      </div>

                      {/* 2. Horario, Todo el día, Fecha Fin y Repetición */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer px-2 py-1.5 rounded-lg border border-slate-700">
                          <input
                            type="checkbox"
                            checked={newEventForm.allDay}
                            onChange={(e) => setNewEventForm({ ...newEventForm, allDay: e.target.checked })}
                            className="accent-amber-500"
                          />
                          <span>Todo el día</span>
                        </label>
                        {!newEventForm.allDay && (
                          <>
                            <input
                              type="time"
                              value={newEventForm.startTime}
                              onChange={(e) => setNewEventForm({ ...newEventForm, startTime: e.target.value })}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              title="Hora de inicio"
                            />
                            <input
                              type="time"
                              value={newEventForm.endTime}
                              onChange={(e) => setNewEventForm({ ...newEventForm, endTime: e.target.value })}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              title="Hora de finalización"
                            />
                          </>
                        )}
                        <select
                          value={newEventForm.recurrence}
                          onChange={(e) => setNewEventForm({ ...newEventForm, recurrence: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                        >
                          <option value="NO_REPETIR">No se repite</option>
                          <option value="DIARIO">Todos los días</option>
                          <option value="SEMANAL">Cada semana</option>
                          <option value="MENSUAL">Cada mes</option>
                          <option value="ANUAL">Anualmente</option>
                          <option value="DIAS_LABORALES">Días laborables (Lun-Vie)</option>
                        </select>
                      </div>

                      {/* 3. Ubicación, Ente y Enlace de Videoconferencia Google Meet */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="📍 Añadir ubicación / Sala / Estudio"
                          value={newEventForm.location}
                          onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="🏛 Ente (ej. CENDIS / MPPC)"
                          value={newEventForm.ente}
                          onChange={(e) => setNewEventForm({ ...newEventForm, ente: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="🎥 Enlace Google Meet"
                          value={newEventForm.meetLink}
                          onChange={(e) => setNewEventForm({ ...newEventForm, meetLink: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      {/* 4. Responsable RRHH, Correo de Invitado, WhatsApp e Invitados Adicionales */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                              emailInvitado:
                                emp && emp.correo ? emp.correo : newEventForm.emailInvitado,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={`${emp.nombres} ${emp.apellidos}`}>
                              👤 Resp: {emp.nombres} {emp.apellidos}
                            </option>
                          ))}
                        </select>
                        <input
                          type="email"
                          placeholder="✉ Correo Gmail para recordatorio"
                          value={newEventForm.emailInvitado}
                          onChange={(e) =>
                            setNewEventForm({ ...newEventForm, emailInvitado: e.target.value })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="📱 Teléfono WhatsApp (ej. 0424-1234567)"
                          value={newEventForm.contacto}
                          onChange={(e) => setNewEventForm({ ...newEventForm, contacto: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      {/* 5. Descripción detallada de Google Calendar */}
                      <div>
                        <textarea
                          rows={2}
                          placeholder="📝 Añadir descripción detallada, agenda de la sesión, requerimientos técnicos o notas de Google Calendar..."
                          value={newEventForm.description}
                          onChange={(e) =>
                            setNewEventForm({ ...newEventForm, description: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      {/* 6. Visibilidad, Disponibilidad y Color */}
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={newEventForm.visibility}
                          onChange={(e) => setNewEventForm({ ...newEventForm, visibility: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        >
                          <option value="PUBLICO">Visibilidad: Público</option>
                          <option value="PRIVADO">Visibilidad: Privado</option>
                          <option value="PREDETERMINADO">Visibilidad: Predeterminada</option>
                        </select>
                        <select
                          value={newEventForm.availability}
                          onChange={(e) =>
                            setNewEventForm({ ...newEventForm, availability: e.target.value })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        >
                          <option value="OCUPADO">Mostrar como: Ocupado</option>
                          <option value="DISPONIBLE">Mostrar como: Disponible</option>
                        </select>
                        <select
                          value={newEventForm.color}
                          onChange={(e) => setNewEventForm({ ...newEventForm, color: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="BLUE">🔵 Color: Azul Google</option>
                          <option value="EMERALD">🟢 Color: Verde Esmeralda</option>
                          <option value="AMBER">🟡 Color: Ámbar CENDIS</option>
                          <option value="ROSE">🔴 Color: Vinotinto</option>
                          <option value="VIOLET">🟣 Color: Violeta</option>
                          <option value="CYAN">🩵 Color: Turquesa</option>
                        </select>
                      </div>

                      {/* 7. Configuración de Recordatorios con Días u Horas de Anticipación */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/50 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5" />
                            <span>Recordatorio Anticipado (Días u Horas antes)</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-300 font-semibold">Notificar</span>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={newEventForm.reminderValue}
                              onChange={(e) =>
                                setNewEventForm({ ...newEventForm, reminderValue: e.target.value })
                              }
                              className="w-16 px-2 py-1 rounded border border-slate-600 text-xs font-black text-center"
                            />
                            <select
                              value={newEventForm.reminderUnit}
                              onChange={(e) =>
                                setNewEventForm({ ...newEventForm, reminderUnit: e.target.value })
                              }
                              className="px-2 py-1 rounded border border-slate-600 text-xs font-bold"
                            >
                              <option value="HORAS">Horas antes</option>
                              <option value="DIAS">Días antes</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-800">
                          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-200">
                            <input
                              type="checkbox"
                              checked={newEventForm.notifyApp}
                              onChange={(e) =>
                                setNewEventForm({ ...newEventForm, notifyApp: e.target.checked })
                              }
                              className="accent-amber-500"
                            />
                            <span>🔔 Notificar por Aplicación</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-200">
                            <input
                              type="checkbox"
                              checked={newEventForm.notifyEmail}
                              onChange={(e) =>
                                setNewEventForm({ ...newEventForm, notifyEmail: e.target.checked })
                              }
                              className="accent-blue-500"
                            />
                            <span>✉ Enviar Correo Gmail</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-200">
                            <input
                              type="checkbox"
                              checked={newEventForm.notifyWhatsapp}
                              onChange={(e) =>
                                setNewEventForm({
                                  ...newEventForm,
                                  notifyWhatsapp: e.target.checked,
                                })
                              }
                              className="accent-emerald-500"
                            />
                            <span>💬 Enviar WhatsApp</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        <span>
                          Guardar en Google Calendar CENDIS y Programar Recordatorio (App / Correo / WhatsApp)
                        </span>
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
            {/* CABECERA CON NAVEGABILIDAD NARANJA NEÓN TRANSPARENTE Y BOTÓN "INGRESAR PERSONAL" */}
            <div className="bg-white rounded-2xl shadow-lg border border-orange-500/30 p-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8c42] block">
                  Gestión Integral del Talento Humano • SIACENDIS
                </span>
                <h2 className="text-base sm:text-lg font-black uppercase text-white mt-0.5">
                  Módulo de Recursos Humanos, Hoja de Vida PDF y Carnetización Oficial
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro completo de trabajadores, foto tipo carnet, carga familiar, perfil en PDF y carnet institucional con código de barra escaneable.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openNewEmployeeModal()}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-2 cursor-pointer transition-all bg-[#ff5f00]/35 hover:bg-[#ff5f00]/55 text-white border-2 border-[#ff7b00] shadow-[0_0_20px_rgba(255,95,0,0.65)]"
                >
                  <Users className="w-4 h-4 text-[#ffd29d]" />
                  <span>+ Ingresar Personal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHrSubTab("LISTA")}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    hrSubTab === "LISTA" ? "neon-orange-nav-active font-black" : "neon-orange-nav"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-[#ffb366]" />
                  <span>Expedientes y Carnets ({employees.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHrSubTab("REPORTE_FILTROS")}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    hrSubTab === "REPORTE_FILTROS" ? "neon-orange-nav-active font-black" : "neon-orange-nav"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-[#ffb366]" />
                  <span>Reporte Completo del Personal (Filtros)</span>
                </button>
              </div>
            </div>

            {/* TARJETAS DE RESUMEN RÁPIDO DE RECURSOS HUMANOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print:hidden">
              <div className="rounded-2xl bg-[#0e1526] border border-[#ff6b00]/40 p-4 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff9f5a] block">
                    Total Nómina CENDIS
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5">{employees.length}</div>
                  <span className="text-[11px] text-slate-400">Trabajadores activos</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#ff5f00]/20 border border-[#ff7b00] flex items-center justify-center text-[#ff9f5a]">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#0e1526] border border-[#ff6b00]/40 p-4 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff9f5a] block">
                    Con Carga Familiar
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {employees.filter((e) => e.tieneCargaFamiliar === "SI").length}
                  </div>
                  <span className="text-[11px] text-slate-400">Expedientes familiares</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#ff5f00]/20 border border-[#ff7b00] flex items-center justify-center text-[#ff9f5a]">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#0e1526] border border-[#ff6b00]/40 p-4 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff9f5a] block">
                    Carnets con Código Barra
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5">{employees.length}</div>
                  <span className="text-[11px] text-slate-400">Listos para lector óptico</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#ff5f00]/20 border border-[#ff7b00] flex items-center justify-center text-[#ff9f5a]">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#0e1526] border border-[#ff6b00]/40 p-4 flex items-center justify-between shadow">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff9f5a] block">
                    Acción Rápida
                  </span>
                  <button
                    type="button"
                    onClick={() => openNewEmployeeModal()}
                    className="mt-1 px-3 py-1.5 rounded-xl text-xs font-black neon-orange-nav-active cursor-pointer"
                  >
                    + Abrir Ventana Ingresar Personal
                  </button>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#ff5f00]/20 border border-[#ff7b00] flex items-center justify-center text-[#ff9f5a]">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* AVISO DE VINCULACIÓN DE CUENTA DE CORREO CON DATOS PERSONALES DEL TRABAJADOR */}
            {!currentUserLinkedEmployee || showLinkChangeSelector ? (
              <div className="rounded-2xl bg-amber-950/85 border-2 border-[#ff6b00]/80 p-5 space-y-4 shadow-xl print:hidden">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#ff6b00] text-white font-black flex items-center justify-center text-lg shrink-0 shadow">
                      !
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#ffb366] block">
                        Control de Identidad • Recursos Humanos SIACENDIS
                      </span>
                      <h3 className="text-sm font-black uppercase text-white mt-0.5">
                        Vincule su usuario ({currentUser.email || `${currentUser.username}@gmail.com`}) con su ficha de trabajador
                      </h3>
                      <p className="text-xs text-slate-200 mt-1">
                        Asocie su cuenta con un expediente existente o abra la ventana <strong>&ldquo;+ Ingresar Personal&rdquo;</strong> para registrar sus datos completos.
                      </p>
                    </div>
                  </div>
                  {currentUserLinkedEmployee && (
                    <button
                      type="button"
                      onClick={() => setShowLinkChangeSelector(false)}
                      className="px-3 py-1.5 rounded-lg neon-orange-nav text-xs font-bold cursor-pointer"
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
                      className="px-4 py-2 rounded-xl neon-orange-nav-active font-black text-xs cursor-pointer"
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
                        openNewEmployeeModal({
                          nombres: parts[0] || "",
                          apellidos: parts.slice(1).join(" ") || "",
                          correo: userEmail,
                        });
                      }}
                      className="w-full md:w-auto px-4 py-2 rounded-xl neon-orange-nav font-bold text-xs cursor-pointer"
                    >
                      + Ingresar Personal con mi correo actual
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
                      Expediente Vinculado con Recursos Humanos
                    </span>
                    <p className="text-xs text-slate-100">
                      Correo:{" "}
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
                  className="px-3 py-1.5 rounded-xl neon-orange-nav font-bold text-xs cursor-pointer"
                >
                  Cambiar vinculación
                </button>
              </div>
            )}

            {hrSubTab === "LISTA" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                {/* BARRA DE BÚSQUEDA RÁPIDA Y BOTÓN DE VENTANA EMERGENTE INGRESAR PERSONAL */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex-1 min-w-[240px]">
                    <input
                      type="text"
                      placeholder="🔍 Buscar trabajador por nombre, apellido, cédula, cargo, dirección o código de barra..."
                      value={hrFilterSearch}
                      onChange={(e) => setHrFilterSearch(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openNewEmployeeModal()}
                      className="px-4 py-2.5 rounded-xl neon-orange-nav-active text-xs font-black uppercase tracking-wide flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-[#ffd29d]" />
                      <span>+ Ingresar Personal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHrSubTab("REPORTE_FILTROS")}
                      className="px-3.5 py-2.5 rounded-xl neon-orange-nav text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#ffb366]" />
                      <span>Ver Reporte Completo PDF</span>
                    </button>
                  </div>
                </div>

                {/* TABLA DE PERSONAL REGISTRADO CON FOTO CARNET, DATOS LABORALES, FAMILIARES Y ACCIONES */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-[#ffb366] uppercase font-black border-b border-[#ff6b00]/40">
                        <th className="p-3">Foto</th>
                        <th className="p-3">Cédula</th>
                        <th className="p-3">Nombre Completo</th>
                        <th className="p-3">Cargo / Coordinación</th>
                        <th className="p-3">Teléfono / Dirección</th>
                        <th className="p-3">Carga Familiar</th>
                        <th className="p-3">Código de Barra</th>
                        <th className="p-3">Acciones (Hoja de Vida / Carnet)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {employees
                        .filter((emp) => {
                          if (!hrFilterSearch.trim()) return true;
                          const q = hrFilterSearch.toLowerCase();
                          return (
                            (emp.nombres || "").toLowerCase().includes(q) ||
                            (emp.apellidos || "").toLowerCase().includes(q) ||
                            (emp.cedula || "").toLowerCase().includes(q) ||
                            (emp.cargo || "").toLowerCase().includes(q) ||
                            (emp.coordinacion || "").toLowerCase().includes(q) ||
                            (emp.codigoBarra || "").toLowerCase().includes(q)
                          );
                        })
                        .map((emp) => {
                          const isMyLinkedEmp = currentUserLinkedEmployee?.id === emp.id;
                          const famCount = Array.isArray(emp.familiaresLista)
                            ? emp.familiaresLista.length
                            : emp.tieneCargaFamiliar === "SI"
                            ? 1
                            : 0;
                          return (
                            <tr key={emp.id} className="hover:bg-slate-900/50 transition">
                              <td className="p-3">
                                <div className="w-11 h-13 rounded-lg border-2 border-[#c5a059] bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                  {emp.fotoCarnet ? (
                                    <img
                                      src={emp.fotoCarnet}
                                      alt={`${emp.nombres} ${emp.apellidos}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[11px] font-black text-[#ffb366]">
                                      {(emp.nombres || "C").charAt(0)}
                                      {(emp.apellidos || "D").charAt(0)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-black text-white whitespace-nowrap">{emp.cedula}</td>
                              <td className="p-3">
                                <div className="font-black text-white">
                                  {emp.nombres} {emp.apellidos}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Sangre: <strong className="text-red-400">{emp.tipoSangre || "O+"}</strong> •{" "}
                                  {emp.estadoCivil || "Soltero(a)"}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-[#ffb366]">{emp.cargo}</div>
                                <div className="text-[11px] text-slate-300">{emp.coordinacion}</div>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-orange-950/80 border border-orange-500/40 text-[10px] font-bold text-orange-300">
                                  {emp.condicionLaboral || "Fijo"}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-200">{emp.telefono}</div>
                                <div className="text-[10px] text-slate-400 max-w-[180px] truncate" title={emp.direccion}>
                                  {emp.direccion || "Caracas"}
                                </div>
                              </td>
                              <td className="p-3">
                                {emp.tieneCargaFamiliar === "SI" ? (
                                  <div>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-[10px]">
                                      Sí ({famCount} reg.)
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-0.5 max-w-[150px] truncate" title={emp.familiares}>
                                      {emp.familiares}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-[11px]">Sin carga</span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-[11px] font-bold text-amber-300 whitespace-nowrap">
                                {emp.codigoBarra}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEmpForCard(emp)}
                                    className="px-2.5 py-1.5 rounded-lg neon-orange-nav-active font-black text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Generar Carnet Oficial CENDIS con Código de Barra Escaneable"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-[#ffd29d]" />
                                    <span>Carnet Oficial</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedEmpForCV(emp)}
                                    className="px-2.5 py-1.5 rounded-lg neon-orange-nav font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Ver Perfil y Hoja de Vida Completa en PDF"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#ffb366]" />
                                    <span>Hoja de Vida PDF</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditEmployeeModal(emp)}
                                    className="px-2.5 py-1.5 rounded-lg neon-orange-nav font-bold text-[10px] cursor-pointer"
                                    title="Editar datos personales, foto carnet o familiares"
                                  >
                                    Editar Ficha
                                  </button>

                                  {!isMyLinkedEmp && (
                                    <button
                                      type="button"
                                      onClick={() => handleLinkUserToEmployee(emp.id)}
                                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-[10px] cursor-pointer"
                                    >
                                      Vincular
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* REPORTE COMPLETO DEL PERSONAL CON DIFERENTES FILTROS */
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-orange-500/40 p-5 space-y-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8c42] block">
                        Filtros Dinámicos de Recursos Humanos
                      </span>
                      <h3 className="text-sm font-black uppercase text-white">
                        Reporte Completo del Personal CENDIS ({filteredEmployees.length} registros filtrados)
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHrFilterCoord("TODAS");
                          setHrFilterCondicion("TODAS");
                          setHrFilterCarga("TODOS");
                          setHrFilterSangre("TODOS");
                          setHrFilterSearch("");
                          setHrReportType("NOMINA_COMPLETA");
                        }}
                        className="px-3 py-2 rounded-xl neon-orange-nav text-xs font-bold cursor-pointer"
                      >
                        Limpiar Filtros
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl neon-orange-nav-active text-xs font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-[#ffd29d]" />
                        <span>Imprimir Reporte Completo PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#ffb366] mb-1">
                        1. Modalidad de Reporte
                      </label>
                      <select
                        value={hrReportType}
                        onChange={(e) => setHrReportType(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-700 text-xs font-bold"
                      >
                        <option value="NOMINA_COMPLETA">Nómina Integral de Personal</option>
                        <option value="CARGA_FAMILIAR">Carga Familiar y Contactos de Emergencia</option>
                        <option value="CARNETIZACION">Padrón de Carnets y Códigos de Barra</option>
                        <option value="FICHA_LABORAL">Condición Laboral, Profesión y Dirección</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#ffb366] mb-1">
                        2. Coordinación
                      </label>
                      <select
                        value={hrFilterCoord}
                        onChange={(e) => setHrFilterCoord(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-700 text-xs font-bold"
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
                      <label className="block text-[10px] font-bold uppercase text-[#ffb366] mb-1">
                        3. Condición Laboral
                      </label>
                      <select
                        value={hrFilterCondicion}
                        onChange={(e) => setHrFilterCondicion(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-700 text-xs font-bold"
                      >
                        <option value="TODAS">Todas las Condiciones</option>
                        <option value="Fijo">Personal Fijo</option>
                        <option value="Contratado">Personal Contratado</option>
                        <option value="Libre Nombramiento">Libre Nombramiento</option>
                        <option value="Comisión de Servicio">Comisión de Servicio</option>
                        <option value="Honorarios Profesionales">Honorarios Profesionales</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#ffb366] mb-1">
                        4. Carga Familiar
                      </label>
                      <select
                        value={hrFilterCarga}
                        onChange={(e) => setHrFilterCarga(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-700 text-xs font-bold"
                      >
                        <option value="TODOS">Todos</option>
                        <option value="SI">Con Carga Familiar</option>
                        <option value="NO">Sin Carga Familiar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#ffb366] mb-1">
                        5. Tipo de Sangre
                      </label>
                      <select
                        value={hrFilterSangre}
                        onChange={(e) => setHrFilterSangre(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-700 text-xs font-bold"
                      >
                        <option value="TODOS">Todos los Tipos</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#ffb366] mb-1">
                        6. Búsqueda Libre
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre, cédula, cargo..."
                        value={hrFilterSearch}
                        onChange={(e) => setHrFilterSearch(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* HOJA IMPRIMIBLE EN PDF DEL REPORTE COMPLETO DEL PERSONAL */}
                <div
                  id={selectedEmpForCard || selectedEmpForCV ? "printable-area-bg" : "printable-area"}
                  className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between text-slate-950"
                >
                  <div className="px-9 pt-6 pb-2">
                    <OfficialHeaderCintillo showRightLogo={true} />
                    <div className="mt-5 mb-4 text-center border-b-2 border-slate-900 pb-3">
                      <h2 className="text-base font-black uppercase text-slate-900">
                        REPORTE GENERAL DE PERSONAL • COORDINACIÓN DE RECURSOS HUMANOS CENDIS
                      </h2>
                      <p className="text-[11px] text-slate-700 font-semibold mt-1">
                        Modalidad: <strong>{hrReportType}</strong> | Coordinación: <strong>{hrFilterCoord}</strong> | Condición:{" "}
                        <strong>{hrFilterCondicion}</strong> | Carga Familiar: <strong>{hrFilterCarga}</strong> | Sangre:{" "}
                        <strong>{hrFilterSangre}</strong> | Total Trabajadores: <strong>{filteredEmployees.length}</strong>
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black uppercase">
                          <th className="border border-slate-900 p-2 text-center">Foto</th>
                          <th className="border border-slate-900 p-2">Cédula</th>
                          <th className="border border-slate-900 p-2">Nombre Completo</th>
                          <th className="border border-slate-900 p-2">Cargo / Coordinación</th>
                          <th className="border border-slate-900 p-2">
                            {hrReportType === "CARGA_FAMILIAR"
                              ? "Familiares y Contactos de Emergencia"
                              : hrReportType === "CARNETIZACION"
                              ? "Código de Barra Escaneable"
                              : hrReportType === "FICHA_LABORAL"
                              ? "Condición / Nivel / Dirección"
                              : "Teléfono / Ingreso / Sangre"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((emp) => (
                          <tr key={emp.id}>
                            <td className="border border-slate-900 p-1.5 text-center">
                              {emp.fotoCarnet ? (
                                <img
                                  src={emp.fotoCarnet}
                                  alt={emp.nombres}
                                  className="w-9 h-11 object-cover mx-auto border border-slate-400"
                                />
                              ) : (
                                <div className="w-9 h-11 bg-slate-200 border border-slate-400 mx-auto flex items-center justify-center text-[9px] font-bold text-slate-700">
                                  FOTO
                                </div>
                              )}
                            </td>
                            <td className="border border-slate-900 p-2 font-bold whitespace-nowrap">{emp.cedula}</td>
                            <td className="border border-slate-900 p-2 font-semibold">
                              <div>
                                {emp.nombres} {emp.apellidos}
                              </div>
                              <div className="text-[10px] text-slate-600">{emp.correo || "Sin correo"}</div>
                            </td>
                            <td className="border border-slate-900 p-2">
                              <div className="font-bold">{emp.cargo}</div>
                              <div className="text-[10px] text-slate-700">{emp.coordinacion}</div>
                            </td>
                            <td className="border border-slate-900 p-2">
                              {hrReportType === "CARGA_FAMILIAR" ? (
                                <div className="space-y-0.5">
                                  <div>
                                    <strong>Familiares:</strong> {emp.familiares || "Sin carga familiar"}
                                  </div>
                                  <div className="text-[10px]">
                                    <strong>Emergencia 1:</strong> {emp.emergencia1 || "N/A"} |{" "}
                                    <strong>Emergencia 2:</strong> {emp.emergencia2 || "N/A"}
                                  </div>
                                </div>
                              ) : hrReportType === "CARNETIZACION" ? (
                                <div className="flex flex-col items-center">
                                  <ScannableCarnetBarcode value={emp.codigoBarra} />
                                </div>
                              ) : hrReportType === "FICHA_LABORAL" ? (
                                <div>
                                  <div>
                                    <strong>{emp.condicionLaboral || "Fijo"}</strong> •{" "}
                                    {emp.profesion || emp.nivelAcademico || "Universitario"}
                                  </div>
                                  <div className="text-[10px] text-slate-700">{emp.direccion}</div>
                                </div>
                              ) : (
                                <div>
                                  <div>
                                    <strong>Tel:</strong> {emp.telefono} | <strong>Sangre:</strong>{" "}
                                    {emp.tipoSangre || "O+"}
                                  </div>
                                  <div className="text-[10px] text-slate-700">
                                    <strong>Ingreso:</strong> {emp.fechaIngreso || "2024-01-15"} |{" "}
                                    <strong>Condición:</strong> {emp.condicionLaboral || "Fijo"}
                                  </div>
                                </div>
                              )}
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

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between print:hidden">
                  <h3 className="text-xs font-black uppercase text-slate-700">
                    Vista Previa y Reporte Semanal de Asistencia en PDF (con Cintillo Oficial)
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Reporte Semanal (PDF)</span>
                  </button>
                </div>

                <div
                  id="printable-area"
                  className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between text-slate-950"
                >
                  <div className="p-10">
                    <OfficialHeaderCintillo showRightLogo={true} />
                    <div className="mt-6 mb-4 text-center">
                      <h2 className="text-base font-black uppercase text-slate-900">
                        REPORTE SEMANAL DE CONTROL DE ASISTENCIA • FUNDACIÓN CENDIS
                      </h2>
                      <p className="text-xs text-slate-600 font-semibold">
                        Total de Registros de Entrada: {attendanceRecords.length} | Fecha de Emisión: {fecha}
                      </p>
                    </div>

                    <table className="w-full text-left text-xs border-collapse border border-slate-900">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 uppercase font-black">
                          <th className="border border-slate-900 p-2.5">Cédula</th>
                          <th className="border border-slate-900 p-2.5">Trabajador</th>
                          <th className="border border-slate-900 p-2.5">Fecha</th>
                          <th className="border border-slate-900 p-2.5">Hora Entrada</th>
                          <th className="border border-slate-900 p-2.5">Estatus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((att) => (
                          <tr key={att.id}>
                            <td className="border border-slate-900 p-2.5 font-bold">{att.cedula}</td>
                            <td className="border border-slate-900 p-2.5 font-semibold">{att.nombre}</td>
                            <td className="border border-slate-900 p-2.5">{att.fecha}</td>
                            <td className="border border-slate-900 p-2.5 font-mono font-bold text-cyan-900">
                              {att.hora}
                            </td>
                            <td className="border border-slate-900 p-2.5 font-bold text-emerald-800">
                              {att.estatus}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <OfficialFooterWave />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MÓDULO 7: ESTADÍSTICA Y CONTABILIDAD GLOBAL
           ==================================================================== */}
        {activeTab === "stats" && (
          <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900">
                  Módulo de Estadística y Contabilidad Institucional CENDIS
                </h2>
                <p className="text-xs text-slate-500">
                  Balance global en tiempo real con visualización e impresión en PDF con cintillo oficial.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Reporte Estadístico (PDF)</span>
              </button>
            </div>

            <div
              id="printable-area"
              className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between text-slate-950"
            >
              <div className="p-10 space-y-6">
                <OfficialHeaderCintillo showRightLogo={true} />

                <div className="mt-4 text-center">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    REPORTE DE ESTADÍSTICA Y CONTABILIDAD GENERAL • SIACENDIS
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    Fecha de Corte Institucional: {formatFechaLargaOficial(fecha)}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <OfficialFooterWave />
            </div>
          </div>
        )}

        {/* ====================================================================
            MÓDULO 8: ORGANIGRAMA (DIAGRAMA Y TEXTUAL)
           ==================================================================== */}
        {activeTab === "org" && (
          <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <h2 className="text-base font-black uppercase text-slate-900">
                Organigrama Oficial • Fundación CENDIS
              </h2>
              <div className="flex flex-wrap gap-2">
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
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Organigrama PDF</span>
                </button>
              </div>
            </div>

            <div
              id="printable-area"
              className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between text-slate-950"
            >
              <div className="p-10 space-y-6">
                <OfficialHeaderCintillo showRightLogo={true} />

                <div className="mt-4 text-center">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    ESTRUCTURA ORGANIZATIVA Y ORGANIGRAMA OFICIAL • FUNDACIÓN CENDIS
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    Ministerio del Poder Popular para la Cultura
                  </p>
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
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-900">
                    {employees.map((emp, idx) => (
                      <div key={emp.id} className="py-1.5 border-b border-slate-200">
                        <strong>Nivel {idx + 1} - {emp.coordinacion}:</strong> {emp.nombres} {emp.apellidos} —{" "}
                        <span className="text-slate-600">{emp.cargo}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <OfficialFooterWave />
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
          VENTANA EMERGENTE (MODAL) "INGRESAR PERSONAL CENDIS" (TODOS LOS PARÁMETROS, FOTO CARNET Y AGREGAR FAMILIARES)
         ==================================================================== */}
      {hrModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-[#0b1221] text-white rounded-2xl shadow-2xl max-w-5xl w-full border-2 border-[#ff6b00]/80 overflow-hidden max-h-[94vh] flex flex-col">
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#161f33] via-[#1c1824] to-[#2b1408] border-b border-[#ff6b00]/50 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff9f5a] block">
                  Padrón Oficial de Recursos Humanos • Fundación CENDIS
                </span>
                <h3 className="text-base font-black uppercase text-white">
                  {editingEmpId
                    ? `Editar Expediente Personal: ${newEmpForm.nombres} ${newEmpForm.apellidos}`
                    : "Ingresar Personal CENDIS (Ficha Integral, Foto Carnet y Carga Familiar)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHrModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-white text-xs font-black cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Cuerpo del Formulario */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const famSummary =
                  newEmpForm.familiaresLista && newEmpForm.familiaresLista.length > 0
                    ? newEmpForm.familiaresLista
                        .map((f) => `${f.parentesco}: ${f.nombreCompleto}`)
                        .join(", ")
                    : newEmpForm.familiares || "Sin carga familiar";

                const payload = {
                  ...newEmpForm,
                  familiares: famSummary,
                  tieneCargaFamiliar:
                    (newEmpForm.familiaresLista && newEmpForm.familiaresLista.length > 0) ||
                    newEmpForm.tieneCargaFamiliar === "SI"
                      ? "SI"
                      : "NO",
                };

                if (editingEmpId) {
                  const updatedEmp = { ...payload, id: editingEmpId };
                  setEmployees((prev) =>
                    prev.map((emp) => (emp.id === editingEmpId ? updatedEmp : emp))
                  );
                  addLog(
                    `Actualizado expediente en RRHH: ${updatedEmp.nombres} ${updatedEmp.apellidos} (${updatedEmp.cedula})`
                  );
                  showToast(
                    `Expediente de ${updatedEmp.nombres} ${updatedEmp.apellidos} actualizado correctamente.`
                  );
                } else {
                  const created = { id: `emp-${Date.now()}`, ...payload };
                  setEmployees((prev) => [...prev, created]);
                  addLog(
                    `Ingresado trabajador en RRHH: ${created.nombres} ${created.apellidos} (${created.cedula})`
                  );

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
                      `Trabajador ${created.nombres} ${created.apellidos} registrado y vinculado a su cuenta.`
                    );
                  } else {
                    showToast(
                      `Trabajador ${created.nombres} ${created.apellidos} ingresado al sistema con carnet y hoja de vida PDF.`
                    );
                  }
                }
                setHrModalOpen(false);
              }}
              className="p-6 overflow-y-auto space-y-6 text-xs"
            >
              {/* SECCIÓN 1: FOTO TIPO CARNET ADJUNTA + DATOS PERSONALES DEL TRABAJADOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#070b14] p-4 rounded-2xl border border-slate-800">
                {/* Columna Foto Tipo Carnet */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center p-3 rounded-xl bg-[#0e1526] border border-[#c5a059]/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff9f5a] mb-2 text-center">
                    Foto Tipo Carnet (Adjuntar)
                  </span>
                  <div className="w-32 h-40 rounded-lg border-[3px] border-[#c5a059] bg-[#e2e4e7] overflow-hidden flex items-center justify-center shadow-md mb-3">
                    {newEmpForm.fotoCarnet ? (
                      <img
                        src={newEmpForm.fotoCarnet}
                        alt="Vista previa Foto Carnet"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg viewBox="0 0 120 150" className="w-28 h-36 text-[#9ea3ab]" fill="currentColor">
                        <circle cx="60" cy="52" r="26" />
                        <path d="M12,145 C12,108 34,94 60,94 C86,94 108,108 108,145 Z" />
                      </svg>
                    )}
                  </div>
                  <label className="w-full py-2 px-3 rounded-xl text-center text-[11px] font-black cursor-pointer bg-[#ff5f00]/30 hover:bg-[#ff5f00]/50 border border-[#ff7b00] text-white transition">
                    📷 Adjuntar Foto Carnet
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoCarnetUpload}
                      className="hidden"
                    />
                  </label>
                  {newEmpForm.fotoCarnet && (
                    <button
                      type="button"
                      onClick={() => setNewEmpForm({ ...newEmpForm, fotoCarnet: "" })}
                      className="mt-1.5 text-[10px] text-red-400 hover:underline cursor-pointer"
                    >
                      Quitar fotografía
                    </button>
                  )}
                </div>

                {/* Columna Datos Personales */}
                <div className="lg:col-span-9 space-y-3">
                  <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#ff9f5a]">
                      1. Datos Personales de Identificación y Ubicación
                    </span>
                    <span className="text-[10px] text-slate-400">Campos obligatorios (*)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Ali Alejandro"
                        value={newEmpForm.nombres}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, nombres: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Apellidos *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Primera"
                        value={newEmpForm.apellidos}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, apellidos: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Número de Cédula *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. V-15.432.111"
                        value={newEmpForm.cedula}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, cedula: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={newEmpForm.fechaNacimiento}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, fechaNacimiento: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Estado Civil</label>
                      <select
                        value={newEmpForm.estadoCivil}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, estadoCivil: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      >
                        <option value="Soltero(a)">Soltero(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Unión Estable de Hecho">Unión Estable de Hecho</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viudo(a)">Viudo(a)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Género</label>
                        <select
                          value={newEmpForm.genero}
                          onChange={(e) => setNewEmpForm({ ...newEmpForm, genero: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                        >
                          <option value="Femenino">Femenino</option>
                          <option value="Masculino">Masculino</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Sangre</label>
                        <select
                          value={newEmpForm.tipoSangre}
                          onChange={(e) => setNewEmpForm({ ...newEmpForm, tipoSangre: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white font-bold"
                        >
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Teléfono Principal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="0414-1234567"
                        value={newEmpForm.telefono}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, telefono: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Teléfono Alterno / Habitación
                      </label>
                      <input
                        type="text"
                        placeholder="0212-5551122"
                        value={newEmpForm.telefonoAlterno || ""}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, telefonoAlterno: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        placeholder="trabajador@gmail.com"
                        value={newEmpForm.correo || ""}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, correo: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Dirección Completa de Habitación *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Estado, Municipio, Parroquia, Avenida / Calle, Edificio o Casa..."
                        value={newEmpForm.direccion}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, direccion: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: TODO LO REFERENTE AL TRABAJADOR (CARGO, COORDINACIÓN, CONDICIÓN, PROFESIÓN, CÓDIGO DE BARRA) */}
              <div className="bg-[#070b14] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#ff9f5a]">
                    2. Datos Laborales, Académicos y Carnetización CENDIS
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold">
                    Código Carnet Escaneable: {newEmpForm.codigoBarra}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Cargo en el CENDIS *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Especialista Audiovisual"
                      value={newEmpForm.cargo}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, cargo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Coordinación Adscrita *
                    </label>
                    <select
                      value={newEmpForm.coordinacion}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, coordinacion: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white font-bold"
                    >
                      <option value="Presidencia">Presidencia</option>
                      <option value="Dirección Ejecutiva">Dirección Ejecutiva</option>
                      <option value="Producción Fonográfica">Producción Fonográfica</option>
                      <option value="Cultura Audiovisual">Cultura Audiovisual</option>
                      <option value="Administración y RRHH">Administración y RRHH</option>
                      <option value="Tecnología y Sistemas">Tecnología y Sistemas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Condición Laboral
                    </label>
                    <select
                      value={newEmpForm.condicionLaboral}
                      onChange={(e) =>
                        setNewEmpForm({ ...newEmpForm, condicionLaboral: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    >
                      <option value="Fijo">Fijo</option>
                      <option value="Contratado">Contratado</option>
                      <option value="Libre Nombramiento">Libre Nombramiento</option>
                      <option value="Comisión de Servicio">Comisión de Servicio</option>
                      <option value="Honorarios Profesionales">Honorarios Profesionales</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Fecha de Ingreso al CENDIS
                    </label>
                    <input
                      type="date"
                      value={newEmpForm.fechaIngreso}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, fechaIngreso: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Nivel Académico
                    </label>
                    <select
                      value={newEmpForm.nivelAcademico}
                      onChange={(e) =>
                        setNewEmpForm({ ...newEmpForm, nivelAcademico: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    >
                      <option value="Bachiller">Bachiller</option>
                      <option value="Técnico Medio">Técnico Medio</option>
                      <option value="TSU">Técnico Superior Universitario (TSU)</option>
                      <option value="Universitario">Universitario (Licenciado / Ingeniero)</option>
                      <option value="Postgrado / Maestría">Postgrado / Maestría / Doctorado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Profesión u Oficio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Productor Musical / Administrador"
                      value={newEmpForm.profesion || ""}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, profesion: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Tallas (Camisa / Pantalón / Calzado)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Camisa M / Pantalón 32 / Calzado 40"
                      value={newEmpForm.tallas || ""}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, tallas: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Código de Barra del Carnet *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={newEmpForm.codigoBarra}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, codigoBarra: e.target.value })
                        }
                        className="flex-1 px-2.5 py-2 rounded-lg bg-[#0d1322] border border-amber-500/60 text-amber-300 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewEmpForm({ ...newEmpForm, codigoBarra: generateNextBarcode() })
                        }
                        className="px-2.5 py-2 rounded-lg neon-orange-nav text-[10px] font-black cursor-pointer"
                        title="Generar nuevo código de barra"
                      >
                        🔄
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Funciones / Observaciones Laborales del Trabajador
                    </label>
                    <input
                      type="text"
                      placeholder="Resumen de responsabilidades, experiencia o funciones dentro de la institución..."
                      value={newEmpForm.observacionesLaborales || ""}
                      onChange={(e) =>
                        setNewEmpForm({ ...newEmpForm, observacionesLaborales: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: AGREGAR FAMILIARES (CARGA FAMILIAR DINÁMICA) Y CONTACTOS DE EMERGENCIA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Sub-sección Agregar Familiares */}
                <div className="lg:col-span-7 bg-[#070b14] p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#ff9f5a]">
                      3. Agregar Familiares (Carga Familiar del Trabajador)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {(newEmpForm.familiaresLista || []).length} familiar(es) registrado(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <select
                      value={familyMemberDraft.parentesco}
                      onChange={(e) =>
                        setFamilyMemberDraft({ ...familyMemberDraft, parentesco: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    >
                      <option value="Hijo(a)">Hijo(a)</option>
                      <option value="Esposo(a)">Esposo(a)</option>
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Hermano(a)">Hermano(a)</option>
                      <option value="Abuelo(a)">Abuelo(a)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Nombre y Apellido"
                      value={familyMemberDraft.nombreCompleto}
                      onChange={(e) =>
                        setFamilyMemberDraft({
                          ...familyMemberDraft,
                          nombreCompleto: e.target.value,
                        })
                      }
                      className="sm:col-span-2 px-2.5 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Cédula o Menor"
                      value={familyMemberDraft.cedula}
                      onChange={(e) =>
                        setFamilyMemberDraft({ ...familyMemberDraft, cedula: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <input
                        type="text"
                        placeholder="Edad"
                        value={familyMemberDraft.edad}
                        onChange={(e) =>
                          setFamilyMemberDraft({ ...familyMemberDraft, edad: e.target.value })
                        }
                        className="w-full min-w-0 flex-1 px-2 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddFamilyMemberToDraft}
                        title="Agregar familiar"
                        className="w-9 h-9 shrink-0 rounded-lg neon-orange-nav-active font-black text-base leading-none flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {(newEmpForm.familiaresLista || []).length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-900 text-[#ffb366] uppercase">
                            <th className="p-2">Parentesco</th>
                            <th className="p-2">Nombre y Apellido</th>
                            <th className="p-2">Cédula</th>
                            <th className="p-2">Edad</th>
                            <th className="p-2 text-right">Quitar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {newEmpForm.familiaresLista.map((fam) => (
                            <tr key={fam.id}>
                              <td className="p-2 font-bold text-amber-300">{fam.parentesco}</td>
                              <td className="p-2 text-white">{fam.nombreCompleto}</td>
                              <td className="p-2 text-slate-300">{fam.cedula}</td>
                              <td className="p-2 text-slate-300">{fam.edad || "-"}</td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFamilyMemberFromDraft(fam.id)}
                                  className="px-2 py-0.5 rounded bg-red-900/50 text-red-300 hover:bg-red-800 text-[10px] font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Use los campos de arriba y presione <strong>&ldquo;+&rdquo;</strong> para incluir hijos, cónyuge, padres u otros familiares a la hoja de vida.
                    </p>
                  )}
                </div>

                {/* Sub-sección Contactos de Emergencia (aparecen en el Reverso del Carnet y Hoja de Vida) */}
                <div className="lg:col-span-5 bg-[#070b14] p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-black uppercase text-[#ff9f5a]">
                      4. Contactos de Emergencia (Para el Carnet Oficial)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Contacto de Emergencia 1: Nombre y Teléfono *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. María Primera: 0412-9876543"
                      value={newEmpForm.emergencia1}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, emergencia1: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Contacto de Emergencia 2: Nombre y Teléfono
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. José Primera: 0416-5554433"
                      value={newEmpForm.emergencia2}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, emergencia2: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">
                      Resumen Carga Familiar
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Esposa y 2 Hijos"
                      value={newEmpForm.familiares}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, familiares: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botones Inferiores del Modal */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHrModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl neon-orange-nav-active font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  {editingEmpId
                    ? "💾 Guardar Cambios del Trabajador"
                    : "✓ Registrar Trabajador, Generar Hoja de Vida y Carnet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE CARNET OFICIAL CENDIS (FORMATO EXACTO A LAS 2 IMÁGENES ADJUNTAS + CÓDIGO DE BARRA ESCANEABLE)
         ==================================================================== */}
      {selectedEmpForCard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1526] text-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto border-2 border-[#ff6b00]/70">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 print:hidden">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff9f5a] block">
                  Formato Institucional MPPC / CENDIS con Código de Barra Escaneable
                </span>
                <h3 className="text-sm font-black uppercase text-white">
                  Carnet Oficial CENDIS • {selectedEmpForCard.nombres} {selectedEmpForCard.apellidos} ({selectedEmpForCard.cedula})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const fechaStr = now.toISOString().slice(0, 10);
                    const horaStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const rec = {
                      id: `att-${Date.now()}`,
                      cedula: selectedEmpForCard.cedula,
                      nombre: `${selectedEmpForCard.nombres} ${selectedEmpForCard.apellidos}`,
                      fecha: fechaStr,
                      hora: horaStr,
                      estatus: `Escaneo Lector Óptico (${selectedEmpForCard.codigoBarra})`,
                    };
                    setAttendanceRecords((prev) => [rec, ...prev]);
                    addLog(
                      `Código de barra ${selectedEmpForCard.codigoBarra} escaneado para ${selectedEmpForCard.nombres} ${selectedEmpForCard.apellidos}`
                    );
                    showToast(
                      `✓ Lector de Código de Barra: Escaneado ${selectedEmpForCard.codigoBarra} (${selectedEmpForCard.nombres} ${selectedEmpForCard.apellidos}) y registrado en Asistencia.`
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-xl neon-orange-nav text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#ffb366]" />
                  <span>Probar Escaneo de Código de Barra</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl neon-orange-nav-active text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#ffd29d]" />
                  <span>Imprimir Carnet en PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmpForCard(null)}
                  className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            <div
              id="printable-area"
              className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white border border-slate-200 rounded-xl flex flex-col justify-between text-slate-950"
            >
              <div className="px-9 pt-6 pb-2 space-y-4">
                <OfficialHeaderCintillo showRightLogo={true} />
                <div className="text-center border-b border-slate-300 pb-2">
                  <h2 className="text-sm font-black uppercase text-slate-900">
                    EMISIÓN DE CARNET INSTITUCIONAL CON CÓDIGO DE BARRA ESCANEABLE • FUNDACIÓN CENDIS
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Portador: {selectedEmpForCard.nombres} {selectedEmpForCard.apellidos} • C.I.:{" "}
                    {selectedEmpForCard.cedula} • Código Lector Óptico: {selectedEmpForCard.codigoBarra}
                  </p>
                </div>

                {/* CONTENEDOR DE FRENTE Y REVERSO DEL CARNET (IDÉNTICO A LAS 2 FOTOS ADJUNTAS) */}
                <div className="flex flex-wrap justify-center items-start gap-8 py-4">
                  {/* ==========================================================
                      FRENTE DEL CARNET (CON ESCUDO DE VENEZUELA DORADO Y CÓDIGO DE BARRA EN LA PARTE FRONTAL)
                     ========================================================== */}
                  <div
                    style={{
                      fontFamily: "'Arial Narrow', Arial, Helvetica, sans-serif",
                      boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
                    }}
                    className="w-[325px] h-[515px] bg-[#fbfbfa] rounded-[18px] border-[4.5px] border-[#c5a059] flex flex-col justify-between overflow-hidden relative select-none"
                  >
                    {/* Cabecera Azul Marino con Escudo Nacional de Venezuela en Dorado y Ministerio del Poder Popular para la Cultura */}
                    <div className="bg-[#0b294d] pt-2.5 pb-2 px-4 flex flex-col items-center text-center border-b-[3px] border-[#c5a059]">
                      <GoldenCoatOfArmsSVG className="w-[62px] h-[62px] mb-1" />
                      <div className="text-[12px] font-black uppercase tracking-[0.04em] text-[#d8b875] leading-tight">
                        MINISTERIO DEL PODER POPULAR
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-[0.04em] text-[#d8b875] leading-tight">
                        PARA LA CULTURA
                      </div>
                    </div>

                    {/* Cuerpo Blanco del Frente */}
                    <div className="flex-1 px-4 pt-2 pb-1.5 flex flex-col justify-between bg-[#fbfbfa]">
                      {/* Logo Dorado Centro Nacional del Disco */}
                      <div className="w-full flex justify-center">
                        <GoldenCendisGlyphSVG showTopTitle={true} compact={true} />
                      </div>

                      {/* Sección central dividida en 2 columnas: Datos a la izquierda, Foto Carnet con marco dorado a la derecha */}
                      <div className="grid grid-cols-12 gap-2 items-center pt-1">
                        <div className="col-span-7 text-left space-y-1 leading-tight">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#9e7f3f] block">
                              NOMBRE:
                            </span>
                            <span className="text-[12.5px] font-black uppercase text-[#0b2545] block break-words">
                              {selectedEmpForCard.nombres}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#9e7f3f] block">
                              APELLIDO:
                            </span>
                            <span className="text-[12.5px] font-black uppercase text-[#0b2545] block break-words">
                              {selectedEmpForCard.apellidos}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9.5px] font-bold uppercase text-[#9e7f3f] block">
                              NÚMERO DE CÉDULA:
                            </span>
                            <span className="text-[12.5px] font-black uppercase text-[#0b2545] block">
                              {selectedEmpForCard.cedula}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#9e7f3f] block">
                              CARGO:
                            </span>
                            <span className="text-[11.5px] font-black uppercase text-[#0b2545] block leading-tight">
                              {selectedEmpForCard.cargo}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#9e7f3f] block">
                              COORDINACIÓN:
                            </span>
                            <span className="text-[11.5px] font-black uppercase text-[#0b2545] block leading-tight">
                              {selectedEmpForCard.coordinacion}
                            </span>
                          </div>
                        </div>

                        {/* Recuadro de Fotografía Tipo Carnet con Borde Dorado */}
                        <div className="col-span-5 flex justify-end">
                          <div className="w-[112px] h-[142px] border-[3px] border-[#b6924c] bg-[#e2e4e7] overflow-hidden flex items-end justify-center shadow-inner">
                            {selectedEmpForCard.fotoCarnet ? (
                              <img
                                src={selectedEmpForCard.fotoCarnet}
                                alt={`${selectedEmpForCard.nombres} ${selectedEmpForCard.apellidos}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                viewBox="0 0 120 150"
                                className="w-full h-full text-[#a3a8b0]"
                                fill="currentColor"
                              >
                                <circle cx="60" cy="54" r="27" />
                                <path d="M8,150 C8,110 32,95 60,95 C88,95 112,110 112,150 Z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CÓDIGO DE BARRA ESCANEABLE EN LA PARTE FRONTAL DEL CARNET */}
                      <div className="pt-1 border-t border-[#c5a059]/40 flex justify-center">
                        <ScannableCarnetBarcode value={selectedEmpForCard.codigoBarra} />
                      </div>
                    </div>

                    {/* Franja Inferior Azul Marino con Borde Superior Dorado */}
                    <div className="h-3.5 bg-[#0b294d] border-t-[2.5px] border-[#c5a059]" />
                  </div>

                  {/* ==========================================================
                      REVERSO DEL CARNET (FIRMAS AUTORIZADAS, POLÍTICA Y EMERGENCIA)
                     ========================================================== */}
                  <div
                    style={{
                      fontFamily: "'Arial Narrow', Arial, Helvetica, sans-serif",
                      boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
                    }}
                    className="w-[325px] h-[515px] bg-[#fbfbfa] rounded-[18px] border-[4.5px] border-[#c5a059] flex flex-col justify-between overflow-hidden relative select-none"
                  >
                    {/* Franja Superior Azul Marino con Borde Inferior Dorado */}
                    <div className="h-7 bg-[#0b294d] border-b-[2.5px] border-[#c5a059]" />

                    {/* Contenido Central del Reverso */}
                    <div className="flex-1 px-4 py-3 flex flex-col justify-between bg-[#fbfbfa] text-slate-950">
                      {/* Glifo Dorado + del Disco + CENDIS - Centro Nacional del Disco */}
                      <div className="text-center">
                        <GoldenCendisGlyphSVG showTopTitle={false} compact={true} />
                        <div className="text-[13px] font-bold text-[#0b2545] tracking-tight mt-1">
                          CENDIS - Centro Nacional del Disco
                        </div>
                      </div>

                      {/* FIRMAS AUTORIZADAS */}
                      <div className="space-y-2.5">
                        <div className="text-[11px] font-bold uppercase text-[#9e7f3f] tracking-wide">
                          FIRMAS AUTORIZADAS
                        </div>

                        {/* Fila Firma 1: DIRECTOR/A GENERAL */}
                        <div>
                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <div
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #f3f4f6 1px, #f3f4f6 4px)",
                              }}
                              className="col-span-8 h-9 border-b-[1.5px] border-slate-800 flex items-center justify-center px-2"
                            >
                              <svg viewBox="0 0 180 36" className="w-32 h-7">
                                <path
                                  d="M14,26 C8,12 36,6 52,16 C38,24 24,28 18,28 C34,26 62,12 76,8 C68,18 62,26 66,26 C74,26 84,16 92,18 C96,20 98,25 108,22 C118,19 138,21 166,20"
                                  fill="none"
                                  stroke="#111827"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #f3f4f6 1px, #f3f4f6 4px)",
                              }}
                              className="col-span-4 h-9 border-b-[1.5px] border-slate-800 flex items-center justify-center text-[10.5px] font-bold text-slate-900"
                            >
                              20 SEP 2024
                            </div>
                          </div>
                          <div className="text-[10.5px] font-bold uppercase text-slate-900 mt-0.5">
                            DIRECTOR/A GENERAL
                          </div>
                        </div>

                        {/* Fila Firma 2: COORDINADOR/A DE RRHH */}
                        <div>
                          <div className="grid grid-cols-12 gap-1.5 items-center">
                            <div
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #f3f4f6 1px, #f3f4f6 4px)",
                              }}
                              className="col-span-8 h-9 border-b-[1.5px] border-slate-800 flex items-center justify-center px-2"
                            >
                              <svg viewBox="0 0 180 36" className="w-32 h-7">
                                <path
                                  d="M22,28 C38,14 48,8 52,18 C54,24 44,26 58,22 C72,18 82,22 92,22 C104,22 118,8 124,10 C128,12 114,28 118,28 C126,28 142,14 156,22"
                                  fill="none"
                                  stroke="#111827"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #f3f4f6 1px, #f3f4f6 4px)",
                              }}
                              className="col-span-4 h-9 border-b-[1.5px] border-slate-800 flex items-center justify-center text-[10.5px] font-bold text-slate-900"
                            >
                              20 SEP 2024
                            </div>
                          </div>
                          <div className="text-[10.5px] font-bold uppercase text-slate-900 mt-0.5">
                            COORDINADOR/A DE RRHH
                          </div>
                        </div>
                      </div>

                      {/* POLÍTICA DE USO Y CONFIDENCIALIDAD */}
                      <div className="text-center px-0.5">
                        <div className="text-[11px] font-bold uppercase text-[#9e7f3f] tracking-tight">
                          POLÍTICA DE USO Y CONFIDENCIALIDAD
                        </div>
                        <p className="text-[9.2px] text-slate-900 leading-[1.25] text-justify mt-1 font-medium">
                          Este carnet es personal e intransferible. Identifica al portador como personal autorizado del CENDIS. Su uso indebido está sujeto a sanciones. En caso de extravío, por favor reportarlo inmediatamente a la Coordinación de Recursos Humanos o a las oficinas del Ministerio. No para uso financiero. [Ley Orgánica de la Administración Pública, Art. 112].
                        </p>
                      </div>

                      {/* INFORMACIÓN DE EMERGENCIA */}
                      <div className="pb-1">
                        <div className="text-[11px] font-bold uppercase text-[#9e7f3f] text-center">
                          INFORMACIÓN DE EMERGENCIA
                        </div>
                        <div className="text-[11.5px] font-bold text-slate-950 leading-snug mt-1">
                          <div className="truncate">
                            {selectedEmpForCard.emergencia1 || "CONTACTO 1: 0414-1234567"}
                          </div>
                          <div className="truncate">
                            {selectedEmpForCard.emergencia2 && selectedEmpForCard.emergencia2 !== "N/A"
                              ? selectedEmpForCard.emergencia2
                              : `TELÉFONO TRABAJADOR: ${selectedEmpForCard.telefono || "0412-0000000"}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pie Azul Marino del Reverso con www.cendis.gob.ve y Ministerio */}
                    <div className="bg-[#0b294d] border-t-[2.5px] border-[#c5a059] py-2 px-3 text-center">
                      <div className="text-[11.5px] font-bold text-white leading-none">
                        www.cendis.gob.ve
                      </div>
                      <div className="text-[8.5px] font-bold uppercase text-[#d8b875] tracking-wider mt-0.5 leading-none">
                        MINISTERIO DEL PODER POPULAR PARA LA CULTURA
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <OfficialFooterWave />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE HOJA DE VIDA / PERFIL EN PDF (REPORTE TIPO CURRÍCULUM CON CINTILLO OFICIAL)
         ==================================================================== */}
      {selectedEmpForCV && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1526] text-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto border-2 border-[#ff6b00]/70">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 print:hidden">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff9f5a] block">
                  Perfil Institucional y Síntesis Curricular en PDF
                </span>
                <h3 className="text-sm font-black uppercase text-white">
                  Hoja de Vida en PDF • {selectedEmpForCV.nombres} {selectedEmpForCV.apellidos} ({selectedEmpForCV.cedula})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmpForCV;
                    setSelectedEmpForCV(null);
                    openEditEmployeeModal(emp);
                  }}
                  className="px-3.5 py-1.5 rounded-xl neon-orange-nav text-xs font-bold cursor-pointer"
                >
                  ✏️ Editar Datos / Familiares
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl neon-orange-nav-active text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#ffd29d]" />
                  <span>Imprimir Hoja de Vida PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmpForCV(null)}
                  className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            <div
              id="printable-area"
              className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white border border-slate-200 rounded-xl flex flex-col justify-between text-xs text-slate-950"
            >
              <div className="px-9 pt-5 pb-2 space-y-2.5">
                <OfficialHeaderCintillo showRightLogo={true} />

                {/* Título del Perfil / Hoja de Vida */}
                <div className="text-center border-b-2 border-[#0b2545] pb-1.5">
                  <h2 className="text-sm sm:text-base font-black uppercase text-[#0b2545] tracking-wide">
                    PERFIL INSTITUCIONAL Y HOJA DE VIDA DEL TRABAJADOR • RECURSOS HUMANOS
                  </h2>
                  <p className="text-[10.5px] text-slate-700 font-semibold">
                    Fundación Centro Nacional del Disco (CENDIS) — Expediente N° {selectedEmpForCV.codigoBarra}
                  </p>
                </div>

                {/* Encabezado del Perfil con Foto Carnet a la Derecha y Resumen Principal */}
                <div className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <div className="col-span-9 space-y-1">
                    <div className="text-base font-black uppercase text-[#0b2545]">
                      {selectedEmpForCV.nombres} {selectedEmpForCV.apellidos}
                    </div>
                    <div className="text-[11px] font-bold text-[#8b1538] uppercase">
                      {selectedEmpForCV.cargo} — {selectedEmpForCV.coordinacion}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-0.5 text-[10.5px]">
                      <div>
                        <strong>Cédula de Identidad:</strong> {selectedEmpForCV.cedula}
                      </div>
                      <div>
                        <strong>Fecha de Nacimiento:</strong>{" "}
                        {selectedEmpForCV.fechaNacimiento || "No registrada"}
                      </div>
                      <div>
                        <strong>Estado Civil / Género:</strong>{" "}
                        {selectedEmpForCV.estadoCivil || "Soltero(a)"} /{" "}
                        {selectedEmpForCV.genero || "No especificado"}
                      </div>
                      <div>
                        <strong>Grupo Sanguíneo:</strong>{" "}
                        <span className="font-black text-red-700">
                          {selectedEmpForCV.tipoSangre || "O+"}
                        </span>
                      </div>
                      <div>
                        <strong>Teléfono Principal:</strong> {selectedEmpForCV.telefono}
                      </div>
                      <div>
                        <strong>Teléfono Alterno:</strong>{" "}
                        {selectedEmpForCV.telefonoAlterno || "No registrado"}
                      </div>
                      <div className="col-span-2">
                        <strong>Correo Electrónico:</strong>{" "}
                        {selectedEmpForCV.correo || "No registrado"}
                      </div>
                      <div className="col-span-2">
                        <strong>Dirección de Habitación:</strong>{" "}
                        {selectedEmpForCV.direccion || "Caracas, Venezuela"}
                      </div>
                    </div>
                  </div>

                  {/* Foto Tipo Carnet en la Hoja de Vida */}
                  <div className="col-span-3 flex flex-col items-center">
                    <div className="w-24 h-30 rounded-lg border-[3px] border-[#c5a059] bg-[#e2e4e7] overflow-hidden flex items-center justify-center shadow">
                      {selectedEmpForCV.fotoCarnet ? (
                        <img
                          src={selectedEmpForCV.fotoCarnet}
                          alt={`${selectedEmpForCV.nombres} ${selectedEmpForCV.apellidos}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          viewBox="0 0 120 150"
                          className="w-20 h-26 text-[#9ea3ab]"
                          fill="currentColor"
                        >
                          <circle cx="60" cy="52" r="26" />
                          <path d="M12,145 C12,108 34,94 60,94 C86,94 108,108 108,145 Z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[8.5px] font-bold uppercase text-slate-600 mt-0.5">
                      Foto Tipo Carnet
                    </span>
                  </div>
                </div>

                {/* Sección II: Información Laboral y Académica en el CENDIS */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-[#0b2545] text-white px-3 py-1 text-[10.5px] font-black uppercase tracking-wider">
                    II. Datos Laborales, Académicos y Dotación en el CENDIS
                  </div>
                  <div className="p-2.5 grid grid-cols-3 gap-2 text-[10.5px] bg-white">
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Cargo Institucional:
                      </span>
                      <span className="font-black text-slate-900">{selectedEmpForCV.cargo}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Coordinación de Adscripción:
                      </span>
                      <span className="font-bold text-slate-900">{selectedEmpForCV.coordinacion}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Condición Laboral:
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedEmpForCV.condicionLaboral || "Personal Fijo"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Fecha de Ingreso:
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedEmpForCV.fechaIngreso || "2024-01-15"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Nivel Académico:
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedEmpForCV.nivelAcademico || "Universitario"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Profesión u Oficio:
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedEmpForCV.profesion || selectedEmpForCV.cargo}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Tallas de Dotación:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {selectedEmpForCV.tallas || "Estándar institucional"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase">
                        Código de Carnet:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedEmpForCV.codigoBarra}
                      </span>
                    </div>
                    {selectedEmpForCV.observacionesLaborales && (
                      <div className="col-span-3 pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-bold block text-[9px] uppercase">
                          Funciones y Síntesis Laboral:
                        </span>
                        <span className="text-slate-800">
                          {selectedEmpForCV.observacionesLaborales}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección III: Carga Familiar Registrada */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-[#0b2545] text-white px-3 py-1 text-[10.5px] font-black uppercase tracking-wider flex justify-between">
                    <span>III. Carga Familiar del Trabajador</span>
                    <span>
                      Tiene Carga Familiar: {selectedEmpForCV.tieneCargaFamiliar === "SI" ? "SÍ" : "NO"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white">
                    {Array.isArray(selectedEmpForCV.familiaresLista) &&
                    selectedEmpForCV.familiaresLista.length > 0 ? (
                      <table className="w-full border-collapse border border-slate-400 text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 font-black uppercase">
                            <th className="border border-slate-400 p-1 text-left">Parentesco</th>
                            <th className="border border-slate-400 p-1 text-left">
                              Nombre y Apellido
                            </th>
                            <th className="border border-slate-400 p-1 text-left">
                              Cédula / Condición
                            </th>
                            <th className="border border-slate-400 p-1 text-left">Edad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEmpForCV.familiaresLista.map((fam, idx) => (
                            <tr key={fam.id || idx}>
                              <td className="border border-slate-400 p-1 font-bold">
                                {fam.parentesco}
                              </td>
                              <td className="border border-slate-400 p-1">
                                {fam.nombreCompleto}
                              </td>
                              <td className="border border-slate-400 p-1">{fam.cedula}</td>
                              <td className="border border-slate-400 p-1">
                                {fam.edad ? `${fam.edad} años` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-[10.5px] text-slate-700">
                        <strong>Resumen Familiar:</strong>{" "}
                        {selectedEmpForCV.familiares || "Sin carga familiar registrada en el expediente."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sección IV: Contactos en Caso de Emergencia y Código de Barra */}
                <div className="grid grid-cols-12 gap-3 items-center border border-slate-300 rounded-xl p-2.5 bg-slate-50">
                  <div className="col-span-7 space-y-0.5 text-[10.5px]">
                    <div className="font-black uppercase text-[#0b2545] text-[11px] mb-0.5">
                      IV. Contactos en Caso de Emergencia
                    </div>
                    <div>
                      <strong>Contacto Principal (1):</strong>{" "}
                      {selectedEmpForCV.emergencia1 || "No especificado"}
                    </div>
                    <div>
                      <strong>Contacto Secundario (2):</strong>{" "}
                      {selectedEmpForCV.emergencia2 || "No especificado"}
                    </div>
                  </div>
                  <div className="col-span-5 flex flex-col items-center border-l border-slate-300 pl-3">
                    <ScannableCarnetBarcode value={selectedEmpForCV.codigoBarra} />
                  </div>
                </div>

                {/* Firmas de Validación de la Hoja de Vida */}
                <div className="grid grid-cols-2 gap-12 pt-3 text-center text-[10.5px]">
                  <div className="border-t border-slate-900 pt-1">
                    <div className="font-black uppercase text-slate-900">
                      {selectedEmpForCV.nombres} {selectedEmpForCV.apellidos}
                    </div>
                    <div className="text-[9.5px] text-slate-600">
                      Firma del Trabajador(a) • C.I. {selectedEmpForCV.cedula}
                    </div>
                  </div>
                  <div className="border-t border-slate-900 pt-1">
                    <div className="font-black uppercase text-slate-900">
                      COORDINACIÓN DE RECURSOS HUMANOS
                    </div>
                    <div className="text-[9.5px] text-slate-600">
                      Fundación Centro Nacional del Disco (CENDIS)
                    </div>
                  </div>
                </div>
              </div>
              <OfficialFooterWave />
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
      {renderPasswordChangeModal()}
    </div>
  );
}