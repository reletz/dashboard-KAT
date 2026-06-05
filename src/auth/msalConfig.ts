import type { Configuration, PopupRequest } from "@azure/msal-browser";

/**
 * Demo mode: kalau env Azure belum diisi (POC / preview lokal), auth di-bypass
 * dengan akun dummy supaya UI bisa didemokan tanpa tenant Azure.
 * Di production, isi VITE_AZURE_CLIENT_ID + VITE_AZURE_TENANT_ID → demo mode mati.
 */
export const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === "true" ||
  !import.meta.env.VITE_AZURE_CLIENT_ID;

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? "demo-client-id",
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_AZURE_TENANT_ID ?? "common"
    }`,
    // Termasuk base path (mis. https://kat.naufarrel.dev/dashboard/).
    // URL ini harus didaftarkan PERSIS di Azure → Authentication → Redirect URIs.
    redirectUri:
      typeof window !== "undefined"
        ? window.location.origin + import.meta.env.BASE_URL
        : "/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};

/** Domain yang diizinkan login. Dipakai untuk UX (ForbiddenScreen);
 *  boundary keamanan sebenarnya ada di server (server/src/auth.ts). */
export const ALLOWED_DOMAINS = ["@mahasiswa.itb.ac.id"];
