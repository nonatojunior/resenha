const SESSION_PREFIX = 'resenha-secreta:session:';

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveSessionToken(code: string, token: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(`${SESSION_PREFIX}${code.toUpperCase()}`, token);
  } catch {
    // Sem persistência: o participante ainda pode usar a sala enquanto a aba estiver aberta.
  }
}

export function getSessionToken(code: string): string | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    return storage.getItem(`${SESSION_PREFIX}${code.toUpperCase()}`);
  } catch {
    return null;
  }
}

export function clearSessionToken(code: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(`${SESSION_PREFIX}${code.toUpperCase()}`);
  } catch {
    // Ignora indisponibilidade do storage.
  }
}

export function createRandomToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let index = 0; index < array.length; index += 1) {
      array[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${createRandomToken(8)}`;
}
