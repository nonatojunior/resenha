import {
  BookOpen,
  BriefcaseBusiness,
  Cake,
  Camera,
  Car,
  Clock3,
  Compass,
  Gem,
  Ghost,
  Gift,
  Heart,
  Map,
  MessageSquareQuote,
  PartyPopper,
  Search,
  Smartphone,
  Sparkles,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  ghost: Ghost,
  map: Map,
  zap: Zap,
  utensils: Utensils,
  speech: MessageSquareQuote,
  heart: Heart,
  clock: Clock3,
  camera: Camera,
  search: Search,
  gem: Gem,
  car: Car,
  book: BookOpen,
  gift: Gift,
  smartphone: Smartphone,
  compass: Compass,
  people: Users,
  party: PartyPopper,
  cake: Cake,
  sparkles: Sparkles,
};

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ name, size = 24, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[name] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
