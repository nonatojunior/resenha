import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../src/pages/HomePage';
import { JoinRoomPage } from '../src/pages/JoinRoomPage';
import { DemoRepository } from '../src/services/demoRepository';
import type { CreateRoomInput } from '../src/types/game';

const ROOM_INPUT: CreateRoomInput = {
  name: 'Resenha da Galera',
  organizerName: 'Ana',
  groupType: 'amigos',
  theme: 'livre',
  visibility: 'link',
  categorySlugs: ['ceo-da-enrolacao'],
  customCategories: [],
  allowLateJoin: true,
  allowVoteChange: false,
};

function renderJoinPage() {
  return render(
    <MemoryRouter initialEntries={['/entrar']}>
      <Routes>
        <Route path="/entrar" element={<JoinRoomPage />} />
        <Route path="/resenha/:codigo" element={<h1>Sala encontrada</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('apresenta a proposta e os atalhos principais', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Seu grupo merece um prêmio',
    );
    expect(screen.getAllByRole('link', { name: /criar minha resenha/i })[0]).toHaveAttribute(
      'href',
      '/criar',
    );
    expect(screen.getAllByRole('link', { name: /entrar em uma resenha/i })[0]).toHaveAttribute(
      'href',
      '/entrar',
    );
    expect(screen.getByRole('heading', { name: /quatro passos/i })).toBeInTheDocument();
    expect(screen.getByText(/nenhum resultado ou participante fictício/i)).toBeInTheDocument();
  });
});

describe('JoinRoomPage', () => {
  it('valida o tamanho do código antes de consultar a sala', async () => {
    const user = userEvent.setup();
    renderJoinPage();

    await user.type(screen.getByLabelText('Código da sala'), 'AB1');
    await user.click(screen.getByRole('button', { name: /entrar na resenha/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O código da sala tem 6 caracteres',
    );
  });

  it('mostra erro amigável quando a sala não existe', async () => {
    const user = userEvent.setup();
    renderJoinPage();

    await user.type(screen.getByLabelText('Código da sala'), 'ZZZZZZ');
    await user.click(screen.getByRole('button', { name: /entrar na resenha/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não encontramos nenhuma resenha com esse código',
    );
  });

  it('navega para a sala quando o código existe', async () => {
    const repository = new DemoRepository();
    const created = await repository.createRoom(ROOM_INPUT);
    const code = created.session.room.code;
    const user = userEvent.setup();
    renderJoinPage();

    await user.type(screen.getByLabelText('Código da sala'), code.toLowerCase());
    await user.click(screen.getByRole('button', { name: /entrar na resenha/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sala encontrada' })).toBeInTheDocument();
    });
  });
});
