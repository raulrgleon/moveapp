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
import { apiFetch } from "@/lib/api-client";
import { loadUserData } from "@/lib/data-cache";
import type { DocumentItem, DocumentStatus } from "@/lib/types";

export interface StoredDocument extends DocumentItem {
  fileName?: string;
}

interface DocumentsContextValue {
  documents: StoredDocument[];
  isHydrated: boolean;
  addDocument: (input: { name: string; category: string; fileName: string }) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const saveToDb = useCallback(
    async (next: StoredDocument[]) => {
      if (!isAuthenticated || !user?.email) return;
      await apiFetch("/api/documents", {
        method: "PUT",
        body: JSON.stringify({ documents: next }),
      });
    },
    [isAuthenticated, user?.email]
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
    () => ({ documents, isHydrated, addDocument, setDocumentStatus }),
    [documents, isHydrated, addDocument, setDocumentStatus]
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
