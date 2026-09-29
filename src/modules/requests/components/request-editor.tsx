"use client";

import { useRequestPlaygroundStore } from "../store/useRequestStore";
import RequestBar from "./request-bar";
import RequestEditorArea from "./request-editor-area";
import ResponseViewer from "./response-viewer";

export default function RequestEditor() {
  const { tabs, activeTabId, updateTab } = useRequestPlaygroundStore();
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  if (!activeTab) return null;

  return (
    <div className="flex flex-col items-center justify-start gap-4 py-4 px-4">
      {/* Request Bar */}
      <RequestBar tab={activeTab} updateTab={updateTab} />
      <RequestEditorArea
        key={activeTab.id}
        tab={activeTab}
        updateTab={updateTab}
      />
      {activeTab.responseData && (
        <ResponseViewer responseData={activeTab.responseData} />
      )}
    </div>
  );
}
