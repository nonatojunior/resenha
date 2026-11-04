import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatPercent,
  initials,
  pluralize,
  toDateTimeInputValue,
} from '../src/lib/format';

describe('formatação em pt-BR', () => {
  it('formata data e hora', () => {
    expect(formatDateTime('2026-10-26T15:30:00')).toBe('26/10/2026, 15:30');
  });

  it('formata data por extenso', () => {
    expect(formatDate('2026-10-26T12:00:00')).toBe('26 de outubro de 2026');
  });

  it('retorna vazio para valores ausentes ou inválidos', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('data inválida')).toBe('');
    expect(formatDateTime(undefined)).toBe('');
  });

  it('formata percentuais com no máximo uma casa decimal', () => {
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(33.3)).toBe('33,3%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('pluraliza corretamente', () => {
    expect(pluralize(1, 'voto', 'votos')).toBe('voto');
    expect(pluralize(2, 'voto', 'votos')).toBe('votos');
  });

  it('gera iniciais para avatares', () => {
    expect(initials('Ana')).toBe('AN');
    expect(initials('Ana Maria Silva')).toBe('AS');
    expect(initials('   ')).toBe('?');
  });

  it('converte ISO para o formato de input datetime-local', () => {
    expect(toDateTimeInputValue('2026-10-26T15:30:00')).toBe('2026-10-26T15:30');
    expect(toDateTimeInputValue(null)).toBe('');
  });
});
