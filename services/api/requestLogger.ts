export function logApiRequest(method: string, url: string, body?: unknown) {
  const timestamp = new Date().toISOString();
  if (body !== undefined) {
    console.log(`[API][${timestamp}] ${method.toUpperCase()} ${url}`, body);
    return;
  }

  console.log(`[API][${timestamp}] ${method.toUpperCase()} ${url}`);
}

export function logApiResponse(
  method: string,
  url: string,
  status: number,
  ok: boolean
) {
  const timestamp = new Date().toISOString();
  console.log(
    `[API][${timestamp}] ${method.toUpperCase()} ${url} -> ${status} ${
      ok ? "OK" : "ERROR"
    }`
  );
}
