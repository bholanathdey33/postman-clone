import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {addRequestToCollection,getAllRequestFromCollection,Request,saveRequest} from "../actions"


export function useAddRequestToCollection(collectionId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (value: Request) => addRequestToCollection(collectionId, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests", collectionId] });
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
        mutationFn: async (value: Request) => saveRequest(id, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests"] });
        },
    });
}