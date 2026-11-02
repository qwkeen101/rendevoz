/**
 * Whether this build has a Rendevoz account server for login, membership,
 * payments, official AI credits and cloud transcription.
 *
 * The original author's server is gone, so this is off by default: everyone
 * counts as premium, AI runs on the user's own key, and features that only a
 * server can provide are hidden or turned off. Set VITE_OFFICIAL_BACKEND=true
 * only after pointing src/api/services/interface.ts at this fork's own server.
 */
export const OFFICIAL_BACKEND_ENABLED = import.meta.env.VITE_OFFICIAL_BACKEND === 'true'
