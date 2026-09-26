"use client";

import {
  ChevronDown,
  ChevronRight,
  Edit,
  EllipsisVertical,
  FilePlus,
  Folder,
  Trash,
} from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditCollectionModal from "./edit-collection";
import DeleteCollectionModal from "./delete-collection";
import { useGetAllRequestFromCollection } from "@/modules/requests/hooks/request";
import { useRequestPlaygroundStore } from "@/modules/requests/store/useRequestStore";
import { REST_METHOD } from "../../../../generated/prisma/enums";
interface Props {
  onAddRequest: (collectionId: string) => void;
  collection: {
    id: string;
    name: string;
    updatedAt: Date;
    workspaceId: string;
  };
}

const CollectionFolder = ({ collection, onAddRequest }: Props) => {
  const openRequestTab = useRequestPlaygroundStore(
    (state) => state.openRequestTab,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const {
    data: requests,
    isLoading: areRequestsLoading,
    isError: isRequestsError,
  } = useGetAllRequestFromCollection(collection.id, isExpanded);

  const requestMethodColors: Record<REST_METHOD, string> = {
    [REST_METHOD.GET]: "text-green-400",
    [REST_METHOD.POST]: "text-blue-400",
    [REST_METHOD.PUT]: "text-yellow-400",
    [REST_METHOD.PATCH]: "text-orange-400",
    [REST_METHOD.DELETE]: "text-red-400",
  };

  return (
    <>
      <div className="flex flex-row justify-between items-center p-2 flex-1 w-full hover:bg-zinc-900 rounded-md">
        <div className="flex min-w-0 flex-row items-center space-x-1">
          <button
            type="button"
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${collection.name}`}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
          <Folder className="w-5 h-5 text-zinc-400" />
          <span className="truncate text-sm font-medium text-zinc-200 capitalize">
            {collection.name}
          </span>
        </div>

        <div className="flex flex-row justify-center items-center space-x-2">
          <button
            type="button"
            aria-label="Add request to collection"
            onClick={() => {
              setIsExpanded(true);
              onAddRequest(collection.id);
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded hover:bg-zinc-800"
          >
            <FilePlus className="w-4 h-4 text-zinc-400 hover:text-indigo-400" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="p-1 hover:bg-zinc-800 rounded"
                />
              }
            >
              <EllipsisVertical className="w-4 h-4 text-zinc-400 hover:text-indigo-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  setIsExpanded(true);
                  onAddRequest(collection.id);
                }}
              >
                <div className="flex w-full items-center font-semibold">
                  <FilePlus className="mr-2 h-4 w-4 text-green-400" />
                  Add Request
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="font-semibold flex justify-center items-center">
                    <Edit className="text-blue-400 mr-2 w-4 h-4" />
                    Edit
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-700 px-1 rounded">
                    ⌘E
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="font-semibold flex justify-center items-center">
                    <Trash className="text-red-400 mr-2 w-4 h-4" />
                    Delete
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-700 px-1 rounded">
                    ⌘D
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isExpanded && (
        <div className="ml-5 w-[calc(100%-1.25rem)] border-l border-zinc-800 pl-3">
          {areRequestsLoading ? (
            <p className="py-2 text-xs text-zinc-500">Loading requests...</p>
          ) : isRequestsError ? (
            <p className="py-2 text-xs text-red-400">
              Could not load requests.
            </p>
          ) : requests?.length ? (
            requests.map((request) => (
              <div
                key={request.id}
                title={`${request.name}: ${request.url}`}
                onDoubleClick={() =>
                  openRequestTab({
                    ...request,
                    workspaceId: collection.workspaceId,
                  })
                }
                className="flex min-w-0 cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-zinc-800/70"
              >
                <span
                  className={`flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold ${requestMethodColors[request.method]}`}
                >
                  {request.method}
                </span>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-emerald-500"
                />
                <div className="min-w-0 flex-1 leading-5">
                  <p className="truncate text-sm font-semibold text-zinc-200">
                    {request.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {request.url}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-2 text-xs text-zinc-500">No requests</p>
          )}
        </div>
      )}
      {/* Modals */}
      <EditCollectionModal
        isModalOpen={isEditOpen}
        setIsModalOpen={setIsEditOpen}
        collectionId={collection.id}
        initialName={collection.name}
      />

      <DeleteCollectionModal
        isModalOpen={isDeleteOpen}
        setIsModalOpen={setIsDeleteOpen}
        collectionId={collection.id}
      />
    </>
  );
};

export default CollectionFolder;
