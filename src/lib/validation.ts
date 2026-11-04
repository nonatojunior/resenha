export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const ok: ValidationResult = { valid: true, error: null };

function fail(error: string): ValidationResult {
  return { valid: false, error };
}

export function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Normaliza apelidos para detectar duplicatas com acentos, caixa e espaços diferentes. */
export function nicknameKey(value: string): string {
  return normalizeSpaces(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function validateNickname(value: string): ValidationResult {
  const nickname = normalizeSpaces(value);
  if (nickname.length < 2) return fail('O apelido precisa ter pelo menos 2 caracteres.');
  if (nickname.length > 24) return fail('O apelido pode ter no máximo 24 caracteres.');
  if (!/^[\p{L}\p{N} ._-]+$/u.test(nickname)) {
    return fail('Use apenas letras, números, espaços, ponto, hífen ou underline.');
  }
  if (!/\p{L}/u.test(nickname)) return fail('O apelido precisa ter pelo menos uma letra.');
  return ok;
}

export function validateRoomName(value: string): ValidationResult {
  const name = normalizeSpaces(value);
  if (name.length < 3) return fail('O nome da resenha precisa ter pelo menos 3 caracteres.');
  if (name.length > 60) return fail('O nome da resenha pode ter no máximo 60 caracteres.');
  return ok;
}

export function validateAccessCode(value: string): ValidationResult {
  const code = value.trim();
  if (code.length < 4) return fail('O código de acesso precisa ter pelo menos 4 caracteres.');
  if (code.length > 16) return fail('O código de acesso pode ter no máximo 16 caracteres.');
  if (!/^[A-Za-z0-9]+$/.test(code)) return fail('Use apenas letras e números no código de acesso.');
  return ok;
}

export function validateCustomCategory(name: string, description: string): ValidationResult {
  const categoryName = normalizeSpaces(name);
  const categoryDescription = normalizeSpaces(description);
  if (categoryName.length < 3) return fail('A categoria precisa ter um nome com pelo menos 3 caracteres.');
  if (categoryName.length > 40) return fail('O nome da categoria pode ter no máximo 40 caracteres.');
  if (categoryDescription.length < 5) {
    return fail('Escreva uma descrição curta com pelo menos 5 caracteres.');
  }
  if (categoryDescription.length > 120) {
    return fail('A descrição da categoria pode ter no máximo 120 caracteres.');
  }
  return ok;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function isValidIsoDate(value: string): boolean {
  if (!value) return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}
