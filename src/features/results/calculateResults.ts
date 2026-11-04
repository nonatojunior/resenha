import type { Category, CategoryResult, Participant, ResultWinner } from '../../types/game';

export interface VoteLike {
  categoryId: string;
  voterId: string;
  targetId: string;
}

function roundPercentage(votes: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 1000) / 10;
}

function buildWinners(
  counts: Map<string, number>,
  participants: Map<string, Participant>,
  totalVotes: number,
  minimumVotes: number,
): ResultWinner[] {
  const winners: ResultWinner[] = [];
  for (const [participantId, votes] of counts.entries()) {
    if (votes !== minimumVotes) continue;
    const participant = participants.get(participantId);
    if (!participant) continue;
    winners.push({
      participantId,
      nickname: participant.nickname,
      votes,
      percentage: roundPercentage(votes, totalVotes),
    });
  }
  return winners.sort(
    (a, b) => b.votes - a.votes || a.nickname.localeCompare(b.nickname, 'pt-BR'),
  );
}

/**
 * Calcula o placar real a partir dos votos registrados.
 * Empates mantêm todos os primeiros colocados com o mesmo número de votos.
 */
export function calculateCategoryResults(
  categories: Category[],
  votes: VoteLike[],
  participants: Participant[],
): CategoryResult[] {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));

  return categories.map((category) => {
    const categoryVotes = votes.filter((vote) => vote.categoryId === category.id);
    const totalVotes = categoryVotes.length;
    const counts = new Map<string, number>();

    for (const vote of categoryVotes) {
      counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1);
    }

    const maxVotes = totalVotes === 0 ? 0 : Math.max(...counts.values());
    const winners = maxVotes > 0 ? buildWinners(counts, participantMap, totalVotes, maxVotes) : [];

    const runnerVotes =
      totalVotes === 0
        ? 0
        : Math.max(
            0,
            ...Array.from(counts.values()).filter((count) => count < maxVotes),
          );
    const runnerUps =
      runnerVotes > 0 ? buildWinners(counts, participantMap, totalVotes, runnerVotes) : [];

    return {
      category,
      totalVotes,
      winners,
      runnerUps,
      tie: winners.length > 1,
    };
  });
}

export function countTotalVoters(votes: VoteLike[]): number {
  return new Set(votes.map((vote) => vote.voterId)).size;
}

export function countCompletedVoters(votes: VoteLike[], totalCategories: number): number {
  const answersByVoter = new Map<string, number>();
  for (const vote of votes) {
    answersByVoter.set(vote.voterId, (answersByVoter.get(vote.voterId) ?? 0) + 1);
  }
  return Array.from(answersByVoter.values()).filter((count) => count >= totalCategories).length;
}
