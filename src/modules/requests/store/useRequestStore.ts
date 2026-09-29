import { create } from "zustand";
import { nanoid } from "nanoid";
import { ResponseData } from "../components/response-viewer";

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  body?: unknown;
  headers?: unknown;
  parameters?: unknown;
  response?: unknown;
}

const normalizeStoredJson = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value == null) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

const createRequestTab = (
  overrides: Partial<RequestTab> = {},
): RequestTab => ({
  id: nanoid(),
  title: "Request",
  method: "GET",
  url: "",
  body: "",
  headers: "",
  parameters: "",
  unsavedChanges: false,
  ...overrides,
});

export type RequestTab = {
  id: string;
  title: string;
  method: string;
  url: string;
  body?: string;
  headers?: string;
  parameters?: string;
  unsavedChanges?: boolean;
  requestId?: string; // link to DB request
  collectionId?: string;
  workspaceId?: string;
  responseData?: ResponseData;
};

type PlaygroundState = {
  tabs: RequestTab[];
  activeTabId: string | null;
  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
  markUnsaved: (id: string, value: boolean) => void;
  openRequestTab: (req: {
    id: string;
    name?: string;
    method: string;
    url: string;
    body?: unknown;
    headers?: unknown;
    parameters?: unknown;
    response?: unknown;
    collectionId?: string;
    workspaceId?: string;
  }) => void;
  updateTabFromSavedRequest: (tabId: string, savedRequest: SavedRequest) => void;
  setTabResponseData: (tabId: string, data: unknown) => void;
};

const initialRequestTab = createRequestTab({
  title: "Request",
  url: "",
  unsavedChanges: false,
});

export const useRequestPlaygroundStore = create<PlaygroundState>((set) => ({
  setTabResponseData: (tabId, data) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              requestId: (data as ResponseData | null)?.requestId ?? tab.requestId,
              responseData: (data as ResponseData | null) ?? undefined,
            }
          : tab,
      ),
    })),
  tabs: [initialRequestTab],
  activeTabId: initialRequestTab.id,

  addTab: () =>
    set((state) => {
      const newTab = createRequestTab({
        title: "Untitled",
        method: "GET",
        url: "",
        body: "",
        headers: "",
        parameters: "",
        unsavedChanges: true,
      });

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),

  closeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const nextActiveId =
        state.activeTabId === id
          ? newTabs[0]?.id ?? null
          : state.activeTabId;

      return { tabs: newTabs, activeTabId: nextActiveId };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, data) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, ...data, unsavedChanges: true } : t,
      ),
    })),

  markUnsaved: (id, value) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, unsavedChanges: value } : t,
      ),
    })),

  openRequestTab: (req) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.requestId === req.id);
      if (existing) {
        return { activeTabId: existing.id };
      }

      const newTab: RequestTab = {
        id: nanoid(),
        title: req.name || "Untitled",
        method: req.method,
        url: req.url,
        body: normalizeStoredJson(req.body),
        headers: normalizeStoredJson(req.headers),
        parameters: normalizeStoredJson(req.parameters),
        requestId: req.id,
        collectionId: req.collectionId,
        workspaceId: req.workspaceId,
        responseData:
          req.response == null
            ? undefined
            : {
                success: true,
                requestId: req.id,
                requestRun: { requestId: req.id, body: req.response as string | object },
              },
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
              title: savedRequest.name,
              method: savedRequest.method,
              body: normalizeStoredJson(savedRequest.body),
              headers: normalizeStoredJson(savedRequest.headers),
              parameters: normalizeStoredJson(savedRequest.parameters),
              url: savedRequest.url,
              requestId: savedRequest.id,
              unsavedChanges: false,
            }
          : t,
      ),
      activeTabId: tabId,
    })),
}));