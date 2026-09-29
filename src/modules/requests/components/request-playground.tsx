"use client";

import { useHotkeys } from "react-hotkeys-hook";
import RequestEditor from "./request-editor";
import TabBar from "./tab-bar";
import { useRequestPlaygroundStore } from "../store/useRequestStore";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import SaveRequestToCollectionModal from "@/modules/collections/components/add-request-modal";
import { REST_METHOD } from "../../../../generated/prisma/enums";
import { useWorkspaceStore } from "@/modules/layout/store";

import { Unplug } from "lucide-react";
import { useSaveRequest } from "../hooks/request";

export default function PlaygroundPage() {
  const { tabs, activeTabId, addTab } = useRequestPlaygroundStore();
  const { selectedWorkspace } = useWorkspaceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const { mutateAsync } = useSaveRequest(activeTab?.requestId ?? "");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const getCurrentRequestData = () => {
    if (!activeTab) {
      return {
        name: "Untitled Request",
        method: REST_METHOD.GET as REST_METHOD,
        url: "",
      };
    }

    return {
      name: activeTab.title || "Untitled Request",
      method: (activeTab.method as REST_METHOD) || REST_METHOD.GET,
      url: activeTab.url,
      body: activeTab.body,
      headers: activeTab.headers,
      parameters: activeTab.parameters,
    };
  };

  const saveActiveRequest = useCallback(async () => {
    if (!activeTab) {
      toast.error("No active request to save");
      return;
    }

    if (activeTab.collectionId) {
      try {
        await mutateAsync({
          url: activeTab.url,
          method: activeTab.method as REST_METHOD,
          name: activeTab.title || "Untitled Request",
          body: activeTab.body,
          headers: activeTab.headers,
          parameters: activeTab.parameters,
        });
        toast.success("Request updated");
      } catch (err) {
        console.error("Failed to update request:", err);
        toast.error("Failed to update request");
      }
      return;
    }

    setShowSaveModal(true);
  }, [activeTab, mutateAsync]);

  useHotkeys(
    "ctrl+s, meta+s",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      void saveActiveRequest();
    },
    {
      preventDefault: true,
      enabled: true,
      keydown: true,
      keyup: false,
      enableOnFormTags: false,
      enableOnContentEditable: false,
    },
    [saveActiveRequest],
  );

  useHotkeys(
    "ctrl+alt+n, meta+alt+n",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      addTab();
      toast.success("New request created");
    },
    {
      preventDefault: true,
      keydown: true,
      keyup: false,
      enableOnFormTags: false,
      enableOnContentEditable: false,
    },
    [addTab],
  );

  if (!activeTab) {
    return (
      <div className="flex space-y-4 flex-col h-full items-center justify-center">
        <div className="flex flex-col justify-center items-center h-40 w-40 border rounded-full bg-zinc-900">
          <Unplug size={80} className="text-indigo-400" />
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center gap-8">
            <kbd className="px-2 py-1 bg-zinc-800 text-indigo-400 text-sm rounded border">
              Ctrl+Alt+N
            </kbd>
            <span className="text-zinc-400 font-semibold">New Request</span>
          </div>
          <div className="flex justify-between items-center gap-8">
            <kbd className="px-2 py-1 bg-zinc-800 text-indigo-400 text-sm rounded border">
              Ctrl+S
            </kbd>
            <span className="text-zinc-400 font-semibold">Save Request</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TabBar />
      <div className="flex-1 overflow-auto">
        <RequestEditor />
      </div>

      {/* Save Request Modal */}
      {showSaveModal && selectedWorkspace && (
        <SaveRequestToCollectionModal
          isModalOpen={showSaveModal}
          setIsModalOpen={setShowSaveModal}
          workspaceId={selectedWorkspace.id}
          workspaceName={selectedWorkspace.name}
          initialCollectionId={activeTab.collectionId}
          initialName={getCurrentRequestData().name}
          request={getCurrentRequestData()}
        />
      )}
    </div>
  );
}
