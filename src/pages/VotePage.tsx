import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Vote,
} from 'lucide-react';
import { Button, LinkButton } from '../components/Button';
import { ErrorState, LoadingState } from '../components/FeedbackStates';
import { Avatar } from '../components/ParticipantList';
import { ProgressBar } from '../components/ProgressBar';
import { useToast } from '../components/Toast';
import { JoinGate } from '../features/rooms/JoinGate';
import { VOTE_FEEDBACK_MESSAGES } from '../features/results/phrases';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePolling } from '../hooks/usePolling';
import { useRoomSession } from '../hooks/useRoomSession';
import { CategoryIcon } from '../components/CategoryIcon';
import { getErrorMessage } from '../lib/errors';
import { getRepository } from '../services';
import type { Category, Participant, SessionData } from '../types/game';

function nicknameFor(participants: Participant[], id: string | null | undefined): string {
  if (!id) return '';
  return participants.find((participant) => participant.id === id)?.nickname ?? '';
}

export function VotePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const {
    status,
    session,
    preview,
    error,
    token,
    authenticate,
    updateSession,
    refresh,
    retry,
  } = useRoomSession(codigo);
  const { showToast } = useToast();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useDocumentTitle(
    session ? `Votar · ${session.room.name}` : 'Votação',
  );

  usePolling(
    async () => {
      if (status === 'ready') await refresh(true);
    },
    7000,
    status === 'ready',
  );

  const categories = useMemo(() => session?.room.categories ?? [], [session]);
  const answeredIds = useMemo(
    () => new Set(session ? Object.keys(session.myVotes) : []),
    [session],
  );

  const fallbackCategory = useMemo(
    () => categories.find((category) => !answeredIds.has(category.id)) ?? categories[0],
    [answeredIds, categories],
  );

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? fallbackCategory;
  const activeCategoryKey = activeCategory?.id ?? null;

  const existingTargetId = activeCategory ? session?.myVotes[activeCategory.id] : undefined;
  const locked = Boolean(existingTargetId) && !session?.room.allowVoteChange;

  useEffect(() => {
    setSelectedTargetId(existingTargetId ?? null);
    setFormError(null);
  }, [activeCategoryKey, existingTargetId]);

  if (status === 'loading') {
    return (
      <div className="container page-state">
        <LoadingState message="Preparando as categorias…" />
      </div>
    );
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <div className="container page-state">
        <ErrorState
          title={status === 'not-found' ? 'Essa votação não existe.' : 'A votação não carregou.'}
          message={error ?? 'Tente novamente em instantes.'}
          onRetry={() => void retry()}
        />
      </div>
    );
  }

  if (status === 'unauthenticated' && preview) {
    return (
      <JoinGate
        preview={preview}
        code={preview.code}
        onAuthenticated={(authenticated) => {
          authenticate(authenticated);
          void refresh(true);
        }}
      />
    );
  }

  if (!session || !token) {
    return (
      <div className="container page-state">
        <ErrorState
          title="Sessão indisponível."
          message="Entre novamente na resenha para votar."
          onRetry={() => void retry()}
        />
      </div>
    );
  }

  const { room, participant, participants } = session;
  const answered = answeredIds.size;
  const total = categories.length;
  const allAnswered = total > 0 && answered >= total;
  const eligibleParticipants = participants.filter((person) => person.id !== participant.id);
  const selectedName = nicknameFor(participants, selectedTargetId);

  const notVoting = room.status !== 'voting';

  const changeCategory = (category: Category) => {
    setActiveCategoryId(category.id);
    setFormError(null);
  };

  const advance = (updated: SessionData) => {
    const next = updated.room.categories.find(
      (category) => !Object.prototype.hasOwnProperty.call(updated.myVotes, category.id),
    );
    if (next) {
      setActiveCategoryId(next.id);
      setSelectedTargetId(null);
    } else {
      const last = updated.room.categories[updated.room.categories.length - 1] ?? activeCategory;
      setActiveCategoryId(last?.id ?? null);
      setSelectedTargetId(null);
    }
  };

  const submitVote = async () => {
    if (!activeCategory || !selectedTargetId) return;
    if (selectedTargetId === participant.id) {
      setFormError('Votar em si mesmo é autoestima demais. Escolha outra pessoa.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const updated = await getRepository().submitVote(
        room.code,
        token,
        activeCategory.id,
        selectedTargetId,
      );
      updateSession(updated);
      const message =
        VOTE_FEEDBACK_MESSAGES[
          (answered + activeCategory.name.length) % VOTE_FEEDBACK_MESSAGES.length
        ];
      showToast(message, 'success');
      advance(updated);
    } catch (caught) {
      const message = getErrorMessage(caught);
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page--vote">
      <div className="container">
        <div className="vote-topbar">
          <Link to={`/resenha/${room.code}`} className="text-link text-link--back">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar para a sala
          </Link>
          <div className="vote-topbar__code">
            <Lock size={14} aria-hidden="true" /> {room.code} · voto secreto
          </div>
        </div>

        <div className="vote-heading">
          <div>
            <span className="eyebrow">
              <Vote size={16} aria-hidden="true" /> Votação secreta
            </span>
            <h1>{notVoting ? 'A votação não está aberta' : activeCategory?.name ?? 'Categorias'}</h1>
            <p>
              {notVoting
                ? 'Esta etapa já foi encerrada. Veja o status da sala para saber o próximo passo.'
                : activeCategory?.description}
            </p>
          </div>
          <div className="vote-heading__progress">
            <ProgressBar value={answered} max={total} label="Seu progresso" tone="purple" />
            <span>
              {answered} de {total} {total === 1 ? 'categoria' : 'categorias'}
            </span>
          </div>
        </div>

        {notVoting ? (
          <div className="card vote-closed">
            <span className="vote-closed__icon">
              {room.status === 'closed' ? (
                <Lock size={30} aria-hidden="true" />
              ) : (
                <Trophy size={30} aria-hidden="true" />
              )}
            </span>
            <h2>
              {room.status === 'closed'
                ? 'Votação encerrada. Agora é suspense.'
                : room.status === 'lobby'
                  ? 'A votação ainda não começou.'
                  : 'Os resultados já foram liberados.'}
            </h2>
            <p>
              {room.status === 'closed'
                ? 'O organizador ainda não liberou o placar. Ninguém consegue votar ou trocar votos agora.'
                : room.status === 'lobby'
                  ? 'Volte para a sala e aguarde o organizador abrir a votação.'
                  : 'O grupo já pode ver o placar calculado a partir dos votos reais.'}
            </p>
            <div className="vote-closed__actions">
              <LinkButton to={`/resenha/${room.code}`} variant="secondary">
                Voltar para a sala
              </LinkButton>
              {room.status === 'revealed' || room.status === 'archived' ? (
                <LinkButton to={`/resenha/${room.code}/resultado`} icon={<Trophy size={18} />}>
                  Ver resultados
                </LinkButton>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {allAnswered ? (
              <div className="vote-complete" role="status">
                <CheckCircle2 size={22} aria-hidden="true" />
                <div>
                  <strong>Você votou em todas as categorias!</strong>
                  <p>
                    {room.allowVoteChange
                      ? 'Pode revisar e trocar seus votos até o organizador encerrar.'
                      : 'Seus votos estão guardados e não podem mais ser alterados.'}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="vote-layout">
              <nav className="vote-categories" aria-label="Categorias da votação">
                <span className="vote-categories__label">Categorias</span>
                <ol>
                  {categories.map((category, index) => {
                    const done = answeredIds.has(category.id);
                    const active = category.id === activeCategory?.id;
                    return (
                      <li key={category.id}>
                        <button
                          type="button"
                          className={`vote-category-link ${done ? 'is-done' : ''} ${
                            active ? 'is-active' : ''
                          }`}
                          onClick={() => changeCategory(category)}
                          aria-current={active ? 'true' : undefined}
                        >
                          <span className="vote-category-link__number">
                            {done ? <Check size={14} /> : index + 1}
                          </span>
                          <span className="vote-category-link__name">{category.name}</span>
                          <span className="vote-category-link__icon">
                            <CategoryIcon name={category.icon} size={16} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <div className="vote-main">
                {activeCategory ? (
                  <section className="card vote-card">
                    <div className="vote-card__heading">
                      <span className="vote-card__icon">
                        <CategoryIcon name={activeCategory.icon} size={27} />
                      </span>
                      <div>
                        <span className="vote-card__counter">
                          Categoria {categories.findIndex((item) => item.id === activeCategory.id) + 1}{' '}
                          de {total}
                        </span>
                        <h2>{activeCategory.name}</h2>
                        <p>{activeCategory.description}</p>
                      </div>
                    </div>

                    <div className="vote-rule">
                      <EyeOff size={16} aria-hidden="true" />
                      <span>
                        {locked
                          ? `Seu voto está confirmado em ${nicknameFor(participants, existingTargetId)}.`
                          : 'Escolha uma pessoa do grupo. Menos você mesmo.'}
                      </span>
                    </div>

                    {eligibleParticipants.length === 0 ? (
                      <p className="vote-empty">
                        Ainda não há outra pessoa elegível nesta sala. Convide alguém para abrir a
                        votação.
                      </p>
                    ) : (
                      <div className="ballot-grid" role="radiogroup" aria-label={`Voto para ${activeCategory.name}`}>
                        {eligibleParticipants.map((person) => {
                          const selected = selectedTargetId === person.id;
                          const isExisting = existingTargetId === person.id;
                          return (
                            <button
                              key={person.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              className={`ballot-option ${selected ? 'ballot-option--selected' : ''} ${
                                isExisting ? 'ballot-option--existing' : ''
                              }`}
                              onClick={() => {
                                if (locked) return;
                                setSelectedTargetId(person.id);
                                setFormError(null);
                              }}
                              disabled={locked || saving}
                            >
                              <Avatar
                                nickname={person.nickname}
                                size="md"
                                isOrganizer={person.role === 'organizer'}
                              />
                              <span className="ballot-option__name">{person.nickname}</span>
                              <span className="ballot-option__check" aria-hidden="true">
                                {selected ? <Check size={16} /> : null}
                              </span>
                              {isExisting ? (
                                <span className="ballot-option__tag">voto atual</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {formError ? (
                      <p className="form-error" role="alert">
                        {formError}
                      </p>
                    ) : null}

                    {!locked && eligibleParticipants.length > 0 ? (
                      <div className="vote-confirm">
                        <div>
                          <span>Confirmar voto em</span>
                          <strong>{selectedName || 'escolha uma pessoa acima'}</strong>
                          <small>
                            {existingTargetId
                              ? 'O voto anterior será substituído pelo novo.'
                              : 'Depois de confirmar, o voto fica secreto.'}
                          </small>
                        </div>
                        <Button
                          size="lg"
                          loading={saving}
                          disabled={!selectedTargetId}
                          onClick={() => void submitVote()}
                          icon={<ShieldCheck size={20} aria-hidden="true" />}
                        >
                          {existingTargetId ? 'Confirmar troca' : 'Confirmar voto'}
                        </Button>
                      </div>
                    ) : null}

                    <div className="vote-card__footer">
                      <span>
                        <Sparkles size={15} aria-hidden="true" /> O placar só aparece depois da
                        revelação.
                      </span>
                      <span>
                        {answeredIds.has(activeCategory.id)
                          ? 'Categoria respondida'
                          : 'Categoria pendente'}
                      </span>
                    </div>
                  </section>
                ) : (
                  <div className="card vote-empty-card">
                    <h2>Nenhuma categoria ativa</h2>
                    <p>O organizador precisa ativar ao menos uma categoria para a votação.</p>
                    <LinkButton to={`/resenha/${room.code}`} variant="secondary">
                      Voltar para a sala
                    </LinkButton>
                  </div>
                )}

                {allAnswered ? (
                  <div className="card vote-next">
                    <div>
                      <span className="eyebrow">Tudo respondido</span>
                      <h3>Agora só resta esperar o grupo</h3>
                      <p>
                        Você pode revisar suas escolhas pelas categorias ao lado
                        {room.allowVoteChange ? ' até o encerramento' : ''}.
                      </p>
                    </div>
                    <LinkButton
                      to={`/resenha/${room.code}`}
                      icon={<ArrowRight size={18} aria-hidden="true" />}
                    >
                      Voltar para a sala
                    </LinkButton>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
