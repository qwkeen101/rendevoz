/// <reference types="vite/client" />
declare const APP_VERSION: string;
declare const IS_DEV: boolean;

interface ImportMetaEnv {
  /** Google Maps Embed API key for map blocks in Markdown. Set it in .env.local. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** freeimage.host API key for avatar uploads. Set it in .env.local. */
  readonly VITE_FREEIMAGE_API_KEY?: string
  /** 'true' once this fork has its own account server. See src/config/backend.ts. */
  readonly VITE_OFFICIAL_BACKEND?: string
}
