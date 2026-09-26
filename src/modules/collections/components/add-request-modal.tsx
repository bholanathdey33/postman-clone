"use client";

import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { useCollections } from "@/modules/collections/hooks/collection";
import { useAddRequestToCollection } from "@/modules/requests/hooks/request";
import type { Request } from "@/modules/requests/actions";
import { Folder, Search } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { REST_METHOD } from "../../../../generated/prisma/enums";

type RequestDraft = Pick<Request, "method" | "url"> &
  Partial<Pick<Request, "body" | "headers">>;

const AddRequestCollectionModal = ({
  isModalOpen,
  setIsModalOpen,
  workspaceId,
  workspaceName,
  initialCollectionId,
  request,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  initialCollectionId?: string;
  request: RequestDraft;
}) => {
  const [name, setName] = useState("Untitled");
  const [search, setSearch] = useState("");
  const [selectedCollectionOverride, setSelectedCollectionOverride] = useState(
    initialCollectionId ?? "",
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const {
    data: collections,
    isLoading: areCollectionsLoading,
    isError: isCollectionsError,
  } = useCollections(workspaceId);
  const selectedCollectionId =
    selectedCollectionOverride ||
    initialCollectionId ||
    collections?.[0]?.id ||
    "";
  const { mutateAsync, isPending } =
    useAddRequestToCollection(selectedCollectionId);
  const methodBadgeColors: Record<REST_METHOD, string> = {
    [REST_METHOD.GET]: "text-green-400",
    [REST_METHOD.POST]: "text-blue-400",
    [REST_METHOD.PUT]: "text-yellow-400",
    [REST_METHOD.PATCH]: "text-orange-400",
    [REST_METHOD.DELETE]: "text-red-400",
  };
  const selectedCollection = collections?.find(
    (collection) => collection.id === selectedCollectionId,
  );
  const filteredCollections = collections?.filter((collection) =>
    collection.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !request.url.trim() || !selectedCollectionId) return;

    try {
      await mutateAsync({
        name: name.trim(),
        method: request.method,
        url: request.url.trim(),
        headers: request.headers,
        body: request.body,
      });
      toast.success("Request saved to collection");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save request");
      console.error("Failed to save request:", error);
    }
  };

  return (
    <Modal
      title="Save as"
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      showFooter={false}
      className="border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl sm:max-w-2xl"
    >
      <div className="space-y-5">
        <section className="space-y-2">
          <label
            htmlFor="save-request-name"
            className="block text-sm font-medium text-zinc-200"
          >
            Request name
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/30">
            <input
              ref={nameInputRef}
              id="save-request-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none"
              required
            />
            <span
              className={`rounded-md bg-zinc-700 px-3 py-1 text-sm font-bold ${methodBadgeColors[request.method]}`}
            >
              {request.method}
            </span>
          </div>
        </section>

        <section className="space-y-2">
          <label className="block text-sm font-medium text-zinc-200">
            Select location
          </label>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>{workspaceName}</span>
            <span aria-hidden="true">&gt;</span>
            <span>Collections</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3">
            <Search className="size-4 shrink-0 text-zinc-500" />
            <input
              aria-label="Search collections"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
          </div>

          <div
            role="radiogroup"
            aria-label="Collections"
            className="max-h-40 space-y-1 overflow-y-auto"
          >
            {areCollectionsLoading ? (
              <p className="py-3 text-sm text-zinc-500">
                Loading collections...
              </p>
            ) : isCollectionsError ? (
              <p className="py-3 text-sm text-red-400">
                Could not load collections.
              </p>
            ) : filteredCollections?.length ? (
              filteredCollections.map((collection) => {
                const isSelected = collection.id === selectedCollectionId;

                return (
                  <label
                    key={collection.id}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 transition-colors ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/70"
                        : "border-transparent hover:bg-zinc-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="save-request-collection"
                      value={collection.id}
                      checked={isSelected}
                      onChange={() =>
                        setSelectedCollectionOverride(collection.id)
                      }
                      className="size-4 accent-indigo-500"
                    />
                    <span className="truncate text-sm font-semibold text-zinc-100">
                      {collection.name}
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="py-3 text-sm text-zinc-500">
                {search
                  ? "No matching collections."
                  : "No collections available."}
              </p>
            )}
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
          <span className="text-zinc-400">Saving to:</span>
          <Folder className="size-4 shrink-0 text-indigo-400" />
          <span className="truncate font-medium text-indigo-300">
            {selectedCollection?.name ?? "Select a collection"}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm">
          <span className="shrink-0 text-zinc-500">URL:</span>
          <span className="truncate text-zinc-200" title={request.url}>
            {request.url || "No URL entered"}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              !name.trim() ||
              !request.url.trim() ||
              !selectedCollectionId
            }
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddRequestCollectionModal;
