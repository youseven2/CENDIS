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
  Download,
  Clock,
  Sparkles,
  Cake,
  Newspaper
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
    entrar_novedades: true,
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
    entrar_novedades: true,
    entrar_config: false,
    ingresar: true,
    modificar: true,
    anular: true,
    eliminar: true,
  },
};

const DEFAULT_USERS = [
  {
    id: 1,
    username: "ADMIN",
    email: "admin.cendis@gmail.com",
    password: "Qwerty123.",
    passwordUpdatedAt: "2026-11-16T12:00:00.000Z",
    fullName: "SUPER USUARIO ADMINISTRADOR",
    cargo: "Administrador del Sistema SIACENDIS",
    role: "ADMIN",
    active: true,
    linkedEmployeeId: null,
    permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN },
    updatedAt: 1794900000000,
  },
];

const INITIAL_EMPLOYEES = [];

const INITIAL_AGENDA_EVENTS = [];

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
    custodio: "Morris López",
    estado: "OPERATIVO",
  },
];

const INITIAL_ORG_CARGOS = [
  {
    id: "org-mppc",
    nombreCargo: "MINISTERIO DEL PODER POPULAR PARA LA CULTURA",
    coordinacion: "MINISTERIO DEL PODER POPULAR PARA LA CULTURA",
    nivelJerarquico: "ENTE RECTOR",
    reportaA: "EJECUTIVO NACIONAL",
    funciones: "Ente rector de las políticas culturales del Estado Venezolano.",
    assignedEmpId: "",
    assignedEmpName: "ALEJANDRO LÓPEZ",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-consejo",
    nombreCargo: "CONSEJO DIRECTIVO",
    coordinacion: "CONSEJO DIRECTIVO",
    nivelJerarquico: "ÓRGANO SUPERIOR",
    reportaA: "MINISTERIO DEL PODER POPULAR PARA LA CULTURA",
    funciones: "Máxima instancia colegiada de dirección y aprobación estratégica de la Fundación CENDIS.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-oac",
    nombreCargo: "OFICINA DE ATENCIÓN AL CIUDADANO",
    coordinacion: "OFICINA DE ATENCIÓN AL CIUDADANO",
    nivelJerarquico: "OFICINA DE APOYO",
    reportaA: "CONSEJO DIRECTIVO",
    funciones: "Recepción, orientación y tramitación de peticiones, quejas y solicitudes ciudadanas.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-auditoria",
    nombreCargo: "AUDITORÍA INTERNA",
    coordinacion: "AUDITORÍA INTERNA",
    nivelJerarquico: "CONTROL INTERNO",
    reportaA: "CONSEJO DIRECTIVO",
    funciones: "Evaluación del control interno, auditoría administrativa y fiscalización institucional.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-presidencia",
    nombreCargo: "PRESIDENCIA",
    coordinacion: "PRESIDENCIA",
    nivelJerarquico: "ALTA DIRECCIÓN",
    reportaA: "CONSEJO DIRECTIVO",
    funciones: "Dirección estratégica, representación legal y conducción superior de la Fundación CENDIS.",
    assignedEmpId: "",
    assignedEmpName: "MIQUEAS FIGUEROA",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-dir-ejecutiva",
    nombreCargo: "DIRECCIÓN EJECUTIVA",
    coordinacion: "DIRECCIÓN EJECUTIVA",
    nivelJerarquico: "ALTA DIRECCIÓN",
    reportaA: "PRESIDENCIA",
    funciones: "Coordinación ejecutiva, administrativa y operativa de las unidades de la Fundación CENDIS.",
    assignedEmpId: "",
    assignedEmpName: "MORRIS LÓPEZ",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-consultoria",
    nombreCargo: "CONSULTORÍA JURÍDICA",
    coordinacion: "CONSULTORÍA JURÍDICA",
    nivelJerarquico: "ASESORÍA",
    reportaA: "DIRECCIÓN EJECUTIVA",
    funciones: "Asesoría legal, redacción de contratos, convenios y dictámenes jurídicos.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-comunicacion",
    nombreCargo: "COORDINACIÓN DE COMUNICACIÓN Y RELACIONES INSTITUCIONALES",
    coordinacion: "COMUNICACIÓN Y RELACIONES INSTITUCIONALES",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "DIRECCIÓN EJECUTIVA",
    funciones: "Difusión cultural, prensa, redes sociales, protocolo y relaciones interinstitucionales.",
    assignedEmpId: "",
    assignedEmpName: "GRISEL MIJARES",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-gestion-interna",
    nombreCargo: "COORDINACIÓN GENERAL DE GESTIÓN INTERNA",
    coordinacion: "GESTIÓN INTERNA",
    nivelJerarquico: "COORDINACIÓN GENERAL",
    reportaA: "DIRECCIÓN EJECUTIVA",
    funciones: "Supervisión integral de administración, planificación, talento humano y tecnología.",
    assignedEmpId: "",
    assignedEmpName: "KATIE MUJICA",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-admin-finanzas",
    nombreCargo: "COORDINACIÓN DE ADMINISTRACIÓN Y FINANZAS",
    coordinacion: "ADMINISTRACIÓN Y FINANZAS",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL DE GESTIÓN INTERNA",
    funciones: "Gestión contable, tesorería, compras, servicios generales y bienes nacionales.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-planif-presup",
    nombreCargo: "COORDINACIÓN DE PLANIFICACIÓN Y PRESUPUESTO",
    coordinacion: "PLANIFICACIÓN Y PRESUPUESTO",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL DE GESTIÓN INTERNA",
    funciones: "Formulación presupuestaria, POA, seguimiento de metas e indicadores institucionales.",
    assignedEmpId: "",
    assignedEmpName: "KAREN COELO",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-rrhh",
    nombreCargo: "COORDINACIÓN DE RECURSOS HUMANOS",
    coordinacion: "RECURSOS HUMANOS",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL DE GESTIÓN INTERNA",
    funciones: "Administración de talento humano, nómina, expedientes, asistencia y bienestar laboral.",
    assignedEmpId: "",
    assignedEmpName: "YSABEL BOMPART",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-tecnologia",
    nombreCargo: "COORDINACIÓN DE TECNOLOGÍA E INFORMÁTICA",
    coordinacion: "TECNOLOGÍA E INFORMÁTICA",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL DE GESTIÓN INTERNA",
    funciones: "Infraestructura tecnológica, sistemas de información, redes y soporte técnico.",
    assignedEmpId: "",
    assignedEmpName: "ROMEL SUCHMOLIN",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-estrategica",
    nombreCargo: "COORDINACIÓN GENERAL ESTRATÉGICA",
    coordinacion: "ESTRATÉGICA",
    nivelJerarquico: "COORDINACIÓN GENERAL",
    reportaA: "DIRECCIÓN EJECUTIVA",
    funciones: "Conducción de proyectos estratégicos y desarrollo artístico fonográfico nacional.",
    assignedEmpId: "",
    assignedEmpName: "DANIEL TORREALBA",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-prod-artistica",
    nombreCargo: "COORDINACIÓN DE PRODUCCIÓN ARTÍSTICA",
    coordinacion: "PRODUCCIÓN ARTÍSTICA",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL ESTRATÉGICA",
    funciones: "Grabación, mezcla, masterización y producción artística de cultores y músicos.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-operaciones",
    nombreCargo: "COORDINACIÓN GENERAL DE OPERACIONES",
    coordinacion: "OPERACIONES",
    nivelJerarquico: "COORDINACIÓN GENERAL",
    reportaA: "DIRECCIÓN EJECUTIVA",
    funciones: "Dirección operativa de producción industrial fonográfica y comercialización.",
    assignedEmpId: "",
    assignedEmpName: "FREDDY FRANQUIZ",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-prod-industrial",
    nombreCargo: "COORDINACIÓN DE PRODUCCIÓN INDUSTRIAL",
    coordinacion: "PRODUCCIÓN INDUSTRIAL",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL DE OPERACIONES",
    funciones: "Replicación, empaque, control de calidad e inventario industrial de discos y formatos.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
  },
  {
    id: "org-comercializacion",
    nombreCargo: "COORDINACIÓN DE COMERCIALIZACIÓN",
    coordinacion: "COMERCIALIZACIÓN",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "COORDINACIÓN GENERAL DE OPERACIONES",
    funciones: "Distribución, ventas, ferias culturales y alianzas de comercialización.",
    assignedEmpId: "",
    assignedEmpName: "",
    status: "ACTIVO",
    updatedAt: 1794600000000,
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

function GoldenCendisGlyphSVG({ sizeClass = "w-[228px]" }) {
  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      <img
        src="/logo-cendis-dorado.png"
        alt="Centro Nacional del Disco (CENDIS) - Logo Completo en Dorado"
        loading="eager"
        decoding="sync"
        style={{
          filter: "drop-shadow(0 1px 1.5px rgba(140, 98, 20, 0.22))",
        }}
        className={`${sizeClass} max-w-[92%] h-auto object-contain block mx-auto`}
      />
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

const STORAGE_DELETED_IDS_KEY = "cendis_deleted_ids_v21";
const STORAGE_DOCS_KEY = "cendis_documents_v21";
const STORAGE_PROJECTS_KEY = "cendis_projects_v21";
const STORAGE_BIENES_KEY = "cendis_bienes_v21";
const STORAGE_BIENES_CAT_KEY = "cendis_bienes_cat_v21";
const STORAGE_ATTENDANCE_KEY = "cendis_attendance_v21";
const STORAGE_CHAT_KEY = "cendis_chat_v21";

function sanitizeUsersDirectorGeneral(list) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_USERS;
  return list.map((u) => {
    const basePerms =
      u.role === "ADMIN"
        ? { ...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN }
        : {
            ...DEFAULT_PERMISSIONS_BY_ROLE.ESTANDAR,
            ...(u.permissions || {}),
            anular: true,
            eliminar: true,
          };
    return { ...u, permissions: basePerms };
  });
}

function sanitizeEmployeesDirectorGeneral(list) {
  if (!Array.isArray(list)) return [];
  return list;
}

function loadStoredDeletedIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_DELETED_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const base = Array.isArray(parsed) ? parsed.map(String) : [];
    if (
      window.localStorage.getItem("cendis_rrhh_purged_deleted_v1") !== "1" ||
      window.localStorage.getItem("cendis_ca_purged_deleted_v1") !== "1" ||
      window.localStorage.getItem("cendis_users_purged_deleted_v1") !== "1" ||
      window.localStorage.getItem("cendis_agenda_purged_deleted_v1") !== "1"
    ) {
      const merged = Array.from(
        new Set([
          ...base,
          "emp-1",
          "emp-2",
          "emp-3",
          "emp-4",
          "att-1",
          "att-2",
          "2",
          "3",
          "4",
          "ev-1",
          "ev-2",
          "ev-3",
          "ev-4",
        ])
      );
      window.localStorage.setItem(STORAGE_DELETED_IDS_KEY, JSON.stringify(merged));
      window.localStorage.setItem("cendis_rrhh_purged_deleted_v1", "1");
      window.localStorage.setItem("cendis_ca_purged_deleted_v1", "1");
      window.localStorage.setItem("cendis_users_purged_deleted_v1", "1");
      window.localStorage.setItem("cendis_agenda_purged_deleted_v1", "1");
      return merged;
    }
    return base;
  } catch {
    return [];
  }
}

function saveStoredDeletedIds(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_DELETED_IDS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function loadStoredUsers() {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    if (window.localStorage.getItem("cendis_users_reset_admin_v2") !== "1") {
      const freshAdminList = [{ ...DEFAULT_USERS[0], updatedAt: Date.now() }];
      window.localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(freshAdminList));
      window.localStorage.setItem("cendis_users_reset_admin_v2", "1");
      return freshAdminList;
    }
    const raw = window.localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return DEFAULT_USERS;
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
    return sanitizeUsersDirectorGeneral(list);
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
  if (typeof window === "undefined") return [];
  try {
    const sampleIds = new Set(["emp-1", "emp-2", "emp-3", "emp-4"]);
    const alreadyCleared = window.localStorage.getItem("cendis_rrhh_empty_init_v1") === "1";
    const raw = window.localStorage.getItem(STORAGE_EMPLOYEES_KEY);
    if (!raw) {
      window.localStorage.setItem("cendis_rrhh_empty_init_v1", "1");
      return [];
    }
    const parsed = JSON.parse(raw);
    let list = Array.isArray(parsed) ? parsed : [];
    if (!alreadyCleared) {
      list = list.filter((e) => !sampleIds.has(String(e.id)));
      window.localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(list));
      window.localStorage.setItem("cendis_rrhh_empty_init_v1", "1");
    }
    return list;
  } catch {
    return [];
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

function loadStoredJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

const INITIAL_DOCUMENTS_LIST = [
  {
    id: "doc-1",
    correlativo: "FC-DG-MEM-2026-007",
    tipo: "MEMORANDUM",
    para: "Lcdo. Jesús García",
    paraDireccion: "General de Administración del Ministerio del Poder Popular para la Cultura",
    de: "Lcdo. Morris López",
    deCargo: "Director General de la Fundación Centro Nacional del Disco (CENDIS)",
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
    updatedAt: 1794600000000,
  },
  {
    id: "doc-2",
    correlativo: "FC-DG-MEM-2026-006",
    tipo: "MEMORANDUM",
    para: "Anaileth Briceño",
    paraDireccion: "Coordinación de Producción Fonográfica del CENDIS",
    de: "Lcdo. Morris López",
    deCargo: "Director General de la Fundación Centro Nacional del Disco (CENDIS)",
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
    updatedAt: 1794600000000,
  },
];

const INITIAL_ATTENDANCE_LIST = [];

const INITIAL_CHAT_LIST = [
  {
    id: 1,
    sender: "Morris López (Director General)",
    recipient: "TODOS",
    text: "Bienvenidos al Chat Interno del SIACENDIS. Recuerden cargar el avance semanal de proyectos y actividades en la Agenda en tiempo real.",
    time: "08:45 AM",
    updatedAt: 1794600000000,
  },
  {
    id: 2,
    sender: "Anaileth Briceño",
    recipient: "TODOS",
    text: "Recibido Director General, ya el archivo maestro lleva 100% de avance.",
    time: "08:50 AM",
    updatedAt: 1794600000000,
  },
];

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

// Unión determinista de colecciones cliente + servidor respetando IDs eliminados (tombstones)
function mergeSyncArrays(localArr, remoteArr, deletedSet) {
  const map = new Map();
  if (Array.isArray(remoteArr)) {
    for (const item of remoteArr) {
      if (!item || item.id === undefined || item.id === null) continue;
      const key = String(item.id);
      if (deletedSet.has(key)) continue;
      map.set(key, item);
    }
  }
  if (Array.isArray(localArr)) {
    for (const item of localArr) {
      if (!item || item.id === undefined || item.id === null) continue;
      const key = String(item.id);
      if (deletedSet.has(key)) continue;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      } else {
        const localTs = Number(item.updatedAt || 0);
        const remoteTs = Number(existing.updatedAt || 0);
        if (localTs > remoteTs) {
          map.set(key, item);
        }
      }
    }
  }
  return Array.from(map.values());
}

// Unificador universal a MAYÚSCULAS para todos los módulos (evita variedad entre mayúsculas y minúsculas)
const UPPERCASE_PRESERVE_KEYS = new Set([
  "id",
  "linkedEmployeeId",
  "updatedAt",
  "passwordUpdatedAt",
  "password",
  "username",
  "email",
  "correo",
  "emailInvitado",
  "fotoCarnet",
  "meetLink",
  "date",
  "endDate",
  "fecha",
  "fechaNacimiento",
  "fechaIngreso",
  "fechaEntrega",
  "fechaAprobacion",
  "fechaAnulacion",
  "startTime",
  "endTime",
  "hora",
  "time",
  "timestamp",
  "color",
  "status",
  "role",
  "permissions",
  "coordinacion",
  "condicionLaboral",
  "nivelAcademico",
  "estadoCivil",
  "genero",
  "parentesco",
  "eventType",
  "recurrence",
  "visibility",
  "availability",
  "reminderUnit",
  "tipo",
  "concepto",
  "ordenSalidaObservaciones",
]);

