import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage, isAppError } from '../lib/errors';
import { normalizeRoomCode } from '../lib/validation';
import { clearSessionToken, getSessionToken, saveSessionToken } from '../lib/session';
import { getRepository } from '../services';
import type { AuthenticatedSession, RoomPreview, SessionData } from '../types/game';

export type RoomSessionStatus = 'loading' | 'ready' | 'unauthenticated' | 'not-found' | 'error';

interface RoomSessionState {
  status: RoomSessionStatus;
  session: SessionData | null;
  preview: RoomPreview | null;
  error: string | null;
  token: string | null;
}

const initialState: RoomSessionState = {
  status: 'loading',
  session: null,
  preview: null,
  error: null,
  token: null,
};

export interface UseRoomSessionResult extends RoomSessionState {
  authenticate: (auth: AuthenticatedSession) => void;
  updateSession: (session: SessionData) => void;
  refresh: (silent?: boolean) => Promise<void>;
  retry: () => Promise<void>;
  signOut: () => void;
}

export function useRoomSession(rawCode: string | undefined): UseRoomSessionResult {
  const code = normalizeRoomCode(rawCode ?? '');
  const [state, setState] = useState<RoomSessionState>(() => ({
    ...initialState,
    token: code ? getSessionToken(code) : null,
  }));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPreview = useCallback(async () => {
    const preview = await getRepository().getRoomPreview(code);
    if (mountedRef.current) {
      setState((current) => ({
        ...current,
        status: 'unauthenticated',
        preview,
        session: null,
        error: null,
      }));
    }
  }, [code]);

  const load = useCallback(
    async (silent = false) => {
      if (!code) {
        setState((current) => ({
          ...current,
          status: 'not-found',
          error: 'Código da sala inválido.',
        }));
        return;
      }

      const token = state.token;
      if (!token) {
        if (!silent) setState((current) => ({ ...current, status: 'loading', error: null }));
        try {
          await fetchPreview();
        } catch (error) {
          if (!mountedRef.current) return;
          if (isAppError(error) && error.code === 'ROOM_NOT_FOUND') {
            setState((current) => ({
              ...current,
              status: 'not-found',
              error: error.message,
            }));
          } else if (silent) {
            // Uma falha passageira no polling não deve apagar a tela já carregada.
            setState((current) =>
              current.preview
                ? current
                : { ...current, status: 'error', error: getErrorMessage(error) },
            );
          } else {
            setState((current) => ({
              ...current,
              status: 'error',
              error: getErrorMessage(error),
            }));
          }
        }
        return;
      }

      if (!silent) setState((current) => ({ ...current, status: 'loading', error: null }));
      try {
        const session = await getRepository().getSession(code, token);
        if (!mountedRef.current) return;
        setState((current) => ({
          ...current,
          status: 'ready',
          session,
          preview: null,
          error: null,
        }));
      } catch (error) {
        if (!mountedRef.current) return;
        if (isAppError(error) && error.code === 'UNAUTHORIZED') {
          clearSessionToken(code);
          setState((current) => ({
            ...current,
            status: 'unauthenticated',
            session: null,
            token: null,
            error: null,
          }));
          try {
            await fetchPreview();
          } catch (previewError) {
            if (!mountedRef.current) return;
            if (isAppError(previewError) && previewError.code === 'ROOM_NOT_FOUND') {
              setState((current) => ({ ...current, status: 'not-found', error: previewError.message }));
            } else {
              setState((current) => ({ ...current, status: 'error', error: getErrorMessage(previewError) }));
            }
          }
          return;
        }
        if (isAppError(error) && error.code === 'ROOM_NOT_FOUND') {
          setState((current) => ({
            ...current,
            status: 'not-found',
            error: error.message,
          }));
          return;
        }
        if (silent) {
          // Mantém a última sessão válida enquanto a conexão se recupera.
          setState((current) =>
            current.session
              ? current
              : { ...current, status: 'error', error: getErrorMessage(error) },
          );
          return;
        }
        setState((current) => ({
          ...current,
          status: 'error',
          error: getErrorMessage(error),
        }));
      }
    },
    [code, fetchPreview, state.token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const authenticate = useCallback(
    (auth: AuthenticatedSession) => {
      saveSessionToken(auth.session.room.code, auth.token);
      setState({
        status: 'ready',
        session: auth.session,
        preview: null,
        error: null,
        token: auth.token,
      });
    },
    [],
  );

  const updateSession = useCallback((session: SessionData) => {
    setState((current) => ({ ...current, session, status: 'ready', error: null }));
  }, []);

  const refresh = useCallback(
    async (silent = true) => {
      await load(silent);
    },
    [load],
  );

  const retry = useCallback(async () => {
    await load(false);
  }, [load]);

  const signOut = useCallback(() => {
    if (code) clearSessionToken(code);
    setState((current) => ({ ...current, status: 'unauthenticated', session: null, token: null }));
    void fetchPreview();
  }, [code, fetchPreview]);

  return {
    ...state,
    authenticate,
    updateSession,
    refresh,
    retry,
    signOut,
  };
}
