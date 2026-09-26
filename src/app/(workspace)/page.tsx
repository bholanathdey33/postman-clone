"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import TabbedSidebar from "@/modules/collections/components/sidebar";
import { useWorkspaceStore } from "@/modules/layout/store";
import RequestPlayground from "./../../../src/modules/requests/components/request-playground"
import { useGetWorkspace } from "@/modules/workspace/hooks/workspaces";
import { Loader } from "lucide-react";

const Page = () => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { data: currentWorkspace, isLoading } = useGetWorkspace(
    selectedWorkspace?.id,
  );
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader className="animate-spin h-6 w-6 text-indigo-500" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        Select a workspace to continue
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full w-full min-h-0 min-w-0"
      resizeTargetMinimumSize={{ fine: 16, coarse: 28 }}
    >
      <ResizablePanel
        defaultSize="65%"
        minSize="40%"
        className="min-h-0 min-w-0"
      >
        <RequestPlayground />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize="35%"
        minSize="25%"
        className="min-h-0 min-w-0"
      >
        <div className="h-full w-full min-h-0 min-w-0">
          <TabbedSidebar currentWorkspace={currentWorkspace} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Page;
