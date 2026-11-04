import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  Copy,
  EyeOff,
  Hourglass,
  Info,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from 'lucide-react';
import { LinkButton } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState, LoadingState } from '../components/FeedbackStates';
import { ParticipantList } from '../components/ParticipantList';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { CategoryPreview } from '../features/rooms/CategoryPreview';
import { InvitePanel } from '../features/rooms/InvitePanel';
import { JoinGate } from '../features/rooms/JoinGate';
import { OrganizerPanel } from '../features/rooms/OrganizerPanel';
import { RoomSteps } from '../features/rooms/RoomSteps';
import { WAITING_MESSAGES } from '../features/results/phrases';
import { buildResultUrl, copyText } from '../features/sharing/share';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePolling } from '../hooks/usePolling';
import { useRoomSession } from '../hooks/useRoomSession';
import { formatDateTime, pluralize } from '../lib/format';

export function RoomPage() {
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
    signOut,
  } = useRoomSession(codigo);
  const { showToast } = useToast();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  const copyResultLink = async () => {
    const success = await copyText(buildResultUrl(session?.room.code ?? ''));
    if (success) {
      setCopiedResult(true);
      window.setTimeout(() => setCopiedResult(false), 2200);
      showToast('Link do resultado copiado!', 'success');
    } else {
      showToast('Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  useDocumentTitle(session?.room.name ?? preview?.name ?? 'Resenha');

  usePolling(
    async () => {
      if (status === 'ready' || status === 'unauthenticated') await refresh(true);
    },
    6500,
    status === 'ready' || status === 'unauthenticated',
  );

  if (status === 'loading') {
    return (
      <div className="container page-state">
        <LoadingState message="Abrindo a resenha…" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="container page-state">
        <ErrorState
          title="Essa resenha não existe (ou deu o fora)."
          message={error ?? 'Confira o código e tente novamente.'}
          onRetry={() => void retry()}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container page-state">
        <ErrorState
          title="A resenha não carregou."
          message={error ?? 'Tente de novo em instantes.'}
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
          message="Entre novamente para continuar de onde parou."
          onRetry={() => void retry()}
        />
      </div>
    );
  }

  const { room, participant, participants, myVotes, votingProgress } = session;
  const answered = Object.keys(myVotes).length;
  const totalCategories = room.categories.length;
  const isOrganizer = participant.role === 'organizer';
  const allAnswered = totalCategories > 0 && answered >= totalCategories;
  const canInvite = room.status === 'lobby' || (room.status === 'voting' && room.allowLateJoin);
  const waitingMessage =
    WAITING_MESSAGES[(room.code.charCodeAt(0) + room.code.charCodeAt(1)) % WAITING_MESSAGES.length];
  const completed = votingProgress?.filter((item) => item.answered >= item.total).length ?? 0;

  return (
    <div className="page page--room">
      <div className="container">
        <div className="room-hero" data-theme={room.theme}>
          <div className="room-hero__top">
            <Link to="/entrar" className="room-hero__back">
              ← Outra resenha
            </Link>
            <StatusBadge status={room.status} />
          </div>

          <div className="room-hero__body">
            <div>
              <span className="room-hero__eyebrow">
                <Sparkles size={15} aria-hidden="true" /> Código {room.code}
              </span>
              <h1>{room.name}</h1>
              <p>
                organizada por <strong>{room.organizerName}</strong> ·{' '}
                {room.participantCount}{' '}
                {pluralize(room.participantCount, 'participante', 'participantes')}
              </p>
            </div>

            <div className="room-hero__badge">
              <EyeOff size={19} aria-hidden="true" />
              <span>
                Votação secreta
                <small>nem o organizador vê os votos</small>
              </span>
            </div>
          </div>

          <RoomSteps status={room.status} />
        </div>

        <div className="room-layout">
          <div className="room-main">
            <section className="card room-status">
              <div className="room-status__heading">
                <div>
                  <span className="eyebrow">
                    {room.status === 'lobby' ? (
                      <Users size={15} aria-hidden="true" />
                    ) : room.status === 'voting' ? (
                      <Vote size={15} aria-hidden="true" />
                    ) : room.status === 'closed' ? (
                      <Hourglass size={15} aria-hidden="true" />
                    ) : (
                      <Trophy size={15} aria-hidden="true" />
                    )}
                    {room.status === 'lobby'
                      ? 'Sala aberta'
                      : room.status === 'voting'
                        ? 'Votação em andamento'
                        : room.status === 'closed'
                          ? 'Votação encerrada'
                          : 'Resultados liberados'}
                  </span>
                  <h2>
                    {room.status === 'lobby'
                      ? 'O grupo está se reunindo'
                      : room.status === 'voting'
                        ? allAnswered
                          ? 'Seus votos estão guardados'
                          : 'Falta pouco para você terminar'
                        : room.status === 'closed'
                          ? 'Agora é só esperar o veredito'
                          : 'O grupo já sabe a verdade'}
                  </h2>
                </div>
                {isOrganizer ? (
                  <span className="badge badge--purple">
                    <ShieldCheck size={14} aria-hidden="true" /> Você organiza
                  </span>
                ) : null}
              </div>

              {room.status === 'lobby' ? (
                <>
                  <p className="room-status__text">
                    {isOrganizer
                      ? room.participantCount < 2
                        ? 'Convide pelo menos mais uma pessoa. A votação só abre com dois participantes.'
                        : 'Já tem gente suficiente. Abra a votação quando o grupo estiver na sala.'
                      : 'O organizador vai abrir a votação quando o grupo estiver completo. Aproveite para conferir as categorias.'}
                  </p>

                  {isOrganizer && room.participantCount < 2 ? (
                    <div className="room-status__callout">
                      <Users size={20} aria-hidden="true" />
                      <p>
                        <strong>Compartilhe o convite.</strong> Cada pessoa entra com um apelido.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {room.status === 'voting' ? (
                <>
                  <div className="room-status__progress">
                    <ProgressBar
                      value={answered}
                      max={totalCategories}
                      label="Seu progresso"
                      tone="mint"
                    />
                    <span className="room-status__fraction">
                      {answered}/{totalCategories} categorias
                    </span>
                  </div>
                  <p className="room-status__text">
                    {allAnswered
                      ? room.allowVoteChange
                        ? 'Você já votou em todas as categorias. Ainda dá para revisar seus votos até o encerramento.'
                        : 'Você já votou em todas as categorias. Seu voto está trancado a sete chaves.'
                      : 'Escolha uma pessoa em cada categoria. Ninguém vê sua escolha — nem o organizador.'}
                  </p>
                  <LinkButton
                    to={`/resenha/${room.code}/votar`}
                    size="lg"
                    full
                    icon={<Vote size={20} aria-hidden="true" />}
                  >
                    {allAnswered
                      ? 'Revisar meus votos'
                      : answered > 0
                        ? 'Continuar votando'
                        : 'Votar agora'}
                  </LinkButton>
                  <p className="room-status__fineprint">
                    <EyeOff size={14} aria-hidden="true" /> O placar só aparece depois que o
                    organizador encerrar e liberar.
                  </p>
                </>
              ) : null}

              {room.status === 'closed' ? (
                <div className="waiting-panel">
                  <span className="waiting-panel__icon">
                    <Hourglass size={28} aria-hidden="true" />
                  </span>
                  <p>{waitingMessage}</p>
                  <span className="waiting-panel__note">
                    O organizador precisa liberar os resultados manualmente.
                  </span>
                </div>
              ) : null}

              {room.status === 'revealed' || room.status === 'archived' ? (
                <>
                  <p className="room-status__text">
                    Os votos foram apurados e o placar está aberto. Prepare o coração — e o
                    print para o grupo.
                  </p>
                  <div className="room-status__actions">
                    <LinkButton
                      to={`/resenha/${room.code}/resultado`}
                      size="lg"
                      icon={<Trophy size={20} aria-hidden="true" />}
                    >
                      Ver o placar completo
                    </LinkButton>
                    <button
                      type="button"
                      className="btn btn--secondary btn--lg"
                      onClick={() => void copyResultLink()}
                    >
                      <span>{copiedResult ? 'Link copiado' : 'Copiar link do resultado'}</span>
                      <Copy size={18} aria-hidden="true" />
                    </button>
                  </div>
                </>
              ) : null}
            </section>

            <section className="card room-participants">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">
                    <Users size={15} aria-hidden="true" /> Na sala
                  </span>
                  <h2>
                    {room.participantCount}{' '}
                    {pluralize(room.participantCount, 'participante', 'participantes')}
                  </h2>
                </div>
                {room.status === 'voting' && isOrganizer ? (
                  <span className="count-pill">
                    {completed} de {room.participantCount} concluíram
                  </span>
                ) : null}
              </div>
              <ParticipantList
                participants={participants}
                currentParticipantId={participant.id}
              />
            </section>

            <section className="card room-categories">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">
                    <Sparkles size={15} aria-hidden="true" /> O julgamento
                  </span>
                  <h2>Categorias da resenha</h2>
                </div>
                <span className="count-pill">{room.categories.length}</span>
              </div>
              <CategoryPreview categories={room.categories} />
            </section>

            {isOrganizer ? (
              <OrganizerPanel session={session} token={token} onSession={updateSession} />
            ) : (
              <div className="room-guest-note card">
                <Info size={19} aria-hidden="true" />
                <div>
                  <strong>Voto secreto, brincadeira limpa.</strong>
                  <p>
                    Ninguém vê em quem você votou. O organizador só acompanha quantas categorias
                    cada pessoa respondeu.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="room-sidebar">
            {canInvite ? <InvitePanel room={room} compact /> : null}

            <div className="card room-info">
              <h2>Detalhes da sala</h2>
              <dl>
                <div>
                  <dt>Código</dt>
                  <dd>{room.code}</dd>
                </div>
                <div>
                  <dt>Organizador</dt>
                  <dd>{room.organizerName}</dd>
                </div>
                <div>
                  <dt>Acesso</dt>
                  <dd>
                    {room.visibility === 'code' ? (
                      <>
                        <ShieldCheck size={14} aria-hidden="true" /> Link + código
                      </>
                    ) : (
                      <>
                        <Users size={14} aria-hidden="true" /> Quem tem o link
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Revelação</dt>
                  <dd>
                    {room.revealAt ? (
                      <>
                        <Clock3 size={14} aria-hidden="true" /> {formatDateTime(room.revealAt)}
                      </>
                    ) : (
                      'Quando o organizador liberar'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Entradas</dt>
                  <dd>
                    {room.allowLateJoin ? 'Abertas durante a votação' : 'Só antes da votação'}
                  </dd>
                </div>
                <div>
                  <dt>Troca de voto</dt>
                  <dd>
                    {room.allowVoteChange
                      ? 'Permitida até encerrar'
                      : 'Voto travado na confirmação'}
                  </dd>
                </div>
              </dl>

              {room.status === 'revealed' ? (
                <div className="room-info__ready">
                  <CheckCircle2 size={18} aria-hidden="true" /> Placar liberado para o grupo
                </div>
              ) : null}

              <button
                type="button"
                className="text-button room-info__signout"
                onClick={() => setConfirmSignOut(true)}
              >
                <LogOut size={15} aria-hidden="true" /> Sair deste dispositivo
              </button>
            </div>

            <div className="card room-seal">
              <EyeOff size={21} aria-hidden="true" />
              <h3>Sigilo de verdade</h3>
              <p>
                Os votos individuais não são exibidos à interface. O placar é calculado no
                servidor a partir dos votos reais.
              </p>
              <Link to="/privacidade" className="text-link">
                Como protegemos os dados
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sair deste dispositivo?"
        description="Você pode entrar de novo com o mesmo apelido apenas se ele ainda estiver disponível. Esta ação não encerra a sala."
        confirmLabel="Sair"
        tone="danger"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          signOut();
        }}
      />
    </div>
  );
}
