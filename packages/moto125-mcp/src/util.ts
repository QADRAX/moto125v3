/** Resultado MCP en texto JSON. */
export function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorPayload(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { message: typeof err === "string" ? err : String(err) };
  }

  const payload: Record<string, unknown> = { message: err.message };

  // Content API (@moto125/api-client): Error + status + detail
  if ("status" in err) {
    const status = Reflect.get(err, "status");
    if (status !== undefined) payload.status = status;
  }
  if ("detail" in err) {
    const detail = Reflect.get(err, "detail");
    if (detail !== undefined) payload.detail = detail;
  }

  // Admin API (axios): response.status / response.data
  if ("response" in err) {
    const response = Reflect.get(err, "response");
    if (response && typeof response === "object") {
      const status = Reflect.get(response, "status");
      const data = Reflect.get(response, "data");
      if (status !== undefined && payload.status === undefined) {
        payload.status = status;
      }
      if (data !== undefined && payload.detail === undefined) {
        payload.detail = data;
      }
    }
  }

  return payload;
}

export function errorResult(err: unknown) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(errorPayload(err), null, 2),
      },
    ],
  };
}

export async function runTool<T>(fn: () => Promise<T>) {
  try {
    return jsonResult(await fn());
  } catch (err) {
    return errorResult(err);
  }
}
