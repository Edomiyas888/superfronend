/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** superbet-api origin (no `/api`), e.g. `http://192.168.1.10:3001` for phone testing */
  readonly VITE_API_URL?: string;
  readonly VITE_SWARM_API_URL?: string;
  readonly VITE_SWARM_API_FALLBACKS?: string;
  /** `websocket` = direct browser WS; omit = HTTP via superbet-api (VITE_SWARM_API_URL) */
  readonly VITE_SWARM_TRANSPORT?: string;
  readonly VITE_SWARM_HTTP_FALLBACK?: string;
  readonly VITE_SWARM_WS_URL?: string;
  readonly VITE_SWARM_WS_FALLBACK?: string;
  readonly VITE_SWARM_SITE_ID?: string;
  /** Partner source id (finixbet default 4) — sent in `request_session` */
  readonly VITE_SWARM_SOURCE?: string;
  readonly VITE_SWARM_LANGUAGE?: string;
  readonly VITE_USE_REST_SPORT_LIST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
