import fs from "fs";
import path from "path";

const TMP_FILE = path.join(process.env.TEMP || "/tmp", "cendis_cloud_sync_v212.json");

function createEmptyState() {
  return {
    updatedAt: 0,
    deletedIds: [],
    agendaEvents: [],
    documents: [],
    employees: [],
    projects: [],
    bienesList: [],
    bienesCatalog: [],
    attendanceRecords: [],
    users: [],
    chatMessages: [],
    orgCargos: [],
    printedLabelsLog: [],
    logs: [],
  };
}

async function loadFromKV() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return null;
  try {
    const res = await fetch(`${kvUrl.replace(/\/$/, "")}/get/cendis_sync_state_v212`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.result) return null;
    const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function saveToKV(state) {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return;
  try {
    await fetch(`${kvUrl.replace(/\/$/, "")}/set/cendis_sync_state_v212`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kvToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(state)),
    });
  } catch {
    // Ignore KV write errors
  }
}

async function loadPersistedState() {
  const kvState = await loadFromKV();
  if (kvState) {
    globalThis.__CENDIS_SYNC_STATE_V212__ = kvState;
    return kvState;
  }
  if (globalThis.__CENDIS_SYNC_STATE_V212__) {
    return globalThis.__CENDIS_SYNC_STATE_V212__;
  }
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        globalThis.__CENDIS_SYNC_STATE_V212__ = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore file read errors in serverless environment
  }
  const initial = createEmptyState();
  globalThis.__CENDIS_SYNC_STATE_V212__ = initial;
  return initial;
}

async function savePersistedState(state) {
  globalThis.__CENDIS_SYNC_STATE_V212__ = state;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(state), "utf8");
  } catch {
    // Ignore write errors if read-only fs
  }
  await saveToKV(state);
}

function mergeCollectionById(serverArr = [], clientArr = [], deletedSet = new Set()) {
  const map = new Map();

  const addOrUpdate = (item) => {
    if (!item || item.id === undefined || item.id === null) return;
    const key = String(item.id);
    if (deletedSet.has(key)) return;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, updatedAt: Number(item.updatedAt) || 1 });
      return;
    }

    const incomingTime = Number(item.updatedAt) || 1;
    const existingTime = Number(existing.updatedAt) || 1;
    if (incomingTime >= existingTime) {
      map.set(key, { ...existing, ...item, updatedAt: incomingTime });
    }
  };

  if (Array.isArray(serverArr)) serverArr.forEach(addOrUpdate);
  if (Array.isArray(clientArr)) clientArr.forEach(addOrUpdate);

  return Array.from(map.values());
}

export function mergeSyncPayload(currentState, incoming = {}) {
  const mergedDeleted = Array.from(
    new Set([
      ...(Array.isArray(currentState.deletedIds) ? currentState.deletedIds.map(String) : []),
      ...(Array.isArray(incoming.deletedIds) ? incoming.deletedIds.map(String) : []),
    ])
  );
  const deletedSet = new Set(mergedDeleted);

  const mergedCatalog = Array.from(
    new Set([
      ...(Array.isArray(currentState.bienesCatalog) ? currentState.bienesCatalog : []),
      ...(Array.isArray(incoming.bienesCatalog) ? incoming.bienesCatalog : []),
    ])
  );

  const nextState = {
    updatedAt: Date.now(),
    deletedIds: mergedDeleted,
    agendaEvents: mergeCollectionById(currentState.agendaEvents, incoming.agendaEvents, deletedSet),
    documents: mergeCollectionById(currentState.documents, incoming.documents, deletedSet),
    employees: mergeCollectionById(currentState.employees, incoming.employees, deletedSet),
    projects: mergeCollectionById(currentState.projects, incoming.projects, deletedSet),
    bienesList: mergeCollectionById(currentState.bienesList, incoming.bienesList, deletedSet),
    bienesCatalog: mergedCatalog,
    attendanceRecords: mergeCollectionById(
      currentState.attendanceRecords,
      incoming.attendanceRecords,
      deletedSet
    ),
    users: mergeCollectionById(currentState.users, incoming.users, deletedSet),
    chatMessages: mergeCollectionById(currentState.chatMessages, incoming.chatMessages, deletedSet),
    orgCargos: mergeCollectionById(currentState.orgCargos, incoming.orgCargos, deletedSet),
    printedLabelsLog: mergeCollectionById(
      currentState.printedLabelsLog,
      incoming.printedLabelsLog,
      deletedSet
    ),
    logs: mergeCollectionById(currentState.logs, incoming.logs, deletedSet).slice(0, 150),
  };

  return nextState;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const currentState = await loadPersistedState();

  if (req.method === "GET") {
    return res.status(200).json(currentState);
  }

  if (req.method === "POST" || req.method === "PUT") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const nextState = mergeSyncPayload(currentState, body || {});
    await savePersistedState(nextState);
    return res.status(200).json(nextState);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
