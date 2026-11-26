import { openDB as idbOpenDB, type IDBPDatabase } from "idb";
import type { ScafbindDocument } from "../types/document";

// ─── Constants ────────────────────────────────────────────────────────────────
export const DB_NAME = "scafbind-local";
export const DB_VERSION = 1;

// ─── Object store key types ───────────────────────────────────────────────────
interface DocumentRecord {
  id: string;
  document: ScafbindDocument;
  savedAt: string;
}

interface DraftRecord {
  projectId: string;
  document: ScafbindDocument;
  savedAt: string;
}

interface OfflineQueueRecord {
  id?: number; // autoIncrement
  operation: string;
  payload: unknown;
  createdAt: string;
  retries: number;
}

// Typed DB schema for idb
interface ScafbindDBSchema {
  documents: {
    key: string;
    value: DocumentRecord;
  };
  drafts: {
    key: string;
    value: DraftRecord;
  };
  "offline-queue": {
    key: number;
    value: OfflineQueueRecord;
  };
}

// ─── Open / initialise DB ─────────────────────────────────────────────────────
let _db: IDBPDatabase<ScafbindDBSchema> | null = null;

export async function openDB(): Promise<IDBPDatabase<ScafbindDBSchema>> {
  if (_db) return _db;

  _db = await idbOpenDB<ScafbindDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Version 1: create all stores
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains("documents")) {
          db.createObjectStore("documents", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("drafts")) {
          db.createObjectStore("drafts", { keyPath: "projectId" });
        }
        if (!db.objectStoreNames.contains("offline-queue")) {
          db.createObjectStore("offline-queue", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      }
      // Future migrations:
      // if (oldVersion < 2) { ... }
    },
  });

  return _db;
}

// ─── Documents store ──────────────────────────────────────────────────────────

/** Persist a document by its id. */
export async function saveDocument(id: string, doc: ScafbindDocument): Promise<void> {
  const db = await openDB();
  await db.put("documents", { id, document: doc, savedAt: new Date().toISOString() });
}

/** Retrieve a document by id. Returns null if not found. */
export async function getDocument(id: string): Promise<ScafbindDocument | null> {
  const db = await openDB();
  const record = await db.get("documents", id);
  return record?.document ?? null;
}

/** Retrieve all locally saved documents. */
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const db = await openDB();
  return db.getAll("documents");
}

/** Delete a document by id. */
export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB();
  await db.delete("documents", id);
}

// ─── Drafts store ─────────────────────────────────────────────────────────────

/** Save a draft for a given project. Overwrites any previous draft. */
export async function saveDraft(projectId: string, doc: ScafbindDocument): Promise<void> {
  const db = await openDB();
  await db.put("drafts", {
    projectId,
    document: doc,
    savedAt: new Date().toISOString(),
  });
}

/** Retrieve a draft for a project. Returns null if none exists. */
export async function getDraft(projectId: string): Promise<ScafbindDocument | null> {
  const db = await openDB();
  const record = await db.get("drafts", projectId);
  return record?.document ?? null;
}

/** Remove a draft for a project. */
export async function clearDraft(projectId: string): Promise<void> {
  const db = await openDB();
  await db.delete("drafts", projectId);
}

// ─── Offline queue store ──────────────────────────────────────────────────────

/** Add an operation to the offline queue. */
export async function addToOfflineQueue(op: { operation: string; payload: unknown }): Promise<number> {
  const db = await openDB();
  const key = await db.add("offline-queue", {
    operation: op.operation,
    payload: op.payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
  return key as number;
}

/** Retrieve all pending offline queue entries, ordered by insertion. */
export async function getOfflineQueue(): Promise<OfflineQueueRecord[]> {
  const db = await openDB();
  return db.getAll("offline-queue");
}

/** Clear all offline queue entries (call after successful sync). */
export async function clearOfflineQueue(): Promise<void> {
  const db = await openDB();
  await db.clear("offline-queue");
}
