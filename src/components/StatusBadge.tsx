import { ROOM_STATUS_LABELS } from '../lib/categories';
import type { RoomStatus } from '../types/game';

export function StatusBadge({ status }: { status: RoomStatus }) {
  return <span className={`status status--${status}`}>{ROOM_STATUS_LABELS[status]}</span>;
}
