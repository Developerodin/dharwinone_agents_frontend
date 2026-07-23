// Port of backend/harness/providers.py + backend/harness/llm.py — only the
// surface studio services actually use: the `get(cfg, stage, policy?)`
// factory and each provider's `generate(model, prompt, options)` /
// `healthy(model, deadlineS?)` methods (grepped call sites: studio/draft.py,
// studio/services/onboarding_service.py, studio/services/edit_service.py,
// studio/services/composition_service.py, studio/consent.py all only ever
// call `provider.generate(model, prompt, {json_mode?, num_ctx?, timeout_s?})`
// and `providers.get(cfg, stage, policy?)`). No SDKs — plain fetch, mirroring
// Python's urllib-only harness.
//
// Deviation: Python's provider methods are synchronous (blocking
// urllib.request calls); `fetch` is inherently async, so `generate`/`healthy`
// here return Promises. Callers (draft.ts's generate/refine/rewriteSection)
// are `async` accordingly — a necessary, not stylistic, departure from the
// Python call sites, which call `provider.generate(...)` directly with no
// `await`.

export type ProviderKind = "ollama" | "vllm" | "anthropic" | "openai";

export interface StageProviderConfig {
  kind?: string;
  model?: string;
  baseUrl?: string;
}

// Mirrors the `cfg` dict shape read by harness/providers.py: `cfg["ollama_url"]`
// and `cfg.get("providers")` (a per-stage dict of {kind, model, base_url}).
export interface ProviderConfig {
  ollamaUrl: string;
  providers?: Record<string, StageProviderConfig | undefined>;
}

export type ProviderPolicy = (stage: string, kind: string, model: string) => void;

export interface GenerateOptions {
  jsonMode?: boolean;
  numCtx?: number;
  timeoutS?: number;
}

export interface Provider {
  generate(model: string, prompt: string, options?: GenerateOptions): Promise<string>;
  healthy(model: string, deadlineS?: number): Promise<boolean>;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is not set`);
  return val;
}

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutS: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutS * 1000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`request to ${url} failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Port of harness.llm.Ollama. */
class OllamaProvider implements Provider {
  private url: string;

  constructor(url: string) {
    this.url = stripTrailingSlashes(url);
  }

  async generate(model: string, prompt: string, options: GenerateOptions = {}): Promise<string> {
    const { jsonMode = false, numCtx = 16384, timeoutS = 600 } = options;
    const body: Record<string, unknown> = {
      model,
      prompt,
      stream: false,
      options: { num_ctx: numCtx },
    };
    if (jsonMode) body.format = "json"; // forces syntactically valid JSON (mitigation #6)
    const data = await postJson(
      `${this.url}/api/generate`,
      body,
      { "Content-Type": "application/json" },
      timeoutS,
    );
    return data.response;
  }

  async healthy(model: string, deadlineS = 60): Promise<boolean> {
    try {
      const out = await this.generate(model, "Reply with OK", { numCtx: 2048, timeoutS: deadlineS });
      return Boolean(out);
    } catch {
      return false;
    }
  }
}

/** Port of harness.providers._AnthropicProvider. */
class AnthropicProvider implements Provider {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = stripTrailingSlashes(baseUrl || "https://api.anthropic.com");
  }

  async generate(model: string, prompt: string, options: GenerateOptions = {}): Promise<string> {
    const { jsonMode = false, timeoutS = 600 } = options;
    const key = requireEnv("ANTHROPIC_API_KEY");
    const content = jsonMode ? `${prompt}\nRespond with JSON only.` : prompt;
    const body = {
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    };
    const data = await postJson(
      `${this.baseUrl}/v1/messages`,
      body,
      {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      timeoutS,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = data.content ?? [];
    return parts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.text ?? "")
      .join("");
  }

  async healthy(model: string, deadlineS = 60): Promise<boolean> {
    try {
      const out = await this.generate(model, "Reply with OK", { numCtx: 2048, timeoutS: deadlineS });
      return Boolean(out);
    } catch {
      return false;
    }
  }
}

/** Port of harness.providers._OpenAICompatProvider (OpenAI cloud or vLLM local). */
class OpenAICompatProvider implements Provider {
  protected baseUrl: string;
  protected apiKeyEnv: string;
  protected authBearer: boolean;

  constructor(baseUrl: string, apiKeyEnv = "OPENAI_API_KEY", authBearer = true) {
    this.baseUrl = stripTrailingSlashes(baseUrl);
    this.apiKeyEnv = apiKeyEnv;
    this.authBearer = authBearer;
  }

