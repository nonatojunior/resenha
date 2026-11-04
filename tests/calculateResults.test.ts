import { describe, expect, it } from 'vitest';
import type { Category, Participant } from '../src/types/game';
import {
  calculateCategoryResults,
  countCompletedVoters,
  countTotalVoters,
  type VoteLike,
} from '../src/features/results/calculateResults';

const joinedAt = '2026-10-26T12:00:00.000Z';

function makeCategory(id: string): Category {
  return {
    id,
    slug: id,
    name: `Categoria ${id}`,
    description: 'Descrição de teste.',
    icon: 'sparkles',
    votingRule: 'Escolha alguém.',
    isCustom: false,
  };
}

const categories: Category[] = [makeCategory('cat1'), makeCategory('cat2')];

const participants: Participant[] = [
  { id: 'p1', nickname: 'Ana', role: 'organizer', joinedAt },
  { id: 'p2', nickname: 'Bia', role: 'guest', joinedAt },
  { id: 'p3', nickname: 'Caio', role: 'guest', joinedAt },
];

function vote(categoryId: string, voterId: string, targetId: string): VoteLike {
  return { categoryId, voterId, targetId };
}

describe('calculateCategoryResults', () => {
  it('retorna categorias sem votos, sem vencedores e sem empate', () => {
    const results = calculateCategoryResults(categories, [], participants);

    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.totalVotes).toBe(0);
      expect(result.winners).toEqual([]);
      expect(result.runnerUps).toEqual([]);
      expect(result.tie).toBe(false);
    }
  });

  it('elege o mais votado e calcula percentuais e vice-líder', () => {
    const votes = [
      vote('cat1', 'v1', 'p1'),
      vote('cat1', 'v2', 'p1'),
      vote('cat1', 'v3', 'p1'),
      vote('cat1', 'v4', 'p2'),
      vote('cat1', 'v5', 'p2'),
      vote('cat1', 'v6', 'p3'),
    ];

    const [result] = calculateCategoryResults(categories, votes, participants);

    expect(result.totalVotes).toBe(6);
    expect(result.tie).toBe(false);
    expect(result.winners).toEqual([
      { participantId: 'p1', nickname: 'Ana', votes: 3, percentage: 50 },
    ]);
    expect(result.runnerUps).toEqual([
      { participantId: 'p2', nickname: 'Bia', votes: 2, percentage: 33.3 },
    ]);
  });

  it('mantém todos os empatados em primeiro lugar', () => {
    const votes = [
      vote('cat1', 'v1', 'p1'),
      vote('cat1', 'v2', 'p1'),
      vote('cat1', 'v3', 'p2'),
      vote('cat1', 'v4', 'p2'),
      vote('cat1', 'v5', 'p3'),
    ];

    const [result] = calculateCategoryResults(categories, votes, participants);

    expect(result.tie).toBe(true);
    expect(result.winners.map((winner) => winner.nickname)).toEqual(['Ana', 'Bia']);
    expect(result.winners.every((winner) => winner.votes === 2)).toBe(true);
    expect(result.runnerUps).toEqual([
      { participantId: 'p3', nickname: 'Caio', votes: 1, percentage: 20 },
    ]);
  });

  it('não cria vice-líder quando todos os votos estão no primeiro lugar', () => {
    const votes = [vote('cat1', 'v1', 'p1'), vote('cat1', 'v2', 'p1')];
    const [result] = calculateCategoryResults(categories, votes, participants);

    expect(result.winners).toHaveLength(1);
    expect(result.runnerUps).toEqual([]);
  });

  it('inclui apenas a categoria correspondente em cada resultado', () => {
    const votes = [
      vote('cat1', 'v1', 'p1'),
      vote('cat2', 'v2', 'p2'),
      vote('cat2', 'v3', 'p2'),
    ];

    const [first, second] = calculateCategoryResults(categories, votes, participants);

    expect(first.totalVotes).toBe(1);
    expect(first.winners[0].participantId).toBe('p1');
    expect(second.totalVotes).toBe(2);
    expect(second.winners[0].participantId).toBe('p2');
  });

  it('ignora votos para pessoas que não participam da sala', () => {
    const votes = [vote('cat1', 'v1', 'fantasma'), vote('cat1', 'v2', 'p1')];
    const [result] = calculateCategoryResults(categories, votes, participants);

    expect(result.totalVotes).toBe(2);
    expect(result.winners).toEqual([
      { participantId: 'p1', nickname: 'Ana', votes: 1, percentage: 50 },
    ]);
  });
});

describe('contadores de votação', () => {
  it('conta eleitores únicos', () => {
    const votes = [
      vote('cat1', 'v1', 'p1'),
      vote('cat2', 'v1', 'p2'),
      vote('cat1', 'v2', 'p1'),
    ];

    expect(countTotalVoters(votes)).toBe(2);
  });

  it('conta apenas quem respondeu todas as categorias', () => {
    const votes = [
      vote('cat1', 'v1', 'p1'),
      vote('cat2', 'v1', 'p2'),
      vote('cat1', 'v2', 'p1'),
      vote('cat1', 'v3', 'p2'),
      vote('cat2', 'v3', 'p1'),
    ];

    expect(countCompletedVoters(votes, 2)).toBe(2);
    expect(countCompletedVoters(votes, 3)).toBe(0);
  });
});
