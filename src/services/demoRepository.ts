import { DEFAULT_CATEGORY_DEFINITIONS, GROUP_TYPE_OPTIONS, THEME_OPTIONS } from '../lib/categories';
import { AppError } from '../lib/errors';
import { createId, createRandomToken } from '../lib/session';
import {
  nicknameKey,
  normalizeRoomCode,
  normalizeSpaces,
  validateAccessCode,
  validateCustomCategory,
  validateNickname,
  validateRoomName,
} from '../lib/validation';
import type {
  AuthenticatedSession,
  Category,
  CreateRoomInput,
  GameRepository,
  Participant,
  ParticipantProgress,
  ResultsData,
  Room,
  RoomPreview,
  RoomStatus,
  SessionData,
  UpdateRoomInput,
} from '../types/game';
import {
  calculateCategoryResults,
  countCompletedVoters,
  countTotalVoters,
  type VoteLike,
} from '../features/results/calculateResults';

const STORAGE_KEY = 'resenha-secreta:demo:v1';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PARTICIPANTS = 80;

interface SimpleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface DemoParticipant extends Participant {
  token: string;
  nicknameKey: string;
}

interface DemoVote extends VoteLike {
  createdAt: string;
}

interface DemoRoom {
  id: string;
  code: string;
  name: string;
  organizerName: string;
  groupType: CreateRoomInput['groupType'];
  customGroupType: string | null;
  theme: CreateRoomInput['theme'];
  status: RoomStatus;
  visibility: CreateRoomInput['visibility'];
  accessCode: string | null;
  revealAt: string | null;
  allowLateJoin: boolean;
  allowVoteChange: boolean;
  categories: Category[];
  participants: DemoParticipant[];
  votes: DemoVote[];
  createdAt: string;
  votingStartedAt: string | null;
  votingClosedAt: string | null;
  revealedAt: string | null;
}

type DemoDatabase = Record<string, DemoRoom>;

function createMemoryStorage(): SimpleStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function defaultStorage(): SimpleStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Modo privado sem storage: mantém apenas em memória.
  }
  return createMemoryStorage();
}

