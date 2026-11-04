import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Lock,
  MessageCircle,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { LinkButton } from '../components/Button';
import { Confetti } from '../components/Confetti';
import { ErrorState, LoadingState } from '../components/FeedbackStates';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { ResultCard } from '../features/results/ResultCard';
import {
  buildResultUrl,
  buildWhatsAppUrl,
  copyText,
} from '../features/sharing/share';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isAppError, getErrorMessage } from '../lib/errors';
import { pluralize } from '../lib/format';
import { normalizeRoomCode } from '../lib/validation';
import { getRepository } from '../services';
import type { ResultsData, RoomPreview } from '../types/game';

type ResultsStatus = 'loading' | 'ready' | 'not-ready' | 'not-found' | 'error';

interface Highlight {
  nickname: string;
  wins: number;
}

export function ResultsPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const code = normalizeRoomCode(codigo ?? '');
  const [status, setStatus] = useState<ResultsStatus>('loading');
  const [results, setResults] = useState<ResultsData | null>(null);
  const [preview, setPreview] = useState<RoomPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useDocumentTitle(results ? `Resultados · ${results.room.name}` : 'Resultados');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!code || code.length !== 6) {
        if (active) {
          setStatus('not-found');
          setError('O código da resenha está incompleto ou inválido.');
        }
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const data = await getRepository().getPublicResults(code);
        if (!active) return;
        setResults(data);
        setStatus('ready');
      } catch (caught) {
        if (!active) return;

        if (isAppError(caught) && caught.code === 'REVEAL_NOT_READY') {
          try {
            const roomPreview = await getRepository().getRoomPreview(code);
            if (!active) return;
            setPreview(roomPreview);
            setStatus('not-ready');
            return;
          } catch (previewError) {
            if (!active) return;
            if (isAppError(previewError) && previewError.code === 'ROOM_NOT_FOUND') {
              setStatus('not-found');
              setError(previewError.message);
            } else {
              setStatus('error');
              setError(getErrorMessage(previewError));
            }
            return;
          }
        }

        if (isAppError(caught) && caught.code === 'ROOM_NOT_FOUND') {
          setStatus('not-found');
          setError(caught.message);
          return;
        }

        setStatus('error');
        setError(getErrorMessage(caught));
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [code]);

  const highlights = useMemo<Highlight[]>(() => {
    if (!results) return [];
    const counts = new Map<string, number>();
    for (const category of results.categories) {
      for (const winner of category.winners) {
        counts.set(winner.nickname, (counts.get(winner.nickname) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([nickname, wins]) => ({ nickname, wins }))
      .sort((a, b) => b.wins - a.wins || a.nickname.localeCompare(b.nickname, 'pt-BR'))
      .slice(0, 3);
  }, [results]);

  const copyResultLink = async () => {
    if (!code) return;
    const copiedOk = await copyText(buildResultUrl(code));
    if (copiedOk) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      showToast('Link do resultado copiado!', 'success');
    } else {
      showToast('Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="container page-state">
        <LoadingState message="Apurado os votos e organizando o caos…" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="container page-state">
        <ErrorState
          title="Não achamos esse resultado."
          message={error ?? 'Confira o link ou peça um novo convite ao organizador.'}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container page-state">
        <ErrorState
          title="O placar não carregou."
          message={error ?? 'Tente novamente em instantes.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (status === 'not-ready') {
    return (
      <div className="container page-state">
        <div className="card pre-reveal">
          <span className="pre-reveal__icon">
            <Lock size={30} aria-hidden="true" />
          </span>
          <span className="eyebrow">Resultados ainda bloqueados</span>
          <h1>{preview?.name ?? 'Essa resenha ainda está no segredo'}</h1>
          <p>
            {preview?.status === 'lobby'
              ? 'A votação ainda não começou. Quando o organizador encerrar e liberar, o placar aparece aqui.'
              : preview?.status === 'voting'
                ? 'O grupo ainda está votando. Os resultados só ficam públicos depois que o organizador encerrar e liberar.'
                : 'A votação terminou, mas o organizador ainda não liberou o placar. Respire: a verdade está guardada.'}
          </p>
          {preview ? <StatusBadge status={preview.status} /> : null}
          <div className="pre-reveal__actions">
            <LinkButton to={`/resenha/${code}`} icon={<ArrowLeft size={17} />}>
              Ir para a sala
            </LinkButton>
            <LinkButton to="/criar" variant="secondary" icon={<Sparkles size={17} />}>
              Criar outra resenha
            </LinkButton>
          </div>
          <p className="pre-reveal__fineprint">
            Nenhum voto individual é exibido. O placar é calculado apenas com votos reais.
          </p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container page-state">
        <ErrorState title="Placar indisponível." message="Tente novamente em instantes." />
      </div>
    );
  }

  const { room, categories, totalVoters, totalParticipants } = results;
  const resultUrl = buildResultUrl(room.code);
  const totalAwarded = categories.reduce((sum, category) => sum + category.winners.length, 0);
  const shareMessage = `🏆 O placar da ${room.name} saiu na Resenha Secreta! Veja quem é quem no grupo: ${resultUrl}`;

  return (
    <div className="page page--results">
      <Confetti pieces={70} />

      <div className="container">
        <div className="results-topbar">
          <Link to={`/resenha/${room.code}`} className="text-link text-link--back">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar para a sala
          </Link>
          <div className="results-topbar__actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => void copyResultLink()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              <span>{copied ? 'Link copiado' : 'Copiar link'}</span>
            </button>
            <a
              className="btn btn--ghost btn--sm"
              href={buildWhatsAppUrl(shareMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
          </div>
        </div>

        <section className="results-hero" data-theme={room.theme}>
          <div className="results-hero__glow" aria-hidden="true" />
          <span className="eyebrow eyebrow--light">
            <Trophy size={16} aria-hidden="true" /> Placar oficial da resenha
          </span>
          <h1>{room.name}</h1>
          <p className="results-hero__subtitle">
            A democracia falou. Agora aguente as consequências.
          </p>

          <div className="results-hero__stats">
            <div>
              <strong>{totalVoters}</strong>
              <span>{pluralize(totalVoters, 'pessoa votou', 'pessoas votaram')}</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>{pluralize(categories.length, 'categoria', 'categorias')}</span>
            </div>
            <div>
              <strong>{totalAwarded}</strong>
              <span>{pluralize(totalAwarded, 'coroa entregue', 'coroas entregues')}</span>
            </div>
            <div>
              <strong>{totalParticipants}</strong>
              <span>{pluralize(totalParticipants, 'participante', 'participantes')}</span>
            </div>
          </div>

          <div className="results-hero__meta">
            <StatusBadge status={room.status} />
            <span>Código {room.code}</span>
            <span>Organizada por {room.organizerName}</span>
          </div>
        </section>

        {highlights.length > 0 ? (
          <section className="card highlights">
            <div className="highlights__heading">
              <div>
                <span className="eyebrow">
                  <Crown size={15} aria-hidden="true" /> Destaques da resenha
                </span>
                <h2>Quem mais levou prêmio para casa</h2>
              </div>
              <span className="muted small">Contagem de categorias vencidas, empates incluídos.</span>
            </div>
            <ol className="highlights__list">
              {highlights.map((highlight, index) => (
                <li key={highlight.nickname}>
                  <span className={`highlights__rank highlights__rank--${index + 1}`}>
                    {index + 1}
                  </span>
                  <span className="highlights__name">{highlight.nickname}</span>
                  <span className="highlights__wins">
                    {highlight.wins} {pluralize(highlight.wins, 'prêmio', 'prêmios')}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="card results-empty">
            <Users size={30} aria-hidden="true" />
            <h2>Ninguém recebeu votos</h2>
            <p>
              A resenha foi revelada, mas nenhuma categoria teve votos válidos. Desta vez o grupo
              escapou do julgamento.
            </p>
          </section>
        )}

        <section className="results-list" aria-label="Resultados por categoria">
          {categories.map((result) => (
            <ResultCard
              key={result.category.id}
              result={result}
              roomName={room.name}
              roomCode={room.code}
            />
          ))}
        </section>

        <section className="card results-footer">
          <div>
            <span className="eyebrow">
              <Share2 size={15} aria-hidden="true" /> Compartilhe a verdade
            </span>
            <h2>Manda o placar no grupo</h2>
            <p>
              Baixe os cards individuais, copie as mensagens ou envie o link público direto para
              quem precisa saber.
            </p>
          </div>
          <div className="results-footer__actions">
            <button type="button" className="btn btn--primary" onClick={() => void copyResultLink()}>
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              <span>{copied ? 'Link copiado' : 'Copiar link do resultado'}</span>
            </button>
            <a
              className="btn btn--secondary"
              href={buildWhatsAppUrl(shareMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={18} aria-hidden="true" /> Compartilhar no WhatsApp
            </a>
            <LinkButton to="/criar" variant="yellow" icon={<Sparkles size={18} />}>
              Criar outra resenha
            </LinkButton>
          </div>
          <p className="results-footer__fineprint">
            <Lock size={14} aria-hidden="true" /> O placar mostra apenas totais agregados. Nenhum
            voto individual é revelado.
          </p>
        </section>
      </div>
    </div>
  );
}
