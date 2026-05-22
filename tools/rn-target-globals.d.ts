// Minimal ambient declarations for the RN-target probe.
// `lib: ["ES2022"]` intentionally omits DOM so the probe catches DOM leaks
// (window/document/navigator). But the Fetch API is available on every target
// runtime cascade-sdk supports (Node 24+, Bun, Deno, browsers, React Native),
// so we re-introduce just the fetch-related globals here. Anything not declared
// below — including navigator, window, document, __dirname, __filename — remains
// a type error, which is exactly what the boundary probe needs to catch.

declare type HeadersInit = Headers | string[][] | Record<string, string>;

declare type BodyInit = string | Uint8Array | ArrayBuffer | null;

declare interface Headers {
  get(name: string): string | null;
  set(name: string, value: string): void;
  has(name: string): boolean;
  delete(name: string): void;
  append(name: string, value: string): void;
}

declare interface RequestInit {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  signal?: AbortSignal | null;
}

declare interface Request {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
}

declare interface Response {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare type RequestInfo = Request | string;

declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

declare const globalThis: {
  fetch: typeof fetch;
};
