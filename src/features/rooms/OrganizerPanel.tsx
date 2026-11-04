import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ChevronDown,
  ChevronUp,
  CirclePlay,
  Eye,
  Pencil,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { Avatar } from '../../components/ParticipantList';
import { Button, LinkButton } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SwitchField, TextField } from '../../components/Field';
import { ProgressBar } from '../../components/ProgressBar';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../lib/errors';
import { normalizeSpaces, validateRoomName } from '../../lib/validation';
import { getRepository } from '../../services';
import type { CustomCategoryInput, SessionData } from '../../types/game';
import { CategorySelector } from './CategorySelector';

type PendingAction = 'start' | 'close' | 'reveal' | 'archive' | 'delete' | null;

interface OrganizerPanelProps {
  session: SessionData;
  token: string;
  onSession: (session: SessionData) => void;
}

export function OrganizerPanel({ session, token, onSession }: OrganizerPanelProps) {
  const repository = getRepository();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [editing, setEditing] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [name, setName] = useState(session.room.name);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    session.room.categories.filter((category) => !category.isCustom).map((category) => category.slug ?? ''),
  );
  const [customCategories, setCustomCategories] = useState<CustomCategoryInput[]>(
    session.room.categories
      .filter((category) => category.isCustom)
      .map((category) => ({ name: category.name, description: category.description })),
  );
  const [allowLateJoin, setAllowLateJoin] = useState(session.room.allowLateJoin);
  const [allowVoteChange, setAllowVoteChange] = useState(session.room.allowVoteChange);
  const [editError, setEditError] = useState<string | null>(null);

  const { room, participant } = session;
  if (participant.role !== 'organizer') return null;

  const runAction = async (
    key: string,
    action: () => Promise<SessionData>,
    message: string,
  ) => {
    setBusy(key);
    try {
      const updated = await action();
      onSession(updated);
      showToast(message, 'success');
      setPending(null);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(null);
    }
  };

  const saveEdit = async () => {
    const validation = validateRoomName(name);
    if (!validation.valid) {
      setEditError(validation.error);
      return;
    }
    if (selectedSlugs.filter(Boolean).length + customCategories.length === 0) {
      setEditError('Deixe pelo menos uma categoria ativa.');
      return;
    }
    setBusy('edit');
    setEditError(null);
    try {
      const updated = await repository.updateRoom(room.code, token, {
        name: normalizeSpaces(name),
        categorySlugs: selectedSlugs.filter(Boolean),
        customCategories,
        allowLateJoin,
        allowVoteChange,
      });
      onSession(updated);
      setEditing(false);
      showToast('Resenha atualizada.', 'success');
    } catch (error) {
      setEditError(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const deleteRoom = async () => {
    setBusy('delete');
    try {
      await repository.deleteRoom(room.code, token);
      showToast('Sala excluída. Os dados foram removidos.', 'success');
      navigate('/');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
      setBusy(null);
    }
  };

  const canStart = room.participantCount >= 2 && room.categories.length > 0;
  const progress = session.votingProgress ?? [];

  return (
    <section className="card organizer-panel">
      <div className="organizer-panel__heading">
        <span className="badge badge--purple">
          <ShieldCheck size={14} aria-hidden="true" /> Painel do organizador
        </span>
        <h2>Controle da resenha</h2>
        <p>Você conduz o jogo, mas nunca vê os votos individuais.</p>
      </div>

      {room.status === 'lobby' ? (
        <div className="organizer-panel__section">
          {editing ? (
            <div className="organizer-edit">
              <TextField
                label="Nome da resenha"
                value={name}
                maxLength={60}
                onChange={(event) => setName(event.target.value)}
                counter={`${name.length}/60`}
                error={editError}
              />
              <CategorySelector
                selectedSlugs={selectedSlugs}
                onToggleSlug={(slug) =>
                  setSelectedSlugs((current) =>
                    current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
                  )
                }
                customCategories={customCategories}
                onAddCustom={(category) => setCustomCategories((current) => [...current, category])}
                onRemoveCustom={(index) =>
                  setCustomCategories((current) => current.filter((_, position) => position !== index))
                }
              />
              <div className="organizer-edit__switches">
                <SwitchField
                  label="Aceitar entradas durante a votação"
                  description="Quem entrar atrasado também poderá votar nas categorias restantes."
                  checked={allowLateJoin}
                  onChange={setAllowLateJoin}
                />
                <SwitchField
                  label="Permitir troca de voto"
                  description="Cada pessoa pode corrigir um voto até o encerramento. Fica registrado apenas o voto final."
                  checked={allowVoteChange}
                  onChange={setAllowVoteChange}
                />
              </div>
              <div className="organizer-edit__actions">
                <Button onClick={() => void saveEdit()} loading={busy === 'edit'}>
                  Salvar alterações
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy === 'edit'}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="organizer-panel__action-row">
                <div>
                  <strong>{room.participantCount} pessoas na sala</strong>
                  <p>{canStart ? 'Tudo pronto para abrir a votação.' : 'Convide pelo menos mais uma pessoa.'}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                  icon={<Pencil size={16} />}
                >
                  Editar sala
                </Button>
              </div>
              <Button
                full
                size="lg"
                onClick={() => setPending('start')}
                disabled={!canStart}
                icon={<CirclePlay size={20} />}
              >
                Abrir votação
              </Button>
              {!canStart ? (
                <p className="muted small">
                  A votação precisa de pelo menos 2 participantes e 1 categoria ativa.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {room.status === 'voting' ? (
        <div className="organizer-panel__section">
          <div className="organizer-progress">
            <div className="organizer-progress__heading">
              <div>
                <strong>Progresso do grupo</strong>
                <p>Contamos categorias respondidas. Nunca as escolhas.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowProgress((current) => !current)}
                aria-label={showProgress ? 'Ocultar progresso' : 'Mostrar progresso'}
                aria-expanded={showProgress}
              >
                {showProgress ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {showProgress ? (
              <ul className="organizer-progress__list">
                {progress.map((item) => (
                  <li key={item.participantId}>
                    <Avatar
                      nickname={item.nickname}
                      size="sm"
                      isOrganizer={item.participantId === participant.id}
                    />
                    <div>
                      <div className="organizer-progress__name">
                        <span>{item.nickname}</span>
                        <strong>
                          {item.answered}/{item.total}
                        </strong>
                      </div>
                      <ProgressBar value={item.answered} max={item.total} tone="mint" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Button
            full
            variant="danger"
            onClick={() => setPending('close')}
            icon={<Eye size={19} />}
            loading={busy === 'close'}
          >
            Encerrar votação
          </Button>
          <p className="muted small">
            Ao encerrar, ninguém mais vota. Depois você libera os resultados para o grupo.
          </p>
        </div>
      ) : null}

      {room.status === 'closed' ? (
        <div className="organizer-panel__section">
          <div className="organizer-panel__callout">
            <Trophy size={24} aria-hidden="true" />
            <div>
              <strong>A votação está encerrada</strong>
              <p>Confira o progresso e libere o placar quando quiser.</p>
            </div>
          </div>
          <Button
            full
            size="lg"
            onClick={() => setPending('reveal')}
            icon={<Trophy size={20} />}
            loading={busy === 'reveal'}
          >
            Liberar resultados
          </Button>
        </div>
      ) : null}

      {room.status === 'revealed' ? (
        <div className="organizer-panel__section">
          <LinkButton
            to={`/resenha/${room.code}/resultado`}
            full
            size="lg"
            icon={<Trophy size={20} />}
          >
            Ver placar completo
          </LinkButton>
          <Button
            variant="secondary"
            full
            onClick={() => setPending('archive')}
            icon={<Archive size={18} />}
          >
            Arquivar sala
          </Button>
          <p className="muted small">
            Arquivar mantém os resultados acessíveis pelo link, mas impede novas interações.
          </p>
        </div>
      ) : null}

      {room.status === 'archived' ? (
        <div className="organizer-panel__section">
          <div className="organizer-panel__callout">
            <Archive size={24} aria-hidden="true" />
            <div>
              <strong>Resenha arquivada</strong>
              <p>Os resultados continuam disponíveis para consulta pelo link.</p>
            </div>
          </div>
          <LinkButton to={`/resenha/${room.code}/resultado`} variant="secondary" full>
            Ver resultados
          </LinkButton>
        </div>
      ) : null}

      <div className="organizer-panel__danger">
        <button type="button" className="text-button text-button--danger" onClick={() => setPending('delete')}>
          <Trash2 size={15} aria-hidden="true" /> Excluir resenha e dados
        </button>
        <p>
          <Users size={14} aria-hidden="true" /> A exclusão remove participantes e votos de forma
          permanente.
        </p>
      </div>

      <ConfirmDialog
        open={pending === 'start'}
        title="Abrir a votação agora?"
        description="Depois de abrir, o nome e as categorias ficam bloqueados. Quem entrou recebe acesso à votação."
        confirmLabel="Abrir votação"
        loading={busy === 'start'}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          void runAction(
            'start',
            () => repository.startVoting(room.code, token),
            'Votação aberta! Avise o grupo.',
          )
        }
      />

      <ConfirmDialog
        open={pending === 'close'}
        title="Encerrar a votação?"
        description="Ninguém mais poderá votar ou trocar votos. O placar ainda não será mostrado até você liberar."
        confirmLabel="Encerrar votação"
        tone="danger"
        loading={busy === 'close'}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          void runAction(
            'close',
            () => repository.closeVoting(room.code, token),
            'Votação encerrada. Hora de revelar!',
          )
        }
      />

      <ConfirmDialog
        open={pending === 'reveal'}
        title="Liberar os resultados?"
        description="O grupo passa a ver o placar calculado a partir dos votos reais, incluindo empates. Não dá para voltar atrás."
        confirmLabel="Liberar resultados"
        loading={busy === 'reveal'}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          void runAction(
            'reveal',
            () => repository.revealResults(room.code, token),
            'Resultados liberados!',
          )
        }
      />

      <ConfirmDialog
        open={pending === 'archive'}
        title="Arquivar esta resenha?"
        description="A sala deixa de aceitar interações, mas o placar continua acessível para quem tem o link."
        confirmLabel="Arquivar sala"
        loading={busy === 'archive'}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          void runAction(
            'archive',
            () => repository.archiveRoom(room.code, token),
            'Sala arquivada.',
          )
        }
      />

      <ConfirmDialog
        open={pending === 'delete'}
        title="Excluir a resenha para sempre?"
        description="Todos os participantes, categorias e votos serão apagados do banco. Essa ação não pode ser desfeita."
        confirmLabel="Excluir tudo"
        tone="danger"
        loading={busy === 'delete'}
        onCancel={() => setPending(null)}
        onConfirm={() => void deleteRoom()}
      />
    </section>
  );
}
