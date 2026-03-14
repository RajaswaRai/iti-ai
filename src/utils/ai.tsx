type FrontendMessage = {
  role: "user" | "ai";
  content: string;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryableResponse = (status: number | null): boolean => {
  if (!status) return false;
  return [429, 500, 502, 503, 504].includes(status);
};

const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  const message = String(error?.message || error);
  return /timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/i.test(
    message,
  );
};

async function callGeminiAPIWithRetry(
  message: string,
  history: FrontendMessage[] = [],
  retries: number = 3,
  baseDelayMs: number = 500,
) {
  const payloadHistory = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const baseUrl = (import.meta.env.VITE_SERVER_URL as string) || "/api";
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: payloadHistory }),
      });

      let responseBody: any = null;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          responseBody = await response.json();
        } catch {
          // Swallow JSON parse errors (empty/invalid JSON)
          responseBody = null;
        }
      }

      if (!response.ok) {
        const bodyText =
          responseBody?.error ||
          (await response.text()).slice(0, 512) ||
          "AI request failed";
        const err = new Error(bodyText);
        // @ts-expect-error
        err.status = response.status;
        throw err;
      }

      if (!responseBody) {
        // Unexpected empty response, treat as error so retry logic can run.
        const err = new Error("AI response was empty or not valid JSON");
        // @ts-expect-error
        err.status = response.status;
        throw err;
      }

      return responseBody?.data?.reply ?? "";
    } catch (error: any) {
      const status = error?.status ?? null;
      const shouldRetry =
        attempt < retries &&
        (isRetryableResponse(status) || isRetryableError(error));

      if (!shouldRetry) {
        throw error;
      }

      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  return "";
}

export { callGeminiAPIWithRetry };
