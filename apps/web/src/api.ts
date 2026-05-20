import type {
  AuthMode,
  AuthResult,
  PublicUser,
  QrChallengeDto
} from "@login-practice/shared";

let jwtToken: string | null = localStorage.getItem("login-practice-jwt");

export function getStoredToken() {
  return jwtToken;
}

export function setStoredToken(token: string | null) {
  jwtToken = token;
  if (token) {
    localStorage.setItem("login-practice-jwt", token);
  } else {
    localStorage.removeItem("login-practice-jwt");
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (jwtToken) {
    headers.set("Authorization", `Bearer ${jwtToken}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "include"
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  register(input: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) {
    return apiFetch<{ user: PublicUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  loginPassword(input: { email: string; password: string; mode: AuthMode }) {
    return apiFetch<AuthResult>("/auth/login/password", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  requestSms(input: { phone: string }) {
    return apiFetch<{ ok: boolean; devCode?: string; expiresInSeconds: number }>(
      "/auth/login/sms/request-code",
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );
  },
  verifySms(input: { phone: string; code: string; mode: AuthMode }) {
    return apiFetch<AuthResult>("/auth/login/sms/verify", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  logout() {
    return apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
  },
  me() {
    return apiFetch<{ user: PublicUser }>("/auth/me");
  },
  createQrChallenge(mode: AuthMode) {
    return apiFetch<QrChallengeDto>("/auth/qr/challenges", {
      method: "POST",
      body: JSON.stringify({ mode })
    });
  },
  getQrChallenge(id: string) {
    return apiFetch<QrChallengeDto>(`/auth/qr/challenges/${id}`);
  },
  scanQrChallenge(id: string) {
    return apiFetch<QrChallengeDto>(`/auth/qr/challenges/${id}/scan`, {
      method: "POST",
      body: JSON.stringify({})
    });
  },
  confirmQrChallenge(id: string, input: { email?: string; password?: string }) {
    return apiFetch<QrChallengeDto>(`/auth/qr/challenges/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  rejectQrChallenge(id: string) {
    return apiFetch<QrChallengeDto>(`/auth/qr/challenges/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }
};