function randomCode(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

function customCategoryFromInput(
  input: { name: string; description: string },
  position: number,
): Category {
  return {
    id: createId(),
    slug: null,
    name: normalizeSpaces(input.name),
    description: normalizeSpaces(input.description),
    icon: 'sparkles',
    votingRule: 'Escolha uma pessoa do grupo — menos você mesmo.',
    isCustom: true,
    position,
  };
}

function buildRoomCategories(input: CreateRoomInput): Category[] {
  const uniqueSlugs = Array.from(new Set(input.categorySlugs));
  if (uniqueSlugs.length === 0) throw new AppError('NOT_ENOUGH_CATEGORIES');
  if (uniqueSlugs.length > DEFAULT_CATEGORY_DEFINITIONS.length) throw new AppError('INVALID_CATEGORY');

  const categories: Category[] = uniqueSlugs.map((slug, index) => {
    const definition = DEFAULT_CATEGORY_DEFINITIONS.find((item) => item.slug === slug);
    if (!definition) throw new AppError('INVALID_CATEGORY');
    return {
      id: `default:${definition.slug}`,
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      votingRule: 'Escolha uma pessoa do grupo — menos você mesmo.',
      isCustom: false,
      position: index,
    };
  });

  if (input.customCategories.length > 6) {
    throw new AppError('INVALID_INPUT', 'Você pode criar no máximo 6 categorias personalizadas.');
  }

  const existingNames = new Set(categories.map((category) => nicknameKey(category.name)));
  input.customCategories.forEach((custom, index) => {
    const validation = validateCustomCategory(custom.name, custom.description);
    if (!validation.valid) throw new AppError('INVALID_INPUT', validation.error ?? undefined);
    const key = nicknameKey(custom.name);
    if (existingNames.has(key)) {
      throw new AppError('INVALID_INPUT', 'Já existe uma categoria com esse nome.');
    }
    existingNames.add(key);
    categories.push(customCategoryFromInput(custom, categories.length + index));
  });

  return categories;
}

function validateCreateInput(input: CreateRoomInput): void {
  const roomValidation = validateRoomName(input.name);
  if (!roomValidation.valid) throw new AppError('INVALID_INPUT', roomValidation.error ?? undefined);

  const nicknameValidation = validateNickname(input.organizerName);
  if (!nicknameValidation.valid) {
    throw new AppError('INVALID_INPUT', nicknameValidation.error ?? undefined);
  }

  if (!GROUP_TYPE_OPTIONS.some((option) => option.value === input.groupType)) {
    throw new AppError('INVALID_INPUT', 'Escolha um tipo de grupo válido.');
  }
  if (input.groupType === 'personalizado') {
    const customType = normalizeSpaces(input.customGroupType ?? '');
    if (customType.length < 3 || customType.length > 30) {
      throw new AppError('INVALID_INPUT', 'Dê um nome de 3 a 30 caracteres para o grupo.');
    }
  }
  if (!THEME_OPTIONS.some((option) => option.value === input.theme)) {
    throw new AppError('INVALID_INPUT', 'Escolha um tema válido.');
  }
  if (input.visibility !== 'link' && input.visibility !== 'code') {
    throw new AppError('INVALID_INPUT', 'Escolha uma regra de acesso válida.');
  }
  if (input.visibility === 'code') {
    const codeValidation = validateAccessCode(input.accessCode ?? '');
    if (!codeValidation.valid) throw new AppError('ACCESS_CODE_REQUIRED');
  }
  if (input.revealAt) {
    const date = new Date(input.revealAt);
    if (Number.isNaN(date.getTime())) throw new AppError('INVALID_INPUT', 'Data de revelação inválida.');
  }
}

export class DemoRepository implements GameRepository {
  readonly mode = 'demo' as const;
  private readonly storage: SimpleStorage;

  constructor(storage?: SimpleStorage) {
    this.storage = storage ?? defaultStorage();
  }

  private readDatabase(): DemoDatabase {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return parsed as DemoDatabase;
    } catch {
      return {};
    }
  }

  private writeDatabase(database: DemoDatabase): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch {
      throw new AppError(
        'UNKNOWN',
        'Não foi possível salvar os dados locais. Verifique o espaço do navegador.',
      );
    }
  }

  private notify(code: string): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('resenha:demo-change', { detail: { code } }));
  }

  private findRoom(database: DemoDatabase, code: string): DemoRoom {
    const room = database[normalizeRoomCode(code)];
    if (!room) throw new AppError('ROOM_NOT_FOUND');
    return room;
  }

  private assertParticipant(room: DemoRoom, token: string): DemoParticipant {
    const participant = room.participants.find((item) => item.token === token);
    if (!participant) throw new AppError('UNAUTHORIZED');
    return participant;
  }

  private assertOrganizer(room: DemoRoom, token: string): DemoParticipant {
    const participant = this.assertParticipant(room, token);
    if (participant.role !== 'organizer') throw new AppError('UNAUTHORIZED');
    return participant;
  }

  private buildRoom(room: DemoRoom): Room {
    const totalCategories = room.categories.length;
    const started = new Set(room.votes.map((vote) => vote.voterId)).size;
    const completed = countCompletedVoters(room.votes, totalCategories);
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      organizerName: room.organizerName,
      groupType: room.groupType,
      customGroupType: room.customGroupType,
      theme: room.theme,
      status: room.status,
      visibility: room.visibility,
      hasAccessCode: Boolean(room.accessCode),
      revealAt: room.revealAt,
      allowLateJoin: room.allowLateJoin,
      allowVoteChange: room.allowVoteChange,
      participantCount: room.participants.length,
      categories: room.categories.map((category) => ({ ...category })),
      votingSummary: {
        started,
        completed,
        totalParticipants: room.participants.length,
        totalCategories,
      },
      createdAt: room.createdAt,
      votingStartedAt: room.votingStartedAt,
      votingClosedAt: room.votingClosedAt,
      revealedAt: room.revealedAt,
    };
  }

  private buildSession(room: DemoRoom, participant: DemoParticipant): SessionData {
    const total = room.categories.length;
    const votingProgress: ParticipantProgress[] | null =
      participant.role === 'organizer'
        ? room.participants.map((item) => ({
            participantId: item.id,
            nickname: item.nickname,
            answered: room.votes.filter((vote) => vote.voterId === item.id).length,
            total,
          }))
        : null;

    const myVotes: Record<string, string> = {};
    for (const vote of room.votes) {
      if (vote.voterId === participant.id) myVotes[vote.categoryId] = vote.targetId;
    }

    return {
      room: this.buildRoom(room),
      participant: {
        id: participant.id,
        nickname: participant.nickname,
        role: participant.role,
        joinedAt: participant.joinedAt,
      },
      participants: room.participants.map((item) => ({
        id: item.id,
        nickname: item.nickname,
        role: item.role,
        joinedAt: item.joinedAt,
      })),
      myVotes,
      votingProgress,
    };
  }

  async createRoom(input: CreateRoomInput): Promise<AuthenticatedSession> {
    validateCreateInput(input);
    const database = this.readDatabase();
    let code = randomCode();
    while (database[code]) code = randomCode();

    const now = new Date().toISOString();
    const token = createRandomToken();
    const categories = buildRoomCategories(input);
    const organizer: DemoParticipant = {
      id: createId(),
      nickname: normalizeSpaces(input.organizerName),
      nicknameKey: nicknameKey(input.organizerName),
      role: 'organizer',
      token,
      joinedAt: now,
    };

    const room: DemoRoom = {
      id: createId(),
      code,
      name: normalizeSpaces(input.name),
      organizerName: organizer.nickname,
      groupType: input.groupType,
      customGroupType:
        input.groupType === 'personalizado' ? normalizeSpaces(input.customGroupType ?? '') : null,
      theme: input.theme,
      status: 'lobby',
      visibility: input.visibility,
      accessCode:
        input.visibility === 'code' ? (input.accessCode ?? '').trim().toUpperCase() : null,
      revealAt: input.revealAt || null,
      allowLateJoin: input.allowLateJoin,
      allowVoteChange: input.allowVoteChange,
      categories,
      participants: [organizer],
      votes: [],
      createdAt: now,
      votingStartedAt: null,
      votingClosedAt: null,
      revealedAt: null,
    };

    database[code] = room;
    this.writeDatabase(database);
    this.notify(code);

    return { token, session: this.buildSession(room, organizer) };
  }

  async getRoomPreview(code: string): Promise<RoomPreview> {
    const room = this.findRoom(this.readDatabase(), code);
    return {
      code: room.code,
      name: room.name,
      status: room.status,
      visibility: room.visibility,
      hasAccessCode: Boolean(room.accessCode),
      groupType: room.groupType,
      theme: room.theme,
      participantCount: room.participants.length,
      createdAt: room.createdAt,
    };
  }
  async joinRoom(code: string, nickname: string, accessCode?: string): Promise<AuthenticatedSession> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);

    if (room.status === 'archived') throw new AppError('ROOM_ARCHIVED');
    if (room.status === 'closed' || room.status === 'revealed') throw new AppError('ROOM_CLOSED');
    if (room.status === 'voting' && !room.allowLateJoin) throw new AppError('VOTING_CLOSED');
    if (room.visibility === 'code') {
      if (!accessCode) throw new AppError('ACCESS_CODE_REQUIRED');
      if ((room.accessCode ?? '').toUpperCase() !== accessCode.trim().toUpperCase()) {
        throw new AppError('INVALID_ACCESS_CODE');
      }
    }

    const validation = validateNickname(nickname);
    if (!validation.valid) {
      throw new AppError('INVALID_INPUT', validation.error ?? undefined);
    }
    if (room.participants.length >= MAX_PARTICIPANTS) {
      throw new AppError('INVALID_INPUT', 'Essa resenha atingiu o limite de participantes.');
    }
    const key = nicknameKey(nickname);
    if (room.participants.some((participant) => participant.nicknameKey === key)) {
      throw new AppError('NICKNAME_TAKEN');
    }

    const token = createRandomToken();
    const participant: DemoParticipant = {
      id: createId(),
      nickname: normalizeSpaces(nickname),
      nicknameKey: key,
      role: 'guest',
      token,
      joinedAt: new Date().toISOString(),
    };
    room.participants.push(participant);
    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);

    return { token, session: this.buildSession(room, participant) };
  }

  async getSession(code: string, token: string): Promise<SessionData> {
    const room = this.findRoom(this.readDatabase(), code);
    const participant = this.assertParticipant(room, token);
    return this.buildSession(room, participant);
  }

  async updateRoom(code: string, token: string, input: UpdateRoomInput): Promise<SessionData> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    const organizer = this.assertOrganizer(room, token);
    if (room.status !== 'lobby') throw new AppError('VOTING_NOT_OPEN');

    const roomValidation = validateRoomName(input.name);
    if (!roomValidation.valid) throw new AppError('INVALID_INPUT', roomValidation.error ?? undefined);

    const categories = buildRoomCategories({
      ...input,
      organizerName: organizer.nickname,
      groupType: room.groupType,
      customGroupType: room.customGroupType,
      theme: room.theme,
      visibility: room.visibility,
      accessCode: null,
      revealAt: room.revealAt,
      allowLateJoin: input.allowLateJoin,
      allowVoteChange: input.allowVoteChange,
    });

    room.name = normalizeSpaces(input.name);
    room.categories = categories;
    room.allowLateJoin = input.allowLateJoin;
    room.allowVoteChange = input.allowVoteChange;
    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);
    return this.buildSession(room, organizer);
  }

  async startVoting(code: string, token: string): Promise<SessionData> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    const organizer = this.assertOrganizer(room, token);
    if (room.status !== 'lobby') throw new AppError('VOTING_NOT_OPEN');
    if (room.participants.length < 2) throw new AppError('NOT_ENOUGH_PARTICIPANTS');
    if (room.categories.length < 1) throw new AppError('NOT_ENOUGH_CATEGORIES');

    room.status = 'voting';
    room.votingStartedAt = new Date().toISOString();
    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);
    return this.buildSession(room, organizer);
  }

  async closeVoting(code: string, token: string): Promise<SessionData> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    const organizer = this.assertOrganizer(room, token);
    if (room.status !== 'voting') throw new AppError('VOTING_NOT_OPEN');

    room.status = 'closed';
    room.votingClosedAt = new Date().toISOString();
    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);
    return this.buildSession(room, organizer);
  }

  async revealResults(code: string, token: string): Promise<SessionData> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    const organizer = this.assertOrganizer(room, token);
    if (room.status !== 'closed') throw new AppError('REVEAL_NOT_READY');

    room.status = 'revealed';
    room.revealedAt = new Date().toISOString();
    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);
    return this.buildSession(room, organizer);
  }

  async archiveRoom(code: string, token: string): Promise<SessionData> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    const organizer = this.assertOrganizer(room, token);
    if (room.status !== 'closed' && room.status !== 'revealed') {
      throw new AppError('INVALID_INPUT', 'Encerre a votação antes de arquivar a sala.');
    }

    room.status = 'archived';
    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);
    return this.buildSession(room, organizer);
  }

  async deleteRoom(code: string, token: string): Promise<void> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    this.assertOrganizer(room, token);
    delete database[room.code];
    this.writeDatabase(database);
    this.notify(room.code);
  }

  async submitVote(
    code: string,
    token: string,
    categoryId: string,
    targetId: string,
  ): Promise<SessionData> {
    const database = this.readDatabase();
    const room = this.findRoom(database, code);
    const voter = this.assertParticipant(room, token);
    if (room.status !== 'voting') {
      throw new AppError(room.status === 'closed' || room.status === 'revealed' ? 'VOTING_CLOSED' : 'VOTING_NOT_OPEN');
    }
    if (!room.categories.some((category) => category.id === categoryId)) {
      throw new AppError('INVALID_CATEGORY');
    }
    if (!room.participants.some((participant) => participant.id === targetId)) {
      throw new AppError('INVALID_TARGET');
    }
    if (targetId === voter.id) throw new AppError('SELF_VOTE');

    const existing = room.votes.find(
      (vote) => vote.voterId === voter.id && vote.categoryId === categoryId,
    );
    if (existing) {
      if (!room.allowVoteChange) throw new AppError('DUPLICATE_VOTE');
      existing.targetId = targetId;
      existing.createdAt = new Date().toISOString();
    } else {
      room.votes.push({
        categoryId,
        voterId: voter.id,
        targetId,
        createdAt: new Date().toISOString(),
      });
    }

    database[room.code] = room;
    this.writeDatabase(database);
    this.notify(room.code);
    return this.buildSession(room, voter);
  }

  async getResults(code: string, token: string): Promise<ResultsData> {
    const room = this.findRoom(this.readDatabase(), code);
    this.assertParticipant(room, token);
    if (room.status !== 'revealed' && room.status !== 'archived') {
      throw new AppError('REVEAL_NOT_READY');
    }
    return this.buildResults(room);
  }

  async getPublicResults(code: string): Promise<ResultsData> {
    const room = this.findRoom(this.readDatabase(), code);
    if (room.status !== 'revealed' && room.status !== 'archived') {
      throw new AppError('REVEAL_NOT_READY');
    }
    return this.buildResults(room);
  }

  private buildResults(room: DemoRoom): ResultsData {
    const participants = room.participants.map((item) => ({
      id: item.id,
      nickname: item.nickname,
      role: item.role,
      joinedAt: item.joinedAt,
    }));

    return {
      room: this.buildRoom(room),
      categories: calculateCategoryResults(room.categories, room.votes, participants),
      totalVoters: countTotalVoters(room.votes),
      totalParticipants: room.participants.length,
    };
  }
}
