import type { CategoryResult } from '../../types/game';

export const VOTE_FEEDBACK_MESSAGES = [
  'Voto registrado. Sua consciência que lute.',
  'Mais uma categoria resolvida!',
  'Você está quase liberado para descobrir a verdade.',
  'Anotado com sucesso. Ninguém viu nada.',
  'Missão cumprida. O grupo agradece (ou não).',
  'Voto no cofre. A democracia segue.',
  'Mais um capítulo dessa novela escrita.',
  'Registrado. Agora finja que não foi você.',
];

export const WAITING_MESSAGES = [
  'O grupo está votando escondido. Resista à curiosidade.',
  'A apuração está em segredo absoluto.',
  'Nem o organizador consegue espiar. Respira.',
  'As urnas estão fechadas. O suspense é parte do pacote.',
];

export const RESULT_PUNCHLINES = [
  'Não é uma fase. É um estilo de vida.',
  'A democracia falou. Agora aguente as consequências.',
  'A coroa é sua. A responsabilidade também.',
  'O grupo votou e não aceita recurso.',
  'O prêmio é imaginário, mas a fama é eterna.',
  'Guarde esse troféu com orgulho. Ele não paga aluguel.',
  'A concorrência era forte, mas o talento falou mais alto.',
];

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function pickFeedbackMessage(seed: number): string {
  return VOTE_FEEDBACK_MESSAGES[Math.abs(seed) % VOTE_FEEDBACK_MESSAGES.length];
}

export function pickPunchline(result: CategoryResult): string {
  const seed = hashValue(
    `${result.category.slug ?? result.category.name}:${result.winners.map((winner) => winner.nickname).join(',')}`,
  );
  return RESULT_PUNCHLINES[seed % RESULT_PUNCHLINES.length];
}

export function buildResultHeadline(result: CategoryResult): string {
  if (result.winners.length === 0) {
    return `Ninguém levou o prêmio ${result.category.name}. O grupo decepcionou.`;
  }
  if (result.tie) {
    const names = result.winners.map((winner) => winner.nickname).join(' e ');
    return `Empate! ${names} dividem o prêmio ${result.category.name}.`;
  }
  const winner = result.winners[0];
  return `O grupo decidiu: o prêmio ${result.category.name} vai para ${winner.nickname}.`;
}

export function buildResultMessage(result: CategoryResult, roomUrl?: string): string {
  let message: string;
  if (result.winners.length === 0) {
    message = `😶 Ninguém levou o prêmio ${result.category.name} na Resenha Secreta. O grupo votou e não aceita recurso.`;
  } else if (result.tie) {
    const names = result.winners.map((winner) => winner.nickname).join(' e ');
    message = `🏆 Empate no prêmio ${result.category.name}: ${names} dividem a coroa na Resenha Secreta! O grupo votou e não aceita recurso 😂`;
  } else {
    message = `🏆 O prêmio ${result.category.name} foi para ${result.winners[0].nickname} na Resenha Secreta! O grupo votou e não aceita recurso 😂`;
  }
  return roomUrl ? `${message}\n\n${roomUrl}` : message;
}
