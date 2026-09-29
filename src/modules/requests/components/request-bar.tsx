import React, { useState } from "react";
import { RequestTab } from "../store/useRequestStore";
import { useRequestPlaygroundStore } from "../store/useRequestStore";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { runDirect } from "../actions";
import { toast } from "sonner";

interface Props {
  tab: RequestTab;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
}

const parseKeyValueInput = (value?: string): Record<string, string> => {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return {};

    return parsed.reduce<Record<string, string>>((acc, item) => {
      if (item && item.enabled !== false && item.key) {
        acc[String(item.key)] = String(item.value ?? "");
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const RequestBar = ({ tab, updateTab }: Props) => {
  const [isSending, setIsSending] = useState(false);
  const requestColorMap: Record<string, string> = {
    GET: "text-green-500",
    POST: "text-blue-500",
    PUT: "text-yellow-500",
    DELETE: "text-red-500",
  };

  const onSendRequest = async () => {
    setIsSending(true);
    try {
      if (!tab.requestId && !tab.collectionId) {
        toast.error("Save this request before sending it.");
        return;
      }

      const result = await runDirect({
        id: tab.requestId,
        collectionId: tab.collectionId,
        name: tab.title || "Untitled",
        method: tab.method,
        url: tab.url,
        headers: parseKeyValueInput(tab.headers),
        parameters: parseKeyValueInput(tab.parameters),
        body: tab.body,
      });

      if (result.requestRun) {
        useRequestPlaygroundStore.getState().setTabResponseData(tab.id, result);
      }

      if (result.success) {
        toast.success("Request sent successfully!");
      } else {
        toast.error(result.error || result.result?.error || "Request failed");
      }
    } catch (error) {
      console.error("Failed to send request:", error);
      toast.error("Failed to send request");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-row items-center justify-between bg-zinc-900 rounded-md px-2 py-2 w-full">
      <div className="flex flex-row items-center gap-2 flex-1">
        <Select
          value={tab.method}
          onValueChange={(value) => {
            if (value) updateTab(tab.id, { method: value });
          }}
        >
          <SelectTrigger
            className={`w-24 ${requestColorMap[tab.method] || "text-gray-500"}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="GET" className="text-green-500">
                GET
              </SelectItem>
              <SelectItem value="POST" className="text-blue-500">
                POST
              </SelectItem>
              <SelectItem value="PUT" className="text-yellow-500">
                PUT
              </SelectItem>
              <SelectItem value="DELETE" className="text-red-500">
                DELETE
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Input
          value={tab.url || ""}
          onChange={(e) => updateTab(tab.id, { url: e.target.value })}
          placeholder="Enter URL"
          className="flex-1"
        />
      </div>

      <Button
        onClick={() => void onSendRequest()}
        disabled={isSending}
        className="ml-2 text-white font-bold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60"
      >
        <Send className="mr-2" />
        {isSending ? "Sending..." : "Send"}
      </Button>
    </div>
  );
};

export default RequestBar;
