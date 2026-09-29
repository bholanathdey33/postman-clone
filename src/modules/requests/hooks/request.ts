import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {addRequestToCollection,getAllRequestFromCollection,Request,run,saveRequest} from "../actions"
import { useRequestPlaygroundStore } from "../store/useRequestStore";


export function useAddRequestToCollection(collectionId: string) {
    const queryClient = useQueryClient();
    const { activeTabId, tabs, updateTabFromSavedRequest } = useRequestPlaygroundStore.getState();

    return useMutation({
        mutationFn: async (value: Request) => addRequestToCollection(collectionId, value),
        onSuccess: (request) => {
            queryClient.invalidateQueries({ queryKey: ["requests", collectionId] });

            const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
            if (activeTab) {
              updateTabFromSavedRequest(activeTab.id, {
                id: request.id,
                name: request.name,
                method: request.method,
                url: request.url,
                body: request.body ?? "",
                headers: request.headers ?? "",
                parameters: request.parameters ?? "",
              });
            }
        },
    });
}


export function useGetAllRequestFromCollection(collectionId: string, enabled = true) {
    return useQuery({
        queryKey: ["requests", collectionId],
        queryFn: async () => getAllRequestFromCollection(collectionId),
        enabled,
    });
}


export function useSaveRequest(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (value: Request) => {
            if (!id) {
                const { activeTabId, tabs } = useRequestPlaygroundStore.getState();
                const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

                if (!activeTab?.collectionId) {
                    throw new Error("Save this request to a collection before saving it.");
                }

                return addRequestToCollection(activeTab.collectionId, value);
            }

            return saveRequest(id, value);
        },
        onSuccess: (request) => {
            queryClient.invalidateQueries({ queryKey: ["requests"] });

            const { activeTabId, tabs, updateTabFromSavedRequest } = useRequestPlaygroundStore.getState();
            const tab = tabs.find((entry) => entry.id === activeTabId || entry.requestId === id) ?? tabs[0];

            if (tab) {
              updateTabFromSavedRequest(tab.id, {
                id: request.id,
                name: request.name,
                method: request.method,
                url: request.url,
                body: request.body ?? "",
                headers: request.headers ?? "",
                parameters: request.parameters ?? "",
              });
            }
        },
    });
}


export function useRunRequest(requestId: string) {

  const setTabResponseData = useRequestPlaygroundStore((state) => state.setTabResponseData);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await run(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      const tab = useRequestPlaygroundStore
        .getState()
        .tabs.find((entry) => entry.requestId === requestId);
      if (tab && data.requestRun) {
        setTabResponseData(tab.id, { ...data, requestId });
      }
    },
  });
}