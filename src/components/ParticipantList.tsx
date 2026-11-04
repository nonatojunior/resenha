import { useMemo } from 'react';
import { Crown } from 'lucide-react';
import type { Participant } from '../types/game';
import { initials } from '../lib/format';

const AVATAR_TONES = ['lilac', 'pink', 'orange', 'mint', 'yellow', 'blue'] as const;

function toneFor(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

interface AvatarProps {
  nickname: string;
  size?: 'sm' | 'md' | 'lg';
  isOrganizer?: boolean;
  className?: string;
}

export function Avatar({ nickname, size = 'md', isOrganizer, className }: AvatarProps) {
  const tone = useMemo(() => toneFor(nickname), [nickname]);
  return (
    <span
      className={`avatar avatar--${size} avatar--${tone} ${className ?? ''}`}
      aria-hidden="true"
      title={nickname}
    >
      {initials(nickname)}
      {isOrganizer ? (
        <span className="avatar__crown">
          <Crown size={12} />
        </span>
      ) : null}
    </span>
  );
}

interface ParticipantListProps {
  participants: Participant[];
  currentParticipantId?: string;
  compact?: boolean;
}

export function ParticipantList({
  participants,
  currentParticipantId,
  compact = false,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return <p className="muted">Ninguém entrou ainda. Manda o convite!</p>;
  }

  return (
    <ul className={`participant-list ${compact ? 'participant-list--compact' : ''}`}>
      {participants.map((participant) => (
        <li key={participant.id} className="participant-list__item">
          <Avatar
            nickname={participant.nickname}
            size={compact ? 'sm' : 'md'}
            isOrganizer={participant.role === 'organizer'}
          />
          <span className="participant-list__name">
            {participant.nickname}
            {participant.id === currentParticipantId ? <strong> (você)</strong> : null}
          </span>
          {participant.role === 'organizer' ? (
            <span className="badge badge--tiny badge--yellow">Organizador</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
