import { describe, expect, it } from 'vitest';
import {
  isValidHexColor,
  isValidIsoDate,
  nicknameKey,
  normalizeRoomCode,
  normalizeSpaces,
  validateAccessCode,
  validateCustomCategory,
  validateNickname,
  validateRoomName,
} from '../src/lib/validation';

describe('normalização', () => {
  it('remove espaços duplicados e das pontas', () => {
    expect(normalizeSpaces('  Resenha   da   firma  ')).toBe('Resenha da firma');
  });

  it('normaliza códigos de sala para letras e números maiúsculos', () => {
    expect(normalizeRoomCode(' ab-c 12 3 ')).toBe('ABC123');
    expect(normalizeRoomCode('abc123')).toBe('ABC123');
  });

  it('cria a mesma chave para apelidos com acento, caixa e espaços diferentes', () => {
    expect(nicknameKey('  José  Silva ')).toBe('jose silva');
    expect(nicknameKey('JOSE SILVA')).toBe('jose silva');
    expect(nicknameKey('João')).toBe('joao');
  });
});

describe('validateNickname', () => {
  it('aceita apelidos válidos', () => {
    expect(validateNickname('Ana').valid).toBe(true);
    expect(validateNickname('Bia_23').valid).toBe(true);
    expect(validateNickname('Zé do Rolê').valid).toBe(true);
  });

  it('rejeita apelidos curtos, longos ou sem letras', () => {
    expect(validateNickname('A').error).toMatch(/pelo menos 2/);
    expect(validateNickname('a'.repeat(25)).error).toMatch(/no máximo 24/);
    expect(validateNickname('1234').error).toMatch(/pelo menos uma letra/);
  });

  it('rejeita símbolos não permitidos', () => {
    expect(validateNickname('Ana <3').valid).toBe(false);
    expect(validateNickname('ana@casa').valid).toBe(false);
  });
});

describe('validateRoomName', () => {
  it('exige de 3 a 60 caracteres', () => {
    expect(validateRoomName('Oi').valid).toBe(false);
    expect(validateRoomName('Sala').valid).toBe(true);
    expect(validateRoomName('x'.repeat(61)).valid).toBe(false);
  });
});

describe('validateAccessCode', () => {
  it('exige de 4 a 16 letras e números', () => {
    expect(validateAccessCode('abc').valid).toBe(false);
    expect(validateAccessCode('AB12').valid).toBe(true);
    expect(validateAccessCode('AB 12').valid).toBe(false);
    expect(validateAccessCode('A'.repeat(17)).valid).toBe(false);
  });
});

describe('validateCustomCategory', () => {
  it('valida nome e descrição', () => {
    expect(validateCustomCategory('Rei do Churrasco', 'Quem domina a grelha.').valid).toBe(true);
    expect(validateCustomCategory('Oi', 'Descrição válida.').valid).toBe(false);
    expect(validateCustomCategory('Categoria', 'curt').valid).toBe(false);
    expect(validateCustomCategory('Categoria', 'x'.repeat(121)).valid).toBe(false);
  });
});

describe('utilitários', () => {
  it('valida cores hexadecimais de seis dígitos', () => {
    expect(isValidHexColor('#7C3AED')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(false);
    expect(isValidHexColor('purple')).toBe(false);
  });

  it('aceita data vazia ou ISO válida e rejeita data inválida', () => {
    expect(isValidIsoDate('')).toBe(true);
    expect(isValidIsoDate('2026-12-31T20:00:00.000Z')).toBe(true);
    expect(isValidIsoDate('não é data')).toBe(false);
  });
});
