/**
 * Username normalization, Turkish validation, and browser credential storage helpers.
 */

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsernameFormat(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = normalizeUsername(raw);

  if (!normalized) {
    return { valid: true, normalized: '' };
  }

  if (normalized.length < 3) {
    return {
      valid: false,
      normalized,
      error: 'Kullanıcı adı en az 3 karakter olmalıdır.',
    };
  }

  if (normalized.length > 24) {
    return {
      valid: false,
      normalized,
      error: 'Kullanıcı adı en fazla 24 karakter olabilir.',
    };
  }

  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        'Kullanıcı adı yalnızca küçük harf (a-z), rakam (0-9), nokta (.), alt çizgi (_) ve tire (-) içerebilir.',
    };
  }

  if (normalized.startsWith('.') || normalized.endsWith('.') || normalized.includes('..')) {
    return {
      valid: false,
      normalized,
      error: 'Kullanıcı adı nokta ile başlayıp bitemez ve arka arkaya iki nokta içeremez.',
    };
  }

  return { valid: true, normalized };
}

export function isPasswordCredentialSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'PasswordCredential' in window && !!navigator.credentials;
}

/**
 * Prompts browser password managers (Chrome / Google Password Manager / Android Autofill)
 * to save or update login credentials when supported.
 */
export async function storeBrowserCredential(
  id: string,
  password: string,
  displayName?: string
): Promise<void> {
  if (typeof window === 'undefined' || !id || !password) return;
  try {
    const win = window as unknown as {
      PasswordCredential?: new (data: {
        id: string;
        password: string;
        name?: string;
      }) => Credential;
    };
    if (win.PasswordCredential && navigator.credentials?.store) {
      const cred = new win.PasswordCredential({
        id: id.trim(),
        password,
        name: displayName?.trim() || id.trim(),
      });
      await navigator.credentials.store(cred);
    }
  } catch {
    // Browser may block or skip depending on user preferences; ignore silently
  }
}

/**
 * Retrieves saved credentials from browser / Google Password Manager when supported.
 */
export async function getSavedBrowserCredential(
  mediation: 'silent' | 'optional' | 'required' = 'optional'
): Promise<{ id: string; password: string } | null> {
  if (typeof window === 'undefined') return null;
  try {
    if (!('PasswordCredential' in window) || !navigator.credentials?.get) {
      return null;
    }
    const cred = (await navigator.credentials.get({
      password: true,
      mediation,
    } as CredentialRequestOptions)) as (Credential & { id?: string; password?: string; type?: string }) | null;

    if (cred && cred.id && typeof cred.password === 'string' && cred.password.length > 0) {
      return { id: cred.id, password: cred.password };
    }
    return null;
  } catch {
    return null;
  }
}
