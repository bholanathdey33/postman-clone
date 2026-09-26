import { create } from "zustand";
import { nanoid } from "nanoid";

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
}

const serializeRequestValue = (value: unknown) => {
  if (value == null) return undefined;
  return typeof value === "string" ? value : JSON.stringify(value);
};

export type RequestTab = {
  id: string;
  title: string;
  method: string;
  url: string;
  body?: string;
  headers?: string;
  parameters?: string;
  unsavedChanges?: boolean;
  requestId?: string;
  collectionId?: string;
  workspaceId?: string;
};

interface OpenRequest {
  id: string;
  name?: string;
  method: string;
  url: string;
  body?: unknown;
  headers?: unknown;
  parameters?: unknown;
  collectionId?: string;
  workspaceId?: string;
}

const initialRequestTab: RequestTab = {
  id: nanoid(),
  title: "Request",
  method: "GET",
  url: "https://echo.hoppscotch.io",
  unsavedChanges: false,
};

type PlaygroundState = {
  tabs: RequestTab[];
  activeTabId: string | null;
  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
  markUnsaved: (id: string, value: boolean) => void;
  openRequestTab: (req: OpenRequest) => void;
  updateTabFromSavedRequest: (tabId: string, savedRequest: SavedRequest) => void;
};

export const useRequestPlaygroundStore = create<PlaygroundState>((set) => ({
  tabs: [initialRequestTab],
  activeTabId: initialRequestTab.id,

  addTab: () =>
    set((state) => {
      const newTab: RequestTab = {
        id: nanoid(),
        title: "Untitled",
        method: "GET",
        url: "https://echo.hoppscotch.io",
        unsavedChanges: true,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),

  closeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActive =
        state.activeTabId === id && newTabs.length > 0
          ? newTabs[0].id
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActive };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, data) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, ...data, unsavedChanges: true } : t
      ),
    })),

  markUnsaved: (id, value) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, unsavedChanges: value } : t
      ),
    })),

  openRequestTab: (req) =>
    set((state) => {
      // 🔎 check if already open
      const existing = state.tabs.find((t) => t.requestId === req.id);
      if (existing) {
        return { activeTabId: existing.id };
      }

      const newTab: RequestTab = {
        id: nanoid(),
        title: req.name || "Untitled",
        method: req.method,
        url: req.url,
        body: serializeRequestValue(req.body),
        headers: serializeRequestValue(req.headers),
        parameters: serializeRequestValue(req.parameters),
        requestId: req.id,
        collectionId: req.collectionId,
        workspaceId: req.workspaceId,
        unsavedChanges: false,
      };

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),

    updateTabFromSavedRequest: (tabId: string, savedRequest: SavedRequest) =>
  set((state) => ({
    tabs: state.tabs.map((t) =>
      t.id === tabId
        ? {
            ...t,
            id: savedRequest.id, // ✅ Replace temporary id with saved one
            title: savedRequest.name,
            method: savedRequest.method,
            url: savedRequest.url,
            unsavedChanges: false,
          }
        : t
    ),
    activeTabId: savedRequest.id, // ✅ keep active in sync
  })),

}));