  async generate(model: string, prompt: string, options: GenerateOptions = {}): Promise<string> {
    const { jsonMode = false, timeoutS = 600 } = options;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.authBearer) headers.Authorization = `Bearer ${requireEnv(this.apiKeyEnv)}`;
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: prompt }],
    };
    if (jsonMode) body.response_format = { type: "json_object" };
    const data = await postJson(`${this.baseUrl}/v1/chat/completions`, body, headers, timeoutS);
    return data.choices[0].message.content;
  }

  async healthy(model: string, deadlineS = 60): Promise<boolean> {
    try {
      const out = await this.generate(model, "Reply with OK", { numCtx: 2048, timeoutS: deadlineS });
      return Boolean(out);
    } catch {
      return false;
    }
  }
}

/** Port of harness.providers._OpenAIProvider. */
class OpenAIProvider extends OpenAICompatProvider {
  constructor(baseUrl?: string) {
    super(baseUrl || "https://api.openai.com");
  }
}

/** Port of harness.providers._VllmProvider (unauthenticated OpenAI-compatible local server). */
class VllmProvider extends OpenAICompatProvider {
  constructor(baseUrl: string) {
    super(baseUrl, "", false);
  }
}

// Port of harness.providers.LOCAL_SEMAPHORE / CLOUD_SEMAPHORE. Python uses a
// threading.Semaphore because its providers run under real OS threads; Node
// is single-threaded, so this is a plain async mutex-style queue that caps
// how many concurrent in-flight `generate()` calls a wrapped provider allows
// — same intent (serialize local model calls, allow a few cloud calls at
// once), ported to the async world.
class AsyncSemaphore {
  private permits: number;
  private readonly waiters: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  private acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits -= 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      this.permits += 1;
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const LOCAL_SEMAPHORE = new AsyncSemaphore(1);
const CLOUD_SEMAPHORE = new AsyncSemaphore(4);

// Port of harness.providers._wrap_semaphore. Note `healthy` deliberately
// bypasses the semaphore, same as the Python wrapper.
function wrapSemaphore(inner: Provider, sem: AsyncSemaphore): Provider {
  return {
    generate: (model, prompt, options) => sem.run(() => inner.generate(model, prompt, options)),
    healthy: (model, deadlineS) => inner.healthy(model, deadlineS),
  };
}

const ollamaCache = new Map<string, Provider>();

function getImpl(cfg: ProviderConfig, stage: string, policy?: ProviderPolicy): Provider {
  const providersCfg = cfg.providers;
  if (!providersCfg) {
    const url = cfg.ollamaUrl;
    if (!ollamaCache.has(url)) {
      ollamaCache.set(url, wrapSemaphore(new OllamaProvider(url), LOCAL_SEMAPHORE));
    }
    return ollamaCache.get(url)!;
  }

  const stageCfg = providersCfg[stage] ?? {};
  const kind = stageCfg.kind ?? "ollama";
  const model = stageCfg.model ?? "";
  if (policy) policy(stage, kind, model);

  switch (kind) {
    case "ollama":
      return wrapSemaphore(new OllamaProvider(stageCfg.baseUrl ?? cfg.ollamaUrl), LOCAL_SEMAPHORE);
    case "vllm":
      return wrapSemaphore(
        new VllmProvider(stageCfg.baseUrl ?? "http://127.0.0.1:8000"),
        LOCAL_SEMAPHORE,
      );
    case "anthropic":
      return wrapSemaphore(new AnthropicProvider(stageCfg.baseUrl), CLOUD_SEMAPHORE);
    case "openai":
      return wrapSemaphore(new OpenAIProvider(stageCfg.baseUrl), CLOUD_SEMAPHORE);
    default:
      throw new Error(`unknown provider kind: ${JSON.stringify(kind)}`);
  }
}

let factoryOverride: typeof getImpl | null = null;

/** Test seam: replace the whole `get()` factory (e.g. to always return a
 * fake provider) without touching real fetch/env/cache state. Pass `null`
 * to restore the real factory. */
export function setProviderFactoryForTests(fn: typeof getImpl | null): void {
  factoryOverride = fn;
}

/** Port of harness.providers.get: return a duck-typed provider for the given
 * pipeline stage. */
export function get(cfg: ProviderConfig, stage: string, policy?: ProviderPolicy): Provider {
  return (factoryOverride ?? getImpl)(cfg, stage, policy);
}

/** Test-only: clear the cached-by-URL Ollama provider singleton(s). */
export function resetProviderCacheForTests(): void {
  ollamaCache.clear();
}
