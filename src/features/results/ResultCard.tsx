import { useState } from 'react';
import {
  Copy,
  Download,
  MessageCircle,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { Avatar } from '../../components/ParticipantList';
import { Button } from '../../components/Button';
import { CategoryIcon } from '../../components/CategoryIcon';
import { buttonClass } from '../../lib/buttonClass';
import { useToast } from '../../components/Toast';
import type { CategoryResult } from '../../types/game';
import { formatPercent } from '../../lib/format';
import { buildResultMessage, pickPunchline } from './phrases';
import {
  buildResultUrl,
  buildWhatsAppUrl,
  copyText,
} from '../sharing/share';
import {
  downloadResultCard,
  shareResultCard,
  type ResultCardInput,
} from '../sharing/card';

interface ResultCardProps {
  result: CategoryResult;
  roomName: string;
  roomCode: string;
}

function buildInput(result: CategoryResult, roomName: string, roomCode: string): ResultCardInput {
  const names = result.winners.map((winner) => winner.nickname);
  const winnerName = names.length > 0 ? names.join(' e ') : 'Ninguém';
  const votesText =
    result.winners.length === 0
      ? 'Sem votos registrados'
      : result.tie
        ? `Empate · ${result.winners[0].votes} ${result.winners[0].votes === 1 ? 'voto' : 'votos'} cada`
        : `${result.winners[0].votes} ${result.winners[0].votes === 1 ? 'voto' : 'votos'} · ${formatPercent(result.winners[0].percentage)}`;

  return {
    categoryName: result.category.name,
    winnerName,
    phrase: pickPunchline(result),
    roomName,
    votesText,
    roomUrl: buildResultUrl(roomCode),
  };
}

export function ResultCard({ result, roomName, roomCode }: ResultCardProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<'download' | 'share' | 'copy' | null>(null);
  const resultUrl = buildResultUrl(roomCode);
  const message = buildResultMessage(result, resultUrl);
  const input = buildInput(result, roomName, roomCode);
  const punchline = pickPunchline(result);
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const download = async () => {
    setBusy('download');
    try {
      await downloadResultCard(input);
      showToast('Card gerado! Confira os downloads.', 'success');
    } catch {
      showToast('Não foi possível gerar o card neste navegador.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy('share');
    try {
      const shared = await shareResultCard(input, message);
      if (!shared) {
        showToast('Compartilhamento direto indisponível. Baixe o card ou copie a mensagem.', 'info');
      }
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    setBusy('copy');
    const copied = await copyText(message);
    setBusy(null);
    showToast(
      copied
        ? 'Mensagem copiada! Agora é só colar no grupo.'
        : 'Não foi possível copiar. Selecione a mensagem manualmente.',
      copied ? 'success' : 'error',
    );
  };

  return (
    <article className={`result-card ${result.tie ? 'result-card--tie' : ''}`}>
      <div className="result-card__top">
        <span className="result-card__icon">
          <CategoryIcon name={result.category.icon} size={23} />
        </span>
        <div className="result-card__title">
          <span className="result-card__label">Prêmio</span>
          <h3>{result.category.name}</h3>
          <p>{result.category.description}</p>
        </div>
        <span className="result-card__stamp">
          <Trophy size={16} aria-hidden="true" />
          {result.tie ? 'Empate' : 'Vencedor'}
        </span>
      </div>

      {result.winners.length > 0 ? (
        <div className="result-card__winner">
          <div className="result-card__avatars">
            {result.winners.map((winner) => (
              <Avatar key={winner.participantId} nickname={winner.nickname} size="lg" />
            ))}
          </div>
          <div className="result-card__winner-copy">
            <span>
              {result.tie
                ? 'O grupo dividiu a coroa entre'
                : 'O grupo decidiu que o prêmio vai para'}
            </span>
            <h4>{result.winners.map((winner) => winner.nickname).join(' e ')}</h4>
            <p className="result-card__votes">
              <strong>{result.winners[0].votes}</strong>{' '}
              {result.winners[0].votes === 1 ? 'voto' : 'votos'}
              <span>·</span>
              {formatPercent(result.winners[0].percentage)} dos votos válidos
              {result.tie ? ' para cada' : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="result-card__winner result-card__winner--empty">
          <span className="result-card__empty-icon">
            <Users size={24} aria-hidden="true" />
          </span>
          <div>
            <span>Nenhum voto registrado nesta categoria.</span>
            <h4>O grupo passou batido.</h4>
          </div>
        </div>
      )}

      <p className="result-card__punchline">
        <Sparkles size={16} aria-hidden="true" /> {punchline}
      </p>

      {result.runnerUps.length > 0 ? (
        <p className="result-card__runner">
          <strong>Quase lá:</strong>{' '}
          {result.runnerUps.map((runner) => `${runner.nickname} (${runner.votes})`).join(', ')}
        </p>
      ) : null}

      <div className="result-card__footer">
        <span className="result-card__total">
          <Users size={14} aria-hidden="true" /> {result.totalVotes}{' '}
          {result.totalVotes === 1 ? 'voto válido' : 'votos válidos'}
        </span>

        <div className="result-card__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void download()}
            loading={busy === 'download'}
            icon={<Download size={16} aria-hidden="true" />}
            aria-label={`Baixar card do prêmio ${result.category.name}`}
          >
            Baixar
          </Button>
          {canNativeShare ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void share()}
              loading={busy === 'share'}
              icon={<Share2 size={16} aria-hidden="true" />}
            >
              Compartilhar
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void copy()}
            loading={busy === 'copy'}
            icon={<Copy size={16} aria-hidden="true" />}
          >
            Copiar
          </Button>
          <a
            className={buttonClass('ghost', { size: 'sm' })}
            href={buildWhatsAppUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}
