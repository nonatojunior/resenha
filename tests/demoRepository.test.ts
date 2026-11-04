import { describe, expect, it } from 'vitest';
import { DemoRepository } from '../src/services/demoRepository';
import type { AppErrorCode } from '../src/lib/errors';
import type { CreateRoomInput } from '../src/types/game';

const BASE_INPUT: CreateRoomInput = {
  name: 'Resenha de Teste',
  organizerName: 'Ana',
  groupType: 'amigos',
  theme: 'livre',
  visibility: 'link',
  categorySlugs: ['ceo-da-enrolacao', 'fantasma-do-whatsapp'],
  customCategories: [],
  allowLateJoin: true,
  allowVoteChange: false,
};

function input(overrides: Partial<CreateRoomInput> = {}): CreateRoomInput {
  return { ...BASE_INPUT, ...overrides };
}

async function expectAppError(promise: Promise<unknown>, code: AppErrorCode) {
  await expect(promise).rejects.toMatchObject({ name: 'AppError', code });
}

describe('DemoRepository — fluxo completo', () => {
  it('cria a sala, permite entrada e bloqueia apelidos duplicados', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input());
    const code = created.session.room.code;

    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(created.session.room.status).toBe('lobby');
    expect(created.session.participant.role).toBe('organizer');
    expect(created.session.room.categories).toHaveLength(2);
    expect(created.token).toHaveLength(64);

    const preview = await repository.getRoomPreview(code.toLowerCase());
    expect(preview.code).toBe(code);
    expect(preview.name).toBe('Resenha de Teste');
    expect(preview.participantCount).toBe(1);

    const guest = await repository.joinRoom(code, '  Bia  ');
    expect(guest.session.participant.nickname).toBe('Bia');
    expect(guest.session.room.participantCount).toBe(2);

    await expectAppError(repository.joinRoom(code, 'ana'), 'NICKNAME_TAKEN');
    await expectAppError(repository.getRoomPreview('ZZZZZZ'), 'ROOM_NOT_FOUND');
  });

  it('só abre a votação com pelo menos duas pessoas', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input());
    const code = created.session.room.code;

    await expectAppError(repository.startVoting(code, created.token), 'NOT_ENOUGH_PARTICIPANTS');

    await repository.joinRoom(code, 'Bia');
    const started = await repository.startVoting(code, created.token);

    expect(started.room.status).toBe('voting');
    expect(started.room.votingStartedAt).not.toBeNull();
  });

  it('registra votos secretos, bloqueia auto-voto e voto duplicado', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input());
    const code = created.session.room.code;
    const organizerId = created.session.participant.id;
    const categories = created.session.room.categories;

    const guest = await repository.joinRoom(code, 'Bia');
    await repository.joinRoom(code, 'Caio');
    await repository.startVoting(code, created.token);

    await expectAppError(
      repository.submitVote(code, guest.token, categories[0].id, guest.session.participant.id),
      'SELF_VOTE',
    );
    await expectAppError(
      repository.submitVote(code, guest.token, 'categoria-inexistente', organizerId),
      'INVALID_CATEGORY',
    );
    await expectAppError(
      repository.submitVote(code, guest.token, categories[0].id, 'pessoa-inexistente'),
      'INVALID_TARGET',
    );

    const afterVote = await repository.submitVote(
      code,
      guest.token,
      categories[0].id,
      organizerId,
    );
    expect(afterVote.myVotes[categories[0].id]).toBe(organizerId);

    await expectAppError(
      repository.submitVote(code, guest.token, categories[0].id, organizerId),
      'DUPLICATE_VOTE',
    );

    await expectAppError(repository.getResults(code, guest.token), 'REVEAL_NOT_READY');
    await expectAppError(repository.getPublicResults(code), 'REVEAL_NOT_READY');
  });

  it('mantém os votos individuais fora da sessão de outros participantes', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input());
    const code = created.session.room.code;
    const categories = created.session.room.categories;

    const guest = await repository.joinRoom(code, 'Bia');
    await repository.joinRoom(code, 'Caio');
    await repository.startVoting(code, created.token);
    await repository.submitVote(code, guest.token, categories[0].id, created.session.participant.id);

    const organizerSession = await repository.getSession(code, created.token);
    expect(organizerSession.myVotes).toEqual({});
    expect(organizerSession.votingProgress).not.toBeNull();

    const guestSession = await repository.getSession(code, guest.token);
    expect(guestSession.votingProgress).toBeNull();

    await expectAppError(repository.getSession(code, 'token-invalido'), 'UNAUTHORIZED');
  });

  it('revela resultados agregados, trata empate e mantém o placar público', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input());
    const code = created.session.room.code;
    const organizerId = created.session.participant.id;
    const categories = created.session.room.categories;

    const guestOne = await repository.joinRoom(code, 'Bia');
    const guestTwo = await repository.joinRoom(code, 'Caio');
    await repository.startVoting(code, created.token);

    await repository.submitVote(code, guestOne.token, categories[0].id, organizerId);
    await repository.submitVote(code, guestTwo.token, categories[0].id, guestOne.session.participant.id);
    await repository.submitVote(code, guestOne.token, categories[1].id, organizerId);
    await repository.submitVote(code, guestTwo.token, categories[1].id, organizerId);

    await expectAppError(repository.revealResults(code, created.token), 'REVEAL_NOT_READY');

    const closed = await repository.closeVoting(code, created.token);
    expect(closed.room.status).toBe('closed');

    const revealed = await repository.revealResults(code, created.token);
    expect(revealed.room.status).toBe('revealed');
    expect(revealed.room.revealedAt).not.toBeNull();

    const results = await repository.getPublicResults(code);
    expect(results.totalVoters).toBe(2);
    expect(results.totalParticipants).toBe(3);
    expect(results.categories[0].tie).toBe(true);
    expect(results.categories[0].winners.map((winner) => winner.nickname).sort()).toEqual([
      'Ana',
      'Bia',
    ]);
    expect(results.categories[1].tie).toBe(false);
    expect(results.categories[1].winners).toEqual([
      { participantId: organizerId, nickname: 'Ana', votes: 2, percentage: 100 },
    ]);

    const serialized = JSON.stringify(results);
    expect(serialized).not.toContain(guestOne.token);
    expect(serialized).not.toContain(guestTwo.token);

    const authenticatedResults = await repository.getResults(code, guestOne.token);
    expect(authenticatedResults.categories).toHaveLength(2);
    await expectAppError(repository.getResults(code, 'token-invalido'), 'UNAUTHORIZED');

    const archived = await repository.archiveRoom(code, created.token);
    expect(archived.room.status).toBe('archived');
    expect((await repository.getPublicResults(code)).categories).toHaveLength(2);

    await repository.deleteRoom(code, created.token);
    await expectAppError(repository.getRoomPreview(code), 'ROOM_NOT_FOUND');
  });

  it('permite trocar o voto apenas quando a sala autoriza', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input({ allowVoteChange: true }));
    const code = created.session.room.code;
    const organizerId = created.session.participant.id;
    const categories = created.session.room.categories;

    const guestOne = await repository.joinRoom(code, 'Bia');
    const guestTwo = await repository.joinRoom(code, 'Caio');
    const guestTwoId = guestTwo.session.participant.id;
    await repository.startVoting(code, created.token);

    await repository.submitVote(code, guestOne.token, categories[0].id, organizerId);
    const changed = await repository.submitVote(
      code,
      guestOne.token,
      categories[0].id,
      guestTwoId,
    );

    expect(changed.myVotes[categories[0].id]).toBe(guestTwoId);
    expect(Object.keys(changed.myVotes)).toHaveLength(1);
  });

  it('protege salas com código de acesso', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(
      input({ visibility: 'code', accessCode: 'AB12' }),
    );
    const code = created.session.room.code;

    const preview = await repository.getRoomPreview(code);
    expect(preview.visibility).toBe('code');
    expect(preview.hasAccessCode).toBe(true);

    await expectAppError(repository.joinRoom(code, 'Bia'), 'ACCESS_CODE_REQUIRED');
    await expectAppError(repository.joinRoom(code, 'Bia', 'ZZZZ'), 'INVALID_ACCESS_CODE');

    const guest = await repository.joinRoom(code, 'Bia', 'ab12');
    expect(guest.session.room.participantCount).toBe(2);
  });

  it('exige organizador para ações de controle', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input());
    const code = created.session.room.code;
    const guest = await repository.joinRoom(code, 'Bia');

    await expectAppError(repository.startVoting(code, guest.token), 'UNAUTHORIZED');
    await expectAppError(repository.closeVoting(code, guest.token), 'UNAUTHORIZED');
    await expectAppError(repository.revealResults(code, guest.token), 'UNAUTHORIZED');
    await expectAppError(repository.deleteRoom(code, guest.token), 'UNAUTHORIZED');
  });

  it('impede novas entradas depois do encerramento', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(input({ allowLateJoin: false, allowVoteChange: false }));
    const code = created.session.room.code;

    await repository.joinRoom(code, 'Bia');
    await repository.startVoting(code, created.token);

    await expectAppError(repository.joinRoom(code, 'Caio'), 'VOTING_CLOSED');

    await repository.closeVoting(code, created.token);
    await expectAppError(repository.joinRoom(code, 'Caio'), 'ROOM_CLOSED');

    await repository.archiveRoom(code, created.token);
    await expectAppError(repository.joinRoom(code, 'Caio'), 'ROOM_ARCHIVED');
  });

  it('valida os dados de criação e categorias personalizadas', async () => {
    const repository = new DemoRepository();

    await expectAppError(repository.createRoom(input({ name: 'Oi' })), 'INVALID_INPUT');
    await expectAppError(repository.createRoom(input({ organizerName: 'A' })), 'INVALID_INPUT');
    await expectAppError(
      repository.createRoom(input({ categorySlugs: [] })),
      'NOT_ENOUGH_CATEGORIES',
    );
    await expectAppError(
      repository.createRoom(input({ categorySlugs: ['nao-existe'] })),
      'INVALID_CATEGORY',
    );
    await expectAppError(
      repository.createRoom(input({ visibility: 'code', accessCode: null })),
      'ACCESS_CODE_REQUIRED',
    );
    await expectAppError(
      repository.createRoom(
        input({
          categorySlugs: ['ceo-da-enrolacao'],
          customCategories: [{ name: 'CEO da Enrolação', description: 'Categoria repetida.' }],
        }),
      ),
      'INVALID_INPUT',
    );

    const withCustom = await repository.createRoom(
      input({
        categorySlugs: ['ceo-da-enrolacao'],
        customCategories: [{ name: 'Rei do Churrasco', description: 'Quem domina a grelha.' }],
      }),
    );
    expect(withCustom.session.room.categories).toHaveLength(2);
    expect(withCustom.session.room.categories[1].isCustom).toBe(true);
    expect(withCustom.session.room.categories[1].name).toBe('Rei do Churrasco');
  });
});
