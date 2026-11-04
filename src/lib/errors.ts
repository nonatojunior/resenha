export type AppErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_CLOSED'
  | 'ROOM_ARCHIVED'
  | 'VOTING_NOT_OPEN'
  | 'VOTING_CLOSED'
  | 'NICKNAME_TAKEN'
  | 'INVALID_NICKNAME'
  | 'SELF_VOTE'
  | 'DUPLICATE_VOTE'
  | 'UNAUTHORIZED'
  | 'INVALID_ACCESS_CODE'
  | 'ACCESS_CODE_REQUIRED'
  | 'VOTE_CHANGE_DISABLED'
  | 'NOT_ENOUGH_PARTICIPANTS'
  | 'NOT_ENOUGH_CATEGORIES'
  | 'REVEAL_NOT_READY'
  | 'INVALID_CATEGORY'
  | 'INVALID_TARGET'
  | 'TOO_MANY_REQUESTS'
  | 'INVALID_INPUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

const FRIENDLY_MESSAGES: Record<AppErrorCode, string> = {
  ROOM_NOT_FOUND: 'Não encontramos nenhuma resenha com esse código. Confira e tente de novo.',
  ROOM_CLOSED: 'Essa resenha já foi encerrada para novas entradas.',
  ROOM_ARCHIVED: 'Essa resenha foi arquivada pelo organizador.',
  VOTING_NOT_OPEN: 'A votação ainda não começou. Segura a ansiedade!',
  VOTING_CLOSED: 'A votação já foi encerrada. Agora só resta esperar o veredito.',
  NICKNAME_TAKEN: 'Esse apelido já está em uso nessa resenha. Tente outro.',
  INVALID_NICKNAME: 'Use um apelido de 2 a 24 caracteres, sem símbolos estranhos.',
  SELF_VOTE: 'Votar em si mesmo é muita autoestima. Escolha outra pessoa.',
  DUPLICATE_VOTE: 'Você já votou nessa categoria e o voto não pode ser alterado.',
  UNAUTHORIZED: 'Sua sessão não tem permissão para essa ação. Entre novamente.',
  INVALID_ACCESS_CODE: 'Código de acesso incorreto. Confira com o organizador.',
  ACCESS_CODE_REQUIRED: 'Essa resenha pede um código de acesso.',
  VOTE_CHANGE_DISABLED: 'O organizador não liberou a troca de votos.',
  NOT_ENOUGH_PARTICIPANTS: 'Convide pelo menos mais uma pessoa antes de abrir a votação.',
  NOT_ENOUGH_CATEGORIES: 'Ative pelo menos uma categoria antes de abrir a votação.',
  REVEAL_NOT_READY: 'Encerre a votação antes de liberar os resultados.',
  INVALID_CATEGORY: 'Essa categoria não está ativa nesta resenha.',
  INVALID_TARGET: 'Escolha uma pessoa que esteja participando desta resenha.',
  TOO_MANY_REQUESTS: 'Muitas tentativas em pouco tempo. Respira e tenta de novo.',
  INVALID_INPUT: 'Confira os campos preenchidos e tente novamente.',
  NETWORK_ERROR: 'A conexão deu uma cochilada. Verifique a internet e tente de novo.',
  UNKNOWN: 'Algo deu errado. Tente novamente em instantes.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? FRIENDLY_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return FRIENDLY_MESSAGES.UNKNOWN;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  const raw = error instanceof Error ? error.message : String(error ?? '');
  const knownCodes = Object.keys(FRIENDLY_MESSAGES) as AppErrorCode[];
  const found = knownCodes.find((code) => raw.toUpperCase().includes(code));
  if (found) return new AppError(found);

  if (/failed to fetch|networkerror|load failed|fetch/i.test(raw)) {
    return new AppError('NETWORK_ERROR');
  }
  return new AppError('UNKNOWN');
}
