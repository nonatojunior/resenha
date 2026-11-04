import { describe, expect, it } from 'vitest';
import { AppError, getErrorMessage, isAppError, toAppError } from '../src/lib/errors';

describe('AppError', () => {
  it('usa a mensagem amigável padrão do código', () => {
    const error = new AppError('SELF_VOTE');

    expect(error.name).toBe('AppError');
    expect(error.code).toBe('SELF_VOTE');
    expect(error.message).toMatch(/autoestima/i);
    expect(isAppError(error)).toBe(true);
  });

  it('aceita uma mensagem específica sem perder o código', () => {
    const error = new AppError('INVALID_INPUT', 'Mensagem específica.');

    expect(error.code).toBe('INVALID_INPUT');
    expect(error.message).toBe('Mensagem específica.');
  });
});

describe('getErrorMessage', () => {
  it('prioriza a mensagem de AppError', () => {
    expect(getErrorMessage(new AppError('ROOM_CLOSED'))).toMatch(/encerrada/i);
  });

  it('usa a mensagem de um Error comum', () => {
    expect(getErrorMessage(new Error('Falha inesperada'))).toBe('Falha inesperada');
  });

  it('usa o fallback para valores desconhecidos', () => {
    expect(getErrorMessage(null)).toMatch(/Algo deu errado/);
    expect(getErrorMessage('texto')).toMatch(/Algo deu errado/);
  });
});

describe('toAppError', () => {
  it('mantém a mesma instância de AppError', () => {
    const error = new AppError('VOTING_CLOSED');
    expect(toAppError(error)).toBe(error);
  });

  it('reconhece códigos devolvidos pelo servidor', () => {
    const error = toAppError(new Error('postgres: ROOM_ARCHIVED'));
    expect(error.code).toBe('ROOM_ARCHIVED');
  });

  it('converte falhas de rede em NETWORK_ERROR', () => {
    expect(toAppError(new Error('Failed to fetch')).code).toBe('NETWORK_ERROR');
    expect(toAppError(new Error('NetworkError when attempting to fetch resource.')).code).toBe(
      'NETWORK_ERROR',
    );
    expect(toAppError(new Error('Load failed')).code).toBe('NETWORK_ERROR');
  });

  it('usa UNKNOWN para erros não mapeados', () => {
    expect(toAppError(new Error('algo bizarro')).code).toBe('UNKNOWN');
    expect(toAppError(undefined).code).toBe('UNKNOWN');
  });
});
