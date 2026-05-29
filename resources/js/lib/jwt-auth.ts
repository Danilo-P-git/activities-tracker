import axios from 'axios';

const TOKEN_STORAGE_KEY = 'api_token';
const TOKEN_COOKIE_NAME = 'jwt_token';

function secureCookieSuffix() {
    return window.location.protocol === 'https:' ? '; Secure' : '';
}

export function getJwtToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function applyJwtToken(token: string | null): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax${secureCookieSuffix()}`;

        return;
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;
    document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secureCookieSuffix()}`;
}

export function bootstrapJwtAuth(): void {
    const token = getJwtToken();

    if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common.Authorization;
    }
}

export async function logoutWithJwt(): Promise<void> {
    const token = getJwtToken();

    try {
        await axios.post(
            '/api/auth/logout',
            {},
            token
                ? {
                      headers: {
                          Authorization: `Bearer ${token}`,
                      },
                  }
                : undefined,
        );
    } catch {
        // A missing or expired token is equivalent to being logged out.
    }

    applyJwtToken(null);
}
