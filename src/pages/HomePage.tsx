import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  EyeOff,
  Lock,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from 'lucide-react';
import { LinkButton } from '../components/Button';
import { CategoryIcon } from '../components/CategoryIcon';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getDefaultCategories } from '../lib/categories';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Crie a resenha',
    text: 'Dê um nome ao grupo, escolha as categorias e defina quem pode entrar.',
  },
  {
    icon: MessageCircle,
    title: 'Chame a galera',
    text: 'Mande o link no WhatsApp. Cada pessoa entra com um apelido, sem cadastro.',
  },
  {
    icon: Vote,
    title: 'Vote escondido',
    text: 'Todo mundo escolhe uma pessoa por categoria — menos a si mesmo.',
  },
  {
    icon: Trophy,
    title: 'Revele o caos',
    text: 'O organizador libera o placar real, com direito a empate e card compartilhável.',
  },
];

const RULES = [
  {
    icon: EyeOff,
    title: 'Voto secreto de verdade',
    text: 'Nem o organizador vê em quem cada pessoa votou. Só o placar agregado aparece.',
  },
  {
    icon: Lock,
    title: 'Sem cadastro',
    text: 'Nada de e-mail, senha ou número de telefone. Um apelido basta para participar.',
  },
  {
    icon: ShieldCheck,
    title: 'Zoeira com limite',
    text: 'Categorias sobre atitudes e hábitos. Nada de atacar corpo, religião, saúde ou origem.',
  },
];

export function HomePage() {
  useDocumentTitle('Quem é quem no grupo?');
  const categories = getDefaultCategories().slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="hero__glow hero__glow--one" aria-hidden="true" />
        <div className="hero__glow hero__glow--two" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow eyebrow--light">
              <PartyPopper size={16} aria-hidden="true" /> O julgamento mais carinhoso da internet
            </span>
            <h1>
              Seu grupo merece um prêmio. Ou uma <span className="highlight">exposição pública.</span>
            </h1>
            <p className="hero__lead">
              Crie uma votação secreta com categorias absurdamente específicas, convide o grupo
              pelo WhatsApp e descubra quem é quem no seu rolê.
            </p>

            <div className="hero__actions">
              <LinkButton to="/criar" size="lg" icon={<Sparkles size={20} aria-hidden="true" />}>
                Criar minha resenha
              </LinkButton>
              <LinkButton
                to="/entrar"
                size="lg"
                variant="secondary"
                icon={<ArrowRight size={20} aria-hidden="true" />}
              >
                Entrar em uma resenha
              </LinkButton>
            </div>

            <ul className="hero__trust">
              <li>
                <Check size={15} aria-hidden="true" /> Grátis para o grupo
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Sem e-mail ou senha
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Funciona no celular
              </li>
            </ul>
          </div>

          <div className="hero__visual" aria-label="Exemplo ilustrativo de uma rodada">
            <div className="hero-ticket">
              <div className="hero-ticket__top">
                <span className="hero-ticket__brand">
                  <Sparkles size={16} aria-hidden="true" /> Resenha Secreta
                </span>
                <span className="hero-ticket__tag">voto secreto</span>
              </div>

              <p className="hero-ticket__label">Prêmio da rodada</p>
              <h2>CEO da Enrolação</h2>
              <p className="hero-ticket__description">
                Quem sempre promete, marca o rolê e nunca entrega.
              </p>

              <div className="hero-ballot" role="img" aria-label="Cédula de votação ilustrativa">
                <div className="hero-ballot__avatar">??</div>
                <div>
                  <span>seu voto vai para</span>
                  <strong>alguém muito suspeito</strong>
                </div>
                <Lock size={18} aria-hidden="true" />
              </div>

              <div className="hero-ticket__footer">
                <span>Ninguém vê. Só o placar aparece.</span>
                <span className="hero-ticket__dots" aria-hidden="true">
                  ● ● ●
                </span>
              </div>
            </div>

            <div className="hero-float hero-float--top" aria-hidden="true">
              <Users size={17} /> 8 pessoas na sala
            </div>
            <div className="hero-float hero-float--bottom" aria-hidden="true">
              <Trophy size={17} /> Empate é permitido
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight" id="como-funciona">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Como funciona</span>
            <h2>Quatro passos até alguém perder a amizade</h2>
            <p>
              O jogo é rápido: cria, compartilha, vota e revela. O organizador conduz o placar
              sem nunca espiar os votos.
            </p>
          </div>

          <ol className="steps-grid">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li className="step-card" key={step.title}>
                  <span className="step-card__number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="step-card__icon">
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="container">
          <div className="section-heading section-heading--split">
            <div>
              <span className="eyebrow">Categorias</span>
              <h2>Prêmios que descrevem o grupo inteiro</h2>
              <p>
                Comece com as categorias da casa e crie as suas. Tudo sobre hábitos, manias e
                situações — nunca sobre características sensíveis.
              </p>
            </div>
            <Link className="text-link text-link--arrow" to="/criar">
              Montar minha lista <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="category-marquee">
            {categories.map((category) => (
              <article className="category-chip" key={category.slug}>
                <span className="category-chip__icon">
                  <CategoryIcon name={category.icon} size={22} />
                </span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="fineprint">
            Exemplo ilustrativo de categorias. Nenhum resultado ou participante fictício é
            apresentado como real.
          </p>
        </div>
      </section>

      <section className="section section--purple">
        <div className="container fairness">
          <div className="fairness__copy">
            <span className="eyebrow eyebrow--light">A zoeira tem regras</span>
            <h2>Segredo de verdade, não só no nome</h2>
            <p>
              A Resenha Secreta foi desenhada para rir junto. Por isso, os votos ficam guardados
              no banco e só aparecem de forma agregada, depois que o organizador libera.
            </p>
            <LinkButton to="/privacidade" variant="yellow" icon={<ShieldCheck size={19} />}>
              Ler a política de privacidade
            </LinkButton>
          </div>

          <ul className="fairness__list">
            {RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <li key={rule.title}>
                  <span>
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{rule.title}</h3>
                    <p>{rule.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-panel">
            <div>
              <span className="eyebrow eyebrow--light">Agora é com o grupo</span>
              <h2>Quem será o próximo homenageado?</h2>
              <p>
                Leva menos de dois minutos para criar. A fama, como você sabe, é eterna.
              </p>
            </div>
            <div className="cta-panel__actions">
              <LinkButton to="/criar" size="lg" variant="yellow" icon={<Sparkles size={20} />}>
                Criar minha resenha
              </LinkButton>
              <LinkButton to="/entrar" size="lg" variant="ghost" icon={<ArrowRight size={19} />}>
                Tenho um código
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
