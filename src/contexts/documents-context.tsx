"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useMove } from "@/contexts/move-context";
import { apiFetch } from "@/lib/api-client";
import { invalidateUserData, loadUserData } from "@/lib/data-cache";
import type { DocumentItem, DocumentStatus } from "@/lib/types";

export interface StoredDocument extends DocumentItem {
  fileName?: string;
  hasFile?: boolean;
  sizeBytes?: number;
}

interface DocumentsContextValue {
  documents: StoredDocument[];
  isHydrated: boolean;
  canEdit: boolean;
  addDocument: (input: { name: string; category: string; fileName: string }) => void;
  uploadDocument: (
    file: File,
    name: string,
    category: string,
    expiresAt?: string
  ) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  refreshDocuments: () => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const { canEdit } = useMove();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshDocuments = useCallback(async () => {
    if (!isAuthenticated || !user?.email) return;
    const data = await loadUserData(user.email, true);
    setDocuments(data.documents);
  }, [isAuthenticated, user?.email]);

  const saveToDb = useCallback(
    async (next: StoredDocument[]) => {
      if (!isAuthenticated || !user?.email || !canEdit) return;
      await apiFetch("/api/documents", {
        method: "PUT",
        body: JSON.stringify({ documents: next }),
      });
    },
    [isAuthenticated, user?.email, canEdit]
  );

  useEffect(() => {
    if (!authHydrated) return;

    async function load() {
      if (isAuthenticated && user?.email) {
        try {
          const data = await loadUserData(user.email);
          setDocuments(data.documents);
        } catch {
          setDocuments([]);
        }
      } else {
        setDocuments([]);
      }
      setIsHydrated(true);
    }

    load();
  }, [authHydrated, isAuthenticated, user?.email]);

  const uploadDocument = useCallback(
    async (file: File, name: string, category: string, expiresAt?: string) => {
      if (!canEdit) throw new Error("Read-only access");
      const form = new FormData();
      form.append("file", file);
      form.append("name", name);
      form.append("category", category);
      if (expiresAt) form.append("expiresAt", expiresAt);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Upload failed");
      }
      invalidateUserData();
      await refreshDocuments();
    },
    [canEdit, refreshDocuments]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!canEdit) return;
      await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      invalidateUserData();
    },
    [canEdit]
  );

  const addDocument = useCallback(
    (input: { name: string; category: string; fileName: string }) => {
      const doc: StoredDocument = {
        id: `doc-${Date.now()}`,
        name: input.name.trim() || input.fileName,
        category: input.category,
        status: "pending",
        uploadedAt: new Date().toISOString().slice(0, 10),
        fileName: input.fileName,
      };
      setDocuments((prev) => {
        const next = [doc, ...prev];
        void saveToDb(next);
        return next;
      });
    },
    [saveToDb]
  );

  const setDocumentStatus = useCallback(
    (id: string, status: DocumentStatus) => {
      setDocuments((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, status } : d));
        void saveToDb(next);
        return next;
      });
    },
    [saveToDb]
  );

  const value = useMemo(
    () => ({
      documents,
      isHydrated,
      canEdit,
      addDocument,
      uploadDocument,
      deleteDocument,
      setDocumentStatus,
      refreshDocuments,
    }),
    [
      documents,
      isHydrated,
      canEdit,
      addDocument,
      uploadDocument,
      deleteDocument,
      setDocumentStatus,
      refreshDocuments,
    ]
  );

  return (
    <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentsProvider");
  return ctx;
}
