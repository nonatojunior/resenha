import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/lib/errors';
import { saveSessionToken } from '../src/lib/session';
import type { Room, RoomPreview, SessionData } from '../src/types/game';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getRoomPreview: vi.fn(),
}));

vi.mock('../src/services', () => ({
  getRepository: () => ({
    getSession: mocks.getSession,
    getRoomPreview: mocks.getRoomPreview,
  }),
}));

import { useRoomSession } from '../src/hooks/useRoomSession';

const joinedAt = '2026-10-26T12:00:00.000Z';

const room: Room = {
  id: 'room-1',
  code: 'ABC123',
  name: 'Resenha de Teste',
  organizerName: 'Ana',
  groupType: 'amigos',
  customGroupType: null,
  theme: 'livre',
  status: 'voting',
  visibility: 'link',
  hasAccessCode: false,
  revealAt: null,
  allowLateJoin: true,
  allowVoteChange: false,
  participantCount: 2,
  categories: [],
  votingSummary: {
    started: 1,
    completed: 0,
    totalParticipants: 2,
    totalCategories: 2,
  },
  createdAt: joinedAt,
  votingStartedAt: joinedAt,
  votingClosedAt: null,
  revealedAt: null,
};

const session: SessionData = {
  room,
  participant: { id: 'p1', nickname: 'Ana', role: 'organizer', joinedAt },
  participants: [{ id: 'p1', nickname: 'Ana', role: 'organizer', joinedAt }],
  myVotes: {},
  votingProgress: null,
};

const preview: RoomPreview = {
  code: 'ABC123',
  name: 'Resenha de Teste',
  status: 'voting',
  visibility: 'link',
  hasAccessCode: false,
  groupType: 'amigos',
  theme: 'livre',
  participantCount: 2,
  createdAt: joinedAt,
};

describe('useRoomSession', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.getRoomPreview.mockReset();
  });

  it('mantém a sessão carregada quando o polling falha de forma silenciosa', async () => {
    saveSessionToken('ABC123', 'token-valido');
    mocks.getSession.mockResolvedValue(session);

    const { result } = renderHook(() => useRoomSession('ABC123'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.session).toEqual(session);

    mocks.getSession.mockRejectedValue(new AppError('NETWORK_ERROR'));
    await act(async () => {
      await result.current.refresh(true);
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.session).toEqual(session);
    expect(result.current.error).toBeNull();
  });

  it('mostra erro amigável quando a carga inicial falha', async () => {
    saveSessionToken('ABC123', 'token-valido');
    mocks.getSession.mockRejectedValue(new AppError('NETWORK_ERROR'));

    const { result } = renderHook(() => useRoomSession('ABC123'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/conexão deu uma cochilada/i);
    expect(result.current.session).toBeNull();
  });

  it('descarta o token inválido e volta para a entrada da sala', async () => {
    saveSessionToken('ABC123', 'token-invalido');
    mocks.getSession.mockRejectedValue(new AppError('UNAUTHORIZED'));
    mocks.getRoomPreview.mockResolvedValue(preview);

    const { result } = renderHook(() => useRoomSession('ABC123'));

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.preview).toEqual(preview);
    expect(result.current.token).toBeNull();
  });

  it('marca código inválido como sala não encontrada', async () => {
    const { result } = renderHook(() => useRoomSession(''));

    await waitFor(() => expect(result.current.status).toBe('not-found'));
    expect(result.current.error).toBe('Código da sala inválido.');
  });
});
