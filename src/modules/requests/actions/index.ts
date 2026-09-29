"use server";

import db from "@/lib/db";
import { REST_METHOD } from "../../../../generated/prisma/enums";
import axios, { AxiosRequestConfig } from "axios";

export interface Request {
    name: string;
    method: REST_METHOD;
    url: string;
    body?: string;
    headers?: string;
    parameters?: string;
    response?: string;
}

const normalizeJsonField = (value?: unknown) => {
  if (value == null || value === "") return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return value;
};

export const addRequestToCollection = async (collectionId:string , value:Request)=>{
  const request = await db.request.create({
    data:{
        collectionId,
        name: value.name,
        method: value.method,
        url: value.url,
        body: normalizeJsonField(value.body),
        headers: normalizeJsonField(value.headers),
        parameters: normalizeJsonField(value.parameters),
    }
  });

  return request;
}

export const saveRequest = async (id:string, value:Request)=>{
  const request = await db.request.update({
    where: {
      id,
    },
    data: {
      name: value.name,
      method: value.method,
      url: value.url,
      body: normalizeJsonField(value.body),
      headers: normalizeJsonField(value.headers),
      parameters: normalizeJsonField(value.parameters),
    },
  });

  return request;
}

export const getAllRequestFromCollection = async (collectionId:string)=>{
  const requests = await db.request.findMany({
    where: {
      collectionId,
    },
  });
  return requests;
}

export async function sendRequest(req: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
}) {
  const config: AxiosRequestConfig = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    params: req.params,
    data: req.body,
    validateStatus: () => true, // ✅ capture errors too
  };

  const start = performance.now();
  try {
    const res = await axios(config);
    const end = performance.now();

    const duration = end - start;
    const responseBody =
      typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
    const headers = Object.fromEntries(
      Object.entries(res.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(", ") : String(value),
      ]),
    );

    return {
      status: res.status,
      statusText: res.statusText,
      headers,
      data: res.data,
      duration: Math.round(duration),
      size: new TextEncoder().encode(responseBody).length,
    };
  } catch (error: unknown) {
    const end = performance.now();
    const message = error instanceof Error ? error.message : "Request failed";
    return {
      error: message,
      duration: Math.round(end - start),
    };
  }
}

export async function run(requestId: string) {
  try {
    const request = await db.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error(`Request with id ${requestId} not found`);
    }

   
    const requestConfig = {
      method: request.method,
      url: request.url,
      headers: (request.headers as Record<string, string> | null) || undefined,
      params: (request.parameters as Record<string, string> | null) || undefined,
      body: request.body || undefined
    };

    const result = await sendRequest(requestConfig);

   
    const requestRun = await db.requestRun.create({
      data: {
        requestId: request.id,
        status: result.status || 0,
        statusText: result.statusText || (result.error ? 'Error' : null),
        headers: result.headers || "",
        body: result.data ? (typeof result.data === 'string' ? result.data : JSON.stringify(result.data)) : null,
        durationMs: result.duration || 0
      }
    });

  
    if (result.data && !result.error) {
      await db.request.update({
        where: { id: request.id },
        data: {
          response: result.data,
          updatedAt: new Date()
        }
      });
    }

    return {
      success: true,
      requestRun,
      result
    };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    try {
      const failedRun = await db.requestRun.create({
        data: {
          requestId,
          status: 0,
          statusText: 'Failed',
          headers: "",
          body: message,
          durationMs: 0
        }
      });

      return {
        success: false,
        error: message,
        requestRun: failedRun
      };
    } catch (dbError: unknown) {
      const dbMessage = dbError instanceof Error ? dbError.message : "Database save failed";
      return {
        success: false,
        error: `Request failed: ${message}. DB save failed: ${dbMessage}`
      };
    }
  }
}


export async function runDirect(requestData: {
  id?: string;
  collectionId?: string;
  name?: string;
  method: string;
  url: string;
  headers?: Record<string, string> | string | null;
  parameters?: Record<string, string> | string | null;
  body?: unknown;
}) {
  let persistedRequest: { id: string; method: REST_METHOD; url: string } | null = null;

  try {
    const resolvedRequest = requestData.id
      ? await db.request.findUnique({ where: { id: requestData.id } })
      : null;

    if (resolvedRequest) {
      persistedRequest = resolvedRequest;
    } else if (requestData.collectionId) {
      persistedRequest = await db.request.create({
        data: {
          collectionId: requestData.collectionId,
          name: requestData.name || "Untitled",
          method: requestData.method as REST_METHOD,
          url: requestData.url || "",
          body: normalizeJsonField(requestData.body),
          headers: normalizeJsonField(requestData.headers),
          parameters: normalizeJsonField(requestData.parameters),
        },
      });
    } else {
      throw new Error("Save this request before sending it.");
    }

    const requestConfig = {
      method: requestData.method,
      url: requestData.url,
      headers: typeof requestData.headers === "string" ? undefined : (requestData.headers ?? undefined),
      params: typeof requestData.parameters === "string" ? undefined : (requestData.parameters ?? undefined),
      body: requestData.body,
    };

    const result = await sendRequest(requestConfig);
    const responseBody =
      result.data == null
        ? ""
        : typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data);

    const requestRun = await db.requestRun.create({
      data: {
        requestId: persistedRequest.id,
        status: result.status || 0,
        statusText: result.statusText || (result.error ? "Error" : null),
        headers: result.headers ?? {},
        body: result.error ? result.error : responseBody,
        durationMs: result.duration || 0,
      },
    });

    if (!result.error) {
      await db.request.update({
        where: { id: persistedRequest.id },
        data: {
          response: result.data ?? "",
          updatedAt: new Date(),
        },
      });
    }

    return {
      success: !result.error,
      requestId: persistedRequest.id,
      requestRun: {
        id: requestRun.id,
        requestId: persistedRequest.id,
        status: requestRun.status,
        statusText: requestRun.statusText,
        headers: result.headers ?? {},
        body: requestRun.body,
        durationMs: requestRun.durationMs,
        createdAt: requestRun.createdAt.toISOString(),
      },
      result: {
        status: result.status,
        statusText: result.statusText,
        duration: result.duration,
        size: result.size,
        error: result.error,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    const requestIdForFailure = persistedRequest?.id ?? (requestData.id && (await db.request.findUnique({ where: { id: requestData.id } }))?.id);

    if (requestIdForFailure) {
      try {
        const failedRun = await db.requestRun.create({
          data: {
            requestId: requestIdForFailure,
            status: 0,
            statusText: "Failed",
            headers: "",
            body: message,
            durationMs: 0,
          },
        });

        return {
          success: false,
          requestId: requestIdForFailure,
          error: message,
          requestRun: {
            id: failedRun.id,
            requestId: requestIdForFailure,
            status: failedRun.status,
            statusText: failedRun.statusText,
            headers: {},
            body: failedRun.body,
            durationMs: failedRun.durationMs,
            createdAt: failedRun.createdAt.toISOString(),
          },
          result: { status: 0, statusText: "Failed", duration: 0, size: 0, error: message },
        };
      } catch {
        return {
          success: false,
          error: message,
          requestRun: null,
        };
      }
    }

    return {
      success: false,
      error: message,
      requestId: persistedRequest?.id,
      requestRun: null,
    };
  }
}