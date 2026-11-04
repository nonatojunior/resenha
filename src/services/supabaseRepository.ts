import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError, toAppError } from '../lib/errors';
import type {
  AuthenticatedSession,
  CreateRoomInput,
  GameRepository,
  ResultsData,
  RoomPreview,
  SessionData,
  UpdateRoomInput,
} from '../types/game';

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('UNKNOWN', `Resposta inesperada do servidor (${context}).`);
  }
  return value as Record<string, unknown>;
}

function parseSession(data: unknown): SessionData {
  const record = asRecord(data, 'sessão');
  if (!record.room || !record.participant) {
    throw new AppError('UNKNOWN', 'Sessão inválida retornada pelo servidor.');
  }
  return record as unknown as SessionData;
}

function parseAuthenticatedSession(data: unknown): AuthenticatedSession {
  const record = asRecord(data, 'entrada na sala');
  if (typeof record.token !== 'string' || !record.token) {
    throw new AppError('UNKNOWN', 'Token de sessão não retornado pelo servidor.');
  }
  return { token: record.token, session: parseSession(record.session) };
}

function parseResults(data: unknown): ResultsData {
  const record = asRecord(data, 'resultados');
  if (!record.room || !Array.isArray(record.categories)) {
    throw new AppError('UNKNOWN', 'Resultados inválidos retornados pelo servidor.');
  }
  return record as unknown as ResultsData;
}

function parsePreview(data: unknown): RoomPreview {
  const record = asRecord(data, 'sala');
  if (typeof record.code !== 'string' || typeof record.name !== 'string') {
    throw new AppError('ROOM_NOT_FOUND');
  }
  return record as unknown as RoomPreview;
}

/** Repositório real: todas as operações passam por RPCs validadas + RLS sem acesso direto às tabelas. */
export class SupabaseRepository implements GameRepository {
  readonly mode = 'supabase' as const;
  private readonly client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  private async call<T>(fn: string, params: Record<string, unknown>): Promise<T> {
    try {
      const { data, error } = await this.client.rpc(fn, params);
      if (error) throw toAppError(error);
      return data as T;
    } catch (error) {
      throw toAppError(error);
    }
  }

  async createRoom(input: CreateRoomInput): Promise<AuthenticatedSession> {
    const data = await this.call<unknown>('create_room', {
      p_name: input.name,
      p_organizer_name: input.organizerName,
      p_group_type: input.groupType,
      p_custom_group_type: input.customGroupType ?? null,
      p_theme: input.theme,
      p_visibility: input.visibility,
      p_access_code: input.visibility === 'code' ? (input.accessCode ?? '') : null,
      p_reveal_at: input.revealAt ?? null,
      p_category_slugs: input.categorySlugs,
      p_custom_categories: input.customCategories,
      p_allow_late_join: input.allowLateJoin,
      p_allow_vote_change: input.allowVoteChange,
    });
    return parseAuthenticatedSession(data);
  }

  async getRoomPreview(code: string): Promise<RoomPreview> {
    const data = await this.call<unknown>('get_room_preview', { p_code: code });
    return parsePreview(data);
  }

  async joinRoom(code: string, nickname: string, accessCode?: string): Promise<AuthenticatedSession> {
    const data = await this.call<unknown>('join_room', {
      p_code: code,
      p_nickname: nickname,
      p_access_code: accessCode ?? null,
    });
    return parseAuthenticatedSession(data);
  }

  async getSession(code: string, token: string): Promise<SessionData> {
    const data = await this.call<unknown>('get_session', { p_code: code, p_token: token });
    return parseSession(data);
  }

  async updateRoom(code: string, token: string, input: UpdateRoomInput): Promise<SessionData> {
    const data = await this.call<unknown>('update_room', {
      p_code: code,
      p_token: token,
      p_name: input.name,
      p_category_slugs: input.categorySlugs,
      p_custom_categories: input.customCategories,
      p_allow_late_join: input.allowLateJoin,
      p_allow_vote_change: input.allowVoteChange,
    });
    return parseSession(data);
  }

  async startVoting(code: string, token: string): Promise<SessionData> {
    return parseSession(await this.call<unknown>('start_voting', { p_code: code, p_token: token }));
  }

  async closeVoting(code: string, token: string): Promise<SessionData> {
    return parseSession(await this.call<unknown>('close_voting', { p_code: code, p_token: token }));
  }

  async revealResults(code: string, token: string): Promise<SessionData> {
    return parseSession(await this.call<unknown>('reveal_results', { p_code: code, p_token: token }));
  }

  async archiveRoom(code: string, token: string): Promise<SessionData> {
    return parseSession(await this.call<unknown>('archive_room', { p_code: code, p_token: token }));
  }

  async deleteRoom(code: string, token: string): Promise<void> {
    await this.call<unknown>('delete_room', { p_code: code, p_token: token });
  }

  async submitVote(
    code: string,
    token: string,
    categoryId: string,
    targetId: string,
  ): Promise<SessionData> {
    return parseSession(
      await this.call<unknown>('submit_vote', {
        p_code: code,
        p_token: token,
        p_category_id: categoryId,
        p_target_id: targetId,
      }),
    );
  }

  async getResults(code: string, token: string): Promise<ResultsData> {
    return parseResults(await this.call<unknown>('get_results', { p_code: code, p_token: token }));
  }

  async getPublicResults(code: string): Promise<ResultsData> {
    return parseResults(await this.call<unknown>('get_public_results', { p_code: code }));
  }
}