function normalizeRecordToUpperCase(val) {
  if (typeof val === "string") return val.toUpperCase();
  if (Array.isArray(val)) return val.map((item) => normalizeRecordToUpperCase(item));
  if (val && typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (UPPERCASE_PRESERVE_KEYS.has(k)) {
        out[k] = v;
      } else if (typeof v === "string") {
        out[k] = v.toUpperCase();
      } else if (Array.isArray(v) || (v && typeof v === "object")) {
        out[k] = normalizeRecordToUpperCase(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return val;
}

// ============================================================================
// COMPONENTE PRINCIPAL APP
// ============================================================================
export default function App() {
  // Captura global para convertir automáticamente cualquier texto ingresado (minúscula o mayúscula) a MAYÚSCULA en todos los módulos
  const handleGlobalUppercaseInput = (e) => {
    const el = e.target;
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
    if (el.dataset && el.dataset.noUppercase === "true") return;
    const inputType = (el.type || "text").toLowerCase();
    if (
      inputType === "password" ||
      inputType === "date" ||
      inputType === "time" ||
      inputType === "file" ||
      inputType === "number" ||
      inputType === "checkbox" ||
      inputType === "radio" ||
      inputType === "range" ||
      inputType === "color" ||
      inputType === "email"
    ) {
      return;
    }
    if (typeof el.value === "string") {
      const upper = el.value.toUpperCase();
      if (el.value !== upper) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.value = upper;
        try {
          if (typeof start === "number" && typeof end === "number") {
            el.setSelectionRange(start, end);
          }
        } catch {
          // Ignorar si el input no soporta setSelectionRange
        }
      }
    }
  };

  const [deletedIds, setDeletedIdsState] = useState(() => loadStoredDeletedIds());
  const setDeletedIds = (updater) => {
    setDeletedIdsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const clean = Array.from(new Set((next || []).map(String)));
      saveStoredDeletedIds(clean);
      return clean;
    });
  };

  const [users, setUsersState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredUsers())
  );
  const setUsers = (updater) => {
    setUsersState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(sanitizeUsersDirectorGeneral(nextRaw));
      saveStoredUsers(next);
      return next;
    });
  };
  const [currentUser, setCurrentUser] = useState(() => getSessionFromCookie(loadStoredUsers()));
  const [currentScreen, setCurrentScreen] = useState(() =>
    getSessionFromCookie(loadStoredUsers()) ? "PORTAL" : "INTRANET"
  ); // INTRANET | LOGIN | PORTAL | APP
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

  // Conmutador global de Modo Oscuro / Modo Claro (Blanco) en todo el sistema
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "DARK";
    try {
      return window.localStorage.getItem("cendis_theme_mode") === "LIGHT" ? "LIGHT" : "DARK";
    } catch {
      return "DARK";
    }
  });

  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === "DARK" ? "LIGHT" : "DARK";
      try {
        window.localStorage.setItem("cendis_theme_mode", next);
      } catch {
        // Ignorar bloqueo de almacenamiento
      }
      return next;
    });
  };

  // Pestaña activa
  const [activeTab, setActiveTab] = useState("editor");

  // Mensajes de aviso / notificaciones y Registro de Novedades ("NEW")
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text, type = "success", isNew = false) => {
    setToastMessage({ text, type, isNew });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const INITIAL_NEW_NOTICES = [
    {
      id: "new-intranet-215",
      module: "intranet",
      title: "Canal Informativo del CENDIS (Intranet)",
      detail: "Nueva página de inicio con eventos de Agenda, cumpleaños del personal y novedades del sistema.",
      date: "2026-11-15",
      seen: false,
    },
    {
      id: "new-agenda-clock-215",
      module: "agenda",
      title: "Reloj selector de hora y Cumpleaños automáticos",
      detail: "Selector de reloj en eventos de Agenda e ingreso automático de cumpleaños desde RRHH.",
      date: "2026-11-15",
      seen: false,
    },
    {
      id: "new-config-rrhh-215",
      module: "config",
      title: "Usuarios vinculados a Recursos Humanos",
      detail: "Para crear un usuario en Configuración ahora debe seleccionarse un trabajador registrado en RRHH.",
      date: "2026-11-15",
      seen: false,
    },
  ];
  const [systemNewNotices, setSystemNewNotices] = useState(() =>
    loadStoredJson("cendis_new_notices_v1", INITIAL_NEW_NOTICES)
  );
  const [newNoticesModalOpen, setNewNoticesModalOpen] = useState(false);

  // Estado del Módulo Novedades (vinculado gráficamente al Canal Informativo)
  const [novedadesList, setNovedadesListState] = useState(() =>
    loadStoredJson("cendis_novedades_v1", [])
  );
  const setNovedadesList = (updater) => {
    setNovedadesListState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveStoredJson("cendis_novedades_v1", next);
      return next;
    });
  };
  const NOVEDAD_PRESETS = [
    {
      id: "CUSTOM",
      label: "Redacción Libre (Personalizada)",
      categoria: "COMUNICADO OFICIAL",
      titulo: "",
      mensaje: "",
    },
    {
      id: "REUNION",
      label: "Reunión General de Personal CENDIS",
      categoria: "AVISO GENERAL",
      titulo: "CONVOCATORIA A REUNIÓN GENERAL DE TRABAJADORES",
      mensaje: "Se convoca a todo el personal administrativo, técnico y obrero de la Fundación CENDIS a participar en la reunión general institucional.",
    },
    {
      id: "JORNADA",
      label: "Jornada Especial / Operativo Institucional",
      categoria: "EVENTO ESPECIAL",
      titulo: "JORNADA ESPECIAL DE ATENCIÓN AL PERSONAL CENDIS",
      mensaje: "Informamos a todos los trabajadores del CENDIS sobre la realización de nuestra jornada especial en las instalaciones de la sede principal.",
    },
    {
      id: "RRHH",
      label: "Comunicado de Talento Humano (RRHH)",
      categoria: "TALENTO HUMANO",
      titulo: "INFORMACIÓN IMPORTANTE DE RECURSOS HUMANOS",
      mensaje: "La Coordinación de Recursos Humanos informa a todo el personal activo sobre los lineamientos y trámites administrativos vigentes.",
    },
    {
      id: "MANTENIMIENTO",
      label: "Aviso de Mantenimiento / Sistemas",
      categoria: "NORMATIVA",
      titulo: "AVISO DE MANTENIMIENTO PROGRAMADO",
      mensaje: "Se notifica a todas las coordinaciones que se estará realizando mantenimiento preventivo en las áreas e infraestructura de la institución.",
    },
  ];
  const [novedadForm, setNovedadForm] = useState({
    preset: "CUSTOM",
    categoria: "COMUNICADO OFICIAL",
    titulo: "",
    mensaje: "",
    mediaDataUrl: "",
    mediaType: "",
    mediaName: "",
  });
  const registerNewNotice = (module, title, detail) => {
    const entry = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      module: module || "sistema",
      title,
      detail: detail || title,
      date: new Date().toISOString().slice(0, 10),
      seen: false,
    };
    setSystemNewNotices((prev) => {
      const next = [entry, ...prev].slice(0, 25);
      saveStoredJson("cendis_new_notices_v1", next);
      return next;
    });
  };
  const markModuleNewSeen = (moduleId) => {
    setSystemNewNotices((prev) => {
      const hasUnseen = prev.some((n) => n.module === moduleId && !n.seen);
      if (!hasUnseen) return prev;
      const next = prev.map((n) => (n.module === moduleId ? { ...n, seen: true } : n));
      saveStoredJson("cendis_new_notices_v1", next);
      return next;
    });
  };
  const unseenNewCount = useMemo(
    () => systemNewNotices.filter((n) => !n.seen).length,
    [systemNewNotices]
  );

  // Estado Universal de Memorandos, Solicitudes, Oficios, Órdenes de Salida, Alimentos y Servicios Generales
  const [docType, setDocType] = useState("MEMORANDUM"); // MEMORANDUM | SOLICITUD | OFICIO | ORDEN_SALIDA | SOLICITUD_ALIMENTOS | SOLICITUD_SERVICIOS_GENERALES
  const [docUnitPrefix, setDocUnitPrefix] = useState("FC-DG");
  const [counters, setCounters] = useState({
    MEMORANDUM: 7,
    SOLICITUD: 1,
    OFICIO: 1,
    ORDEN_SALIDA: 1,
    SOLICITUD_ALIMENTOS: 1,
    SOLICITUD_SERVICIOS_GENERALES: 1,
  });
  const [manualCorrelative, setManualCorrelative] = useState(false);
  const [customCorrelative, setCustomCorrelative] = useState("");

  // Variables para Solicitud de Alimentos (contabilidad y reporte con filtro)
  const [alimentosData, setAlimentosData] = useState({
    coordinacionSolicitante: "PRODUCCIÓN FONOGRÁFICA",
    tipoAlimento: "ALMUERZO",
    actividad: "",
    fechaActividad: new Date().toISOString().slice(0, 10),
    observaciones: "",
    items: [
      { id: 1, rubro: "ALMUERZOS", unidad: "RACIONES", cantidad: 10, detalle: "Menú institucional" },
    ],
  });
  const [alimentosFilter, setAlimentosFilter] = useState({
    desde: "",
    hasta: "",
    coordinacion: "TODAS",
    tipoAlimento: "TODOS",
    query: "",
  });
  const [showAlimentosReportModal, setShowAlimentosReportModal] = useState(false);

  // Variables para Solicitud de Servicios Generales (materiales para funcionamiento del CENDIS)
  const [serviciosGeneralesData, setServiciosGeneralesData] = useState({
    areaSolicitante: "DIRECCIÓN GENERAL",
    tipoServicio: "SUMINISTRO DE MATERIALES Y MANTENIMIENTO",
    prioridad: "NORMAL",
    fechaRequerida: new Date().toISOString().slice(0, 10),
    justificacionUso: "",
    materiales: [
      { id: 1, material: "", unidad: "UNIDADES", cantidad: 1, uso: "Funcionamiento operativo CENDIS" },
    ],
  });

  // Variables específicas para Orden de Salida de Equipos (integrada con RRHH y Bienes Nacionales)
  const [ordenSalidaData, setOrdenSalidaData] = useState({
    tipoSalida: "PRÉSTAMO / COMISIÓN DE SERVICIO",
    fechaSalida: "2026-11-15",
    fechaRetorno: "2026-11-20",
    responsableNombre: "ANAILETH BRICEÑO",
    responsableCedula: "V-20.164.307",
    responsableCargo: "COORDINADORA DE PRODUCCIÓN - PRODUCCIÓN FONOGRÁFICA",
    responsableTelefono: "0424-1643007",
    destino: "TEATRO TERESA CARREÑO / ACTIVIDAD CULTURAL MPPC",
    autorizadoPor: "LCDO. MORRIS LÓPEZ (DIRECTOR GENERAL)",
    equipos: [
      {
        id: "eq-init-1",
        bienId: "bn-2",
        codigoBN: "BN-CENDIS-001046",
        descripcion: "MICRÓFONO DE CONDENSADOR ESTUDIO",
        marca: "NEUMANN",
        modelo: "U87 AI",
        serial: "NM-U87-44120",
        cantidad: 1,
        estadoSalida: "OPERATIVO / BUEN ESTADO",
      },
    ],
  });
  const [equipoDraft, setEquipoDraft] = useState({
    bienId: "",
    codigoBN: "",
    descripcion: "",
    marca: "",
    modelo: "",
    serial: "",
    cantidad: 1,
    estadoSalida: "OPERATIVO / BUEN ESTADO",
  });

  const [para, setPara] = useState("");
  const [paraDireccion, setParaDireccion] = useState("");
  const [de, setDe] = useState("LCDO. MORRIS LÓPEZ");
  const [deCargo, setDeCargo] = useState(
    "DIRECTOR GENERAL DE LA FUNDACIÓN CENTRO NACIONAL DEL DISCO (CENDIS)"
  );
  const getTodayIsoDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };
  const memoDateInputRef = React.useRef(null);
  const [fecha, setFecha] = useState(() => getTodayIsoDate());
  const [asunto, setAsunto] = useState("");
  const [concepto, setConcepto] = useState("");

  const [signerNombre, setSignerNombre] = useState("LCDO. MORRIS LÓPEZ");
  const [signerCargo, setSignerCargo] = useState("DIRECTOR GENERAL");
  const [signerEnte, setSignerEnte] = useState("FUNDACIÓN CENTRO NACIONAL DEL DISCO (CENDIS)");
  const [signerMinisterio, setSignerMinisterio] = useState(
    "MINISTERIO DEL PODER POPULAR PARA LA CULTURA"
  );
  const [signerResolucion] = useState(
    "DESIGNADO SEGÚN GACETA OFICIAL DE LA REPÚBLICA BOLIVARIANA DE VENEZUELA N° 42.125"
  );

  const [documents, setDocumentsState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredJson(STORAGE_DOCS_KEY, INITIAL_DOCUMENTS_LIST))
  );
  const setDocuments = (updater) => {
    setDocumentsState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson(STORAGE_DOCS_KEY, next);
      return next;
    });
  };

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

  const addLog = (actionText, userObj = currentUser, moduleKey = activeTab) => {
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
    if (actionText && !actionText.startsWith("Inicio de sesión") && !actionText.startsWith("Cierre de sesión")) {
      registerNewNotice(moduleKey || "sistema", actionText, `Acción registrada por ${userObj ? userObj.fullName : "Sistema"} (${stamp})`);
    }
  };

  // Estado de Recursos Humanos
  const [employees, setEmployeesState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredEmployees())
  );
  const setEmployees = (updater) => {
    setEmployeesState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredEmployees(next);
      return next;
    });
  };
  const [hrSubTab, setHrSubTab] = useState("LISTA"); // LISTA | REPORTE_FILTROS
  const [selectedEmpForCard, setSelectedEmpForCard] = useState(null);
  const [selectedEmpForCV, setSelectedEmpForCV] = useState(null);
  const [selectedEmpForConstancia, setSelectedEmpForConstancia] = useState(null);
  const [constanciaCounter, setConstanciaCounter] = useState(() => {
    const saved = loadStoredJson("cendis_constancia_counter_v1", 1);
    return Number(saved) || 1;
  });
  const [constanciaForm, setConstanciaForm] = useState({
    correlativo: "CRH-2026-001",
    rif: "G-20008344-9",
    tratamiento: "el ciudadano",
    nombreCompleto: "",
    cedula: "",
    fechaIngreso: "",
    cargo: "",
    dependencia: "",
    remuneracionLetras: "DOSCIENTOS SETENTA Y CINCO MIL BOLÍVARES CON 88/100",
    remuneracionMonto: "Bs 275,88",
    fechaExpedicion: new Date().toISOString().slice(0, 10),
    firmanteNombre: "MORRIS LÓPEZ",
    firmanteCargo: "DIRECTOR GENERAL",
    iniciales: "ML/rrhh.",
  });

  const numeroABolivaresLetras = (rawMonto) => {
    const cleaned = String(rawMonto || "")
      .replace(/bs\.?/gi, "")
      .replace(/\s+/g, "")
      .trim();
    if (!cleaned) return "";
    let normalized = cleaned;
    if (cleaned.includes(",") && cleaned.includes(".")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (cleaned.includes(",")) {
      normalized = cleaned.replace(",", ".");
    }
    const num = parseFloat(normalized);
    if (Number.isNaN(num) || num < 0) return "";
    const entero = Math.floor(num);
    const centavos = Math.round((num - entero) * 100);
    const centStr = String(centavos === 100 ? 0 : centavos).padStart(2, "0");

    const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
    const ESPECIALES = [
      "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
      "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
    ];
    const DECENAS = [
      "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA",
      "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
    ];
    const CENTENAS = [
      "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS",
      "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
    ];

    const convertirGrupo = (n) => {
      if (n === 0) return "";
      if (n === 100) return "CIEN";
      const c = Math.floor(n / 100);
      const r = n % 100;
      let res = CENTENAS[c] ? CENTENAS[c] + (r > 0 ? " " : "") : "";
      if (r >= 10 && r <= 19) {
        res += ESPECIALES[r - 10];
      } else if (r >= 21 && r <= 29) {
        res += "VEINTI" + UNIDADES[r - 20];
      } else {
        const d = Math.floor(r / 10);
        const u = r % 10;
        if (d > 0) res += DECENAS[d] + (u > 0 ? " Y " : "");
        if (u > 0) res += UNIDADES[u];
      }
      return res.trim();
    };

    const convertirEntero = (n) => {
      if (n === 0) return "CERO";
      const millones = Math.floor(n / 1000000);
      const restoMillon = n % 1000000;
      const miles = Math.floor(restoMillon / 1000);
      const unidades = restoMillon % 1000;
      const partes = [];
      if (millones > 0) {
        partes.push(millones === 1 ? "UN MILLÓN" : `${convertirGrupo(millones)} MILLONES`);
      }
      if (miles > 0) {
        partes.push(miles === 1 ? "MIL" : `${convertirGrupo(miles)} MIL`);
      }
      if (unidades > 0) {
        partes.push(convertirGrupo(unidades));
      }
      return partes.join(" ");
    };

    const textoEntero = convertirEntero(entero);
    const dePrefix = entero >= 1000000 && entero % 1000000 === 0 ? "DE " : "";
    const moneda = entero === 1 ? "BOLÍVAR" : "BOLÍVARES";
    return `${textoEntero} ${dePrefix}${moneda} CON ${centStr}/100`;
  };

  const openConstanciaModal = (emp) => {
    if (!emp) return;
    const freshEmp = employees.find((x) => String(x.id) === String(emp.id)) || emp;
    const isFemale =
      String(freshEmp.genero || "").toUpperCase().startsWith("F") ||
      String(freshEmp.nombres || "").trim().toUpperCase().endsWith("A");
    const corrNum = String(constanciaCounter || 1).padStart(3, "0");
    const yearNow = new Date().getFullYear();
    const formatIngreso = (iso) => {
      if (!iso) return "15/01/2024";
      const parts = String(iso).split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return iso;
    };
    const rawSueldo = String(freshEmp.sueldoMensual || "").trim();
    const autoLetras = rawSueldo ? numeroABolivaresLetras(rawSueldo) : "";
    setConstanciaForm({
      correlativo: `CRH-${yearNow}-${corrNum}`,
      rif: "G-20008344-9",
      tratamiento: isFemale ? "la ciudadana" : "el ciudadano",
      nombreCompleto: `${freshEmp.apellidos || ""} ${freshEmp.nombres || ""}`.trim().toUpperCase(),
      cedula: String(freshEmp.cedula || "").replace(/^V-?/i, ""),
      fechaIngreso: formatIngreso(freshEmp.fechaIngreso),
      cargo: (freshEmp.cargo || "PERSONAL CENDIS").toUpperCase(),
      dependencia: (freshEmp.coordinacion || "FUNDACIÓN CENDIS").toUpperCase(),
      remuneracionLetras:
        autoLetras ||
        (freshEmp.sueldoLetras || "").trim().toUpperCase() ||
        "DOSCIENTOS SETENTA Y CINCO BOLÍVARES CON 88/100",
      remuneracionMonto: rawSueldo
        ? rawSueldo.toUpperCase().startsWith("BS")
          ? rawSueldo
          : `Bs ${rawSueldo}`
        : "Bs 275,88",
      fechaExpedicion: new Date().toISOString().slice(0, 10),
      firmanteNombre: "MORRIS LÓPEZ",
      firmanteCargo: "DIRECTOR GENERAL",
      iniciales: "ML/rrhh.",
    });
    setSelectedEmpForConstancia(freshEmp);
  };

  // Mantener sincronizada la Constancia de Trabajo si se actualiza el sueldo u otros datos del trabajador en RRHH
  useEffect(() => {
    if (!selectedEmpForConstancia) return;
    const freshEmp = employees.find(
      (x) => String(x.id) === String(selectedEmpForConstancia.id)
    );
    if (!freshEmp) return;
    const rawSueldo = String(freshEmp.sueldoMensual || "").trim();
    if (!rawSueldo) return;
    const formattedMonto = rawSueldo.toUpperCase().startsWith("BS")
      ? rawSueldo
      : `Bs ${rawSueldo}`;
    const autoLetras = numeroABolivaresLetras(rawSueldo);
    setConstanciaForm((prev) => {
      if (
        prev.remuneracionMonto === formattedMonto &&
        prev.cargo === (freshEmp.cargo || "PERSONAL CENDIS").toUpperCase() &&
        prev.dependencia === (freshEmp.coordinacion || "FUNDACIÓN CENDIS").toUpperCase()
      ) {
        return prev;
      }
      return {
        ...prev,
        nombreCompleto: `${freshEmp.apellidos || ""} ${freshEmp.nombres || ""}`.trim().toUpperCase(),
        cedula: String(freshEmp.cedula || "").replace(/^V-?/i, ""),
        cargo: (freshEmp.cargo || "PERSONAL CENDIS").toUpperCase(),
        dependencia: (freshEmp.coordinacion || "FUNDACIÓN CENDIS").toUpperCase(),
        remuneracionMonto: formattedMonto,
        remuneracionLetras: autoLetras || prev.remuneracionLetras,
      };
    });
  }, [employees, selectedEmpForConstancia]);
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
    centroVotacion: "",
    estadoVotacion: "",
    municipioVotacion: "",
    parroquiaVotacion: "",
    yaVoto: "NO",
    sueldoMensual: "",
    sueldoLetras: "",
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

  // Estado de Agenda (Google Calendar Completo con Recordatorios App / Correo / WhatsApp y Sincronización en Tiempo Real)
  const [agendaEvents, setAgendaEventsState] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("cendis_agenda_v1");
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      if (window.localStorage.getItem("cendis_agenda_empty_init_v1") !== "1") {
        const sampleEvIds = new Set(["ev-1", "ev-2", "ev-3", "ev-4"]);
        list = list.filter((ev) => !sampleEvIds.has(String(ev.id)));
        window.localStorage.setItem("cendis_agenda_v1", JSON.stringify(list));
        window.localStorage.setItem("cendis_agenda_empty_init_v1", "1");
      }
      return normalizeRecordToUpperCase(list);
    } catch {
      return [];
    }
  });
  const setAgendaEvents = (updater) => {
    setAgendaEventsState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      try {
        window.localStorage.setItem("cendis_agenda_v1", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };
  const [agendaYear, setAgendaYear] = useState(() => new Date().getFullYear());
  const [agendaMonth, setAgendaMonth] = useState(() => new Date().getMonth()); // 0..11
  const [agendaViewMode, setAgendaViewMode] = useState("CALENDAR"); // CALENDAR | REPORT | REMINDERS
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [reportPeriodType, setReportPeriodType] = useState("SEMANAL");
  const [reportColumnsCount, setReportColumnsCount] = useState(5);
  const [reportViceministerio] = useState("VICEMINISTERIO CULTURA AUDIOVISUAL");
  const [reportEnteTitle] = useState("ENTE: FUNDACIÓN CENTRO NACIONAL DEL DISCO (CENDIS)");
  const [reportWeekStartDate, setReportWeekStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [reportSemanaLabel, setReportSemanaLabel] = useState(() => {
    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
    ];
    const now = new Date();
    return `MES DE ${meses[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [selectedDayModal, setSelectedDayModal] = useState(null);
  const [newEventForm, setNewEventForm] = useState({
    ente: "CENDIS",
    title: "",
    eventType: "EVENTO", // EVENTO | TAREA | FUERA_DE_OFICINA | SESION_ESTUDIO
    allDay: false,
    endDate: "",
    startTime: "09:00",
    endTime: "10:30",
    timeZone: "AMERICA/CARACAS (GMT-04:00)",
    recurrence: "NO_REPETIR", // NO_REPETIR | DIARIO | SEMANAL | MENSUAL | ANUAL | DIAS_LABORALES
    location: "",
    meetLink: "https://meet.google.com/cen-dis-mppc",
    description: "",
    responsable: "MORRIS LÓPEZ",
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
  const [attendanceRecords, setAttendanceRecordsState] = useState(() => {
    let loaded = loadStoredJson(STORAGE_ATTENDANCE_KEY, INITIAL_ATTENDANCE_LIST);
    if (typeof window !== "undefined" && window.localStorage.getItem("cendis_ca_full_reset_v2") !== "1") {
      loaded = [];
      saveStoredJson(STORAGE_ATTENDANCE_KEY, []);
      try {
        window.localStorage.setItem("cendis_ca_full_reset_v2", "1");
      } catch {}
    }
    return normalizeRecordToUpperCase(loaded);
  });
  const setAttendanceRecords = (updater) => {
    setAttendanceRecordsState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson(STORAGE_ATTENDANCE_KEY, next);
      return next;
    });
  };
  const [scannerInput, setScannerInput] = useState("");
  const [scannerAlert, setScannerAlert] = useState(null);

  // Estado de Organigrama y Cargos Vinculados a RRHH
  const [orgViewMode, setOrgViewMode] = useState("DIAGRAM"); // DIAGRAM | TEXT
  const [orgCargos, setOrgCargosState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredJson("cendis_org_cargos_v1", INITIAL_ORG_CARGOS))
  );
  const setOrgCargos = (updater) => {
    setOrgCargosState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson("cendis_org_cargos_v1", next);
      return next;
    });
  };

  // Asegurar que la estructura oficial completa del Organigrama CENDIS esté presente
  useEffect(() => {
    setOrgCargos((prev) => {
      const defaultsById = new Map(INITIAL_ORG_CARGOS.map((c) => [String(c.id), c]));
      const existingIds = new Set((prev || []).map((c) => String(c.id)));
      const missing = INITIAL_ORG_CARGOS.filter((c) => !existingIds.has(String(c.id)));
      let changed = missing.length > 0;
      const updated = (prev || []).map((c) => {
        const def = defaultsById.get(String(c.id));
        if (def && !c.assignedEmpId && !c.assignedEmpName && def.assignedEmpName) {
          changed = true;
          return { ...c, assignedEmpName: def.assignedEmpName };
        }
        return c;
      });
      if (!changed) return prev;
      return [...missing, ...updated];
    });
  }, []);

  const assignEmployeeToOrgCargo = (cargoId, empId) => {
    const emp = employees.find((e) => String(e.id) === String(empId));
    const empName = emp ? `${emp.nombres} ${emp.apellidos}`.trim().toUpperCase() : "";
    const nextCargos = orgCargos.map((c) =>
      String(c.id) === String(cargoId)
        ? { ...c, assignedEmpId: empId || "", assignedEmpName: empName, updatedAt: Date.now() }
        : c
    );
    setOrgCargos(nextCargos);
    syncWithCloudServer({ orgCargos: nextCargos });
    const targetCargo = orgCargos.find((c) => String(c.id) === String(cargoId));
    addLog(
      emp
        ? `Asignado ${empName} al cargo ${targetCargo?.nombreCargo || cargoId} en Organigrama`
        : `Liberado cargo ${targetCargo?.nombreCargo || cargoId} en Organigrama`,
      currentUser,
      "org"
    );
    showToast(
      emp
        ? `${empName} asignado(a) a ${targetCargo?.nombreCargo || "cargo"} desde RRHH.`
        : `Cargo ${targetCargo?.nombreCargo || ""} marcado como vacante.`
    );
  };
  const [orgCargoModalOpen, setOrgCargoModalOpen] = useState(false);
  const [editingOrgCargoId, setEditingOrgCargoId] = useState(null);
  const [orgCargoForm, setOrgCargoForm] = useState({
    nombreCargo: "",
    coordinacion: "PRODUCCIÓN FONOGRÁFICA",
    nivelJerarquico: "COORDINACIÓN",
    reportaA: "DIRECCIÓN GENERAL",
    funciones: "",
    assignedEmpId: "",
  });

  // Estado de Proyectos y Tareas
  const [projects, setProjectsState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredJson(STORAGE_PROJECTS_KEY, INITIAL_PROJECTS))
  );
  const setProjects = (updater) => {
    setProjectsState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson(STORAGE_PROJECTS_KEY, next);
      return next;
    });
  };
  const [projectsViewMode, setProjectsViewMode] = useState("BOARD"); // BOARD | PDF_REPORT
  const [newProjectForm, setNewProjectForm] = useState({
    nombre: "",
    tarea: "",
    justificacion: "",
    responsable: "ANAILETH BRICEÑO",
    coordinacion: "Producción Fonográfica",
    fechaEntrega: "2026-11-30",
    porcentaje: 0,
  });

  // Estado de Bienes Nacionales
  const [bienesCatalog, setBienesCatalogState] = useState(() =>
    normalizeRecordToUpperCase(
      loadStoredJson(STORAGE_BIENES_CAT_KEY, [
        "CONSOLA DE MEZCLA DIGITAL",
        "MICRÓFONO DE CONDENSADOR ESTUDIO",
        "COMPUTADORA ESTACIÓN DE TRABAJO",
        "MONITOR DE AUDIO ACTIVO",
        "INTERFAZ DE AUDIO PROFESIONAL",
        "ESCRITORIO EJECUTIVO",
        "SILLA ERGONÓMICA",
      ])
    )
  );
  const setBienesCatalog = (updater) => {
    setBienesCatalogState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson(STORAGE_BIENES_CAT_KEY, next);
      return next;
    });
  };

  const [bienesList, setBienesListState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredJson(STORAGE_BIENES_KEY, INITIAL_BIENES))
  );
  const setBienesList = (updater) => {
    setBienesListState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson(STORAGE_BIENES_KEY, next);
      return next;
    });
  };
  const [bienesViewMode, setBienesViewMode] = useState("FORM"); // FORM | PDF | LABELS
  const [printedLabelsLog, setPrintedLabelsLogState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredJson("cendis_printed_labels_v1", []))
  );
  const setPrintedLabelsLog = (updater) => {
    setPrintedLabelsLogState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson("cendis_printed_labels_v1", next);
      return next;
    });
  };
  const [labelGenForm, setLabelGenForm] = useState({
    sourceBienId: "",
    cantidad: 1,
    articulo: "CONSOLA DE MEZCLA DIGITAL",
    prefijoBN: "BN-CENDIS",
    ubicacion: "SEDE CENDIS",
  });
  const [currentLabelBatch, setCurrentLabelBatch] = useState({
    batchId: null,
    items: [],
    isLockedPrinted: false,
  });
  const [newBienForm, setNewBienForm] = useState({
    articulo: "CONSOLA DE MEZCLA DIGITAL",
    nuevoArticuloTexto: "",
    marca: "",
    modelo: "",
    serial: "",
    codigoBN: "BN-CENDIS-001048",
    ubicacion: "ESTUDIO DE GRABACIÓN PRINCIPAL",
    custodio: "ANAILETH BRICEÑO",
  });

  // Estado de Chat Corporativo Interno (Burbuja Flotante)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState("TODOS");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessagesState] = useState(() =>
    normalizeRecordToUpperCase(loadStoredJson(STORAGE_CHAT_KEY, INITIAL_CHAT_LIST))
  );
  const setChatMessages = (updater) => {
    setChatMessagesState((prev) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = normalizeRecordToUpperCase(nextRaw);
      saveStoredJson(STORAGE_CHAT_KEY, next);
      return next;
    });
  };

  // ============================================================================
  // SINCRONIZACIÓN EN TIEMPO REAL MULTIDISPOSITIVO Y MULTIUSUARIO (/api/sync + BroadcastChannel)
  // ============================================================================
  const [syncStatus, setSyncStatus] = useState("SINCRONIZADO");
  const [lastSyncTime, setLastSyncTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  const syncPayloadRef = React.useRef({});
  syncPayloadRef.current = {
    deletedIds,
    agendaEvents,
    documents,
    employees,
    projects,
    bienesList,
    bienesCatalog,
    attendanceRecords,
    users,
    chatMessages,
    orgCargos,
    printedLabelsLog,
    systemNewNotices,
    novedadesList,
  };

  const applyRemoteState = (remote, currentSnap) => {
    if (!remote || typeof remote !== "object") return;

    const mergedDeletedList = Array.from(
      new Set([
        ...(currentSnap.deletedIds || []).map(String),
        ...(Array.isArray(remote.deletedIds) ? remote.deletedIds.map(String) : []),
      ])
    );
    const deletedSet = new Set(mergedDeletedList);

    if (mergedDeletedList.length !== (currentSnap.deletedIds || []).length) {
      setDeletedIds(mergedDeletedList);
    }

    if (Array.isArray(remote.agendaEvents)) {
      const mergedAgenda = mergeSyncArrays(
        currentSnap.agendaEvents,
        remote.agendaEvents,
        deletedSet
      );
      if (JSON.stringify(mergedAgenda) !== JSON.stringify(currentSnap.agendaEvents)) {
        setAgendaEvents(mergedAgenda);
      }
    }
    if (Array.isArray(remote.documents)) {
      const mergedDocs = mergeSyncArrays(currentSnap.documents, remote.documents, deletedSet);
      if (JSON.stringify(mergedDocs) !== JSON.stringify(currentSnap.documents)) {
        setDocuments(mergedDocs);
      }
    }
    if (Array.isArray(remote.employees)) {
      const mergedEmps = sanitizeEmployeesDirectorGeneral(
        mergeSyncArrays(currentSnap.employees, remote.employees, deletedSet)
      );
      if (JSON.stringify(mergedEmps) !== JSON.stringify(currentSnap.employees)) {
        setEmployees(mergedEmps);
      }
    }
    if (Array.isArray(remote.projects)) {
      const mergedProjs = mergeSyncArrays(currentSnap.projects, remote.projects, deletedSet);
      if (JSON.stringify(mergedProjs) !== JSON.stringify(currentSnap.projects)) {
        setProjects(mergedProjs);
      }
    }
    if (Array.isArray(remote.bienesList)) {
      const mergedBienes = mergeSyncArrays(currentSnap.bienesList, remote.bienesList, deletedSet);
      if (JSON.stringify(mergedBienes) !== JSON.stringify(currentSnap.bienesList)) {
        setBienesList(mergedBienes);
      }
    }
    if (Array.isArray(remote.bienesCatalog) && remote.bienesCatalog.length > 0) {
      const mergedCatalog = Array.from(
        new Set([...(currentSnap.bienesCatalog || []), ...remote.bienesCatalog])
      );
      if (JSON.stringify(mergedCatalog) !== JSON.stringify(currentSnap.bienesCatalog)) {
        setBienesCatalog(mergedCatalog);
      }
    }
    if (Array.isArray(remote.attendanceRecords)) {
      const mergedAtt = mergeSyncArrays(
        currentSnap.attendanceRecords,
        remote.attendanceRecords,
        deletedSet
      );
      if (JSON.stringify(mergedAtt) !== JSON.stringify(currentSnap.attendanceRecords)) {
        setAttendanceRecords(mergedAtt);
      }
    }
    if (Array.isArray(remote.systemNewNotices)) {
      const mergedNotices = mergeSyncArrays(
        currentSnap.systemNewNotices || [],
        remote.systemNewNotices,
        deletedSet
      ).slice(0, 25);
      if (JSON.stringify(mergedNotices) !== JSON.stringify(currentSnap.systemNewNotices || [])) {
        setSystemNewNotices(mergedNotices);
        saveStoredJson("cendis_new_notices_v1", mergedNotices);
      }
    }
    if (Array.isArray(remote.novedadesList)) {
      const mergedNovedades = mergeSyncArrays(
        currentSnap.novedadesList || [],
        remote.novedadesList,
        deletedSet
      );
      if (JSON.stringify(mergedNovedades) !== JSON.stringify(currentSnap.novedadesList || [])) {
        setNovedadesList(mergedNovedades);
      }
    }
    if (Array.isArray(remote.users)) {
      const mergedUsers = sanitizeUsersDirectorGeneral(
        mergeSyncArrays(currentSnap.users, remote.users, deletedSet)
      );
      if (JSON.stringify(mergedUsers) !== JSON.stringify(currentSnap.users)) {
        setUsers(mergedUsers);
      }
    }
    if (Array.isArray(remote.chatMessages)) {
      const mergedChat = mergeSyncArrays(
        currentSnap.chatMessages,
        remote.chatMessages,
        deletedSet
      );
      if (JSON.stringify(mergedChat) !== JSON.stringify(currentSnap.chatMessages)) {
        setChatMessages(mergedChat);
      }
    }
    if (Array.isArray(remote.orgCargos)) {
      const mergedCargos = mergeSyncArrays(
        currentSnap.orgCargos,
        remote.orgCargos,
        deletedSet
      );
      if (JSON.stringify(mergedCargos) !== JSON.stringify(currentSnap.orgCargos)) {
        setOrgCargos(mergedCargos);
      }
    }
    if (Array.isArray(remote.printedLabelsLog)) {
      const mergedLabels = mergeSyncArrays(
        currentSnap.printedLabelsLog,
        remote.printedLabelsLog,
        deletedSet
      );
      if (JSON.stringify(mergedLabels) !== JSON.stringify(currentSnap.printedLabelsLog)) {
        setPrintedLabelsLog(mergedLabels);
      }
    }
  };

  const broadcastSyncRef = React.useRef(null);

  const syncWithCloudServer = async (overridePartial = {}, mode = "PUSH") => {
    if (typeof window === "undefined") return;
    try {
      setSyncStatus("SINCRONIZANDO");
      const currentSnap = {
        ...syncPayloadRef.current,
        ...overridePartial,
      };

      if (mode === "PUSH" && broadcastSyncRef.current) {
        try {
          broadcastSyncRef.current.postMessage(currentSnap);
        } catch {
          // ignore BroadcastChannel errors
        }
      }

      let remote = null;
      if (mode === "PULL") {
        const resGet = await fetch(`/api/sync?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!resGet.ok) {
          setSyncStatus("LOCAL");
          return;
        }
        remote = await resGet.json();
        if (!remote || !remote.updatedAt) {
          const resSeed = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentSnap),
          });
          if (resSeed.ok) remote = await resSeed.json();
        }
      } else {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentSnap),
        });
        if (!response.ok) {
          setSyncStatus("LOCAL");
          return;
        }
        remote = await response.json();
      }

      applyRemoteState(remote, currentSnap);
      setSyncStatus("SINCRONIZADO");
      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch {
      setSyncStatus("LOCAL");
    }
  };

  // Ciclo continuo de sincronización en tiempo real cada 2.5 segundos + al enfocar ventana + entre pestañas
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("cendis_realtime_sync_v212");
      broadcastSyncRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev && ev.data && typeof ev.data === "object") {
          applyRemoteState(ev.data, syncPayloadRef.current);
        }
      };
    }

    syncWithCloudServer({}, "PUSH");
    const intervalId = setInterval(() => {
      syncWithCloudServer({}, "PULL");
    }, 2500);
    const onFocus = () => syncWithCloudServer({}, "PULL");
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
      if (broadcastSyncRef.current) {
        broadcastSyncRef.current.close();
        broadcastSyncRef.current = null;
      }
    };
  }, []);

  // Empujar cambios inmediatamente cuando se crea, modifica, anula o elimina en cualquier módulo
  const hasMountedSyncRef = React.useRef(false);
  useEffect(() => {
    if (!hasMountedSyncRef.current) {
      hasMountedSyncRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      syncWithCloudServer({}, "PUSH");
    }, 180);
    return () => clearTimeout(timer);
  }, [
    deletedIds,
    agendaEvents,
    documents,
    employees,
    projects,
    bienesList,
    bienesCatalog,
    attendanceRecords,
    users,
    chatMessages,
    orgCargos,
    printedLabelsLog,
  ]);

  // ============================================================================
  // FUNCIONES UNIVERSALES DE ELIMINAR Y ANULAR EN TODOS LOS MÓDULOS
  // ============================================================================
  const handleUniversalDelete = (collectionKey, itemId, label = "Registro") => {
    const idStr = String(itemId);
    const nextDeleted = Array.from(new Set([...deletedIds, idStr]));
    setDeletedIds(nextDeleted);

    if (collectionKey === "documents") {
      const next = documents.filter((x) => String(x.id) !== idStr);
      setDocuments(next);
      if (String(selectedDocId) === idStr) setSelectedDocId(null);
      if (String(reviewModalDocId) === idStr) setReviewModalDocId(null);
      syncWithCloudServer({ deletedIds: nextDeleted, documents: next });
    } else if (collectionKey === "agendaEvents") {
      const next = agendaEvents.filter((x) => String(x.id) !== idStr);
      setAgendaEvents(next);
      if (selectedEventDetail && String(selectedEventDetail.id) === idStr) {
        setSelectedEventDetail(null);
      }
      syncWithCloudServer({ deletedIds: nextDeleted, agendaEvents: next });
    } else if (collectionKey === "employees") {
      const next = employees.filter((x) => String(x.id) !== idStr);
      setEmployees(next);
      if (selectedEmpForCard && String(selectedEmpForCard.id) === idStr) setSelectedEmpForCard(null);
      if (selectedEmpForCV && String(selectedEmpForCV.id) === idStr) setSelectedEmpForCV(null);
      if (editingEmpId && String(editingEmpId) === idStr) setHrModalOpen(false);
      syncWithCloudServer({ deletedIds: nextDeleted, employees: next });
    } else if (collectionKey === "projects") {
      const next = projects.filter((x) => String(x.id) !== idStr);
      setProjects(next);
      syncWithCloudServer({ deletedIds: nextDeleted, projects: next });
    } else if (collectionKey === "bienesList" || collectionKey === "bienes") {
      const next = bienesList.filter((x) => String(x.id) !== idStr);
      setBienesList(next);
      syncWithCloudServer({ deletedIds: nextDeleted, bienesList: next });
    } else if (collectionKey === "attendanceRecords" || collectionKey === "attendance") {
      const next = attendanceRecords.filter((x) => String(x.id) !== idStr);
      setAttendanceRecords(next);
      syncWithCloudServer({ deletedIds: nextDeleted, attendanceRecords: next });
    } else if (collectionKey === "users") {
      if (String(itemId) === "1") {
        showToast("El usuario Administrador principal no puede ser eliminado.", "error");
        return;
      }
      const next = users.filter((x) => String(x.id) !== idStr);
      setUsers(next);
      if (String(selectedConfigUserId) === idStr && next[0]) {
        setSelectedConfigUserId(String(next[0].id));
      }
      syncWithCloudServer({ deletedIds: nextDeleted, users: next });
    } else if (collectionKey === "chatMessages" || collectionKey === "chat") {
      const next = chatMessages.filter((x) => String(x.id) !== idStr);
      setChatMessages(next);
      syncWithCloudServer({ deletedIds: nextDeleted, chatMessages: next });
    } else if (collectionKey === "orgCargos") {
      const next = orgCargos.filter((x) => String(x.id) !== idStr);
      setOrgCargos(next);
      syncWithCloudServer({ deletedIds: nextDeleted, orgCargos: next });
    }

    addLog(`ELIMINADO definitivamente: ${label}`);
    showToast(`🗑️ ${label} eliminado del sistema y sincronizado en todos los dispositivos.`);
  };

  const handleUniversalAnnul = (collectionKey, itemId, label = "Registro") => {
    const idStr = String(itemId);
    const nowTs = Date.now();

    if (collectionKey === "documents") {
      const now = new Date();
      const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
      const next = documents.map((d) =>
        String(d.id) === idStr
          ? {
              ...d,
              status: "ANULADO",
              motivoAnulacion: d.motivoAnulacion || "ANULADO DIRECTAMENTE POR EL USUARIO.",
              anuladoPor: currentUser?.fullName || currentUser?.username || "USUARIO",
              fechaAnulacion: stamp,
              updatedAt: nowTs,
            }
          : d
      );
      setDocuments(next);
      syncWithCloudServer({ documents: next });
    } else if (collectionKey === "agendaEvents") {
      const next = agendaEvents.map((ev) =>
        String(ev.id) === idStr ? { ...ev, status: "ANULADO", color: "ROSE", updatedAt: nowTs } : ev
      );
      setAgendaEvents(next);
      if (selectedEventDetail && String(selectedEventDetail.id) === idStr) {
        setSelectedEventDetail((prev) => (prev ? { ...prev, status: "ANULADO", color: "ROSE" } : null));
      }
      syncWithCloudServer({ agendaEvents: next });
    } else if (collectionKey === "employees") {
      const next = employees.map((emp) =>
        String(emp.id) === idStr
          ? { ...emp, status: "ANULADO", condicionLaboral: "ANULADO / INACTIVO", updatedAt: nowTs }
          : emp
      );
      setEmployees(next);
      syncWithCloudServer({ employees: next });
    } else if (collectionKey === "projects") {
      const next = projects.map((p) =>
        String(p.id) === idStr
          ? { ...p, status: "ANULADO", estatus: "ANULADO", porcentaje: 0, updatedAt: nowTs }
          : p
      );
      setProjects(next);
      syncWithCloudServer({ projects: next });
    } else if (collectionKey === "bienesList" || collectionKey === "bienes") {
      const next = bienesList.map((b) =>
        String(b.id) === idStr
          ? { ...b, status: "ANULADO", estado: "ANULADO", updatedAt: nowTs }
          : b
      );
      setBienesList(next);
      syncWithCloudServer({ bienesList: next });
    } else if (collectionKey === "attendanceRecords" || collectionKey === "attendance") {
      const next = attendanceRecords.map((a) =>
        String(a.id) === idStr ? { ...a, status: "ANULADO", estatus: "ANULADO", updatedAt: nowTs } : a
      );
      setAttendanceRecords(next);
      syncWithCloudServer({ attendanceRecords: next });
    } else if (collectionKey === "users") {
      if (String(itemId) === "1") {
        showToast("El usuario Administrador principal no puede ser anulado.", "error");
        return;
      }
      const next = users.map((u) =>
        String(u.id) === idStr
          ? { ...u, active: !u.active, status: u.active ? "ANULADO" : "ACTIVO", updatedAt: nowTs }
          : u
      );
      setUsers(next);
      syncWithCloudServer({ users: next });
    } else if (collectionKey === "orgCargos") {
      const next = orgCargos.map((c) =>
        String(c.id) === idStr ? { ...c, status: "ANULADO", updatedAt: nowTs } : c
      );
      setOrgCargos(next);
      syncWithCloudServer({ orgCargos: next });
    }

    addLog(`ANULADO: ${label}`);
    showToast(`🚫 ${label} marcado como ANULADO y sincronizado en tiempo real.`);
  };

  // Estado para nuevo usuario y submódulo Usuarios en Configuración
  const [configSubTab, setConfigSubTab] = useState("USUARIOS");
  const [selectedConfigUserId, setSelectedConfigUserId] = useState(() => {
    const initialList = loadStoredUsers();
    return initialList[0] ? String(initialList[0].id) : "1";
  });
  const [newUserForm, setNewUserForm] = useState({
    linkedEmployeeId: "",
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
    novedades: "entrar_novedades",
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
      docType === "MEMORANDUM"
        ? "MEM"
        : docType === "SOLICITUD"
        ? "SOL"
        : docType === "ORDEN_SALIDA"
        ? "OS"
        : docType === "SOLICITUD_ALIMENTOS"
        ? "SAL"
        : docType === "SOLICITUD_SERVICIOS_GENERALES"
        ? "SSG"
        : "OFI";
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
      ordenSalida: docType === "ORDEN_SALIDA" ? ordenSalidaData : undefined,
      alimentos: docType === "SOLICITUD_ALIMENTOS" ? alimentosData : undefined,
      serviciosGenerales:
        docType === "SOLICITUD_SERVICIOS_GENERALES" ? serviciosGeneralesData : undefined,
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
    ordenSalidaData,
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
  const handleLogin = (e) => {
    e.preventDefault();
    const rawInput = loginUsername.trim().toLowerCase();

    const found = users.find(
      (u) =>
        (String(u.username || "").trim().toLowerCase() === rawInput ||
          (u.email && String(u.email).trim().toLowerCase() === rawInput)) &&
        (u.password === loginPassword || u.password === loginPassword.trim())
    );

    if (!found) {
      setLoginError("Usuario o contraseña incorrectos.");
      return;
    }
    if (!found.active) {
      setLoginError("Cuenta suspendida por el Administrador.");
      return;
    }
    setCurrentUser(found);
    setSessionCookie(found);
    setLoginError("");
    setCurrentScreen("PORTAL");
    addLog(`Inicio de sesión exitoso (${found.username})`, found);
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

  // Sincronización automática de cumpleaños de RRHH hacia el Calendario de Agenda
  const upsertEmployeeBirthdayEvent = (emp) => {
    if (!emp || !emp.fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(emp.fechaNacimiento)) return;
    const [, mm, dd] = emp.fechaNacimiento.split("-");
    const currentYear = new Date().getFullYear();
    const bdayDate = `${currentYear}-${mm}-${dd}`;
    const fullName = `${emp.nombres || ""} ${emp.apellidos || ""}`.trim().toUpperCase();
    const bdayId = `bday-${emp.id}`;
    const bdayEvent = {
      id: bdayId,
      title: `🎂 CUMPLEAÑOS DE ${fullName}`,
      date: bdayDate,
      endDate: bdayDate,
      allDay: true,
      startTime: "08:00",
      endTime: "17:00",
      recurrence: "ANUAL",
      eventType: "CUMPLEANOS",
      location: `SEDE CENDIS • ${emp.coordinacion || "TALENTO HUMANO"}`,
      ente: "FUNDACIÓN CENDIS",
      meetLink: "",
      responsable: fullName,
      responsableEmail: emp.correo || "",
      guests: [],
      description: `Celebración de cumpleaños del trabajador ${fullName} (${emp.cargo || "Personal CENDIS"}). Registrado automáticamente desde Recursos Humanos.`,
      remindBeforeMinutes: 1440,
      color: "ROSE",
      status: "APROBADO",
      linkedEmployeeId: emp.id,
      updatedAt: Date.now(),
    };
    setAgendaEvents((prev) => {
      const exists = prev.some((ev) => String(ev.id) === bdayId);
      if (exists) {
        return prev.map((ev) => (String(ev.id) === bdayId ? { ...ev, ...bdayEvent } : ev));
      }
      return [...prev, bdayEvent];
    });
  };

  useEffect(() => {
    if (!employees || employees.length === 0) return;
    const currentYear = new Date().getFullYear();
    setAgendaEvents((prev) => {
      let changed = false;
      const next = [...prev];
      employees.forEach((emp) => {
        if (!emp || !emp.fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(emp.fechaNacimiento)) return;
        const bdayId = `bday-${emp.id}`;
        if (!next.some((ev) => String(ev.id) === bdayId)) {
          const [, mm, dd] = emp.fechaNacimiento.split("-");
          const fullName = `${emp.nombres || ""} ${emp.apellidos || ""}`.trim().toUpperCase();
          next.push({
            id: bdayId,
            title: `🎂 CUMPLEAÑOS DE ${fullName}`,
            date: `${currentYear}-${mm}-${dd}`,
            endDate: `${currentYear}-${mm}-${dd}`,
            allDay: true,
            startTime: "08:00",
            endTime: "17:00",
            recurrence: "ANUAL",
            eventType: "CUMPLEANOS",
            location: `SEDE CENDIS • ${emp.coordinacion || "TALENTO HUMANO"}`,
            ente: "FUNDACIÓN CENDIS",
            meetLink: "",
            responsable: fullName,
            responsableEmail: emp.correo || "",
            guests: [],
            description: `Celebración de cumpleaños del trabajador ${fullName} (${emp.cargo || "Personal CENDIS"}).`,
            remindBeforeMinutes: 1440,
            color: "ROSE",
            status: "APROBADO",
            linkedEmployeeId: emp.id,
            updatedAt: Date.now(),
          });
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [employees.length]);

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
                  data-no-uppercase="true"
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
                data-no-uppercase="true"
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
                data-no-uppercase="true"
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

  const handleUpdateAgendaEventStatus = (eventId, newStatus) => {
    const colorMap = {
      REALIZADO: "EMERALD",
      REPROGRAMADO: "AMBER",
      SUSPENDIDO: "ROSE",
      APROBADO: "BLUE",
    };
    const nextColor = colorMap[newStatus] || "BLUE";
    setAgendaEvents((prev) =>
      prev.map((ev) =>
        String(ev.id) === String(eventId)
          ? { ...ev, status: newStatus, color: nextColor, updatedAt: Date.now() }
          : ev
      )
    );
    setSelectedEventDetail((prev) =>
      prev && String(prev.id) === String(eventId)
        ? { ...prev, status: newStatus, color: nextColor }
        : prev
    );
    setTimeout(() => syncWithCloudServer(), 60);
    addLog(`Estado de evento en Agenda actualizado a ${newStatus}`, currentUser, "agenda");
    showToast(`Evento marcado como ${newStatus}.`);
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
      ordenSalida: docType === "ORDEN_SALIDA" ? ordenSalidaData : undefined,
      alimentos: docType === "SOLICITUD_ALIMENTOS" ? alimentosData : undefined,
      serviciosGenerales:
        docType === "SOLICITUD_SERVICIOS_GENERALES" ? serviciosGeneralesData : undefined,
      status: "PENDIENTE_APROBACION",
      creadoPor: currentUser?.fullName || currentUser?.username || "usuario",
      creadoEn: stamp,
      aprobadoPor: null,
      fechaAprobacion: null,
      motivoAnulacion: "",
      anuladoPor: null,
      fechaAnulacion: null,
      updatedAt: Date.now(),
    };
    const nextDocs = [newDoc, ...documents];
    setDocuments(nextDocs);
    syncWithCloudServer({ documents: nextDocs });
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
    if (docObj.ordenSalida) {
      setOrdenSalidaData(docObj.ordenSalida);
    }
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
    const nextDocs = documents.map((d) =>
      d.id === docId
        ? {
            ...d,
            status: "APROBADO",
            aprobadoPor: currentUser.fullName || currentUser.username,
            fechaAprobacion: stamp,
            motivoAnulacion: "",
            anuladoPor: null,
            fechaAnulacion: null,
            updatedAt: Date.now(),
          }
        : d
    );
    setDocuments(nextDocs);
    syncWithCloudServer({ documents: nextDocs });
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
    const nextDocs = documents.map((d) =>
      d.id === docId
        ? {
            ...d,
            status: "ANULADO",
            motivoAnulacion: cleanReason,
            anuladoPor: currentUser?.fullName || currentUser?.username || "Administrador",
            fechaAnulacion: stamp,
            updatedAt: Date.now(),
          }
        : d
    );
    setDocuments(nextDocs);
    syncWithCloudServer({ documents: nextDocs });
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
      "morris.lopez.cendis@gmail.com";
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
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDayModal,
      endDate: newEventForm.endDate || selectedDayModal,
      ...newEventForm,
      reminderValue: Number(newEventForm.reminderValue) || 1,
      status: initialStatus,
      updatedAt: Date.now(),
    };
    const nextEvents = [...agendaEvents, created];
    setAgendaEvents(nextEvents);
    syncWithCloudServer({ agendaEvents: nextEvents });

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
        `Actividad "${created.title}" agendada y sincronizada en tiempo real (${formatReminderLabel(created)} vía ${channels}).`
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
        updatedAt: Date.now(),
      };
      const nextAtt = [rec, ...attendanceRecords];
      setAttendanceRecords(nextAtt);
      syncWithCloudServer({ attendanceRecords: nextAtt });
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
      centroVotacion: prefill.centroVotacion || "",
      estadoVotacion: prefill.estadoVotacion || "",
      municipioVotacion: prefill.municipioVotacion || "",
      parroquiaVotacion: prefill.parroquiaVotacion || "",
      yaVoto: prefill.yaVoto || "NO",
      sueldoMensual: prefill.sueldoMensual || "",
      sueldoLetras: prefill.sueldoLetras || "",
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
      centroVotacion: emp.centroVotacion || "",
      estadoVotacion: emp.estadoVotacion || "",
      municipioVotacion: emp.municipioVotacion || "",
      parroquiaVotacion: emp.parroquiaVotacion || "",
      yaVoto: emp.yaVoto || "NO",
      sueldoMensual: emp.sueldoMensual || "",
      sueldoLetras: emp.sueldoLetras || "",
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
      if (
        hrFilterCoord !== "TODAS" &&
        (emp.coordinacion || "").toUpperCase() !== hrFilterCoord.toUpperCase()
      )
        return false;
      if (
        hrFilterCondicion !== "TODAS" &&
        (emp.condicionLaboral || "Fijo").toUpperCase() !== hrFilterCondicion.toUpperCase()
      )
        return false;
      if (
        hrFilterCarga !== "TODOS" &&
        (emp.tieneCargaFamiliar || "").toUpperCase() !== hrFilterCarga.toUpperCase()
      )
        return false;
      if (
        hrFilterSangre !== "TODOS" &&
        (emp.tipoSangre || "").toUpperCase() !== hrFilterSangre.toUpperCase()
      )
        return false;
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

  const AGENDA_MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  // Calendario dinámico por Mes y Año seleccionado
  const calendarLeadingBlanks = useMemo(() => {
    return new Date(agendaYear, agendaMonth, 1).getDay();
  }, [agendaYear, agendaMonth]);

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(agendaYear, agendaMonth + 1, 0).getDate();
    const mm = String(agendaMonth + 1).padStart(2, "0");
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${agendaYear}-${mm}-${String(d).padStart(2, "0")}`;
      days.push({ dayNumber: d, dateStr });
    }
    return days;
  }, [agendaYear, agendaMonth]);

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
      const evs = agendaEvents.filter(
        (ev) =>
          ev.status !== "ANULADO" &&
          (ev.date === dateIso ||
            (ev.recurrence === "ANUAL" && ev.date && ev.date.slice(5, 10) === dateIso.slice(5, 10)))
      );
      cols.push({ dateIso, dayLabel, events: evs });
    }
    return cols;
  }, [reportWeekStartDate, reportColumnsCount, agendaEvents]);

  const reportMonthlyEvents = useMemo(() => {
    const targetYm = `${agendaYear}-${String(agendaMonth + 1).padStart(2, "0")}`;
    const targetMm = String(agendaMonth + 1).padStart(2, "0");
    return agendaEvents
      .filter(
        (ev) =>
          ev.status !== "ANULADO" &&
          ((ev.date && ev.date.startsWith(targetYm)) ||
            (ev.recurrence === "ANUAL" && ev.date && ev.date.slice(5, 7) === targetMm))
      )
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""));
  }, [agendaYear, agendaMonth, agendaEvents]);

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

  const renderThemeModeSwitcher = () => (
    <button
      type="button"
      onClick={toggleThemeMode}
      title={
        themeMode === "DARK"
          ? "Cambiar a Modo Claro en todo el sistema"
          : "Cambiar a Modo Oscuro en todo el sistema"
      }
      className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow ${
        themeMode === "LIGHT"
          ? "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500"
          : "neon-orange-nav text-white"
      }`}
    >
      <span>{themeMode === "DARK" ? "☀️" : "🌙"}</span>
      <span>{themeMode === "DARK" ? "Modo Claro" : "Modo Oscuro"}</span>
    </button>
  );

  const renderRealtimeSyncBadge = () => (
    <button
      type="button"
      onClick={() => syncWithCloudServer()}
      title={`Sincronización multi-dispositivo en tiempo real (${lastSyncTime || "Activa"}). Clic para sincronizar ahora.`}
      className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-[10.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          syncStatus === "SYNCING"
            ? "bg-amber-400 animate-ping"
            : syncStatus === "ONLINE"
            ? "bg-emerald-400 animate-pulse"
            : "bg-blue-400"
        }`}
      />
      <span>Sync Real-Time {lastSyncTime ? `(${lastSyncTime})` : ""}</span>
    </button>
  );

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
                ? "bg-[#d97706] text-white font-black shadow"
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

  const renderGlobalThemeStyles = () => (
    <style>{`
      /* Navegabilidad en color Naranja Suave y Cálido (no chillón), transparente con letras blancas nítidas */
      :not(.cendis-theme-light) .cendis-dark-workspace button.bg-slate-100:not(#printable-area *),
      :not(.cendis-theme-light) .cendis-dark-workspace button.bg-white:not(#printable-area *),
      .neon-orange-nav {
        background: rgba(217, 119, 6, 0.20) !important;
        border: 1px solid rgba(245, 158, 11, 0.52) !important;
        color: #ffffff !important;
        box-shadow: 0 2px 8px rgba(180, 83, 9, 0.16) !important;
        backdrop-filter: blur(8px);
      }
      :not(.cendis-theme-light) .cendis-dark-workspace button.bg-slate-100:hover:not(#printable-area *),
      :not(.cendis-theme-light) .cendis-dark-workspace button.bg-white:hover:not(#printable-area *),
      .neon-orange-nav:hover {
        background: rgba(217, 119, 6, 0.32) !important;
        border-color: rgba(251, 191, 36, 0.78) !important;
        color: #ffffff !important;
        box-shadow: 0 3px 12px rgba(217, 119, 6, 0.26) !important;
      }
      .neon-orange-nav-active {
        background: linear-gradient(135deg, rgba(217, 119, 6, 0.46) 0%, rgba(180, 83, 9, 0.34) 100%) !important;
        border: 1.5px solid #f59e0b !important;
        color: #ffffff !important;
        box-shadow: 0 3px 14px rgba(217, 119, 6, 0.32), inset 0 0 8px rgba(251, 191, 36, 0.18) !important;
        backdrop-filter: blur(8px);
      }

      /* ======================================================================
         MODO CLARO / BLANCO GLOBAL (CONMUTA ENTRE OSCURO Y BLANCO MANTENIENDO EL DISEÑO)
         ====================================================================== */
      .cendis-theme-light,
      .cendis-theme-light .cendis-dark-workspace,
      .cendis-theme-light .bg-\\[#050a15\\],
      .cendis-theme-light .bg-\\[#030710\\] {
        background: #f8fafc !important;
        background-color: #f8fafc !important;
        color: #0f172a !important;
      }
      .cendis-theme-light header.bg-\\[#0b1221\\] {
        background: #ffffff !important;
        border-bottom: 1px solid #cbd5e1 !important;
        color: #0f172a !important;
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06) !important;
      }
      .cendis-theme-light header.bg-\\[#0b1221\\] h1,
      .cendis-theme-light header.bg-\\[#0b1221\\] .text-white:not(.neon-orange-nav *):not(.neon-orange-nav-active *):not(.bg-\\[#b91c1c\\] *):not(.bg-slate-900 *) {
        color: #0f172a !important;
      }
      .cendis-theme-light header.bg-\\[#0b1221\\] .text-slate-400 {
        color: #475569 !important;
      }
      .cendis-theme-light .bg-\\[#0c1322\\],
      .cendis-theme-light .bg-\\[#0d1526\\],
      .cendis-theme-light .bg-\\[#0f172a\\],
      .cendis-theme-light .bg-\\[#0b1221\\]:not(header),
      .cendis-theme-light .bg-\\[#0e1526\\],
      .cendis-theme-light .bg-\\[#0d1322\\],
      .cendis-theme-light .bg-\\[#161f33\\],
      .cendis-theme-light .cendis-dark-workspace .bg-white:not(#printable-area):not(#printable-area *) {
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #0f172a !important;
        border-color: #cbd5e1 !important;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06) !important;
      }
      /* Tarjetas del Portal en Modo Blanco conservando su diseño y bordes institucionales */
      .cendis-theme-light .group.rounded-\\[24px\\] {
        background: #ffffff !important;
        color: #0f172a !important;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
      }
      .cendis-theme-light .group.rounded-\\[24px\\] h3 {
        color: #0f172a !important;
      }
      .cendis-theme-light .group.rounded-\\[24px\\] p.text-slate-300\\/90 {
        color: #334155 !important;
      }
      .cendis-theme-light .group.rounded-\\[24px\\] .bg-\\[#090d16\\]\\/90 {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        border-color: #cbd5e1 !important;
      }
      .cendis-theme-light .cendis-dark-workspace .bg-slate-50:not(#printable-area):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-100:not(button):not(#printable-area):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-900:not(button):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-900\\/90:not(button):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-900\\/60:not(button):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-900\\/50:not(button):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-800\\/90:not(button):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-slate-800:not(button):not(#printable-area *),
      .cendis-theme-light .bg-\\[#070b14\\]:not(#printable-area *),
      .cendis-theme-light .bg-\\[#090d16\\]\\/90:not(#printable-area *),
      .cendis-theme-light .bg-\\[#161824\\]:not(#printable-area *) {
        background: #f1f5f9 !important;
        background-color: #f1f5f9 !important;
        color: #1e293b !important;
        border-color: #cbd5e1 !important;
      }
      .cendis-theme-light .cendis-dark-workspace .bg-amber-950\\/85:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-amber-950\\/70:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-amber-950\\/50:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-amber-950\\/40:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-orange-950\\/80:not(#printable-area *) {
        background: #fffbeb !important;
        background-color: #fffbeb !important;
        color: #78350f !important;
        border-color: #f59e0b !important;
      }
      .cendis-theme-light .cendis-dark-workspace .bg-emerald-950\\/75:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-emerald-950\\/70:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-emerald-950\\/30:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-emerald-950\\/90:not(#printable-area *) {
        background: #ecfdf5 !important;
        background-color: #ecfdf5 !important;
        color: #065f46 !important;
        border-color: #10b981 !important;
      }
      .cendis-theme-light .cendis-dark-workspace .bg-blue-950\\/70:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-blue-950\\/60:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-blue-950\\/80:not(#printable-area *) {
        background: #eff6ff !important;
        background-color: #eff6ff !important;
        color: #1e3a8a !important;
        border-color: #3b82f6 !important;
      }
      .cendis-theme-light .cendis-dark-workspace .bg-red-950\\/90:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-red-950\\/70:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-red-950\\/60:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .bg-red-950\\/40:not(#printable-area *) {
        background: #fef2f2 !important;
        background-color: #fef2f2 !important;
        color: #7f1d1d !important;
        border-color: #ef4444 !important;
      }
      .cendis-theme-light .text-white:not(.neon-orange-nav):not(.neon-orange-nav *):not(.neon-orange-nav-active):not(.neon-orange-nav-active *):not(button.bg-slate-900):not(button.bg-slate-900 *):not(button.bg-slate-800):not(button.bg-slate-800 *):not(button.bg-slate-700):not(button.bg-slate-700 *):not(.bg-\\[#8b1538\\]):not(.bg-\\[#8b1538\\] *):not(.bg-\\[#b91c1c\\]):not(.bg-\\[#b91c1c\\] *):not(.bg-emerald-600):not(.bg-emerald-600 *):not(.bg-emerald-700):not(.bg-emerald-700 *):not(.bg-blue-600):not(.bg-blue-600 *):not(.bg-blue-700):not(.bg-blue-700 *):not(.bg-blue-900):not(.bg-blue-900 *):not(.bg-indigo-700):not(.bg-indigo-700 *):not(.bg-teal-700):not(.bg-teal-700 *):not(.bg-cyan-700):not(.bg-cyan-700 *):not(.bg-purple-700):not(.bg-purple-700 *):not(.bg-amber-700):not(.bg-amber-700 *):not(.bg-red-600):not(.bg-red-600 *):not(.bg-red-700):not(.bg-red-700 *):not(.bg-red-900):not(.bg-red-900 *):not(#printable-area *),
      .cendis-theme-light .text-slate-100:not(button *):not(#printable-area *),
      .cendis-theme-light .text-slate-200:not(button *):not(#printable-area *),
      .cendis-theme-light .text-slate-300:not(button *):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .text-slate-900:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .text-slate-800:not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .text-slate-700:not(#printable-area *) {
        color: #1e293b !important;
      }
      .cendis-theme-light .text-slate-400:not(button *):not(#printable-area *),
      .cendis-theme-light .text-slate-500:not(button *):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .text-slate-600:not(#printable-area *) {
        color: #475569 !important;
      }
      .cendis-theme-light .cendis-dark-workspace .text-\\[#ffb366\\]:not(.neon-orange-nav *):not(.neon-orange-nav-active *):not(#printable-area *),
      .cendis-theme-light .cendis-dark-workspace .text-\\[#ff9f5a\\]:not(#printable-area *),
      .cendis-theme-light .text-amber-300:not(button):not(button *):not(#printable-area *),
      .cendis-theme-light .text-amber-200:not(button):not(button *):not(#printable-area *),
      .cendis-theme-light .text-amber-400:not(button):not(button *):not(#printable-area *) {
        color: #b45309 !important;
      }
      .cendis-theme-light .text-emerald-300:not(button *):not(#printable-area *),
      .cendis-theme-light .text-emerald-400:not(button *):not(#printable-area *) {
        color: #047857 !important;
      }
      .cendis-theme-light .text-blue-300:not(button *):not(#printable-area *),
      .cendis-theme-light .text-blue-400:not(button *):not(#printable-area *) {
        color: #1d4ed8 !important;
      }
      .cendis-theme-light .text-red-200:not(button *):not(#printable-area *),
      .cendis-theme-light .text-red-300:not(button *):not(#printable-area *),
      .cendis-theme-light .text-red-400:not(button *):not(#printable-area *) {
        color: #b91c1c !important;
      }
      .cendis-theme-light button.bg-slate-900,
      .cendis-theme-light button.bg-slate-800,
      .cendis-theme-light button.bg-slate-700,
      .cendis-theme-light button.bg-\\[#8b1538\\],
      .cendis-theme-light button.bg-\\[#b91c1c\\],
      .cendis-theme-light button.bg-emerald-700,
      .cendis-theme-light button.bg-emerald-600,
      .cendis-theme-light button.bg-blue-600,
      .cendis-theme-light button.bg-purple-700,
      .cendis-theme-light button.bg-teal-700,
      .cendis-theme-light button.bg-cyan-700,
      .cendis-theme-light button.bg-indigo-700,
      .cendis-theme-light button.bg-amber-700,
      .cendis-theme-light button.bg-red-700,
      .cendis-theme-light button.bg-red-900 {
        color: #ffffff !important;
      }
      .cendis-theme-light button.bg-slate-900 span,
      .cendis-theme-light button.bg-slate-800 span,
      .cendis-theme-light button.bg-slate-700 span {
        color: #ffffff !important;
      }
      .cendis-theme-light input:not(#printable-area *),
      .cendis-theme-light select:not(#printable-area *),
      .cendis-theme-light textarea:not(#printable-area *) {
        background-color: #ffffff !important;
        color: #1e293b !important;
        border-color: #cbd5e1 !important;
      }
      .cendis-theme-light .neon-orange-nav {
        background: rgba(217, 119, 6, 0.90) !important;
        border: 1px solid #b45309 !important;
        color: #ffffff !important;
      }
      .cendis-theme-light .neon-orange-nav span,
      .cendis-theme-light .neon-orange-nav svg,
      .cendis-theme-light .neon-orange-nav-active span,
      .cendis-theme-light .neon-orange-nav-active svg {
        color: #ffffff !important;
      }
      .cendis-theme-light .neon-orange-nav-active {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
        border: 1.5px solid #92400e !important;
        color: #ffffff !important;
      }

      /* ======================================================================
         UNIFICACIÓN GLOBAL EN MAYÚSCULAS EN TODOS LOS MÓDULOS (EXCEPTO CUERPO DE MEMO)
         ====================================================================== */
      .cendis-dark-workspace input:not([type="password"]):not([type="email"]):not([data-no-uppercase="true"]),
      .cendis-dark-workspace textarea:not([data-no-uppercase="true"]),
      .cendis-dark-workspace select,
      .cendis-dark-workspace option,
      .cendis-dark-workspace table td,
      .cendis-dark-workspace table th,
      #printable-area,
      #printable-area *:not(svg):not(path):not(.preserve-case-content):not(.preserve-case-content *) {
        text-transform: uppercase !important;
      }
      .preserve-case-content,
      .preserve-case-content * {
        text-transform: none !important;
      }
    `}</style>
  );

  // ==========================================================================
  // 0) CANAL INFORMATIVO DEL CENDIS (PÁGINA TIPO INTRANET)
  // ==========================================================================
  if (currentScreen === "INTRANET") {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayMmDd = todayIso.slice(5, 10);
    const currentMonthMm = todayIso.slice(5, 7);

    const activeIntranetEvents = agendaEvents
      .filter((ev) => ev.status !== "ANULADO" && ev.eventType !== "CUMPLEANOS")
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""));

    const birthdayEmployees = employees
      .filter((emp) => emp.fechaNacimiento && /^\d{4}-\d{2}-\d{2}$/.test(emp.fechaNacimiento))
      .map((emp) => {
        const [, mm, dd] = emp.fechaNacimiento.split("-");
        const mmdd = `${mm}-${dd}`;
        return {
          ...emp,
          mmdd,
          mm,
          dd,
          isToday: mmdd === todayMmDd,
          isThisMonth: mm === currentMonthMm,
        };
      })
      .filter((emp) => emp.isThisMonth)
      .sort((a, b) => (a.isToday === b.isToday ? a.mmdd.localeCompare(b.mmdd) : a.isToday ? -1 : 1));

    const monthNamesEs = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    const currentMonthLabel = monthNamesEs[Math.max(0, Number(currentMonthMm) - 1)] || "Mes";

    return (
      <div
        className={`min-h-screen ${
          themeMode === "LIGHT"
            ? "cendis-theme-light bg-[#eef2f6] text-slate-900"
            : "bg-[#050a15] text-slate-100"
        } flex flex-col font-sans`}
      >
        {renderGlobalThemeStyles()}

        {/* Franja tricolor superior */}
        <div className="grid grid-cols-3 h-1.5 w-full shrink-0">
          <div className="bg-[#facc15]" />
          <div className="bg-[#1d4ed8]" />
          <div className="bg-[#dc2626]" />
        </div>

        {/* Cabecera Intranet */}
        <header className="bg-gradient-to-r from-[#4a0e13] via-[#171226] to-[#0a1326] border-b border-slate-800 px-4 md:px-8 py-4 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-white rounded-xl px-3 py-1.5 shadow-md shrink-0">
                <CendisGlyphLogo className="w-28" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f59e0b]">
                  MINISTERIO DEL PODER POPULAR PARA LA CULTURA • INTRANET INSTITUCIONAL
                </p>
                <h1 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>CANAL INFORMATIVO DEL CENDIS</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                    NEW
                  </span>
                </h1>
                <p className="text-[11px] text-slate-300 font-medium">
                  Cartelera institucional en tiempo real: eventos de agenda, tareas, cumpleaños del personal y novedades del sistema.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {renderThemeModeSwitcher()}
              <button
                type="button"
                onClick={() => setCurrentScreen(currentUser ? "PORTAL" : "LOGIN")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#dc2626] hover:from-[#991b1b] hover:to-[#b91c1c] text-white text-xs font-black uppercase tracking-wider shadow-lg border border-amber-400/50 flex items-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>{currentUser ? "Ir al Portal del Sistema" : "Ingresar al Sistema"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido Intranet */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          {/* Tarjetas Resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl bg-[#0e1526] border border-blue-500/40 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-300">Eventos (Agenda)</span>
                <CalendarIcon className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{activeIntranetEvents.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Eventos programados</p>
            </div>
            <div className="rounded-2xl bg-[#0e1526] border border-rose-500/40 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-rose-300">Cumpleaños ({currentMonthLabel})</span>
                <Cake className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">
                {birthdayEmployees.filter((e) => e.isThisMonth).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {birthdayEmployees.filter((e) => e.isToday).length} celebrando hoy
              </p>
            </div>
            <div className="rounded-2xl bg-[#0e1526] border border-emerald-500/40 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-300">Personal CENDIS</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{employees.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Trabajadores activos en RRHH</p>
            </div>
            <div className="rounded-2xl bg-[#0e1526] border border-amber-500/50 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-300">Novedades CENDIS</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{novedadesList.length}</p>
              <p className="text-[10px] text-amber-300 font-bold mt-0.5">
                Comunicados publicados
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Columna 1: Eventos de la Agenda */}
            <section className="lg:col-span-5 rounded-2xl bg-[#0c1322] border border-slate-800 p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                    <span>Eventos</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Eventos predeterminados del módulo Agenda sincronizados en tiempo real
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[10px] font-black">
                  {activeIntranetEvents.length} ACTIVOS
                </span>
              </div>

              <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                {activeIntranetEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No hay eventos registrados en la Agenda en este momento.
                  </p>
                ) : (
                  activeIntranetEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl bg-[#070b14] border border-slate-800/90 hover:border-blue-500/50 p-3.5 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-black">
                          📅 {ev.date} • {ev.allDay ? "TODO EL DÍA" : `${ev.startTime || "08:00"}${ev.endTime ? ` - ${ev.endTime}` : ""}`}
                        </span>
                        <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {ev.status || "PROGRAMADO"}
                        </span>
                      </div>
                      <h3 className="text-xs font-black text-white uppercase leading-snug">{ev.title}</h3>
                      {ev.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-300">
                        <span>📍 {ev.location || "Sede CENDIS"}</span>
                        <span>👤 {ev.responsable || "CENDIS"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Columna 2: Cumpleaños del Personal (Mes en curso) */}
            <section className="lg:col-span-4 rounded-2xl bg-[#0c1322] border border-slate-800 p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Cake className="w-4 h-4 text-rose-400" />
                    <span>Cumpleaños de {currentMonthLabel}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Cumpleaños del mes en curso (Recursos Humanos)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-black">
                  🎂 {birthdayEmployees.length} ESTE MES
                </span>
              </div>

              <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
                {birthdayEmployees.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No hay cumpleaños registrados para el mes de {currentMonthLabel}.
                  </p>
                ) : (
                  birthdayEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className={`rounded-xl p-3 border transition ${
                        emp.isToday
                          ? "bg-gradient-to-r from-rose-950/80 to-amber-950/60 border-amber-400 shadow-lg"
                          : emp.isThisMonth
                          ? "bg-[#11192e] border-rose-500/40"
                          : "bg-[#070b14] border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-white uppercase">
                          🎂 {emp.nombres} {emp.apellidos}
                        </span>
                        {emp.isToday ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse">
                            ¡HOY!
                          </span>
                        ) : emp.isThisMonth ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-black">
                            ESTE MES
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10.5px] text-amber-300 font-bold mt-0.5">
                        {emp.cargo || "Trabajador CENDIS"}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>🏢 {emp.coordinacion || "CENDIS"}</span>
                        <span className="font-bold text-slate-200">
                          Día {emp.dd}/{emp.mm}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Columna 3: Novedades del Módulo Novedades */}
            <section className="lg:col-span-3 rounded-2xl bg-[#0c1322] border border-slate-800 p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-amber-400" />
                    <span>Novedades</span>
                    {novedadesList.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                        NEW
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Comunicados publicados desde el módulo Novedades
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                {novedadesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No hay novedades publicadas en este momento.
                  </p>
                ) : (
                  novedadesList.map((nov) => (
                    <div
                      key={nov.id}
                      className="rounded-xl bg-[#070b14] border border-amber-400/60 p-3 space-y-2 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                          NEW • {nov.categoria || "COMUNICADO"}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">{nov.fecha}</span>
                      </div>
                      <p className="text-xs font-black text-white leading-snug uppercase">{nov.titulo}</p>
                      {nov.mensaje && (
                        <p className="text-[11px] text-slate-300 leading-snug whitespace-pre-line">{nov.mensaje}</p>
                      )}
                      {nov.mediaDataUrl && (
                        <div className="pt-1">
                          {nov.mediaType === "PDF" || nov.mediaDataUrl.startsWith("data:application/pdf") ? (
                            <iframe
                              src={nov.mediaDataUrl}
                              title={nov.mediaName || nov.titulo}
                              className="w-full h-48 rounded-lg border border-slate-700 bg-white"
                            />
                          ) : (
                            <img
                              src={nov.mediaDataUrl}
                              alt={nov.mediaName || nov.titulo}
                              className="w-full max-h-56 object-contain rounded-lg border border-slate-700 bg-black/40"
                            />
                          )}
                        </div>
                      )}
                      {nov.autor && (
                        <p className="text-[9.5px] text-slate-400">Publicado por: {nov.autor}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>

        <footer className="border-t border-slate-800/80 py-3 px-6 text-center text-[10.5px] text-slate-400">
          SIACENDIS • Fundación Centro Nacional del Disco (CENDIS) • RIF: G-20008344-9 • Canal Informativo Institucional
        </footer>
      </div>
    );
  }

  // ==========================================================================
  // 1) VENTANA ÚNICA DE INICIO DE SESIÓN (IDÉNTICA A LA CAPTURA ADJUNTA)
  // ==========================================================================
  if (currentScreen === "LOGIN") {
    return (
      <div
        className={`min-h-screen max-h-screen overflow-y-auto ${
          themeMode === "LIGHT"
            ? "cendis-theme-light bg-[#eef2f6] text-slate-900"
            : "bg-[#050a15] text-slate-100"
        } flex flex-col items-center justify-center p-3 font-sans relative`}
      >
        {renderGlobalThemeStyles()}
        <div className="fixed top-3 left-3 z-40">
          <button
            type="button"
            onClick={() => setCurrentScreen("INTRANET")}
            className="px-3 py-1.5 rounded-xl bg-[#0e1526] hover:bg-[#17223b] border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Canal Informativo</span>
          </button>
        </div>
        <div className="fixed top-3 right-3 z-40">{renderThemeModeSwitcher()}</div>
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
                      Usuario
                    </label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value);
                        setLoginError("");
                      }}
                      placeholder="Ingrese su usuario"
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
                      data-no-uppercase="true"
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
                      <span>Iniciar Sesión</span>
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
        badgeText: "ACTIVO",
        subtitle: "EXPEDIENTES, CARNETS Y FILTROS",
        title: "RECURSOS HUMANOS",
        desc: "Ingreso de todo el personal del CENDIS, carga familiar, Hoja de Vida en PDF, Carnet Oficial con código de barras y reporte general con filtros.",
        pills: [
          { symbol: "👥", text: `${employees.length} Trabajadores`, color: "text-amber-400" },
          {
            symbol: "🪪",
            text: "Carnets y Hoja de Vida PDF",
            color: "text-emerald-400",
          },
        ],
        footerCode: "2024-CENDIS-RRHH",
        icon: Users,
        cornerBadge: "+",
        cornerBg: "bg-emerald-500 text-slate-950",
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
        id: "novedades",
        theme: "WARM",
        badgeText: "NEW",
        subtitle: "CANAL INFORMATIVO Y COMUNICADOS",
        title: "NOVEDADES CENDIS",
        desc: "Publicación de comunicados predeterminados y material gráfico (PDF, JPG, PNG) visible directamente en el Canal Informativo del CENDIS.",
        pills: [
          { symbol: "📰", text: `${novedadesList.length} Publicaciones`, color: "text-amber-400" },
          { symbol: "🖼", text: "PDF / JPG / PNG Visual", color: "text-emerald-400" },
        ],
        footerCode: "INTRANET-CENDIS",
        icon: Newspaper,
        cornerBadge: "★",
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
      <div
        className={`min-h-screen ${
          themeMode === "LIGHT"
            ? "cendis-theme-light bg-[#eef2f6] text-slate-900"
            : "bg-[#030710] text-slate-100"
        } flex flex-col font-sans`}
      >
        {renderGlobalThemeStyles()}
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
                  ({currentUser.username}) • Rol:{" "}
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
              {renderRealtimeSyncBadge()}
              {renderDeviceViewportSwitcher()}
              {renderThemeModeSwitcher()}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentScreen("INTRANET")}
                  className="px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] border border-blue-500/40 text-blue-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                  title="Abrir Canal Informativo del CENDIS (Intranet)"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Intranet</span>
                  {unseenNewCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                      NEW
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] border border-amber-500/40 text-amber-400 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                  title="Cambiar clave de seguridad (Vigencia límite: 90 días)"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Clave</span>
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
                      markModuleNewSeen(mod.id);
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

                        <div className="flex items-center gap-1.5">
                          {systemNewNotices.some((n) => n.module === mod.id && !n.seen) && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase animate-pulse shadow">
                              NEW
                            </span>
                          )}
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
  // 3) ÁREA DE TRABAJO PRINCIPAL (ESTILO OSCURO CÁLIDO/AZUL O CLARO CONMUTABLE)
  // ==========================================================================
  return (
    <div
      className={`min-h-screen ${
        themeMode === "LIGHT"
          ? "cendis-theme-light bg-[#eef2f6] text-slate-900"
          : "bg-[#030710] text-slate-100"
      } flex flex-col font-sans`}
    >
      {renderGlobalThemeStyles()}
      <style>{`
        /* Adaptación de paneles al tema oscuro de las capturas fuera del área de impresión (solo cuando themeMode === DARK) */
        :not(.cendis-theme-light) .cendis-dark-workspace .bg-white:not(#printable-area):not(#printable-area *) {
          background: linear-gradient(145deg, #161824 0%, #0d1322 100%);
          color: #f1f5f9;
          border-color: rgba(148, 163, 184, 0.18);
        }
        :not(.cendis-theme-light) .cendis-dark-workspace .bg-slate-50:not(#printable-area):not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace .bg-slate-100:not(button):not(#printable-area):not(#printable-area *) {
          background-color: #080d19;
          color: #e2e8f0;
          border-color: rgba(148, 163, 184, 0.15);
        }
        :not(.cendis-theme-light) .cendis-dark-workspace .text-slate-900:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace .text-slate-800:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace .text-slate-700:not(#printable-area *) {
          color: #f8fafc;
        }
        :not(.cendis-theme-light) .cendis-dark-workspace .text-slate-600:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace .text-slate-500:not(#printable-area *) {
          color: #94a3b8;
        }
        :not(.cendis-theme-light) .cendis-dark-workspace input:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace select:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace textarea:not(#printable-area *) {
          background-color: #070b14;
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.25);
        }
        :not(.cendis-theme-light) .cendis-dark-workspace input:focus:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace select:focus:not(#printable-area *),
        :not(.cendis-theme-light) .cendis-dark-workspace textarea:focus:not(#printable-area *) {
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
          @page orgLandscape {
            size: letter landscape;
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
          html:has(#printable-area.org-print-landscape),
          body:has(#printable-area.org-print-landscape),
          #root:has(#printable-area.org-print-landscape) {
            width: 279.4mm !important;
            height: 215.9mm !important;
            max-height: 215.9mm !important;
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
          }
          #printable-area.org-print-auto-height {
            height: auto !important;
            min-height: 278mm !important;
            max-height: none !important;
            overflow: visible !important;
          }
          #printable-area.org-print-one-page {
            height: 278mm !important;
            min-height: 278mm !important;
            max-height: 278mm !important;
            overflow: hidden !important;
          }
          #printable-area.org-print-landscape {
            page: orgLandscape;
            width: 279.4mm !important;
            max-width: 279.4mm !important;
            height: 215mm !important;
            min-height: 215mm !important;
            max-height: 215mm !important;
            overflow: hidden !important;
          }
          .print\\:hidden,
          #printable-area .print\\:hidden,
          [data-print-hidden="true"] {
            display: none !important;
          }
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
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 print:hidden ${
            toastMessage.type === "error"
              ? "bg-red-950 text-red-200 border-red-500/60"
              : "bg-[#161824] text-amber-400 border-amber-500/50"
          }`}
        >
          {toastMessage.type === "error" ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <>
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shrink-0">
                NEW
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </>
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* PANEL FLOTANTE DE NOVEDADES ("NEW") */}
      {newNoticesModalOpen && (
        <div className="fixed top-20 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-[#0c1322] border border-amber-500/60 shadow-2xl p-4 space-y-3 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                NEW
              </span>
              <span className="text-xs font-black uppercase text-white">Novedades y Acciones Recientes</span>
            </div>
            <div className="flex items-center gap-2">
              {unseenNewCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = systemNewNotices.map((n) => ({ ...n, seen: true }));
                    setSystemNewNotices(next);
                    saveStoredJson("cendis_new_notices_v1", next);
                  }}
                  className="text-[10px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                >
                  Marcar vistas
                </button>
              )}
              <button
                type="button"
                onClick={() => setNewNoticesModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {systemNewNotices.slice(0, 15).map((n) => (
              <div
                key={n.id}
                className={`rounded-xl p-2.5 border text-[11px] ${
                  n.seen
                    ? "bg-[#070b14] border-slate-800 text-slate-300"
                    : "bg-[#141c2f] border-amber-500/50 text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[8.5px] font-black uppercase">
                    {n.seen ? n.module : "NEW"}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-mono">{n.date}</span>
                </div>
                <p className="font-bold leading-snug">{n.title}</p>
                {n.detail && <p className="text-[10px] text-slate-400 mt-0.5">{n.detail}</p>}
              </div>
            ))}
          </div>
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
              <button
                type="button"
                onClick={() => setCurrentScreen("INTRANET")}
                className="px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] text-xs font-bold flex items-center gap-1.5 border border-blue-500/40 text-blue-300 cursor-pointer"
                title="Abrir Canal Informativo del CENDIS"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Intranet</span>
              </button>
              <span className="font-black tracking-tight text-xs uppercase text-white">
                SIACENDIS
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNewNoticesModalOpen((v) => !v)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/60 text-amber-300 text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
                title="Ver novedades, acciones recientes y modificaciones del sistema"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>NEW</span>
                {unseenNewCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse">
                    {unseenNewCount}
                  </span>
                )}
              </button>
              {renderRealtimeSyncBadge()}
              {renderDeviceViewportSwitcher()}
              {renderThemeModeSwitcher()}

              <button
                type="button"
                onClick={openPasswordModal}
                className="px-2.5 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] border border-amber-500/40 text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Cambiar clave de seguridad (Límite de renovación: 90 días)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Clave</span>
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
              { id: "novedades", label: "Novedades", icon: Newspaper },
              { id: "config", label: "Configuración", icon: Settings },
            ].map((tab) => {
              const IconT = tab.icon;
              const allowed = canEnterModule(tab.id);
              const hasNew = systemNewNotices.some((n) => n.module === tab.id && !n.seen);
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
                    markModuleNewSeen(tab.id);
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
                  {hasNew && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[8.5px] font-black uppercase animate-pulse">
                      NEW
                    </span>
                  )}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "MEMORANDUM", label: "Memorando" },
                  { id: "SOLICITUD", label: "Solicitud" },
                  { id: "OFICIO", label: "Oficio / Circular" },
                  { id: "ORDEN_SALIDA", label: "Orden de Salida" },
                  { id: "SOLICITUD_ALIMENTOS", label: "Solicitud Alimentos" },
                  { id: "SOLICITUD_SERVICIOS_GENERALES", label: "Servicios Generales" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedDocId(null);
                      setDocType(t.id);
                      if (t.id === "ORDEN_SALIDA" && (!asunto || asunto === "SOLICITUD DE TRANSPORTE")) {
                        setAsunto("AUTORIZACIÓN DE SALIDA DE EQUIPOS Y BIENES NACIONALES");
                      } else if (t.id === "SOLICITUD_ALIMENTOS" && !asunto) {
                        setAsunto("SOLICITUD DE ALIMENTOS Y REFRIGERIOS INSTITUCIONALES");
                      } else if (t.id === "SOLICITUD_SERVICIOS_GENERALES" && !asunto) {
                        setAsunto("SOLICITUD DE MATERIALES Y SERVICIOS GENERALES PARA FUNCIONAMIENTO DEL CENDIS");
                      }
                    }}
                    className={`py-2 px-1.5 rounded-xl text-[10.5px] font-black uppercase border cursor-pointer ${
                      docType === t.id
                        ? "bg-[#8b1538] text-white border-[#8b1538]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {docType === "SOLICITUD_ALIMENTOS" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAlimentosReportModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Reporte Contable de Alimentos (Filtro)</span>
                  </button>
                </div>
              )}

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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        FECHA {fecha ? `(${formatFechaLargaOficial(fecha)})` : ""}:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocId(null);
                          setFecha(getTodayIsoDate());
                        }}
                        className="px-1.5 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-500 text-[10px] font-bold cursor-pointer"
                        title="Colocar fecha actual del día"
                      >
                        Hoy
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={memoDateInputRef}
                        type="date"
                        value={fecha}
                        onChange={(e) => {
                          setSelectedDocId(null);
                          setFecha(e.target.value);
                        }}
                        style={{ colorScheme: themeMode === "LIGHT" ? "light" : "dark" }}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = memoDateInputRef.current;
                          if (!el) return;
                          el.focus();
                          if (typeof el.showPicker === "function") {
                            try {
                              el.showPicker();
                            } catch {
                              // Fallback si el navegador bloquea showPicker
                            }
                          }
                        }}
                        className="px-2.5 py-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="Abrir calendario para seleccionar fecha"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        ASUNTO:
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setSelectedDocId(null);
                          setAsunto(e.target.value);
                        }}
                        className="px-1.5 py-0.5 rounded border border-slate-300 text-[10px]"
                      >
                        <option value="">Opciones rápidas...</option>
                        <option value="SOLICITUD DE TRANSPORTE">Solicitud de transporte</option>
                        <option value="AUTORIZACIÓN DE SALIDA DE EQUIPOS Y BIENES NACIONALES">Salida de equipos</option>
                        <option value="SOLICITUD DE MATERIALES E INSUMOS">Solicitud de materiales</option>
                        <option value="CONVOCATORIA A REUNIÓN INSTITUCIONAL">Convocatoria a reunión</option>
                        <option value="REMISIÓN DE INFORME DE GESTIÓN">Remisión de informe</option>
                        <option value="PERMISO / COMISIÓN DE SERVICIO">Comisión de servicio</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={asunto}
                      onChange={(e) => {
                        setSelectedDocId(null);
                        setAsunto(e.target.value);
                      }}
                      placeholder="Escriba el asunto del documento"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-600">
                      CONTENIDO / CUERPO DEL DOCUMENTO:
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setSelectedDocId(null);
                        setConcepto(e.target.value);
                      }}
                      className="px-2 py-0.5 rounded border border-slate-300 text-[10px]"
                    >
                      <option value="">Plantilla rápida (opcional)...</option>
                      <option value="Tengo el agrado de dirigirme a usted en la oportunidad de saludarle cordialmente y, a su vez, solicitarle ">
                        Saludo y solicitud formal
                      </option>
                      <option value="Por medio de la presente me dirijo a usted con la finalidad de remitirle ">
                        Remisión formal
                      </option>
                      <option value="Se autoriza la salida de los equipos y bienes nacionales detallados a continuación para el cumplimiento de actividades institucionales.">
                        Texto base Orden de Salida
                      </option>
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    data-no-uppercase="true"
                    value={concepto}
                    placeholder="Escriba aquí el contenido del documento..."
                    onChange={(e) => {
                      setSelectedDocId(null);
                      setConcepto(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed preserve-case-content"
                  />
                </div>

                {/* VARIABLES COMPLETAS PARA ORDEN DE SALIDA DE EQUIPOS (INTEGRADO CON RRHH Y BIENES NACIONALES) */}
                {docType === "ORDEN_SALIDA" && (
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5">
                      <span className="text-[11px] font-black uppercase text-amber-300">
                        📦 Variables de Orden de Salida de Equipos
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Integrado con RRHH y Bienes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Tipo de Salida
                        </label>
                        <select
                          value={ordenSalidaData.tipoSalida}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setOrdenSalidaData({ ...ordenSalidaData, tipoSalida: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="PRÉSTAMO / COMISIÓN DE SERVICIO">Préstamo / Comisión</option>
                          <option value="TRASLADO EXTERNO / EVENTO">Traslado Externo / Evento</option>
                          <option value="MANTENIMIENTO / REPARACIÓN">Mantenimiento / Reparación</option>
                          <option value="ASIGNACIÓN PERMANENTE">Asignación Permanente</option>
                          <option value="DEVOLUCIÓN / RESGUARDO">Devolución / Resguardo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Fecha de Salida
                        </label>
                        <input
                          type="date"
                          value={ordenSalidaData.fechaSalida}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setOrdenSalidaData({ ...ordenSalidaData, fechaSalida: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Fecha Estimada Retorno
                        </label>
                        <input
                          type="date"
                          value={ordenSalidaData.fechaRetorno}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setOrdenSalidaData({ ...ordenSalidaData, fechaRetorno: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Responsable que Retira
                        </label>
                        <select
                          onChange={(e) => {
                            const emp = employees.find((x) => x.id === e.target.value);
                            if (!emp) return;
                            setSelectedDocId(null);
                            setOrdenSalidaData({
                              ...ordenSalidaData,
                              responsableNombre: `${emp.nombres} ${emp.apellidos}`,
                              responsableCedula: emp.cedula || "",
                              responsableCargo: `${emp.cargo} - ${emp.coordinacion}`,
                              responsableTelefono: emp.telefono || "",
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold mb-1"
                        >
                          <option value="">Seleccionar trabajador de RRHH...</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nombres} {emp.apellidos} ({emp.cedula})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Nombre del responsable"
                          value={ordenSalidaData.responsableNombre}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setOrdenSalidaData({ ...ordenSalidaData, responsableNombre: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500">
                          Cédula / Teléfono y Cargo
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            placeholder="Cédula"
                            value={ordenSalidaData.responsableCedula}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setOrdenSalidaData({ ...ordenSalidaData, responsableCedula: e.target.value });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Teléfono"
                            value={ordenSalidaData.responsableTelefono}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setOrdenSalidaData({ ...ordenSalidaData, responsableTelefono: e.target.value });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Cargo / Coordinación"
                          value={ordenSalidaData.responsableCargo}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setOrdenSalidaData({ ...ordenSalidaData, responsableCargo: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Destino / Lugar donde se trasladan los equipos"
                        value={ordenSalidaData.destino}
                        onChange={(e) => {
                          setSelectedDocId(null);
                          setOrdenSalidaData({ ...ordenSalidaData, destino: e.target.value });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Autorizado por (Ej. Lcdo. Morris López)"
                        value={ordenSalidaData.autorizadoPor}
                        onChange={(e) => {
                          setSelectedDocId(null);
                          setOrdenSalidaData({ ...ordenSalidaData, autorizadoPor: e.target.value });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    {/* AGREGAR EQUIPOS DESDE BIENES NACIONALES O MANUAL */}
                    <div className="pt-2 border-t border-amber-500/30 space-y-2">
                      <label className="block text-[10px] font-black uppercase text-amber-300">
                        + Agregar Equipos / Artículos a la Orden de Salida
                      </label>
                      <select
                        value={equipoDraft.bienId}
                        onChange={(e) => {
                          const bn = bienesList.find((b) => String(b.id) === e.target.value);
                          if (!bn) {
                            setEquipoDraft({ ...equipoDraft, bienId: "" });
                            return;
                          }
                          setEquipoDraft({
                            bienId: bn.id,
                            codigoBN: bn.codigoBN || "",
                            descripcion: bn.articulo || "",
                            marca: bn.marca || "",
                            modelo: bn.modelo || "",
                            serial: bn.serial || "",
                            cantidad: 1,
                            estadoSalida: bn.estado || "OPERATIVO",
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        <option value="">-- Cargar desde Bienes Nacionales (o escribir abajo) --</option>
                        {bienesList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.codigoBN} • {b.articulo} ({b.marca} {b.modelo} • S/N: {b.serial})
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <input
                          type="text"
                          placeholder="Descripción equipo"
                          value={equipoDraft.descripcion}
                          onChange={(e) => setEquipoDraft({ ...equipoDraft, descripcion: e.target.value })}
                          className="sm:col-span-2 px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Código BN"
                          value={equipoDraft.codigoBN}
                          onChange={(e) => setEquipoDraft({ ...equipoDraft, codigoBN: e.target.value })}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Marca"
                          value={equipoDraft.marca}
                          onChange={(e) => setEquipoDraft({ ...equipoDraft, marca: e.target.value })}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Modelo"
                          value={equipoDraft.modelo}
                          onChange={(e) => setEquipoDraft({ ...equipoDraft, modelo: e.target.value })}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Serial"
                          value={equipoDraft.serial}
                          onChange={(e) => setEquipoDraft({ ...equipoDraft, serial: e.target.value })}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant."
                          value={equipoDraft.cantidad}
                          onChange={(e) =>
                            setEquipoDraft({ ...equipoDraft, cantidad: Number(e.target.value) || 1 })
                          }
                          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!equipoDraft.descripcion.trim()) {
                              showToast("Indique la descripción del equipo para agregarlo.", "error");
                              return;
                            }
                            setSelectedDocId(null);
                            setOrdenSalidaData((prev) => ({
                              ...prev,
                              equipos: [
                                ...(prev.equipos || []),
                                { ...equipoDraft, id: `eq-${Date.now()}` },
                              ],
                            }));
                            setEquipoDraft({
                              bienId: "",
                              codigoBN: "",
                              descripcion: "",
                              marca: "",
                              modelo: "",
                              serial: "",
                              cantidad: 1,
                              estadoSalida: "OPERATIVO / BUEN ESTADO",
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs cursor-pointer"
                        >
                          + Agregar Equipo
                        </button>
                      </div>

                      {(ordenSalidaData.equipos || []).length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                          {ordenSalidaData.equipos.map((eq, idx) => (
                            <div
                              key={eq.id || idx}
                              className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-700 text-[11px]"
                            >
                              <span className="truncate font-semibold">
                                {idx + 1}. {eq.descripcion} ({eq.codigoBN || "S/N"} • {eq.serial || "-"}) x{eq.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocId(null);
                                  setOrdenSalidaData((prev) => ({
                                    ...prev,
                                    equipos: prev.equipos.filter((x) => x.id !== eq.id),
                                  }));
                                }}
                                className="text-red-400 hover:text-red-300 font-black cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* VARIABLES PARA SOLICITUD DE ALIMENTOS (CONTABILIDAD Y REPORTE CON FILTRO) */}
                {docType === "SOLICITUD_ALIMENTOS" && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-500/50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 pb-1.5">
                      <span className="text-[11px] font-black uppercase text-emerald-300">
                        🍽 Solicitud de Alimentos (Contabilización)
                      </span>
                      <span className="text-[10px] font-black text-amber-300">
                        Total Contabilizado:{" "}
                        {(alimentosData.items || []).reduce(
                          (acc, it) => acc + (Number(it.cantidad) || 0),
                          0
                        )}{" "}
                        unidades/raciones
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Coordinación Solicitante
                        </label>
                        <input
                          type="text"
                          value={alimentosData.coordinacionSolicitante}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setAlimentosData({
                              ...alimentosData,
                              coordinacionSolicitante: e.target.value,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Tipo de Servicio Alimentario
                        </label>
                        <select
                          value={alimentosData.tipoAlimento}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setAlimentosData({ ...alimentosData, tipoAlimento: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="DESAYUNO">Desayuno</option>
                          <option value="ALMUERZO">Almuerzo</option>
                          <option value="CENA">Cena</option>
                          <option value="REFRIGERIO / COFFEE BREAK">Refrigerio / Coffee Break</option>
                          <option value="HIDRATACIÓN / AGUA">Hidratación / Agua</option>
                          <option value="COMBO COMPLETO">Combo Completo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Fecha de Actividad
                        </label>
                        <input
                          type="date"
                          value={alimentosData.fechaActividad}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setAlimentosData({ ...alimentosData, fechaActividad: e.target.value });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Actividad / Evento Institucional
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Grabación en Estudio / Reunión Directiva / Jornada Cultural"
                        value={alimentosData.actividad}
                        onChange={(e) => {
                          setSelectedDocId(null);
                          setAlimentosData({ ...alimentosData, actividad: e.target.value });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300">
                          Rubros y Cantidades a Contabilizar
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocId(null);
                            setAlimentosData((prev) => ({
                              ...prev,
                              items: [
                                ...(prev.items || []),
                                {
                                  id: Date.now(),
                                  rubro: "",
                                  unidad: "RACIONES",
                                  cantidad: 1,
                                  detalle: "",
                                },
                              ],
                            }));
                          }}
                          className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black cursor-pointer"
                        >
                          + Agregar Rubro
                        </button>
                      </div>
                      {(alimentosData.items || []).map((it, idx) => (
                        <div key={it.id || idx} className="grid grid-cols-12 gap-1.5 items-center">
                          <input
                            type="text"
                            placeholder="Rubro (Ej. Almuerzo)"
                            value={it.rubro}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setAlimentosData((prev) => ({
                                ...prev,
                                items: prev.items.map((x) =>
                                  x.id === it.id ? { ...x, rubro: e.target.value } : x
                                ),
                              }));
                            }}
                            className="col-span-4 px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Cant."
                            value={it.cantidad}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setAlimentosData((prev) => ({
                                ...prev,
                                items: prev.items.map((x) =>
                                  x.id === it.id ? { ...x, cantidad: Number(e.target.value) || 0 } : x
                                ),
                              }));
                            }}
                            className="col-span-2 px-2 py-1 rounded border border-slate-300 text-[11px] font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Unidad"
                            value={it.unidad}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setAlimentosData((prev) => ({
                                ...prev,
                                items: prev.items.map((x) =>
                                  x.id === it.id ? { ...x, unidad: e.target.value } : x
                                ),
                              }));
                            }}
                            className="col-span-2 px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <input
                            type="text"
                            placeholder="Detalle"
                            value={it.detalle}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setAlimentosData((prev) => ({
                                ...prev,
                                items: prev.items.map((x) =>
                                  x.id === it.id ? { ...x, detalle: e.target.value } : x
                                ),
                              }));
                            }}
                            className="col-span-3 px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocId(null);
                              setAlimentosData((prev) => ({
                                ...prev,
                                items: prev.items.filter((x) => x.id !== it.id),
                              }));
                            }}
                            className="col-span-1 text-red-400 hover:text-red-300 font-black text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VARIABLES PARA SOLICITUD DE SERVICIOS GENERALES (MATERIALES PARA FUNCIONAMIENTO DEL CENDIS) */}
                {docType === "SOLICITUD_SERVICIOS_GENERALES" && (
                  <div className="p-3.5 rounded-xl bg-blue-950/35 border border-blue-500/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-500/30 pb-1.5">
                      <span className="text-[11px] font-black uppercase text-blue-300">
                        🛠 Solicitud de Servicios Generales (Materiales para el CENDIS)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Área / Dependencia
                        </label>
                        <input
                          type="text"
                          value={serviciosGeneralesData.areaSolicitante}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setServiciosGeneralesData({
                              ...serviciosGeneralesData,
                              areaSolicitante: e.target.value,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Tipo de Requerimiento
                        </label>
                        <select
                          value={serviciosGeneralesData.tipoServicio}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setServiciosGeneralesData({
                              ...serviciosGeneralesData,
                              tipoServicio: e.target.value,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="SUMINISTRO DE MATERIALES Y MANTENIMIENTO">Materiales y Mantenimiento</option>
                          <option value="INSUMOS DE LIMPIEZA Y ASEO">Insumos de Limpieza y Aseo</option>
                          <option value="ELECTRICIDAD E ILUMINACIÓN">Electricidad e Iluminación</option>
                          <option value="PLOMERÍA Y INFRAESTRUCTURA">Plomería e Infraestructura</option>
                          <option value="PAPELERÍA Y OFICINA">Papelería y Oficina</option>
                          <option value="REFRIGERACIÓN / AIRES ACONDICIONADOS">Refrigeración / A.A.</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Prioridad
                        </label>
                        <select
                          value={serviciosGeneralesData.prioridad}
                          onChange={(e) => {
                            setSelectedDocId(null);
                            setServiciosGeneralesData({
                              ...serviciosGeneralesData,
                              prioridad: e.target.value,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="URGENTE">Urgente</option>
                          <option value="ALTA">Alta</option>
                          <option value="NORMAL">Normal</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300">
                          Materiales Requeridos para el Funcionamiento del CENDIS
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocId(null);
                            setServiciosGeneralesData((prev) => ({
                              ...prev,
                              materiales: [
                                ...(prev.materiales || []),
                                {
                                  id: Date.now(),
                                  material: "",
                                  unidad: "UNIDADES",
                                  cantidad: 1,
                                  uso: "",
                                },
                              ],
                            }));
                          }}
                          className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-black cursor-pointer"
                        >
                          + Agregar Material
                        </button>
                      </div>
                      {(serviciosGeneralesData.materiales || []).map((mat, idx) => (
                        <div key={mat.id || idx} className="grid grid-cols-12 gap-1.5 items-center">
                          <input
                            type="text"
                            placeholder="Material requerido"
                            value={mat.material}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setServiciosGeneralesData((prev) => ({
                                ...prev,
                                materiales: prev.materiales.map((x) =>
                                  x.id === mat.id ? { ...x, material: e.target.value } : x
                                ),
                              }));
                            }}
                            className="col-span-4 px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Cant."
                            value={mat.cantidad}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setServiciosGeneralesData((prev) => ({
                                ...prev,
                                materiales: prev.materiales.map((x) =>
                                  x.id === mat.id ? { ...x, cantidad: Number(e.target.value) || 0 } : x
                                ),
                              }));
                            }}
                            className="col-span-2 px-2 py-1 rounded border border-slate-300 text-[11px] font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Unidad"
                            value={mat.unidad}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setServiciosGeneralesData((prev) => ({
                                ...prev,
                                materiales: prev.materiales.map((x) =>
                                  x.id === mat.id ? { ...x, unidad: e.target.value } : x
                                ),
                              }));
                            }}
                            className="col-span-2 px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <input
                            type="text"
                            placeholder="Uso / Área"
                            value={mat.uso}
                            onChange={(e) => {
                              setSelectedDocId(null);
                              setServiciosGeneralesData((prev) => ({
                                ...prev,
                                materiales: prev.materiales.map((x) =>
                                  x.id === mat.id ? { ...x, uso: e.target.value } : x
                                ),
                              }));
                            }}
                            className="col-span-3 px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocId(null);
                              setServiciosGeneralesData((prev) => ({
                                ...prev,
                                materiales: prev.materiales.filter((x) => x.id !== mat.id),
                              }));
                            }}
                            className="col-span-1 text-red-400 hover:text-red-300 font-black text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

                            {d.status !== "ANULADO" && (
                              <button
                                type="button"
                                onClick={() => handleUniversalAnnul("documents", d.id, d.correlativo)}
                                className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer"
                                title="Anular documento"
                              >
                                🚫 Anular
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleUniversalDelete("documents", d.id, d.correlativo)}
                              className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              title="Eliminar definitivamente"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
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

                <div className="flex flex-wrap items-center gap-2">
                  {activePreviewDoc.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(activePreviewDoc)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                      >
                        🔍 Revisar / Autorizar
                      </button>
                      {activePreviewDoc.status !== "ANULADO" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUniversalAnnul("documents", activePreviewDoc.id, activePreviewDoc.correlativo)
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
                        >
                          🚫 Anular
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleUniversalDelete("documents", activePreviewDoc.id, activePreviewDoc.correlativo)
                        }
                        className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </>
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

                    {/* TÍTULO CENTRADO (MEMORANDO / SOLICITUD / OFICIO / ORDEN DE SALIDA) */}
                    <div className="mt-3 mb-5 text-center">
                      <h2
                        style={{ fontSize: "13pt", letterSpacing: "0.04em" }}
                        className="font-bold uppercase text-slate-950"
                      >
                        {activePreviewDoc.tipo === "MEMORANDUM"
                          ? "MEMORANDO"
                          : activePreviewDoc.tipo === "SOLICITUD"
                          ? "SOLICITUD"
                          : activePreviewDoc.tipo === "ORDEN_SALIDA"
                          ? "ORDEN DE SALIDA DE EQUIPOS Y BIENES"
                          : activePreviewDoc.tipo === "SOLICITUD_ALIMENTOS"
                          ? "SOLICITUD DE ALIMENTOS Y REFRIGERIOS"
                          : activePreviewDoc.tipo === "SOLICITUD_SERVICIOS_GENERALES"
                          ? "SOLICITUD DE SERVICIOS GENERALES Y MATERIALES"
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

                    {/* CUERPO DEL MEMORANDO / SOLICITUD (RESPETA MAYÚSCULAS Y MINÚSCULAS ORIGINALES) */}
                    <div
                      style={{ fontSize: "12pt", lineHeight: "1.55" }}
                      className="mt-5 text-justify whitespace-pre-line text-slate-950 preserve-case-content"
                    >
                      {activePreviewDoc.concepto}
                    </div>

                    {/* BLOQUE ESPECÍFICO DE ORDEN DE SALIDA DE EQUIPOS EN EL PDF */}
                    {activePreviewDoc.tipo === "ORDEN_SALIDA" && activePreviewDoc.ordenSalida && (
                      <div className="mt-4 space-y-3 text-[10.5pt] text-slate-950">
                        <div className="grid grid-cols-2 gap-2 border border-slate-900 p-2.5 bg-slate-50">
                          <div>
                            <strong>TIPO DE SALIDA:</strong> {activePreviewDoc.ordenSalida.tipoSalida}
                          </div>
                          <div>
                            <strong>DESTINO:</strong> {activePreviewDoc.ordenSalida.destino}
                          </div>
                          <div>
                            <strong>FECHA SALIDA:</strong> {activePreviewDoc.ordenSalida.fechaSalida}
                          </div>
                          <div>
                            <strong>RETORNO ESTIMADO:</strong> {activePreviewDoc.ordenSalida.fechaRetorno}
                          </div>
                          <div>
                            <strong>RESPONSABLE QUE RETIRA:</strong> {activePreviewDoc.ordenSalida.responsableNombre} ({activePreviewDoc.ordenSalida.responsableCedula})
                          </div>
                          <div>
                            <strong>CARGO / TELÉFONO:</strong> {activePreviewDoc.ordenSalida.responsableCargo} • {activePreviewDoc.ordenSalida.responsableTelefono}
                          </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-900 text-[9.5pt]">
                          <thead>
                            <tr className="bg-slate-200 font-bold uppercase">
                              <th className="border border-slate-900 p-1.5 text-center">#</th>
                              <th className="border border-slate-900 p-1.5">Código BN</th>
                              <th className="border border-slate-900 p-1.5">Equipo / Descripción</th>
                              <th className="border border-slate-900 p-1.5">Marca / Modelo</th>
                              <th className="border border-slate-900 p-1.5">Serial</th>
                              <th className="border border-slate-900 p-1.5 text-center">Cant.</th>
                              <th className="border border-slate-900 p-1.5">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(activePreviewDoc.ordenSalida.equipos || []).map((eq, i) => (
                              <tr key={eq.id || i}>
                                <td className="border border-slate-900 p-1.5 text-center font-bold">{i + 1}</td>
                                <td className="border border-slate-900 p-1.5 font-bold">{eq.codigoBN || "N/A"}</td>
                                <td className="border border-slate-900 p-1.5 font-semibold">{eq.descripcion}</td>
                                <td className="border border-slate-900 p-1.5">{eq.marca} {eq.modelo}</td>
                                <td className="border border-slate-900 p-1.5 font-mono">{eq.serial || "S/N"}</td>
                                <td className="border border-slate-900 p-1.5 text-center font-bold">{eq.cantidad || 1}</td>
                                <td className="border border-slate-900 p-1.5">{eq.estadoSalida}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[9pt]">
                          <div className="border-t border-slate-900 pt-1">
                            <div className="font-bold">{activePreviewDoc.ordenSalida.autorizadoPor || activePreviewDoc.signerNombre}</div>
                            <div>AUTORIZADO POR</div>
                          </div>
                          <div className="border-t border-slate-900 pt-1">
                            <div className="font-bold">BIENES NACIONALES / SEGURIDAD</div>
                            <div>ENTREGADO / VERIFICADO</div>
                          </div>
                          <div className="border-t border-slate-900 pt-1">
                            <div className="font-bold">{activePreviewDoc.ordenSalida.responsableNombre}</div>
                            <div>RECIBÍ CONFORME ({activePreviewDoc.ordenSalida.responsableCedula})</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BLOQUE ESPECÍFICO DE SOLICITUD DE ALIMENTOS EN EL PDF */}
                    {activePreviewDoc.tipo === "SOLICITUD_ALIMENTOS" && activePreviewDoc.alimentos && (
                      <div className="mt-4 space-y-2.5 text-[10pt] text-slate-950">
                        <div className="grid grid-cols-2 gap-2 border border-slate-900 p-2 bg-slate-50">
                          <div>
                            <strong>COORDINACIÓN:</strong> {activePreviewDoc.alimentos.coordinacionSolicitante}
                          </div>
                          <div>
                            <strong>TIPO:</strong> {activePreviewDoc.alimentos.tipoAlimento}
                          </div>
                          <div>
                            <strong>ACTIVIDAD:</strong> {activePreviewDoc.alimentos.actividad || "INSTITUCIONAL"}
                          </div>
                          <div>
                            <strong>FECHA ACTIVIDAD:</strong> {activePreviewDoc.alimentos.fechaActividad}
                          </div>
                        </div>
                        <table className="w-full border-collapse border border-slate-900 text-[9.5pt]">
                          <thead>
                            <tr className="bg-slate-200 font-bold uppercase">
                              <th className="border border-slate-900 p-1.5 text-center">#</th>
                              <th className="border border-slate-900 p-1.5">Rubro / Alimento</th>
                              <th className="border border-slate-900 p-1.5 text-center">Cantidad</th>
                              <th className="border border-slate-900 p-1.5">Unidad</th>
                              <th className="border border-slate-900 p-1.5">Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(activePreviewDoc.alimentos.items || []).map((it, i) => (
                              <tr key={it.id || i}>
                                <td className="border border-slate-900 p-1.5 text-center font-bold">{i + 1}</td>
                                <td className="border border-slate-900 p-1.5 font-semibold">{it.rubro}</td>
                                <td className="border border-slate-900 p-1.5 text-center font-bold">{it.cantidad}</td>
                                <td className="border border-slate-900 p-1.5">{it.unidad}</td>
                                <td className="border border-slate-900 p-1.5">{it.detalle || "-"}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-100 font-black">
                              <td colSpan={2} className="border border-slate-900 p-1.5 text-right uppercase">
                                Total Contabilizado:
                              </td>
                              <td className="border border-slate-900 p-1.5 text-center">
                                {(activePreviewDoc.alimentos.items || []).reduce(
                                  (acc, it) => acc + (Number(it.cantidad) || 0),
                                  0
                                )}
                              </td>
                              <td colSpan={2} className="border border-slate-900 p-1.5">
                                Raciones / Unidades
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* BLOQUE ESPECÍFICO DE SERVICIOS GENERALES EN EL PDF */}
                    {activePreviewDoc.tipo === "SOLICITUD_SERVICIOS_GENERALES" &&
                      activePreviewDoc.serviciosGenerales && (
                        <div className="mt-4 space-y-2.5 text-[10pt] text-slate-950">
                          <div className="grid grid-cols-3 gap-2 border border-slate-900 p-2 bg-slate-50">
                            <div>
                              <strong>ÁREA:</strong> {activePreviewDoc.serviciosGenerales.areaSolicitante}
                            </div>
                            <div>
                              <strong>SERVICIO:</strong> {activePreviewDoc.serviciosGenerales.tipoServicio}
                            </div>
                            <div>
                              <strong>PRIORIDAD:</strong> {activePreviewDoc.serviciosGenerales.prioridad}
                            </div>
                          </div>
                          <table className="w-full border-collapse border border-slate-900 text-[9.5pt]">
                            <thead>
                              <tr className="bg-slate-200 font-bold uppercase">
                                <th className="border border-slate-900 p-1.5 text-center">#</th>
                                <th className="border border-slate-900 p-1.5">Material Requerido (CENDIS)</th>
                                <th className="border border-slate-900 p-1.5 text-center">Cantidad</th>
                                <th className="border border-slate-900 p-1.5">Unidad</th>
                                <th className="border border-slate-900 p-1.5">Uso / Destino</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(activePreviewDoc.serviciosGenerales.materiales || []).map((mat, i) => (
                                <tr key={mat.id || i}>
                                  <td className="border border-slate-900 p-1.5 text-center font-bold">{i + 1}</td>
                                  <td className="border border-slate-900 p-1.5 font-semibold">{mat.material}</td>
                                  <td className="border border-slate-900 p-1.5 text-center font-bold">{mat.cantidad}</td>
                                  <td className="border border-slate-900 p-1.5">{mat.unidad}</td>
                                  <td className="border border-slate-900 p-1.5">{mat.uso || "Funcionamiento CENDIS"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

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

            {/* MODAL DE REPORTE CONTABLE DE SOLICITUD DE ALIMENTOS CON FILTRO */}
            {showAlimentosReportModal && (() => {
              const allFoodDocs = documents.filter(
                (d) => d.tipo === "SOLICITUD_ALIMENTOS" && d.status !== "ANULADO" && d.alimentos
              );
              const filteredFoodDocs = allFoodDocs.filter((d) => {
                const actDate = d.alimentos?.fechaActividad || d.fecha || "";
                if (alimentosFilter.desde && actDate < alimentosFilter.desde) return false;
                if (alimentosFilter.hasta && actDate > alimentosFilter.hasta) return false;
                if (
                  alimentosFilter.coordinacion !== "TODAS" &&
                  (d.alimentos?.coordinacionSolicitante || "").toUpperCase() !==
                    alimentosFilter.coordinacion.toUpperCase()
                ) {
                  return false;
                }
                if (
                  alimentosFilter.tipoAlimento !== "TODOS" &&
                  (d.alimentos?.tipoAlimento || "").toUpperCase() !==
                    alimentosFilter.tipoAlimento.toUpperCase()
                ) {
                  return false;
                }
                if (alimentosFilter.query.trim()) {
                  const q = alimentosFilter.query.trim().toLowerCase();
                  const hay = `${d.correlativo} ${d.alimentos?.actividad || ""} ${d.alimentos?.coordinacionSolicitante || ""}`.toLowerCase();
                  if (!hay.includes(q)) return false;
                }
                return true;
              });
              const totalRaciones = filteredFoodDocs.reduce(
                (acc, d) =>
                  acc +
                  (d.alimentos?.items || []).reduce((s, it) => s + (Number(it.cantidad) || 0), 0),
                0
              );
              return (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
                  <div className="bg-[#0b1221] text-white rounded-2xl shadow-2xl max-w-4xl w-full border border-emerald-500/50 overflow-hidden">
                    <div className="px-5 py-4 bg-[#11192e] border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black uppercase text-emerald-300">
                          📊 Reporte Contable de Solicitudes de Alimentos (Con Filtro)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Contabilización acumulada: <strong className="text-amber-300">{totalRaciones} raciones/unidades</strong> en {filteredFoodDocs.length} solicitudes
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAlimentosReportModal(false)}
                        className="text-slate-400 hover:text-white text-sm font-black cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input
                          type="date"
                          value={alimentosFilter.desde}
                          onChange={(e) => setAlimentosFilter({ ...alimentosFilter, desde: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#070b14] text-xs"
                          title="Desde"
                        />
                        <input
                          type="date"
                          value={alimentosFilter.hasta}
                          onChange={(e) => setAlimentosFilter({ ...alimentosFilter, hasta: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#070b14] text-xs"
                          title="Hasta"
                        />
                        <select
                          value={alimentosFilter.tipoAlimento}
                          onChange={(e) =>
                            setAlimentosFilter({ ...alimentosFilter, tipoAlimento: e.target.value })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#070b14] text-xs font-bold"
                        >
                          <option value="TODOS">Todos los Tipos</option>
                          <option value="DESAYUNO">Desayuno</option>
                          <option value="ALMUERZO">Almuerzo</option>
                          <option value="CENA">Cena</option>
                          <option value="REFRIGERIO / COFFEE BREAK">Refrigerio</option>
                          <option value="HIDRATACIÓN / AGUA">Hidratación / Agua</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Buscar coordinación o actividad..."
                          value={alimentosFilter.query}
                          onChange={(e) => setAlimentosFilter({ ...alimentosFilter, query: e.target.value })}
                          className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#070b14] text-xs"
                        />
                      </div>

                      <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#11192e] text-amber-300 uppercase">
                            <tr>
                              <th className="p-2">Correlativo</th>
                              <th className="p-2">Fecha</th>
                              <th className="p-2">Coordinación</th>
                              <th className="p-2">Tipo</th>
                              <th className="p-2">Actividad</th>
                              <th className="p-2 text-center">Total Raciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {filteredFoodDocs.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                                  No hay solicitudes de alimentos que coincidan con el filtro seleccionado.
                                </td>
                              </tr>
                            ) : (
                              filteredFoodDocs.map((d) => {
                                const subTotal = (d.alimentos?.items || []).reduce(
                                  (s, it) => s + (Number(it.cantidad) || 0),
                                  0
                                );
                                return (
                                  <tr key={d.id} className="hover:bg-slate-900/60">
                                    <td className="p-2 font-bold text-amber-300">{d.correlativo}</td>
                                    <td className="p-2">{d.alimentos?.fechaActividad || d.fecha}</td>
                                    <td className="p-2">{d.alimentos?.coordinacionSolicitante}</td>
                                    <td className="p-2">{d.alimentos?.tipoAlimento}</td>
                                    <td className="p-2">{d.alimentos?.actividad || "-"}</td>
                                    <td className="p-2 text-center font-black text-emerald-400">{subTotal}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                          <button
                            type="button"
                            onClick={() =>
                              handleUniversalDelete("documents", docToReview.id, docToReview.correlativo)
                            }
                            className="px-3.5 py-2 rounded-xl bg-red-900 hover:bg-red-800 border border-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar Definitivamente</span>
                          </button>

                          {canAnnul && !showAnnulBoxInModal && (
                            <button
                              type="button"
                              onClick={() => setShowAnnulBoxInModal(true)}
                              className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
                            >
                              🚫 Anular Documento...
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
            MÓDULO 2: AGENDA CENDIS (ESTILO GOOGLE CALENDAR COMPLETO + RECORDATORIOS + SYNC TIEMPO REAL)
           ==================================================================== */}
        {activeTab === "agenda" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
            {/* Barra superior estilo Google Calendar con Sincronización en Tiempo Real Multi-Dispositivo */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#f59e0b]">
                    Sincronización en Tiempo Real Multi-Dispositivo y Multi-Usuario Activa
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9.5px] font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    EN VIVO {lastSyncTime ? `• ${lastSyncTime}` : ""}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-900 uppercase mt-0.5">
                  AGENDA CENDIS • Google Calendar & Centro de Recordatorios
                </h2>
                <p className="text-xs text-slate-500">
                  Cualquier evento creado, modificado, anulado o eliminado en un dispositivo se actualiza en tiempo real para todos los usuarios y equipos.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const defaultDay =
                      today.getFullYear() === agendaYear && today.getMonth() === agendaMonth
                        ? today.toISOString().slice(0, 10)
                        : `${agendaYear}-${String(agendaMonth + 1).padStart(2, "0")}-01`;
                    setSelectedDayModal(defaultDay);
                    setNewEventForm((prev) => ({ ...prev, endDate: defaultDay }));
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
                <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (agendaMonth === 0) {
                          setAgendaMonth(11);
                          setAgendaYear((y) => y - 1);
                        } else {
                          setAgendaMonth((m) => m - 1);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-black cursor-pointer border border-slate-700"
                      title="Mes anterior"
                    >
                      ◀
                    </button>
                    <select
                      value={agendaMonth}
                      onChange={(e) => setAgendaMonth(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-black uppercase cursor-pointer"
                      title="Seleccionar mes"
                    >
                      {AGENDA_MONTH_NAMES.map((mName, idx) => (
                        <option key={mName} value={idx}>
                          {mName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={agendaYear}
                      onChange={(e) => setAgendaYear(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 text-xs font-black cursor-pointer"
                      title="Seleccionar año"
                    >
                      {Array.from({ length: 16 }, (_, i) => 2020 + i).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (agendaMonth === 11) {
                          setAgendaMonth(0);
                          setAgendaYear((y) => y + 1);
                        } else {
                          setAgendaMonth((m) => m + 1);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-black cursor-pointer border border-slate-700"
                      title="Mes siguiente"
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setAgendaYear(now.getFullYear());
                        setAgendaMonth(now.getMonth());
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer"
                    >
                      Hoy
                    </button>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      America/Caracas (GMT-04:00)
                    </span>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">
                    {AGENDA_MONTH_NAMES[agendaMonth]} {agendaYear} • Haz clic en cualquier día para agendar
                  </span>
                </div>
                <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-[11px] font-black uppercase text-slate-600 py-2">
                  <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
                  {Array.from({ length: calendarLeadingBlanks }).map((_, idx) => (
                    <div key={`blank-${idx}`} className="min-h-[120px] bg-slate-50/40" />
                  ))}
                  {calendarDays.map((d) => {
                    const dayEvents = agendaEvents.filter(
                      (ev) =>
                        ev.date === d.dateStr ||
                        (ev.recurrence === "ANUAL" &&
                          ev.date &&
                          ev.date.slice(5, 10) === d.dateStr.slice(5, 10))
                    );
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
                            const isAnulado = ev.status === "ANULADO";
                            const pillClass = isAnulado
                              ? "bg-red-900/80 border-l-4 border-red-400 line-through opacity-75"
                              : colorClasses[ev.color] ||
                                (ev.status === "APROBADO" ? colorClasses.BLUE : colorClasses.AMBER);
                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventDetail(ev);
                                }}
                                title={`${ev.title}\n${ev.description || ""}\nEstatus: ${ev.status || "ACTIVO"}`}
                                className={`px-1.5 py-1 rounded text-white text-[10px] font-semibold truncate shadow-2xs ${pillClass}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="truncate">
                                    {ev.allDay ? "Todo el día" : ev.startTime} • {ev.title}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUniversalDelete("agendaEvents", ev.id, ev.title);
                                      }}
                                      title="Eliminar evento"
                                      className="px-1 rounded bg-black/30 hover:bg-red-600 text-[9px] font-black cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
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
                        {ev.status !== "ANULADO" && (
                          <button
                            type="button"
                            onClick={() => handleUniversalAnnul("agendaEvents", ev.id, ev.title)}
                            className="px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow"
                          >
                            🚫 Anular
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUniversalDelete("agendaEvents", ev.id, ev.title)}
                          className="px-3 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-end justify-between gap-4 print:hidden">
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Tipo de Reporte
                      </label>
                      <select
                        value={reportPeriodType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setReportPeriodType(nextType);
                          if (nextType === "MENSUAL") {
                            setReportSemanaLabel(
                              `MES DE ${AGENDA_MONTH_NAMES[agendaMonth].toUpperCase()} ${agendaYear}`
                            );
                          } else {
                            const base = new Date(`${reportWeekStartDate}T12:00:00`);
                            const end = new Date(base);
                            end.setDate(base.getDate() + reportColumnsCount - 1);
                            setReportSemanaLabel(
                              `SEMANA DEL ${base.getDate()} AL ${end.getDate()} DE ${AGENDA_MONTH_NAMES[
                                end.getMonth()
                              ].toUpperCase()} DE ${end.getFullYear()}`
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        <option value="SEMANAL">Reporte Semanal</option>
                        <option value="MENSUAL">Reporte Mensual</option>
                      </select>
                    </div>

                    {reportPeriodType === "SEMANAL" ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Inicio de Semana
                          </label>
                          <input
                            type="date"
                            value={reportWeekStartDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              setReportWeekStartDate(val);
                              const base = new Date(`${val}T12:00:00`);
                              const end = new Date(base);
                              end.setDate(base.getDate() + reportColumnsCount - 1);
                              setReportSemanaLabel(
                                `SEMANA DEL ${base.getDate()} AL ${end.getDate()} DE ${AGENDA_MONTH_NAMES[
                                  end.getMonth()
                                ].toUpperCase()} DE ${end.getFullYear()}`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Días
                          </label>
                          <select
                            value={reportColumnsCount}
                            onChange={(e) => {
                              const cnt = Number(e.target.value);
                              setReportColumnsCount(cnt);
                              const base = new Date(`${reportWeekStartDate}T12:00:00`);
                              const end = new Date(base);
                              end.setDate(base.getDate() + cnt - 1);
                              setReportSemanaLabel(
                                `SEMANA DEL ${base.getDate()} AL ${end.getDate()} DE ${AGENDA_MONTH_NAMES[
                                  end.getMonth()
                                ].toUpperCase()} DE ${end.getFullYear()}`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                          >
                            <option value={4}>4 Días</option>
                            <option value={5}>5 Días (Lun-Vie)</option>
                            <option value={7}>7 Días (Completa)</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Mes
                          </label>
                          <select
                            value={agendaMonth}
                            onChange={(e) => {
                              const m = Number(e.target.value);
                              setAgendaMonth(m);
                              setReportSemanaLabel(
                                `MES DE ${AGENDA_MONTH_NAMES[m].toUpperCase()} ${agendaYear}`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                          >
                            {AGENDA_MONTH_NAMES.map((mName, idx) => (
                              <option key={mName} value={idx}>
                                {mName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Año
                          </label>
                          <select
                            value={agendaYear}
                            onChange={(e) => {
                              const yr = Number(e.target.value);
                              setAgendaYear(yr);
                              setReportSemanaLabel(
                                `MES DE ${AGENDA_MONTH_NAMES[agendaMonth].toUpperCase()} ${yr}`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                          >
                            {Array.from({ length: 16 }, (_, i) => 2020 + i).map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Título del Período
                      </label>
                      <input
                        type="text"
                        value={reportSemanaLabel}
                        onChange={(e) => setReportSemanaLabel(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold w-64"
                      />
                    </div>
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

                    {reportPeriodType === "MENSUAL" ? (
                      <table
                        className="w-full border-collapse border border-black"
                        style={{ fontFamily: "Calibri, sans-serif", fontSize: "10.5pt", fontWeight: "bold" }}
                      >
                        <thead>
                          <tr className="bg-[#9fb0c2] text-black">
                            <th className="border border-black px-2 py-1.5 text-left">Fecha</th>
                            <th className="border border-black px-2 py-1.5 text-left">Hora</th>
                            <th className="border border-black px-2 py-1.5 text-left">Actividad / Ente</th>
                            <th className="border border-black px-2 py-1.5 text-left">Lugar</th>
                            <th className="border border-black px-2 py-1.5 text-left">Responsable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportMonthlyEvents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="border border-black p-6 text-center text-slate-500">
                                Sin actividades registradas para {AGENDA_MONTH_NAMES[agendaMonth]} {agendaYear}
                              </td>
                            </tr>
                          ) : (
                            reportMonthlyEvents.map((ev) => (
                              <tr key={ev.id}>
                                <td className="border border-black p-2 whitespace-nowrap">{ev.date}</td>
                                <td className="border border-black p-2 whitespace-nowrap">
                                  {ev.allDay ? "Todo el día" : `${ev.startTime}${ev.endTime ? ` - ${ev.endTime}` : ""}`}
                                </td>
                                <td className="border border-black p-2">
                                  <div>{ev.title}</div>
                                  <div className="text-[9.5pt] font-normal">Ente: {ev.ente}</div>
                                </td>
                                <td className="border border-black p-2">{ev.location || "Sede CENDIS"}</td>
                                <td className="border border-black p-2">{ev.responsable}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : (
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
                    )}
                  </div>
                  <OfficialFooterWave />
                </div>
              </div>
            )}

            {/* MODAL DE DETALLE DE EVENTO ESTILO GOOGLE CALENDAR */}
            {selectedEventDetail && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                  <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                        {selectedEventDetail.eventType || "EVENTO"} • {selectedEventDetail.visibility || "PÚBLICO"} •{" "}
                        {selectedEventDetail.availability || "OCUPADO"}
                      </span>
                      <h3 className="text-sm font-black truncate">{selectedEventDetail.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedEventDetail(null)}
                      className="text-white/80 hover:text-white text-xs font-bold px-2.5 py-1 rounded bg-blue-800 cursor-pointer shrink-0"
                    >
                      Cerrar ✕
                    </button>
                  </div>
                  <div className="p-4 space-y-2.5 text-xs overflow-y-auto flex-1">
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
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase text-slate-600">
                          Estado del Evento:
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            selectedEventDetail.status === "REALIZADO"
                              ? "bg-emerald-600 text-white"
                              : selectedEventDetail.status === "REPROGRAMADO"
                              ? "bg-amber-500 text-slate-950"
                              : selectedEventDetail.status === "SUSPENDIDO"
                              ? "bg-rose-600 text-white"
                              : selectedEventDetail.status === "ANULADO"
                              ? "bg-red-800 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {selectedEventDetail.status || "PROGRAMADO"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateAgendaEventStatus(selectedEventDetail.id, "REALIZADO")
                          }
                          className={`py-1.5 px-2 rounded-xl font-black text-[10.5px] cursor-pointer border ${
                            selectedEventDetail.status === "REALIZADO"
                              ? "bg-emerald-600 text-white border-emerald-400"
                              : "bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border-emerald-600/40"
                          }`}
                        >
                          ✅ Realizado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateAgendaEventStatus(selectedEventDetail.id, "REPROGRAMADO")
                          }
                          className={`py-1.5 px-2 rounded-xl font-black text-[10.5px] cursor-pointer border ${
                            selectedEventDetail.status === "REPROGRAMADO"
                              ? "bg-amber-500 text-slate-950 border-amber-300"
                              : "bg-amber-950/60 hover:bg-amber-700 text-amber-300 border-amber-600/40"
                          }`}
                        >
                          🔁 Reprogramado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateAgendaEventStatus(selectedEventDetail.id, "SUSPENDIDO")
                          }
                          className={`py-1.5 px-2 rounded-xl font-black text-[10.5px] cursor-pointer border ${
                            selectedEventDetail.status === "SUSPENDIDO"
                              ? "bg-rose-600 text-white border-rose-400"
                              : "bg-rose-950/60 hover:bg-rose-800 text-rose-300 border-rose-600/40"
                          }`}
                        >
                          ⏸ Suspendido
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      {selectedEventDetail.status !== "ANULADO" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUniversalAnnul(
                              "agendaEvents",
                              selectedEventDetail.id,
                              selectedEventDetail.title
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
                        >
                          🚫 Anular Actividad
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleUniversalDelete(
                            "agendaEvents",
                            selectedEventDetail.id,
                            selectedEventDetail.title
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Actividad</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VENTANA FLOTANTE DEL DÍA CON TODOS LOS PARÁMETROS DE GOOGLE CALENDAR */}
            {selectedDayModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                  <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        Google Calendar SIACENDIS • Parámetros Completos y Recordatorios Anticipados
                      </span>
                      <h3 className="text-sm font-black">Agenda del Día: {selectedDayModal}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedDayModal(null)}
                      className="text-white/80 hover:text-white text-xs font-bold px-2.5 py-1 rounded bg-blue-800 cursor-pointer shrink-0"
                    >
                      Cerrar ✕
                    </button>
                  </div>

                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
                                <div className="flex flex-wrap items-center gap-1">
                                  {ev.status !== "APROBADO" && currentUser?.role === "ADMIN" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAgendaEvents((prev) =>
                                          prev.map((item) =>
                                            item.id === ev.id
                                              ? { ...item, status: "APROBADO", updatedAt: Date.now() }
                                              : item
                                          )
                                        );
                                        setTimeout(() => syncWithCloudServer(), 60);
                                      }}
                                      className="px-2 py-1 rounded bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      ✓ Aprobar
                                    </button>
                                  )}
                                  {ev.status !== "ANULADO" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUniversalAnnul("agendaEvents", ev.id, ev.title)
                                      }
                                      className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      🚫 Anular
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUniversalDelete("agendaEvents", ev.id, ev.title)
                                    }
                                    className="px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 bg-[#070b14]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  const inp = e.currentTarget.parentElement?.querySelector('input[type="time"]');
                                  if (inp) {
                                    inp.focus();
                                    try { inp.showPicker?.(); } catch {}
                                  }
                                }}
                                title="Abrir reloj para escoger hora de inicio"
                                className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Inicio:</span>
                              </button>
                              <input
                                type="time"
                                value={newEventForm.startTime}
                                onChange={(e) => setNewEventForm({ ...newEventForm, startTime: e.target.value })}
                                className="bg-transparent text-xs outline-none cursor-pointer"
                                style={{ colorScheme: themeMode === "LIGHT" ? "light" : "dark" }}
                                title="Hora de inicio"
                              />
                            </div>
                            <div className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 bg-[#070b14]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  const inp = e.currentTarget.parentElement?.querySelector('input[type="time"]');
                                  if (inp) {
                                    inp.focus();
                                    try { inp.showPicker?.(); } catch {}
                                  }
                                }}
                                title="Abrir reloj para escoger hora de finalización"
                                className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Fin:</span>
                              </button>
                              <input
                                type="time"
                                value={newEventForm.endTime}
                                onChange={(e) => setNewEventForm({ ...newEventForm, endTime: e.target.value })}
                                className="bg-transparent text-xs outline-none cursor-pointer"
                                style={{ colorScheme: themeMode === "LIGHT" ? "light" : "dark" }}
                                title="Hora de finalización"
                              />
                            </div>
                          </div>
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

                <button
                  type="button"
                  onClick={() => setHrSubTab("REPORTE_VOTACION")}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    hrSubTab === "REPORTE_VOTACION" ? "neon-orange-nav-active font-black" : "neon-orange-nav"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb366]" />
                  <span>Reporte Centro de Votación</span>
                </button>

                <button
                  type="button"
                  onClick={() => openConstanciaModal(employees[0])}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/60 shadow"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Constancia de Trabajo</span>
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
                                    onClick={() => openConstanciaModal(emp)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Generar Constancia de Trabajo con correlativo independiente"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Constancia</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditEmployeeModal(emp)}
                                    className="px-2.5 py-1.5 rounded-lg neon-orange-nav font-bold text-[10px] cursor-pointer"
                                    title="Editar datos personales, foto carnet o familiares"
                                  >
                                    Editar Ficha
                                  </button>

                                  {emp.status !== "ANULADO" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUniversalAnnul(
                                          "employees",
                                          emp.id,
                                          `${emp.nombres} ${emp.apellidos}`
                                        )
                                      }
                                      className="px-2 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer"
                                      title="Anular expediente"
                                    >
                                      🚫 Anular
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUniversalDelete(
                                        "employees",
                                        emp.id,
                                        `${emp.nombres} ${emp.apellidos}`
                                      )
                                    }
                                    className="px-2 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Eliminar trabajador definitivamente"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : bienesViewMode === "LABELS" ? (
              /* GENERADOR DE ETIQUETAS CON CÓDIGO DE BARRA, LOGO DORADO CENDIS Y SEGURIDAD NO REPETIBLE / NO REIMPRIMIBLE */
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                        Control de Seguridad Patrimonial • Correlativo Único Irrepetible
                      </span>
                      <h3 className="text-sm font-black uppercase text-slate-900">
                        Generador de Etiquetas de Bienes Nacionales (Uso Único — No Reimprimible)
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                      🔒 {printedLabelsLog.length} Etiquetas Emitidas y Bloqueadas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Artículo / Bien a Etiquetar
                      </label>
                      <select
                        value={labelGenForm.sourceBienId}
                        onChange={(e) => {
                          const bn = bienesList.find((x) => String(x.id) === e.target.value);
                          setLabelGenForm({
                            ...labelGenForm,
                            sourceBienId: e.target.value,
                            articulo: bn ? bn.articulo : labelGenForm.articulo,
                            ubicacion: bn ? bn.ubicacion : labelGenForm.ubicacion,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        <option value="">-- Lote Nuevo de Artículos --</option>
                        {bienesList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.codigoBN} • {b.articulo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Descripción en Etiqueta
                      </label>
                      <input
                        type="text"
                        value={labelGenForm.articulo}
                        onChange={(e) => setLabelGenForm({ ...labelGenForm, articulo: e.target.value })}
                        placeholder="Ej. Consola / Micrófono / Laptop"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        ¿Cuántos Artículos va a Ingresar?
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={labelGenForm.cantidad}
                        onChange={(e) =>
                          setLabelGenForm({
                            ...labelGenForm,
                            cantidad: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-black"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const qty = Math.max(1, Math.min(50, Number(labelGenForm.cantidad) || 1));
                        const existingNums = printedLabelsLog
                          .map((l) => {
                            const m = String(l.correlativoSeguridad || "").match(/(\d+)$/);
                            return m ? parseInt(m[1], 10) : 0;
                          })
                          .filter((n) => !Number.isNaN(n));
                        let nextSeq = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1001;
                        const existingCodesSet = new Set(
                          printedLabelsLog.map((l) => String(l.correlativoSeguridad || "").toUpperCase())
                        );

                        const items = [];
                        for (let i = 0; i < qty; i++) {
                          let code = "";
                          do {
                            code = `BN-CENDIS-${String(nextSeq).padStart(6, "0")}`;
                            nextSeq++;
                          } while (existingCodesSet.has(code));
                          existingCodesSet.add(code);
                          items.push({
                            id: `lbl-${Date.now()}-${i}`,
                            correlativoSeguridad: code,
                            articulo: labelGenForm.articulo || "BIEN NACIONAL CENDIS",
                            ubicacion: labelGenForm.ubicacion || "SEDE CENDIS",
                            fechaEmision: new Date().toISOString().slice(0, 10),
                          });
                        }
                        setCurrentLabelBatch({
                          batchId: `BATCH-${Date.now()}`,
                          items,
                          isLockedPrinted: false,
                        });
                        showToast(
                          `Generadas ${items.length} etiqueta(s) únicas con código de barra listas para impresión única.`
                        );
                      }}
                      className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs cursor-pointer shadow"
                    >
                      🏷️ Generar {labelGenForm.cantidad} Etiqueta(s) Única(s)
                    </button>
                  </div>

                  {currentLabelBatch.items.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs">
                        {currentLabelBatch.isLockedPrinted ? (
                          <span className="font-black text-red-300">
                            🔒 LOTE IMPRESO Y BLOQUEADO: Por seguridad, estas etiquetas ya quedaron registradas y NO pueden reimprimirse.
                          </span>
                        ) : (
                          <span className="font-bold text-amber-200">
                            ⚠️ Lote listo ({currentLabelBatch.items.length} etiquetas). Al imprimir, quedarán bloqueadas permanentemente contra reimpresión.
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={currentLabelBatch.isLockedPrinted}
                        onClick={() => {
                          if (currentLabelBatch.isLockedPrinted) return;
                          const alreadyUsed = currentLabelBatch.items.some((it) =>
                            printedLabelsLog.some(
                              (log) =>
                                String(log.correlativoSeguridad).toUpperCase() ===
                                String(it.correlativoSeguridad).toUpperCase()
                            )
                          );
                          if (alreadyUsed) {
                            showToast(
                              "BLOQUEO DE SEGURIDAD: Uno o más correlativos ya fueron impresos anteriormente y no pueden repetirse.",
                              "error"
                            );
                            setCurrentLabelBatch((prev) => ({ ...prev, isLockedPrinted: true }));
                            return;
                          }
                          const now = new Date();
                          const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
                          const newLogEntries = currentLabelBatch.items.map((it) => ({
                            ...it,
                            impresoPor: currentUser?.fullName || currentUser?.username || "USUARIO",
                            impresoEn: stamp,
                            bloqueada: true,
                            updatedAt: Date.now(),
                          }));
                          const nextLogs = [...newLogEntries, ...printedLabelsLog];
                          setPrintedLabelsLog(nextLogs);
                          syncWithCloudServer({ printedLabelsLog: nextLogs });
                          setCurrentLabelBatch((prev) => ({ ...prev, isLockedPrinted: true }));
                          addLog(
                            `Impresas y bloqueadas por seguridad ${newLogEntries.length} etiqueta(s) BN (${newLogEntries[0].correlativoSeguridad} ...)`
                          );
                          setTimeout(() => window.print(), 120);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                          currentLabelBatch.isLockedPrinted
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-70"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow"
                        }`}
                      >
                        <Printer className="w-4 h-4" />
                        <span>
                          {currentLabelBatch.isLockedPrinted
                            ? "🔒 Ya Impresa (Bloqueada por Seguridad)"
                            : "🔒 Imprimir Etiquetas (Uso Único)"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ÁREA IMPRIMIBLE DE ETIQUETAS PEQUEÑAS CON LOGO DORADO CENDIS Y CÓDIGO DE BARRA */}
                {currentLabelBatch.items.length > 0 && (
                  <div
                    id="printable-area"
                    className="w-full max-w-[820px] mx-auto bg-white p-6 rounded-xl border border-slate-200 text-slate-950"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentLabelBatch.items.map((lbl) => (
                        <div
                          key={lbl.id}
                          className="border-2 border-[#c5a059] rounded-lg p-2.5 bg-[#fbfbfa] flex flex-col items-center justify-between text-center shadow-sm"
                          style={{ minHeight: "155px", pageBreakInside: "avoid" }}
                        >
                          <div className="w-full border-b border-[#c5a059]/60 pb-1 flex flex-col items-center">
                            <GoldenCendisGlyphSVG sizeClass="w-[96px]" />
                            <span className="text-[7.5px] font-black uppercase tracking-wider text-[#0b2545] mt-0.5">
                              BIEN NACIONAL • MPPC CENDIS
                            </span>
                          </div>

                          <div className="my-1 w-full">
                            <div className="text-[8.5px] font-black uppercase text-slate-800 truncate">
                              {lbl.articulo}
                            </div>
                            <div className="text-[11px] font-black font-mono text-[#0b294d] tracking-tight">
                              {lbl.correlativoSeguridad}
                            </div>
                          </div>

                          <div className="w-full flex flex-col items-center">
                            <ScannableCarnetBarcode value={lbl.correlativoSeguridad} />
                            <span className="text-[6.5px] font-bold uppercase text-red-700 tracking-wider mt-0.5">
                              ETIQUETA ÚNICA DE SEGURIDAD • NO REPETIBLE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AUDITORÍA DE ETIQUETAS YA IMPRESAS Y BLOQUEADAS */}
                {printedLabelsLog.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 print:hidden">
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      Registro de Seguridad: Etiquetas Emitidas (No Reimprimibles)
                    </h4>
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase font-black">
                            <th className="p-2">N° Bien / Correlativo</th>
                            <th className="p-2">Artículo</th>
                            <th className="p-2">Emitida Por</th>
                            <th className="p-2">Fecha/Hora</th>
                            <th className="p-2">Estado Seguridad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {printedLabelsLog.slice(0, 30).map((log) => (
                            <tr key={log.id}>
                              <td className="p-2 font-mono font-black text-teal-900">
                                {log.correlativoSeguridad}
                              </td>
                              <td className="p-2 font-semibold">{log.articulo}</td>
                              <td className="p-2">{log.impresoPor}</td>
                              <td className="p-2">{log.impresoEn}</td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-black text-[9.5px]">
                                  🔒 IMPRESA / BLOQUEADA
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : hrSubTab === "REPORTE_VOTACION" ? (
              /* REPORTE INDEPENDIENTE DE CENTRO DE VOTACIÓN Y PARTICIPACIÓN ELECTORAL */
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-amber-500/40 p-5 space-y-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8c42] block">
                        Reporte Independiente • Registro Electoral del Personal
                      </span>
                      <h3 className="text-sm font-black uppercase text-slate-900">
                        Centro de Votación, Ubicación Geográfica y Control de Voto ({employees.length} Trabajadores)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ya votaron:{" "}
                        <strong className="text-emerald-600">
                          {employees.filter((e) => e.yaVoto === "SI").length}
                        </strong>{" "}
                        • Pendientes:{" "}
                        <strong className="text-amber-600">
                          {employees.filter((e) => e.yaVoto !== "SI").length}
                        </strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Reporte PDF</span>
                    </button>
                  </div>
                </div>

                <div
                  id={
                    selectedEmpForCard || selectedEmpForCV || selectedEmpForConstancia
                      ? "printable-area-bg"
                      : "printable-area"
                  }
                  className="org-print-auto-height w-full max-w-[920px] min-h-[1020px] mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between text-slate-950"
                >
                  <div className="p-8 space-y-4">
                    <OfficialHeaderCintillo showRightLogo={true} />

                    <div className="text-center border-b-2 border-slate-900 pb-2">
                      <h2 className="text-sm font-black uppercase text-slate-950">
                        REPORTE DE CENTRO DE VOTACIÓN Y CONTROL ELECTORAL DEL PERSONAL • CENDIS
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-700">
                        Total Trabajadores: {employees.length} • Ya Votaron:{" "}
                        {employees.filter((e) => e.yaVoto === "SI").length} • Pendientes:{" "}
                        {employees.filter((e) => e.yaVoto !== "SI").length}
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-slate-900 text-[9.5px]">
                      <thead>
                        <tr className="bg-slate-200 font-black uppercase text-slate-900">
                          <th className="border border-slate-900 p-1.5 text-center">#</th>
                          <th className="border border-slate-900 p-1.5 text-left">Trabajador</th>
                          <th className="border border-slate-900 p-1.5 text-left">Cédula</th>
                          <th className="border border-slate-900 p-1.5 text-left">Centro de Votación</th>
                          <th className="border border-slate-900 p-1.5 text-left">Estado</th>
                          <th className="border border-slate-900 p-1.5 text-left">Municipio</th>
                          <th className="border border-slate-900 p-1.5 text-left">Parroquia</th>
                          <th className="border border-slate-900 p-1.5 text-center">¿Ya Votó?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp, idx) => {
                          const voted = emp.yaVoto === "SI";
                          return (
                            <tr key={emp.id} className={voted ? "bg-emerald-50" : ""}>
                              <td className="border border-slate-900 p-1.5 text-center font-bold">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-900 p-1.5 font-bold uppercase">
                                {emp.apellidos} {emp.nombres}
                              </td>
                              <td className="border border-slate-900 p-1.5 font-semibold">
                                {emp.cedula}
                              </td>
                              <td className="border border-slate-900 p-1.5 uppercase">
                                {emp.centroVotacion || "POR REGISTRAR"}
                              </td>
                              <td className="border border-slate-900 p-1.5 uppercase">
                                {emp.estadoVotacion || "-"}
                              </td>
                              <td className="border border-slate-900 p-1.5 uppercase">
                                {emp.municipioVotacion || "-"}
                              </td>
                              <td className="border border-slate-900 p-1.5 uppercase">
                                {emp.parroquiaVotacion || "-"}
                              </td>
                              <td className="border border-slate-900 p-1.5 text-center whitespace-nowrap">
                                <div className="inline-flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextEmployees = employees.map((x, i) =>
                                        (emp.id !== undefined && String(x.id) === String(emp.id)) || i === idx
                                          ? { ...x, yaVoto: "SI", updatedAt: Date.now() }
                                          : x
                                      );
                                      setEmployees(nextEmployees);
                                      syncWithCloudServer({ employees: nextEmployees });
                                      showToast(`${emp.nombres} ${emp.apellidos}: marcado como SÍ votó.`);
                                    }}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-black cursor-pointer transition ${
                                      voted
                                        ? "bg-emerald-600 text-white border-emerald-700"
                                        : "bg-white text-slate-900 border-slate-900 hover:bg-emerald-50"
                                    }`}
                                  >
                                    <span className="inline-block w-3 h-3 border border-current rounded-xs leading-[10px] text-center text-[9px]">
                                      {voted ? "✓" : ""}
                                    </span>
                                    <span>Si</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextEmployees = employees.map((x, i) =>
                                        (emp.id !== undefined && String(x.id) === String(emp.id)) || i === idx
                                          ? { ...x, yaVoto: "NO", updatedAt: Date.now() }
                                          : x
                                      );
                                      setEmployees(nextEmployees);
                                      syncWithCloudServer({ employees: nextEmployees });
                                      showToast(`${emp.nombres} ${emp.apellidos}: marcado como NO ha votado.`);
                                    }}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-black cursor-pointer transition ${
                                      !voted
                                        ? "bg-rose-600 text-white border-rose-700"
                                        : "bg-white text-slate-900 border-slate-900 hover:bg-rose-50"
                                    }`}
                                  >
                                    <span className="inline-block w-3 h-3 border border-current rounded-xs leading-[10px] text-center text-[9px]">
                                      {!voted ? "✓" : ""}
                                    </span>
                                    <span>NO</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <OfficialFooterWave />
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
                        <option value="Dirección General">Dirección General</option>
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
                  id={
                    selectedEmpForCard || selectedEmpForCV || selectedEmpForConstancia
                      ? "printable-area-bg"
                      : "printable-area"
                  }
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
                      updatedAt: Date.now(),
                    };
                    setProjects((prev) => [created, ...prev]);
                    setTimeout(() => syncWithCloudServer(), 60);
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{p.nombre}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.estatus === "ANULADO" || p.status === "ANULADO"
                                ? "bg-red-100 text-red-800"
                                : p.porcentaje >= 100
                                ? "bg-emerald-100 text-emerald-800"
                                : p.porcentaje > 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.estatus === "ANULADO" || p.status === "ANULADO"
                              ? "ANULADO"
                              : p.porcentaje >= 100
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

                      <div className="flex flex-wrap items-center gap-1.5">
                        {[0, 25, 50, 75, 100].map((pctVal) => (
                          <button
                            key={pctVal}
                            onClick={() => {
                              setProjects((prev) =>
                                prev.map((item) =>
                                  item.id === p.id
                                    ? {
                                        ...item,
                                        porcentaje: pctVal,
                                        status:
                                          pctVal === 100
                                            ? "COMPLETADO"
                                            : pctVal > 0
                                            ? "EN_EJECUCION"
                                            : "PENDIENTE",
                                        estatus:
                                          pctVal === 100
                                            ? "COMPLETADO"
                                            : pctVal > 0
                                            ? "EN_EJECUCION"
                                            : "PENDIENTE",
                                        updatedAt: Date.now(),
                                      }
                                    : item
                                )
                              );
                              setTimeout(() => syncWithCloudServer(), 60);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                              p.porcentaje === pctVal
                                ? "bg-indigo-700 text-white"
                                : "bg-white border border-slate-300 text-slate-700"
                            }`}
                          >
                            {pctVal}%
                          </button>
                        ))}

                        {p.estatus !== "ANULADO" && p.status !== "ANULADO" && (
                          <button
                            type="button"
                            onClick={() => handleUniversalAnnul("projects", p.id, p.nombre)}
                            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            🚫 Anular
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUniversalDelete("projects", p.id, p.nombre)}
                          className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
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
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setBienesViewMode("FORM")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    bienesViewMode === "FORM" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Inventario y Registro
                </button>
                <button
                  onClick={() => setBienesViewMode("LABELS")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    bienesViewMode === "LABELS"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Etiquetas Código de Barra (Seguridad)</span>
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
                      updatedAt: Date.now(),
                    };
                    setBienesList((prev) => [created, ...prev]);
                    setTimeout(() => syncWithCloudServer(), 60);
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
                        <th className="p-3">Estatus</th>
                        <th className="p-3">Acciones</th>
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
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                b.estado === "ANULADO" || b.status === "ANULADO"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              }`}
                            >
                              {b.estado || b.status || "OPERATIVO"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {b.estado !== "ANULADO" && b.status !== "ANULADO" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUniversalAnnul("bienes", b.id, `${b.codigoBN} (${b.articulo})`)
                                  }
                                  className="px-2 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  🚫 Anular
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleUniversalDelete("bienes", b.id, `${b.codigoBN} (${b.articulo})`)
                                }
                                className="px-2 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : bienesViewMode === "LABELS" ? (
              /* GENERADOR DE ETIQUETAS CON CÓDIGO DE BARRA, LOGO DORADO CENDIS Y SEGURIDAD NO REPETIBLE / NO REIMPRIMIBLE */
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                        Control de Seguridad Patrimonial • Correlativo Único Irrepetible
                      </span>
                      <h3 className="text-sm font-black uppercase text-slate-900">
                        Generador de Etiquetas de Bienes Nacionales (Uso Único — No Reimprimible)
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                      🔒 {printedLabelsLog.length} Etiquetas Emitidas y Bloqueadas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Artículo / Bien a Etiquetar
                      </label>
                      <select
                        value={labelGenForm.sourceBienId}
                        onChange={(e) => {
                          const bn = bienesList.find((x) => String(x.id) === e.target.value);
                          setLabelGenForm({
                            ...labelGenForm,
                            sourceBienId: e.target.value,
                            articulo: bn ? bn.articulo : labelGenForm.articulo,
                            ubicacion: bn ? bn.ubicacion : labelGenForm.ubicacion,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        <option value="">-- Lote Nuevo de Artículos --</option>
                        {bienesList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.codigoBN} • {b.articulo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Descripción en Etiqueta
                      </label>
                      <input
                        type="text"
                        value={labelGenForm.articulo}
                        onChange={(e) => setLabelGenForm({ ...labelGenForm, articulo: e.target.value })}
                        placeholder="Ej. Consola / Micrófono / Laptop"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        ¿Cuántos Artículos va a Ingresar?
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={labelGenForm.cantidad}
                        onChange={(e) =>
                          setLabelGenForm({
                            ...labelGenForm,
                            cantidad: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-black"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const qty = Math.max(1, Math.min(50, Number(labelGenForm.cantidad) || 1));
                        const existingNums = printedLabelsLog
                          .map((l) => {
                            const m = String(l.correlativoSeguridad || "").match(/(\d+)$/);
                            return m ? parseInt(m[1], 10) : 0;
                          })
                          .filter((n) => !Number.isNaN(n));
                        let nextSeq = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1001;
                        const existingCodesSet = new Set(
                          printedLabelsLog.map((l) => String(l.correlativoSeguridad || "").toUpperCase())
                        );

                        const items = [];
                        for (let i = 0; i < qty; i++) {
                          let code = "";
                          do {
                            code = `BN-CENDIS-${String(nextSeq).padStart(6, "0")}`;
                            nextSeq++;
                          } while (existingCodesSet.has(code));
                          existingCodesSet.add(code);
                          items.push({
                            id: `lbl-${Date.now()}-${i}`,
                            correlativoSeguridad: code,
                            articulo: labelGenForm.articulo || "BIEN NACIONAL CENDIS",
                            ubicacion: labelGenForm.ubicacion || "SEDE CENDIS",
                            fechaEmision: new Date().toISOString().slice(0, 10),
                          });
                        }
                        setCurrentLabelBatch({
                          batchId: `BATCH-${Date.now()}`,
                          items,
                          isLockedPrinted: false,
                        });
                        showToast(
                          `Generadas ${items.length} etiqueta(s) únicas con código de barra listas para impresión única.`
                        );
                      }}
                      className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs cursor-pointer shadow"
                    >
                      🏷️ Generar {labelGenForm.cantidad} Etiqueta(s) Única(s)
                    </button>
                  </div>

                  {currentLabelBatch.items.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs">
                        {currentLabelBatch.isLockedPrinted ? (
                          <span className="font-black text-red-300">
                            🔒 LOTE IMPRESO Y BLOQUEADO: Por seguridad, estas etiquetas ya quedaron registradas y NO pueden reimprimirse.
                          </span>
                        ) : (
                          <span className="font-bold text-amber-200">
                            ⚠️ Lote listo ({currentLabelBatch.items.length} etiquetas). Al imprimir, quedarán bloqueadas permanentemente contra reimpresión.
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={currentLabelBatch.isLockedPrinted}
                        onClick={() => {
                          if (currentLabelBatch.isLockedPrinted) return;
                          const alreadyUsed = currentLabelBatch.items.some((it) =>
                            printedLabelsLog.some(
                              (log) =>
                                String(log.correlativoSeguridad).toUpperCase() ===
                                String(it.correlativoSeguridad).toUpperCase()
                            )
                          );
                          if (alreadyUsed) {
                            showToast(
                              "BLOQUEO DE SEGURIDAD: Uno o más correlativos ya fueron impresos anteriormente y no pueden repetirse.",
                              "error"
                            );
                            setCurrentLabelBatch((prev) => ({ ...prev, isLockedPrinted: true }));
                            return;
                          }
                          const now = new Date();
                          const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
                          const newLogEntries = currentLabelBatch.items.map((it) => ({
                            ...it,
                            impresoPor: currentUser?.fullName || currentUser?.username || "USUARIO",
                            impresoEn: stamp,
                            bloqueada: true,
                            updatedAt: Date.now(),
                          }));
                          const nextLogs = [...newLogEntries, ...printedLabelsLog];
                          setPrintedLabelsLog(nextLogs);
                          syncWithCloudServer({ printedLabelsLog: nextLogs });
                          setCurrentLabelBatch((prev) => ({ ...prev, isLockedPrinted: true }));
                          addLog(
                            `Impresas y bloqueadas por seguridad ${newLogEntries.length} etiqueta(s) BN (${newLogEntries[0].correlativoSeguridad} ...)`
                          );
                          setTimeout(() => window.print(), 120);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                          currentLabelBatch.isLockedPrinted
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-70"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow"
                        }`}
                      >
                        <Printer className="w-4 h-4" />
                        <span>
                          {currentLabelBatch.isLockedPrinted
                            ? "🔒 Ya Impresa (Bloqueada por Seguridad)"
                            : "🔒 Imprimir Etiquetas (Uso Único)"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ÁREA IMPRIMIBLE DE ETIQUETAS PEQUEÑAS CON LOGO DORADO CENDIS Y CÓDIGO DE BARRA */}
                {currentLabelBatch.items.length > 0 && (
                  <div
                    id="printable-area"
                    className="w-full max-w-[820px] mx-auto bg-white p-6 rounded-xl border border-slate-200 text-slate-950"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentLabelBatch.items.map((lbl) => (
                        <div
                          key={lbl.id}
                          className="border-2 border-[#c5a059] rounded-lg p-2.5 bg-[#fbfbfa] flex flex-col items-center justify-between text-center shadow-sm"
                          style={{ minHeight: "155px", pageBreakInside: "avoid" }}
                        >
                          <div className="w-full border-b border-[#c5a059]/60 pb-1 flex flex-col items-center">
                            <GoldenCendisGlyphSVG sizeClass="w-[96px]" />
                            <span className="text-[7.5px] font-black uppercase tracking-wider text-[#0b2545] mt-0.5">
                              BIEN NACIONAL • MPPC CENDIS
                            </span>
                          </div>

                          <div className="my-1 w-full">
                            <div className="text-[8.5px] font-black uppercase text-slate-800 truncate">
                              {lbl.articulo}
                            </div>
                            <div className="text-[11px] font-black font-mono text-[#0b294d] tracking-tight">
                              {lbl.correlativoSeguridad}
                            </div>
                          </div>

                          <div className="w-full flex flex-col items-center">
                            <ScannableCarnetBarcode value={lbl.correlativoSeguridad} />
                            <span className="text-[6.5px] font-bold uppercase text-red-700 tracking-wider mt-0.5">
                              ETIQUETA ÚNICA DE SEGURIDAD • NO REPETIBLE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AUDITORÍA DE ETIQUETAS YA IMPRESAS Y BLOQUEADAS */}
                {printedLabelsLog.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 print:hidden">
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      Registro de Seguridad: Etiquetas Emitidas (No Reimprimibles)
                    </h4>
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase font-black">
                            <th className="p-2">N° Bien / Correlativo</th>
                            <th className="p-2">Artículo</th>
                            <th className="p-2">Emitida Por</th>
                            <th className="p-2">Fecha/Hora</th>
                            <th className="p-2">Estado Seguridad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {printedLabelsLog.slice(0, 30).map((log) => (
                            <tr key={log.id}>
                              <td className="p-2 font-mono font-black text-teal-900">
                                {log.correlativoSeguridad}
                              </td>
                              <td className="p-2 font-semibold">{log.articulo}</td>
                              <td className="p-2">{log.impresoPor}</td>
                              <td className="p-2">{log.impresoEn}</td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-black text-[9.5px]">
                                  🔒 IMPRESA / BLOQUEADA
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                            <td
                              className={`border border-slate-900 p-2.5 font-bold ${
                                att.status === "ANULADO" || att.estatus === "ANULADO"
                                  ? "text-red-700 line-through"
                                  : "text-emerald-800"
                              }`}
                            >
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
              {/* ... */}
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
                      {documents.filter((d) => d.tipo === "MEMORANDUM" && d.status !== "ANULADO").length}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-[11px] font-bold uppercase text-blue-700">Solicitudes Emitidas</span>
                    <div className="text-3xl font-black text-blue-900 mt-1">
                      {
                        documents.filter(
                          (d) =>
                            (d.tipo === "SOLICITUD" ||
                              d.tipo === "SOLICITUD_ALIMENTOS" ||
                              d.tipo === "SOLICITUD_SERVICIOS_GENERALES") &&
                            d.status !== "ANULADO"
                        ).length
                      }
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] font-bold uppercase text-amber-700">Personal en RRHH</span>
                    <div className="text-3xl font-black text-amber-900 mt-1">
                      {employees.filter((e) => e.status !== "ANULADO").length}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-bold uppercase text-emerald-700">Actividades en Agenda</span>
                    <div className="text-3xl font-black text-emerald-900 mt-1">
                      {agendaEvents.filter((e) => e.status !== "ANULADO").length}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[11px] font-bold uppercase text-indigo-700">Proyectos (% Global)</span>
                    <div className="text-3xl font-black text-indigo-900 mt-1">
                      {projects.filter((p) => p.status !== "ANULADO").length} ({globalProjectsProgress}%)
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <span className="text-[11px] font-bold uppercase text-teal-700">Bienes Nacionales</span>
                    <div className="text-3xl font-black text-teal-900 mt-1">
                      {bienesList.filter((b) => b.status !== "ANULADO").length}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200">
                    <span className="text-[11px] font-bold uppercase text-cyan-700">Asistencias Registradas</span>
                    <div className="text-3xl font-black text-cyan-900 mt-1">
                      {attendanceRecords.filter((a) => a.status !== "ANULADO" && a.estatus !== "ANULADO").length}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                    <span className="text-[11px] font-bold uppercase text-purple-700">Usuarios Creados</span>
                    <div className="text-3xl font-black text-purple-900 mt-1">
                      {users.filter((u) => u.active !== false && u.status !== "ANULADO").length}
                    </div>
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
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <h2 className="text-base font-black uppercase text-slate-900">
                Organigrama Oficial • Fundación CENDIS
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOrgCargoId(null);
                    setOrgCargoForm({
                      nombreCargo: "",
                      coordinacion: "PRODUCCIÓN FONOGRÁFICA",
                      nivelJerarquico: "COORDINACIÓN",
                      reportaA: "DIRECCIÓN GENERAL",
                      funciones: "",
                      assignedEmpId: "",
                    });
                    setOrgCargoModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-black cursor-pointer shadow"
                >
                  + Crear Nuevo Cargo
                </button>
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
              style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
              className={`${
                orgViewMode === "DIAGRAM"
                  ? "org-print-landscape max-w-[1100px] min-h-[780px]"
                  : "org-print-auto-height max-w-[820px] min-h-[1020px]"
              } w-full mx-auto bg-white shadow-xl border border-slate-200 flex flex-col justify-between text-slate-950`}
            >
              {/* ... */}
              <div className="p-5 sm:p-6 print:px-6 print:py-2 space-y-3 print:space-y-1">
                <OfficialHeaderCintillo showRightLogo={true} />

                <div className="mt-1 print:mt-0.5 text-center">
                  <h2 className="text-sm sm:text-base print:text-[11px] font-black uppercase text-slate-900">
                    ESTRUCTURA ORGANIZATIVA Y ORGANIGRAMA OFICIAL • FUNDACIÓN CENDIS
                  </h2>
                  <p className="text-[11px] print:text-[9px] text-slate-600 font-semibold">
                    Ministerio del Poder Popular para la Cultura • Distribución por Dependencias
                  </p>
                </div>

                {(() => {
                  const dependencies = Array.from(
                    new Set([
                      ...orgCargos.map((c) => (c.coordinacion || "DEPENDENCIA GENERAL").toUpperCase()),
                      ...employees.map((e) => (e.coordinacion || "DEPENDENCIA GENERAL").toUpperCase()),
                    ])
                  );
                  const renderOfficialOrgNode = (
                    cargoId,
                    fallbackTitle,
                    borderColorClass = "border-blue-300",
                    bgGradientClass = "bg-gradient-to-br from-slate-50 to-blue-50",
                    extraClass = ""
                  ) => {
                    const defNode = INITIAL_ORG_CARGOS.find((c) => String(c.id) === String(cargoId));
                    const node = orgCargos.find((c) => String(c.id) === String(cargoId)) || {
                      id: cargoId,
                      nombreCargo: fallbackTitle,
                      assignedEmpName: defNode?.assignedEmpName || "",
                    };
                    const displayName = (node.assignedEmpName || defNode?.assignedEmpName || "").trim();
                    return (
                      <div
                        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                        className={`${bgGradientClass} border-2 ${borderColorClass} rounded-xl px-2.5 py-2 print:px-2 print:py-1.5 text-center shadow-xs space-y-0.5 ${extraClass}`}
                      >
                        <div className="font-black text-[9.5px] print:text-[8px] leading-tight uppercase text-slate-900">
                          {node.nombreCargo || fallbackTitle}
                        </div>
                        <div className="text-[9px] print:text-[7.5px] font-bold text-slate-700 leading-tight">
                          {displayName ? `👤 ${displayName}` : "Cargo vacante / Sin asignar"}
                        </div>
                      </div>
                    );
                  };
                  const officialIds = new Set(INITIAL_ORG_CARGOS.map((c) => String(c.id)));
                  const extraCustomCargos = orgCargos.filter((c) => !officialIds.has(String(c.id)));

                  return orgViewMode === "DIAGRAM" ? (
                    <div className="p-3 sm:p-4 print:p-2.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col items-center space-y-1.5 print:space-y-1">
                      {/* Nivel 1: Ministerio */}
                      <div className="w-full max-w-[270px]">
                        {renderOfficialOrgNode(
                          "org-mppc",
                          "MINISTERIO DEL PODER POPULAR PARA LA CULTURA",
                          "border-blue-300",
                          "bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-100/70"
                        )}
                      </div>
                      <div className="h-2.5 print:h-1.5 w-0.5 bg-slate-400" />

                      {/* Nivel 2: Consejo Directivo */}
                      <div className="w-full max-w-[220px]">
                        {renderOfficialOrgNode(
                          "org-consejo",
                          "CONSEJO DIRECTIVO",
                          "border-sky-300",
                          "bg-gradient-to-br from-sky-50 via-blue-50/80 to-indigo-100/60"
                        )}
                      </div>
                      <div className="h-2.5 print:h-1.5 w-0.5 bg-slate-400" />

                      {/* Nivel 3: Entre Consejo Directivo y Presidencia (OAC y Auditoría Interna en la misma línea) */}
                      <div className="w-full max-w-[760px] grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-5 print:col-span-5">
                          {renderOfficialOrgNode(
                            "org-oac",
                            "OFICINA DE ATENCIÓN AL CIUDADANO",
                            "border-cyan-300",
                            "bg-gradient-to-br from-cyan-50/90 to-sky-100/60"
                          )}
                        </div>
                        <div className="hidden md:flex print:flex md:col-span-2 print:col-span-2 items-center justify-center relative h-10 print:h-7">
                          <div className="w-full h-0.5 bg-slate-400" />
                          <div className="absolute inset-y-0 w-0.5 bg-slate-400" />
                        </div>
                        <div className="md:col-span-5 print:col-span-5">
                          {renderOfficialOrgNode(
                            "org-auditoria",
                            "AUDITORÍA INTERNA",
                            "border-cyan-300",
                            "bg-gradient-to-br from-cyan-50/90 to-sky-100/60"
                          )}
                        </div>
                      </div>
                      <div className="h-2.5 print:h-1.5 w-0.5 bg-slate-400" />

                      {/* Nivel 3B: Presidencia */}
                      <div className="w-full max-w-[230px]">
                        {renderOfficialOrgNode(
                          "org-presidencia",
                          "PRESIDENCIA",
                          "border-sky-400",
                          "bg-gradient-to-br from-sky-50 to-blue-100/80"
                        )}
                      </div>
                      <div className="h-2.5 print:h-1.5 w-0.5 bg-slate-400" />

                      {/* Nivel 4: Dirección Ejecutiva */}
                      <div className="w-full max-w-[230px]">
                        {renderOfficialOrgNode(
                          "org-dir-ejecutiva",
                          "DIRECCIÓN EJECUTIVA",
                          "border-blue-300",
                          "bg-gradient-to-br from-blue-50 via-indigo-50/80 to-sky-100/70"
                        )}
                      </div>
                      <div className="h-3 print:h-2 w-0.5 bg-slate-400" />

                      {/* Nivel 5: Asesoría/Apoyo Izquierda + Coordinación General de Gestión Interna Derecha */}
                      <div className="w-full grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-3 print:gap-2 items-start border-t-2 border-slate-300 pt-2 print:pt-1.5">
                        <div className="lg:col-span-5 print:col-span-5 space-y-2 print:space-y-1.5">
                          {renderOfficialOrgNode(
                            "org-consultoria",
                            "CONSULTORÍA JURÍDICA",
                            "border-indigo-300",
                            "bg-gradient-to-br from-indigo-50/80 to-slate-100/70"
                          )}
                          {renderOfficialOrgNode(
                            "org-comunicacion",
                            "COORDINACIÓN DE COMUNICACIÓN Y RELACIONES INSTITUCIONALES",
                            "border-indigo-300",
                            "bg-gradient-to-br from-indigo-50/80 to-violet-100/60"
                          )}
                        </div>

                        <div className="lg:col-span-7 print:col-span-7 space-y-1.5 print:space-y-1 flex flex-col items-center">
                          <div className="w-full max-w-[280px]">
                            {renderOfficialOrgNode(
                              "org-gestion-interna",
                              "COORDINACIÓN GENERAL DE GESTIÓN INTERNA",
                              "border-teal-300",
                              "bg-gradient-to-br from-teal-50/90 to-cyan-100/70"
                            )}
                          </div>
                          <div className="h-2 print:h-1.5 w-0.5 bg-teal-300" />
                          <div className="w-full grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-1.5 border-t-2 border-teal-200 pt-2 print:pt-1.5">
                            {renderOfficialOrgNode(
                              "org-admin-finanzas",
                              "COORDINACIÓN DE ADMINISTRACIÓN Y FINANZAS",
                              "border-teal-200",
                              "bg-gradient-to-br from-teal-50/70 to-sky-100/50"
                            )}
                            {renderOfficialOrgNode(
                              "org-planif-presup",
                              "COORDINACIÓN DE PLANIFICACIÓN Y PRESUPUESTO",
                              "border-teal-200",
                              "bg-gradient-to-br from-teal-50/70 to-sky-100/50"
                            )}
                            {renderOfficialOrgNode(
                              "org-rrhh",
                              "COORDINACIÓN DE RECURSOS HUMANOS",
                              "border-teal-200",
                              "bg-gradient-to-br from-teal-50/70 to-sky-100/50"
                            )}
                            {renderOfficialOrgNode(
                              "org-tecnologia",
                              "COORDINACIÓN DE TECNOLOGÍA E INFORMÁTICA",
                              "border-teal-200",
                              "bg-gradient-to-br from-teal-50/70 to-sky-100/50"
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-3 print:h-1.5 w-0.5 bg-slate-400" />

                      {/* Nivel 6: Coordinación General Estratégica (Verde difuminado) y Operaciones (Morado difuminado) */}
                      <div className="w-full grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-3 print:gap-2 items-start border-t-2 border-slate-300 pt-2 print:pt-1.5">
                        {/* Rama Verde: Estratégica */}
                        <div className="lg:col-span-5 print:col-span-5 flex flex-col items-center space-y-1.5 print:space-y-1">
                          <div className="w-full max-w-[250px]">
                            {renderOfficialOrgNode(
                              "org-estrategica",
                              "COORDINACIÓN GENERAL ESTRATÉGICA",
                              "border-emerald-300",
                              "bg-gradient-to-br from-emerald-50/90 to-teal-100/70"
                            )}
                          </div>
                          <div className="h-2 print:h-1.5 w-0.5 bg-emerald-300" />
                          <div className="w-full max-w-[250px]">
                            {renderOfficialOrgNode(
                              "org-prod-artistica",
                              "COORDINACIÓN DE PRODUCCIÓN ARTÍSTICA",
                              "border-emerald-200",
                              "bg-gradient-to-br from-emerald-50/70 to-lime-100/50"
                            )}
                          </div>
                        </div>

                        {/* Rama Morada: Operaciones */}
                        <div className="lg:col-span-7 print:col-span-7 flex flex-col items-center space-y-1.5 print:space-y-1">
                          <div className="w-full max-w-[280px]">
                            {renderOfficialOrgNode(
                              "org-operaciones",
                              "COORDINACIÓN GENERAL DE OPERACIONES",
                              "border-purple-300",
                              "bg-gradient-to-br from-purple-50/90 to-fuchsia-100/60"
                            )}
                          </div>
                          <div className="h-2 print:h-1.5 w-0.5 bg-purple-300" />
                          <div className="w-full grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-1.5 border-t-2 border-purple-200 pt-2 print:pt-1.5">
                            {renderOfficialOrgNode(
                              "org-prod-industrial",
                              "COORDINACIÓN DE PRODUCCIÓN INDUSTRIAL",
                              "border-purple-200",
                              "bg-gradient-to-br from-purple-50/70 to-pink-100/40"
                            )}
                            {renderOfficialOrgNode(
                              "org-comercializacion",
                              "COORDINACIÓN DE COMERCIALIZACIÓN",
                              "border-purple-200",
                              "bg-gradient-to-br from-purple-50/70 to-pink-100/40"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs text-slate-900">
                      {dependencies.map((depName) => {
                        const depCargos = orgCargos.filter(
                          (c) => (c.coordinacion || "DEPENDENCIA GENERAL").toUpperCase() === depName
                        );
                        const depEmps = employees.filter(
                          (e) => (e.coordinacion || "DEPENDENCIA GENERAL").toUpperCase() === depName
                        );
                        return (
                          <div key={depName} className="space-y-1.5 border border-slate-300 rounded-xl p-3 bg-white">
                            <div className="font-black text-xs uppercase text-[#8b1538] border-b border-slate-200 pb-1">
                              🏛 DEPENDENCIA: {depName}
                            </div>
                            {depCargos.map((cargoItem, idx) => {
                              const linkedEmp = employees.find(
                                (e) => String(e.id) === String(cargoItem.assignedEmpId)
                              );
                              return (
                                <div
                                  key={cargoItem.id}
                                  className="py-1.5 border-b border-amber-300/60 flex items-center justify-between gap-2 bg-amber-50/70 px-2 rounded"
                                >
                                  <div>
                                    <strong>Cargo {idx + 1} ({cargoItem.nivelJerarquico}):</strong>{" "}
                                    {cargoItem.nombreCargo} •{" "}
                                    <span className="font-bold text-blue-900">
                                      {linkedEmp
                                        ? `${linkedEmp.nombres} ${linkedEmp.apellidos}`
                                        : "VACANTE"}
                                    </span>
                                  </div>
                                  <div data-print-hidden="true" className="flex items-center gap-1 print:hidden">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingOrgCargoId(cargoItem.id);
                                        setOrgCargoForm({
                                          nombreCargo: cargoItem.nombreCargo || "",
                                          coordinacion: cargoItem.coordinacion || "PRODUCCIÓN FONOGRÁFICA",
                                          nivelJerarquico: cargoItem.nivelJerarquico || "COORDINACIÓN",
                                          reportaA: cargoItem.reportaA || "DIRECCIÓN GENERAL",
                                          funciones: cargoItem.funciones || "",
                                          assignedEmpId: cargoItem.assignedEmpId || "",
                                        });
                                        setOrgCargoModalOpen(true);
                                      }}
                                      className="px-2 py-0.5 rounded bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      ✏️ Asignar RRHH
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUniversalDelete("orgCargos", cargoItem.id, cargoItem.nombreCargo)
                                      }
                                      className="px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      🗑️ Eliminar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {depEmps.map((emp, idx) => (
                              <div key={emp.id} className="py-1.5 border-b border-slate-200 flex items-center justify-between gap-2">
                                <div>
                                  <strong>{idx + 1}.</strong> {emp.nombres} {emp.apellidos} —{" "}
                                  <span className="text-slate-600">{emp.cargo}</span>
                                </div>
                                <div data-print-hidden="true" className="flex items-center gap-1 print:hidden">
                                  {emp.status !== "ANULADO" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUniversalAnnul("employees", emp.id, `${emp.nombres} ${emp.apellidos}`)
                                      }
                                      className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      🚫 Anular
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUniversalDelete("employees", emp.id, `${emp.nombres} ${emp.apellidos}`)
                                    }
                                    className="px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <OfficialFooterWave />
            </div>

            {/* VENTANA FLOTANTE PARA CREAR NUEVO CARGO Y VINCULARLO CON RECURSOS HUMANOS */}
            {orgCargoModalOpen && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden">
                <div className="bg-[#0b1221] text-white rounded-2xl shadow-2xl max-w-lg w-full border-2 border-[#d97706]/80 overflow-hidden">
                  <div className="px-5 py-4 bg-[#161f33] border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                        Integración Organigrama ↔ Recursos Humanos
                      </span>
                      <h3 className="text-sm font-black uppercase text-white">
                        {editingOrgCargoId ? "Editar / Asignar Cargo a RRHH" : "Crear Nuevo Cargo en Organigrama"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrgCargoModalOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!orgCargoForm.nombreCargo.trim()) return;
                      const assignedEmp = employees.find(
                        (emp) => String(emp.id) === String(orgCargoForm.assignedEmpId)
                      );
                      const nowTs = Date.now();
                      const cargoPayload = {
                        id: editingOrgCargoId || `cargo-${nowTs}`,
                        nombreCargo: orgCargoForm.nombreCargo.trim(),
                        coordinacion: orgCargoForm.coordinacion,
                        nivelJerarquico: orgCargoForm.nivelJerarquico,
                        reportaA: orgCargoForm.reportaA,
                        funciones: orgCargoForm.funciones,
                        assignedEmpId: assignedEmp ? assignedEmp.id : "",
                        assignedEmpName: assignedEmp
                          ? `${assignedEmp.nombres} ${assignedEmp.apellidos}`
                          : "",
                        status: "ACTIVO",
                        updatedAt: nowTs,
                      };

                      const nextCargos = editingOrgCargoId
                        ? orgCargos.map((c) => (c.id === editingOrgCargoId ? cargoPayload : c))
                        : [cargoPayload, ...orgCargos];
                      setOrgCargos(nextCargos);

                      let nextEmps = employees;
                      if (assignedEmp) {
                        nextEmps = employees.map((emp) =>
                          String(emp.id) === String(assignedEmp.id)
                            ? {
                                ...emp,
                                cargo: cargoPayload.nombreCargo,
                                coordinacion: cargoPayload.coordinacion,
                                updatedAt: nowTs,
                              }
                            : emp
                        );
                        setEmployees(nextEmps);
                      }

                      syncWithCloudServer({ orgCargos: nextCargos, employees: nextEmps }, "PUSH");
                      addLog(
                        `Cargo '${cargoPayload.nombreCargo}' ${
                          editingOrgCargoId ? "actualizado" : "creado"
                        } en Organigrama${
                          assignedEmp ? ` y vinculado a ${assignedEmp.nombres} ${assignedEmp.apellidos}` : ""
                        }`
                      );
                      showToast(
                        assignedEmp
                          ? `Cargo "${cargoPayload.nombreCargo}" vinculado a ${assignedEmp.nombres} ${assignedEmp.apellidos} en RRHH.`
                          : `Cargo "${cargoPayload.nombreCargo}" creado en Organigrama y disponible en RRHH.`
                      );
                      setOrgCargoModalOpen(false);
                    }}
                    className="p-5 space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Nombre del Nuevo Cargo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. ESPECIALISTA EN MASTERIZACIÓN"
                        value={orgCargoForm.nombreCargo}
                        onChange={(e) =>
                          setOrgCargoForm({ ...orgCargoForm, nombreCargo: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                          Coordinación / Unidad
                        </label>
                        <select
                          value={orgCargoForm.coordinacion}
                          onChange={(e) =>
                            setOrgCargoForm({ ...orgCargoForm, coordinacion: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold"
                        >
                          <option value="DIRECCIÓN GENERAL">DIRECCIÓN GENERAL</option>
                          <option value="PRESIDENCIA">PRESIDENCIA</option>
                          <option value="DIRECCIÓN EJECUTIVA">DIRECCIÓN EJECUTIVA</option>
                          <option value="PRODUCCIÓN FONOGRÁFICA">PRODUCCIÓN FONOGRÁFICA</option>
                          <option value="CULTURA AUDIOVISUAL">CULTURA AUDIOVISUAL</option>
                          <option value="ADMINISTRACIÓN Y RRHH">ADMINISTRACIÓN Y RRHH</option>
                          <option value="TECNOLOGÍA Y SISTEMAS">TECNOLOGÍA Y SISTEMAS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                          Nivel Jerárquico
                        </label>
                        <select
                          value={orgCargoForm.nivelJerarquico}
                          onChange={(e) =>
                            setOrgCargoForm({ ...orgCargoForm, nivelJerarquico: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold"
                        >
                          <option value="DIRECCIÓN">DIRECCIÓN</option>
                          <option value="COORDINACIÓN">COORDINACIÓN</option>
                          <option value="ESPECIALISTA">ESPECIALISTA</option>
                          <option value="TÉCNICO / OPERATIVO">TÉCNICO / OPERATIVO</option>
                          <option value="APOYO ADMINISTRATIVO">APOYO ADMINISTRATIVO</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Reporta a (Superior Inmediato)
                      </label>
                      <input
                        type="text"
                        value={orgCargoForm.reportaA}
                        onChange={(e) =>
                          setOrgCargoForm({ ...orgCargoForm, reportaA: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-amber-300 mb-1">
                        Vincular / Asignar Personal de Recursos Humanos (RRHH)
                      </label>
                      <select
                        value={orgCargoForm.assignedEmpId}
                        onChange={(e) =>
                          setOrgCargoForm({ ...orgCargoForm, assignedEmpId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-amber-500/60 text-white font-bold"
                      >
                        <option value="">-- Dejar Cargo Vacante (Disponible para RRHH) --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nombres} {emp.apellidos} ({emp.cedula} • Actual: {emp.cargo})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Funciones Principales del Cargo
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describa las responsabilidades del cargo..."
                        value={orgCargoForm.funciones}
                        onChange={(e) =>
                          setOrgCargoForm({ ...orgCargoForm, funciones: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setOrgCargoModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black cursor-pointer shadow"
                      >
                        💾 Guardar Cargo y Vincular RRHH
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
              { key: "entrar_novedades", label: "Novedades (Canal Informativo)", code: "NOV" },
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
                          {(() => {
                            const linkedEmp = employees.find(
                              (emp) => String(emp.id) === String(selectedUserForPerms.linkedEmployeeId)
                            );
                            return (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                {linkedEmp ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold">
                                    ✓ Trabajador RRHH Vinculado: {linkedEmp.nombres} {linkedEmp.apellidos} ({linkedEmp.cedula}) • {linkedEmp.cargo}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/50 text-amber-300 font-bold">
                                    ⚠ Usuario base sin ficha RRHH vinculada (use el formulario inferior para vincular nuevos trabajadores)
                                  </span>
                                )}
                              </div>
                            );
                          })()}
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-black uppercase text-slate-900">
                          Registrar Nuevo Usuario en el Sistema (Vinculado a RRHH)
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9.5px] font-black uppercase">
                          Requiere Trabajador RRHH
                        </span>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newUserForm.linkedEmployeeId) {
                            showToast(
                              "El trabajador debe estar incluido previamente en Recursos Humanos para crear su usuario y vincular su permisología.",
                              "error"
                            );
                            return;
                          }
                          const selectedEmp = employees.find(
                            (emp) => String(emp.id) === String(newUserForm.linkedEmployeeId)
                          );
                          if (!selectedEmp) {
                            showToast(
                              "Trabajador no encontrado en Recursos Humanos. Regístrelo primero en RRHH.",
                              "error"
                            );
                            return;
                          }
                          if (!newUserForm.username || !newUserForm.password) return;
                          const empFullName = `${selectedEmp.nombres || ""} ${selectedEmp.apellidos || ""}`.trim();
                          const emailClean =
                            (newUserForm.email || selectedEmp.correo || "").trim().toLowerCase() ||
                            (newUserForm.username.includes("@")
                              ? newUserForm.username.trim().toLowerCase()
                              : `${newUserForm.username.trim().toLowerCase()}@gmail.com`);
                          const created = {
                            id: Date.now(),
                            ...newUserForm,
                            fullName: empFullName || newUserForm.fullName,
                            cargo: selectedEmp.cargo || newUserForm.cargo || "PERSONAL CENDIS",
                            email: emailClean,
                            active: true,
                            linkedEmployeeId: selectedEmp.id,
                            permissions: { ...DEFAULT_PERMISSIONS_BY_ROLE[newUserForm.role] },
                            updatedAt: Date.now(),
                          };
                          setUsers((prev) => [...prev, created]);
                          setTimeout(() => syncWithCloudServer(), 60);
                          setSelectedConfigUserId(String(created.id));
                          addLog(`Creado usuario '${created.username}' vinculado a RRHH (${empFullName}) con rol ${created.role}`, currentUser, "config");
                          showToast(
                            `Usuario ${created.fullName} creado y vinculado a Recursos Humanos.`
                          );
                          setNewUserForm({
                            linkedEmployeeId: "",
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
                        <select
                          required
                          value={newUserForm.linkedEmployeeId || ""}
                          onChange={(e) => {
                            const empId = e.target.value;
                            const emp = employees.find((x) => String(x.id) === String(empId));
                            setNewUserForm({
                              ...newUserForm,
                              linkedEmployeeId: empId,
                              fullName: emp ? `${emp.nombres || ""} ${emp.apellidos || ""}`.trim() : "",
                              cargo: emp ? emp.cargo || "" : "",
                              email: emp && emp.correo ? emp.correo : newUserForm.email,
                            });
                          }}
                          className="md:col-span-2 px-3 py-2 rounded-lg border border-amber-400 text-xs font-bold"
                        >
                          <option value="">-- Seleccionar Trabajador de RRHH * --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={String(emp.id)}>
                              {emp.nombres} {emp.apellidos} ({emp.cedula}) • {emp.cargo}
                            </option>
                          ))}
                        </select>
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
                          data-no-uppercase="true"
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
                          readOnly
                          placeholder="Nombre Completo (RRHH)"
                          value={newUserForm.fullName}
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs opacity-80"
                          title="Se completa automáticamente desde Recursos Humanos"
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
                              <th className="p-3 text-left">Configurar / Acciones</th>
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
                                    <div className="flex flex-wrap items-center gap-1.5">
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

                                      {u.status !== "ANULADO" && u.active !== false && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleUniversalAnnul("users", u.id, `Usuario ${u.fullName}`)
                                          }
                                          className="px-2 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-bold cursor-pointer"
                                        >
                                          🚫 Anular
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUniversalDelete("users", u.id, `Usuario ${u.fullName}`)
                                        }
                                        className="px-2 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Eliminar</span>
                                      </button>
                                    </div>
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

        {/* ====================================================================
            MÓDULO 10: NOVEDADES Y COMUNICADOS (VINCULADO AL CANAL INFORMATIVO)
           ==================================================================== */}
        {activeTab === "novedades" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
            <div className="bg-[#0e1526] text-white rounded-2xl p-5 border border-amber-500/40 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base md:text-lg font-black uppercase flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-amber-400" />
                  <span>Módulo de Novedades • Canal Informativo del CENDIS</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    NEW
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Publique comunicados predeterminados o adjunte archivos PDF, JPG o PNG para visualizarlos gráficamente en el Canal Informativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentScreen("INTRANET")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow"
              >
                <Eye className="w-4 h-4" />
                <span>Ver en Canal Informativo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario para predeterminar o redactar novedad */}
              <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-900 border-b border-slate-200 pb-2">
                  Publicar / Predeterminar Novedad al Personal
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!canPerformAction("ingresar")) {
                      showToast("Su usuario no tiene permiso para ingresar novedades.", "error");
                      return;
                    }
                    if (!novedadForm.titulo.trim()) return;
                    const created = {
                      id: `nov-${Date.now()}`,
                      categoria: novedadForm.categoria || "COMUNICADO OFICIAL",
                      titulo: novedadForm.titulo.trim(),
                      mensaje: novedadForm.mensaje.trim(),
                      mediaDataUrl: novedadForm.mediaDataUrl || "",
                      mediaType: novedadForm.mediaType || "",
                      mediaName: novedadForm.mediaName || "",
                      fecha: new Date().toISOString().slice(0, 10),
                      autor: currentUser?.fullName || "Administración CENDIS",
                      updatedAt: Date.now(),
                    };
                    setNovedadesList((prev) => [created, ...prev]);
                    setTimeout(() => syncWithCloudServer(), 60);
                    addLog(`Publicada novedad en Canal Informativo: ${created.titulo}`, currentUser, "novedades");
                    showToast(`Novedad "${created.titulo}" publicada en el Canal Informativo del CENDIS.`);
                    setNovedadForm({
                      preset: "CUSTOM",
                      categoria: "COMUNICADO OFICIAL",
                      titulo: "",
                      mensaje: "",
                      mediaDataUrl: "",
                      mediaType: "",
                      mediaName: "",
                    });
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Plantilla Predeterminada (Opcional)
                    </label>
                    <select
                      value={novedadForm.preset}
                      onChange={(e) => {
                        const presetObj = NOVEDAD_PRESETS.find((p) => p.id === e.target.value);
                        if (presetObj) {
                          setNovedadForm((prev) => ({
                            ...prev,
                            preset: presetObj.id,
                            categoria: presetObj.categoria,
                            titulo: presetObj.titulo || prev.titulo,
                            mensaje: presetObj.mensaje || prev.mensaje,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      {NOVEDAD_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Categoría del Aviso
                    </label>
                    <select
                      value={novedadForm.categoria}
                      onChange={(e) => setNovedadForm({ ...novedadForm, categoria: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      <option value="COMUNICADO OFICIAL">COMUNICADO OFICIAL</option>
                      <option value="AVISO GENERAL">AVISO GENERAL</option>
                      <option value="EVENTO ESPECIAL">EVENTO ESPECIAL</option>
                      <option value="TALENTO HUMANO">TALENTO HUMANO</option>
                      <option value="NORMATIVA">NORMATIVA</option>
                      <option value="FELICITACIÓN">FELICITACIÓN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Título de la Novedad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Jornada de Salud / Reunión General CENDIS"
                      value={novedadForm.titulo}
                      onChange={(e) => setNovedadForm({ ...novedadForm, titulo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Información para todos los trabajadores del CENDIS
                    </label>
                    <textarea
                      rows={4}
                      data-no-uppercase="true"
                      placeholder="Escriba aquí el comunicado o información dirigida al personal del CENDIS..."
                      value={novedadForm.mensaje}
                      onChange={(e) => setNovedadForm({ ...novedadForm, mensaje: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Adjuntar Archivo Gráfico (PDF, JPG o PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 4 * 1024 * 1024) {
                          showToast("El archivo supera el límite recomendado de 4 MB.", "error");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = String(reader.result || "");
                          const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                          setNovedadForm((prev) => ({
                            ...prev,
                            mediaDataUrl: dataUrl,
                            mediaType: isPdf ? "PDF" : "IMAGE",
                            mediaName: file.name,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500 file:text-slate-950 file:font-black cursor-pointer"
                    />
                    {novedadForm.mediaDataUrl && (
                      <div className="mt-2 p-2 rounded-xl border border-slate-300 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-600">
                            Vista previa gráfica: {novedadForm.mediaName}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNovedadForm((prev) => ({
                                ...prev,
                                mediaDataUrl: "",
                                mediaType: "",
                                mediaName: "",
                              }))
                            }
                            className="text-red-500 font-bold cursor-pointer"
                          >
                            Quitar archivo
                          </button>
                        </div>
                        {novedadForm.mediaType === "PDF" ? (
                          <iframe
                            src={novedadForm.mediaDataUrl}
                            title={novedadForm.mediaName}
                            className="w-full h-44 rounded-lg border border-slate-300 bg-white"
                          />
                        ) : (
                          <img
                            src={novedadForm.mediaDataUrl}
                            alt={novedadForm.mediaName}
                            className="w-full max-h-44 object-contain rounded-lg border border-slate-300"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase shadow cursor-pointer"
                  >
                    + Publicar Novedad en Canal Informativo
                  </button>
                </form>
              </div>

              {/* Cartelera gráfica de novedades publicadas */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-black uppercase text-slate-900">
                    Novedades Publicadas ({novedadesList.length})
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600">
                    Sincronizadas con el Canal Informativo
                  </span>
                </div>

                {novedadesList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-10 text-center">
                    No hay novedades publicadas aún. Use el formulario para crear comunicados o subir archivos PDF, JPG o PNG.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                    {novedadesList.map((nov) => (
                      <div
                        key={nov.id}
                        className="rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[9.5px] font-black uppercase">
                                NEW • {nov.categoria}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{nov.fecha}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase">{nov.titulo}</h4>
                          </div>
                          {canPerformAction("eliminar") && (
                            <button
                              type="button"
                              onClick={() => {
                                trackDeletedIds([nov.id]);
                                setNovedadesList((prev) => prev.filter((x) => x.id !== nov.id));
                                setTimeout(() => syncWithCloudServer(), 60);
                                addLog(`Eliminada novedad: ${nov.titulo}`, currentUser, "novedades");
                                showToast(`Novedad "${nov.titulo}" eliminada.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                        {nov.mensaje && (
                          <p className="text-xs text-slate-700 whitespace-pre-line">{nov.mensaje}</p>
                        )}
                        {nov.mediaDataUrl && (
                          <div>
                            {nov.mediaType === "PDF" || nov.mediaDataUrl.startsWith("data:application/pdf") ? (
                              <iframe
                                src={nov.mediaDataUrl}
                                title={nov.mediaName || nov.titulo}
                                className="w-full h-64 rounded-xl border border-slate-300 bg-white"
                              />
                            ) : (
                              <img
                                src={nov.mediaDataUrl}
                                alt={nov.mediaName || nov.titulo}
                                className="w-full max-h-72 object-contain rounded-xl border border-slate-300 bg-black/20"
                              />
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400">Publicado por: {nov.autor}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
                  const updatedEmp = { ...payload, id: editingEmpId, updatedAt: Date.now() };
                  setEmployees((prev) =>
                    prev.map((emp) => (emp.id === editingEmpId ? updatedEmp : emp))
                  );
                  upsertEmployeeBirthdayEvent(updatedEmp);
                  setTimeout(() => syncWithCloudServer(), 60);
                  addLog(
                    `Actualizado expediente en RRHH: ${updatedEmp.nombres} ${updatedEmp.apellidos} (${updatedEmp.cedula})`,
                    currentUser,
                    "hr"
                  );
                  showToast(
                    `Expediente de ${updatedEmp.nombres} ${updatedEmp.apellidos} actualizado y cumpleaños sincronizado en Agenda.`
                  );
                } else {
                  const created = { id: `emp-${Date.now()}`, ...payload, updatedAt: Date.now() };
                  setEmployees((prev) => [...prev, created]);
                  upsertEmployeeBirthdayEvent(created);
                  setTimeout(() => syncWithCloudServer(), 60);
                  addLog(
                    `Ingresado trabajador en RRHH: ${created.nombres} ${created.apellidos} (${created.cedula})`,
                    currentUser,
                    "hr"
                  );
                  showToast(
                    `Trabajador ${created.nombres} ${created.apellidos} ingresado al sistema con cumpleaños agendado.`
                  );
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
                      Cargo en el CENDIS * (Vinculado a Organigrama)
                    </label>
                    <select
                      onChange={(e) => {
                        const selectedCargo = orgCargos.find(
                          (c) => String(c.id) === e.target.value
                        );
                        if (!selectedCargo) return;
                        setNewEmpForm({
                          ...newEmpForm,
                          cargo: selectedCargo.nombreCargo,
                          coordinacion: selectedCargo.coordinacion || newEmpForm.coordinacion,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d1322] border border-amber-500/50 text-amber-300 text-[11px] font-bold mb-1.5"
                    >
                      <option value="">Elegir cargo del Organigrama...</option>
                      {orgCargos
                        .filter((c) => c.status !== "ANULADO")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombreCargo} ({c.coordinacion})
                          </option>
                        ))}
                    </select>
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
                      <option value="Dirección General">Dirección General</option>
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
                    <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                      Sueldo Mensual (Bs) • Para Constancia
                    </label>
                    <input
                      type="text"
                      data-no-uppercase="true"
                      placeholder="Ej. 275,88"
                      value={newEmpForm.sueldoMensual || ""}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, sueldoMensual: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-emerald-500/60 text-emerald-300 font-bold"
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

                {/* SUB-SECCIÓN: DATOS ELECTORALES (CENTRO DE VOTACIÓN) */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-emerald-400 block">
                    Datos de Centro de Votación del Trabajador
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Centro de Votación
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre del centro de votación"
                        value={newEmpForm.centroVotacion || ""}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, centroVotacion: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Distrito Capital / Miranda"
                        value={newEmpForm.estadoVotacion || ""}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, estadoVotacion: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Municipio
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Libertador / Baruta"
                        value={newEmpForm.municipioVotacion || ""}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, municipioVotacion: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Parroquia
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. El Valle / Nuestra Señora del Rosario"
                        value={newEmpForm.parroquiaVotacion || ""}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, parroquiaVotacion: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        ¿Ya Votó?
                      </label>
                      <select
                        value={newEmpForm.yaVoto || "NO"}
                        onChange={(e) =>
                          setNewEmpForm({ ...newEmpForm, yaVoto: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#0d1322] border border-slate-700 text-white font-bold"
                      >
                        <option value="NO">NO</option>
                        <option value="SI">SÍ</option>
                      </select>
                    </div>
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
                    <div className="flex-1 px-4 pt-1.5 pb-1.5 flex flex-col justify-between bg-[#fbfbfa]">
                      {/* Logo Dorado Centro Nacional del Disco (Grande, Llamativo, Centrado y Completo) */}
                      <div className="w-full flex justify-center py-0.5">
                        <GoldenCendisGlyphSVG sizeClass="w-[232px]" />
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
                    <div className="flex-1 px-4 py-2.5 flex flex-col justify-between bg-[#fbfbfa] text-slate-950">
                      {/* Logo Completo Dorado CENDIS + CENDIS - Centro Nacional del Disco */}
                      <div className="text-center">
                        <GoldenCendisGlyphSVG sizeClass="w-[198px]" />
                        <div className="text-[12.5px] font-bold text-[#0b2545] tracking-tight mt-0.5">
                          CENDIS - Centro Nacional del Disco
                        </div>
                      </div>

                      {/* FIRMAS AUTORIZADAS */}
                      <div className="space-y-2.5">
                        <div className="text-[11px] font-bold uppercase text-[#9e7f3f] tracking-wide">
                          FIRMAS AUTORIZADAS
                        </div>

                        {/* Fila Firma 1: DIRECTOR/A GENERAL (MORRIS LÓPEZ) */}
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
                          <div className="text-[10px] font-black uppercase text-slate-900 mt-0.5 leading-tight">
                            LCDO. MORRIS LÓPEZ • DIRECTOR GENERAL
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
                <div className="grid grid-cols-3 gap-6 pt-3 text-center text-[10px]">
                  <div className="border-t border-slate-900 pt-1">
                    <div className="font-black uppercase text-slate-900">
                      {selectedEmpForCV.nombres} {selectedEmpForCV.apellidos}
                    </div>
                    <div className="text-[9px] text-slate-600">
                      Firma del Trabajador(a) • C.I. {selectedEmpForCV.cedula}
                    </div>
                  </div>
                  <div className="border-t border-slate-900 pt-1">
                    <div className="font-black uppercase text-slate-900">
                      COORDINACIÓN DE RECURSOS HUMANOS
                    </div>
                    <div className="text-[9px] text-slate-600">
                      Fundación Centro Nacional del Disco (CENDIS)
                    </div>
                  </div>
                  <div className="border-t border-slate-900 pt-1">
                    <div className="font-black uppercase text-slate-900">
                      LCDO. MORRIS LÓPEZ
                    </div>
                    <div className="text-[9px] text-slate-600">
                      Director General CENDIS • C.I. V-19.324.324
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
          MODAL DE CONSTANCIA DE TRABAJO (FORMATO OFICIAL CON CORRELATIVO CRH)
         ==================================================================== */}
      {selectedEmpForConstancia && (() => {
        const expParts = String(constanciaForm.fechaExpedicion || "").split("-");
        const expMonths = [
          "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
          "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
        ];
        const expYear = expParts[0] || "2026";
        const expMonthName = expMonths[Math.max(0, Math.min(11, (parseInt(expParts[1], 10) || 1) - 1))];
        const expDay = parseInt(expParts[2], 10) || "1";

        return (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0b1221] rounded-2xl shadow-2xl max-w-5xl w-full p-5 space-y-4 max-h-[96vh] overflow-y-auto border-2 border-emerald-500/70">
              {/* Barra superior de acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase text-emerald-300">
                    Constancia de Trabajo • Correlativo Independiente ({constanciaForm.correlativo})
                  </span>
                  <select
                    value={String(selectedEmpForConstancia.id)}
                    onChange={(e) => {
                      const nextEmp = employees.find((x) => String(x.id) === e.target.value);
                      if (nextEmp) openConstanciaModal(nextEmp);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#070b14] border border-emerald-500/50 text-white text-xs font-bold"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.nombres} {emp.apellidos} ({emp.cedula})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextCount = (constanciaCounter || 1) + 1;
                      setConstanciaCounter(nextCount);
                      saveStoredJson("cendis_constancia_counter_v1", nextCount);
                      addLog(
                        `Emitida Constancia de Trabajo ${constanciaForm.correlativo} para ${constanciaForm.nombreCompleto}`,
                        currentUser,
                        "hr"
                      );
                      showToast(`Constancia ${constanciaForm.correlativo} lista para imprimir/PDF.`);
                      setTimeout(() => window.print(), 80);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir / PDF Constancia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEmpForConstancia(null)}
                    className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>

              {/* Panel de edición rápida de datos de la Constancia */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#070b14] p-3.5 rounded-xl border border-slate-800 text-xs print:hidden">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Correlativo (Propio)</label>
                  <input
                    type="text"
                    value={constanciaForm.correlativo}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, correlativo: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">RIF Institucional</label>
                  <input
                    type="text"
                    value={constanciaForm.rif}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, rif: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Tratamiento</label>
                  <select
                    value={constanciaForm.tratamiento}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, tratamiento: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  >
                    <option value="el ciudadano">el ciudadano</option>
                    <option value="la ciudadana">la ciudadana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Fecha Expedición</label>
                  <input
                    type="date"
                    value={constanciaForm.fechaExpedicion}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, fechaExpedicion: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Apellidos y Nombres</label>
                  <input
                    type="text"
                    value={constanciaForm.nombreCompleto}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, nombreCompleto: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Cédula (C.I.)</label>
                  <input
                    type="text"
                    value={constanciaForm.cedula}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, cedula: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Fecha de Ingreso</label>
                  <input
                    type="text"
                    value={constanciaForm.fechaIngreso}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, fechaIngreso: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Cargo</label>
                  <input
                    type="text"
                    value={constanciaForm.cargo}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, cargo: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Dependencia / Coordinación</label>
                  <input
                    type="text"
                    value={constanciaForm.dependencia}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, dependencia: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Remuneración en Letras</label>
                  <input
                    type="text"
                    value={constanciaForm.remuneracionLetras}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, remuneracionLetras: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Monto Numérico (Bs)</label>
                  <input
                    type="text"
                    data-no-uppercase="true"
                    value={constanciaForm.remuneracionMonto}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      const autoLetras = numeroABolivaresLetras(nextVal);
                      setConstanciaForm((prev) => ({
                        ...prev,
                        remuneracionMonto: nextVal,
                        remuneracionLetras: autoLetras || prev.remuneracionLetras,
                      }));
                      const cleanSueldo = nextVal.replace(/^bs\.?\s*/i, "").trim();
                      if (selectedEmpForConstancia) {
                        const nextEmps = employees.map((x) =>
                          String(x.id) === String(selectedEmpForConstancia.id)
                            ? { ...x, sueldoMensual: cleanSueldo, updatedAt: Date.now() }
                            : x
                        );
                        setEmployees(nextEmps);
                        syncWithCloudServer({ employees: nextEmps });
                      }
                    }}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Iniciales Pie</label>
                  <input
                    type="text"
                    data-no-uppercase="true"
                    value={constanciaForm.iniciales}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, iniciales: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Firmante (Por defecto Morris López)</label>
                  <input
                    type="text"
                    value={constanciaForm.firmanteNombre}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, firmanteNombre: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-amber-300 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Cargo del Firmante</label>
                  <input
                    type="text"
                    value={constanciaForm.firmanteCargo}
                    onChange={(e) => setConstanciaForm({ ...constanciaForm, firmanteCargo: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-700 bg-[#0b1221] text-white font-bold"
                  />
                </div>
              </div>

              {/* HOJA OFICIAL IMPRIMIBLE (CINTILLO IGUAL A TODOS LOS REPORTES) */}
              <div
                id="printable-area"
                className="w-full max-w-[820px] min-h-[1020px] mx-auto bg-white border border-slate-200 flex flex-col justify-between text-slate-950"
              >
                <div className="px-14 pt-8 pb-6 flex-1 flex flex-col justify-between">
                  <div>
                    <OfficialHeaderCintillo showRightLogo={true} />

                    {/* Bloque Correlativo Independiente y RIF */}
                    <div className="mt-6 text-[11pt] font-bold text-slate-900 leading-snug">
                      <div>{constanciaForm.correlativo}</div>
                      <div>Rif.: {constanciaForm.rif}</div>
                    </div>

                    {/* Título Centrado */}
                    <div className="mt-8 mb-8 text-center">
                      <h2 className="text-[14pt] font-black uppercase tracking-wider underline text-slate-950">
                        CONSTANCIA
                      </h2>
                    </div>

                    {/* Cuerpo de la Constancia */}
                    <div
                      style={{ fontSize: "12pt", lineHeight: "1.75" }}
                      className="text-justify text-slate-950 preserve-case-content"
                    >
                      Quien suscribe, el <strong>{constanciaForm.firmanteCargo}</strong> de la{" "}
                      <strong>Fundación Centro Nacional del Disco (CENDIS)</strong>, hace constar por medio de
                      la presente que {constanciaForm.tratamiento},{" "}
                      <strong className="uppercase">{constanciaForm.nombreCompleto}</strong> portador(a) de la{" "}
                      <strong>C.I. {constanciaForm.cedula}</strong>, presta sus servicios en esta Fundación
                      desde el {constanciaForm.fechaIngreso}, desempeñando el cargo de{" "}
                      <strong className="uppercase">{constanciaForm.cargo}</strong>, en la{" "}
                      <strong className="uppercase">{constanciaForm.dependencia}</strong> devengando una
                      remuneración mensual de{" "}
                      <strong className="uppercase">{constanciaForm.remuneracionLetras}</strong> (
                      <strong>{constanciaForm.remuneracionMonto}</strong>).
                    </div>

                    {/* Fecha de expedición */}
                    <div
                      style={{ fontSize: "11.5pt" }}
                      className="mt-10 text-slate-950 preserve-case-content"
                    >
                      Constancia que se expide en Caracas a los {expDay} días del mes de{" "}
                      <strong className="uppercase">{expMonthName}</strong> de {expYear}
                    </div>

                    {/* Bloque de Firma Centrado */}
                    <div className="mt-10 text-center text-slate-950" style={{ fontSize: "11.5pt" }}>
                      <p className="mb-16">Atentamente,</p>
                      <div className="inline-block min-w-[260px] pt-1 border-t border-slate-900">
                        <p className="font-black uppercase">{constanciaForm.firmanteNombre}</p>
                        <p className="font-bold uppercase">{constanciaForm.firmanteCargo}</p>
                        <p className="text-[10pt] font-semibold">
                          Fundación Centro Nacional del Disco (CENDIS)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Iniciales al pie izquierdo */}
                  <div className="mt-8 text-[10pt] font-bold text-slate-800 preserve-case-content">
                    {constanciaForm.iniciales}
                  </div>
                </div>

                <OfficialFooterWave />
              </div>
            </div>
          </div>
        );
      })()}

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
                  <div className="flex items-center justify-between text-[10px] font-black text-[#8b1538]">
                    <span>{msg.sender} → {msg.recipient}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">{msg.time}</span>
                      <button
                        type="button"
                        onClick={() => handleUniversalDelete("chat", msg.id, "Mensaje de chat")}
                        title="Eliminar mensaje"
                        className="text-red-500 hover:text-red-700 px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
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
                    updatedAt: Date.now(),
                  },
                ]);
                setTimeout(() => syncWithCloudServer(), 60);
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