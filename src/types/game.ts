export type RoomStatus = 'lobby' | 'voting' | 'closed' | 'revealed' | 'archived';

export type GroupType = 'amigos' | 'familia' | 'trabalho' | 'personalizado';

export type RoomTheme = 'natal' | 'ano-novo' | 'aniversario' | 'confraternizacao' | 'livre';

export type RoomVisibility = 'link' | 'code';

export type ParticipantRole = 'organizer' | 'guest';

export interface Category {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  icon: string;
  votingRule: string;
  isCustom: boolean;
  position?: number;
}

export interface VotingSummary {
  started: number;
  completed: number;
  totalParticipants: number;
  totalCategories: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  organizerName: string;
  groupType: GroupType;
  customGroupType: string | null;
  theme: RoomTheme;
  status: RoomStatus;
  visibility: RoomVisibility;
  hasAccessCode: boolean;
  revealAt: string | null;
  allowLateJoin: boolean;
  allowVoteChange: boolean;
  participantCount: number;
  categories: Category[];
  votingSummary: VotingSummary;
  createdAt: string;
  votingStartedAt: string | null;
  votingClosedAt: string | null;
  revealedAt: string | null;
}

export interface Participant {
  id: string;
  nickname: string;
  role: ParticipantRole;
  joinedAt: string;
}

export interface ParticipantProgress {
  participantId: string;
  nickname: string;
  answered: number;
  total: number;
}

export interface SessionData {
  room: Room;
  participant: Participant;
  participants: Participant[];
  /** Somente os votos do próprio participante: categoria -> participante escolhido. */
  myVotes: Record<string, string>;
  /** Preenchido apenas para o organizador, sem revelar em quem cada pessoa votou. */
  votingProgress: ParticipantProgress[] | null;
}

export interface AuthenticatedSession {
  token: string;
  session: SessionData;
}

export interface RoomPreview {
  code: string;
  name: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  hasAccessCode: boolean;
  groupType: GroupType;
  theme: RoomTheme;
  participantCount: number;
  createdAt: string;
}

export interface CustomCategoryInput {
  name: string;
  description: string;
}

export interface CreateRoomInput {
  name: string;
  organizerName: string;
  groupType: GroupType;
  customGroupType?: string | null;
  theme: RoomTheme;
  visibility: RoomVisibility;
  accessCode?: string | null;
  revealAt?: string | null;
  categorySlugs: string[];
  customCategories: CustomCategoryInput[];
  allowLateJoin: boolean;
  allowVoteChange: boolean;
}

export interface UpdateRoomInput {
  name: string;
  categorySlugs: string[];
  customCategories: CustomCategoryInput[];
  allowLateJoin: boolean;
  allowVoteChange: boolean;
}

export interface ResultWinner {
  participantId: string;
  nickname: string;
  votes: number;
  percentage: number;
}

export interface CategoryResult {
  category: Category;
  totalVotes: number;
  winners: ResultWinner[];
  runnerUps: ResultWinner[];
  tie: boolean;
}

export interface ResultsData {
  room: Room;
  categories: CategoryResult[];
  totalVoters: number;
  totalParticipants: number;
}

export interface GameRepository {
  readonly mode: 'supabase' | 'demo';
  createRoom(input: CreateRoomInput): Promise<AuthenticatedSession>;
  getRoomPreview(code: string): Promise<RoomPreview>;
  joinRoom(code: string, nickname: string, accessCode?: string): Promise<AuthenticatedSession>;
  getSession(code: string, token: string): Promise<SessionData>;
  updateRoom(code: string, token: string, input: UpdateRoomInput): Promise<SessionData>;
  startVoting(code: string, token: string): Promise<SessionData>;
  closeVoting(code: string, token: string): Promise<SessionData>;
  revealResults(code: string, token: string): Promise<SessionData>;
  archiveRoom(code: string, token: string): Promise<SessionData>;
  deleteRoom(code: string, token: string): Promise<void>;
  submitVote(code: string, token: string, categoryId: string, targetId: string): Promise<SessionData>;
  getResults(code: string, token: string): Promise<ResultsData>;
  getPublicResults(code: string): Promise<ResultsData>;
}
