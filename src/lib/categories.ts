import type { Category, GroupType, RoomTheme, RoomVisibility } from '../types/game';

export interface CategoryDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

const DEFAULT_RULE = 'Escolha uma pessoa do grupo — menos você mesmo.';

/** Categorias seguras, engraçadas e sem atacar características pessoais sensíveis. */
export const DEFAULT_CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    slug: 'ceo-da-enrolacao',
    name: 'CEO da Enrolação',
    description: 'Quem sempre promete, marca o rolê e nunca entrega.',
    icon: 'briefcase',
  },
  {
    slug: 'fantasma-do-whatsapp',
    name: 'Fantasma do WhatsApp',
    description: 'Quem aparece, responde “oi” e desaparece por três dias.',
    icon: 'ghost',
  },
  {
    slug: 'prefeito-da-resenha',
    name: 'Prefeito da Resenha',
    description: 'Quem organiza tudo e ainda cobra presença no grupo.',
    icon: 'map',
  },
  {
    slug: 'agente-do-caos',
    name: 'Agente do Caos',
    description: 'Quem transforma qualquer situação simples em uma história inexplicável.',
    icon: 'zap',
  },
  {
    slug: 'fiscal-da-ceia',
    name: 'Fiscal da Ceia',
    description: 'Quem opina sobre cada prato antes mesmo de provar.',
    icon: 'utensils',
  },
  {
    slug: 'rei-das-desculpas',
    name: 'Rei ou Rainha das Desculpas',
    description: 'Quem sempre tem uma justificativa cinematográfica pronta.',
    icon: 'speech',
  },
  {
    slug: 'emocionado-do-grupo',
    name: 'Emocionado do Grupo',
    description: 'Quem se empolga primeiro e já quer fazer o próximo encontro.',
    icon: 'heart',
  },
  {
    slug: 'atraso-premium',
    name: 'Atraso Premium',
    description: 'Quem nunca chega no horário e ainda diz que está saindo de casa.',
    icon: 'clock',
  },
  {
    slug: 'influencer-nao-remunerado',
    name: 'Influencer Não Remunerado',
    description: 'Quem registra o rolê inteiro como se fosse uma produção de cinema.',
    icon: 'camera',
  },
  {
    slug: 'detetive-da-fofoca',
    name: 'Detetive da Fofoca',
    description: 'Quem sempre sabe da novidade antes de ela acontecer.',
    icon: 'search',
  },
  {
    slug: 'patrimonio-imaginario',
    name: 'Patrimônio Imaginário',
    description: 'Quem já comprou três apartamentos, dois carros e uma ilha no plano mental.',
    icon: 'gem',
  },
  {
    slug: 'estou-chegando',
    name: '“Estou Chegando”',
    description: 'Quem manda “estou chegando” ainda de pijama, com o delivery na porta.',
    icon: 'car',
  },
  {
    slug: 'contador-de-historias',
    name: 'Contador de Histórias',
    description: 'Quem aumenta cada detalhe até a história virar uma minissérie.',
    icon: 'book',
  },
  {
    slug: 'esqueceria-o-presente',
    name: 'Esqueceria o Próprio Presente',
    description: 'Quem chega na festa com tudo, menos a lembrança combinada.',
    icon: 'gift',
  },
  {
    slug: 'sem-celular',
    name: 'Sobrevivência sem Celular',
    description: 'Quem não aguentaria 40 minutos desconectado da bateria e do grupo.',
    icon: 'smartphone',
  },
  {
    slug: 'aventura-de-viagem',
    name: 'Aventura de Viagem',
    description: 'Quem transformaria uma ida ao mercado em uma expedição internacional.',
    icon: 'compass',
  },
];

export function getDefaultCategories(): Category[] {
  return DEFAULT_CATEGORY_DEFINITIONS.map((definition) => ({
    ...definition,
    id: `default:${definition.slug}`,
    votingRule: DEFAULT_RULE,
    isCustom: false,
  }));
}

export const CATEGORY_VOTING_RULE = DEFAULT_RULE;

export interface GroupTypeOption {
  value: GroupType;
  label: string;
  description: string;
}

export const GROUP_TYPE_OPTIONS: GroupTypeOption[] = [
  { value: 'amigos', label: 'Amigos', description: 'A turma do rolê, do zap e do “só mais uma”.' },
  { value: 'familia', label: 'Família', description: 'Parentes que se amam e competem por atenção.' },
  { value: 'trabalho', label: 'Trabalho', description: 'A equipe que vira família às sextas-feiras.' },
  { value: 'personalizado', label: 'Outro grupo', description: 'Dê um nome ao seu tipo de resenha.' },
];

export interface ThemeOption {
  value: RoomTheme;
  label: string;
  icon: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'livre', label: 'Resenha livre', icon: 'sparkles' },
  { value: 'natal', label: 'Natal', icon: 'gift' },
  { value: 'ano-novo', label: 'Ano-Novo', icon: 'party' },
  { value: 'aniversario', label: 'Aniversário', icon: 'cake' },
  { value: 'confraternizacao', label: 'Confraternização', icon: 'users' },
];

export const VISIBILITY_OPTIONS: { value: RoomVisibility; label: string; description: string }[] = [
  {
    value: 'link',
    label: 'Quem tem o link, entra',
    description: 'Ideal para grupos já organizados. O código da sala já é um convite aleatório.',
  },
  {
    value: 'code',
    label: 'Link + código de acesso',
    description: 'Mais reservado: além do link, a pessoa precisa digitar um código combinado.',
  },
];

export const ROOM_STATUS_LABELS = {
  lobby: 'Aguardando o grupo',
  voting: 'Votação aberta',
  closed: 'Votação encerrada',
  revealed: 'Resultados liberados',
  archived: 'Sala encerrada',
} as const;

export const THEME_GRADIENTS: Record<RoomTheme, string> = {
  livre: 'linear-gradient(135deg, #7c3aed 0%, #ff4d8d 100%)',
  natal: 'linear-gradient(135deg, #0f766e 0%, #dc2626 100%)',
  'ano-novo': 'linear-gradient(135deg, #4c1d95 0%, #f59e0b 100%)',
  aniversario: 'linear-gradient(135deg, #db2777 0%, #f97316 100%)',
  confraternizacao: 'linear-gradient(135deg, #4338ca 0%, #06b6d4 100%)',
};
