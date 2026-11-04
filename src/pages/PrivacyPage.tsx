import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  EyeOff,
  Lock,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserX,
} from 'lucide-react';
import { LinkButton } from '../components/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SECTIONS = [
  {
    icon: Database,
    title: 'O que guardamos',
    points: [
      'Nome da resenha, apelido do organizador e apelidos dos participantes.',
      'Categorias escolhidas e votos registrados, ligados a identificadores internos.',
      'Datas de criação, início da votação, encerramento e revelação.',
      'Um token de sessão aleatório para recuperar sua participação. No servidor, ele é guardado apenas como hash.',
    ],
  },
  {
    icon: UserX,
    title: 'O que não pedimos',
    points: [
      'Não pedimos e-mail, senha, telefone, CPF, endereço ou foto.',
      'Não usamos login social e não criamos perfil público.',
      'Não mostramos votos individuais para o organizador nem para outros participantes.',
      'Não vendemos dados nem usamos rastreadores de publicidade.',
    ],
  },
  {
    icon: EyeOff,
    title: 'Como o voto secreto funciona',
    points: [
      'Cada pessoa pode registrar um voto por categoria, sempre em outra pessoa.',
      'O organizador vê apenas quantas categorias cada participante respondeu.',
      'Os resultados agregados ficam disponíveis pelo código depois que o organizador libera o placar.',
      'Empates aparecem com todos os primeiros colocados. Nenhum voto é inventado ou arredondado para criar um vencedor.',
    ],
  },
];

export function PrivacyPage() {
  useDocumentTitle('Privacidade e regras');

  return (
    <div className="page page--privacy">
      <div className="container privacy">
        <Link to="/" className="text-link text-link--back">
          <ArrowLeft size={16} aria-hidden="true" /> Voltar ao início
        </Link>

        <div className="page-heading">
          <span className="eyebrow">
            <ShieldCheck size={16} aria-hidden="true" /> Privacidade sem letra miúda
          </span>
          <h1>Regras de convivência e política de privacidade</h1>
          <p>
            A Resenha Secreta é uma brincadeira entre pessoas que se conhecem. Para continuar
            divertida, precisa de apelidos, consentimento e zero exposição de dados pessoais.
          </p>
          <span className="privacy__updated">Última atualização: outubro de 2026</span>
        </div>

        <div className="privacy__grid">
          <div className="privacy__main">
            <section className="card privacy-card">
              <h2>1. Princípio geral</h2>
              <p>
                Este é um jogo recreativo. As categorias e as regras são definidas pelo
                organizador de cada sala. O resultado não representa uma avaliação profissional,
                psicológica ou factual sobre ninguém. Use o bom humor e pare se alguém pedir.
              </p>
              <p>
                Não use a ferramenta para humilhar, discriminar, expor informações íntimas,
                acusar crimes ou atacar características físicas, religião, raça, orientação
                sexual, saúde, deficiência ou qualquer característica pessoal sensível.
              </p>
            </section>

            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <section className="card privacy-card" key={section.title}>
                  <div className="privacy-card__heading">
                    <span>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h2>{section.title}</h2>
                  </div>
                  <ul className="check-list">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </section>
              );
            })}

            <section className="card privacy-card">
              <div className="privacy-card__heading">
                <span>
                  <Smartphone size={20} aria-hidden="true" />
                </span>
                <h2>Armazenamento no seu dispositivo</h2>
              </div>
              <p>
                Guardamos no <code>localStorage</code> apenas o token da sua participação por
                sala, para que você não precise entrar de novo ao atualizar a página. Esse token
                não é um dado de perfil e não é enviado a terceiros. Ele pode ser apagado ao sair
                pelo botão “Sair deste dispositivo” ou ao limpar os dados do navegador.
              </p>
              <p>
                No modo de demonstração local, as salas e os votos ficam inteiramente no
                navegador. Nesse modo, não há compartilhamento real entre dispositivos.
              </p>
            </section>

            <section className="card privacy-card">
              <div className="privacy-card__heading">
                <span>
                  <Trash2 size={20} aria-hidden="true" />
                </span>
                <h2>Retenção e exclusão</h2>
              </div>
              <p>
                A sala fica disponível enquanto o organizador não a excluir. O organizador pode
                apagar a resenha a qualquer momento; isso remove participantes, categorias e
                votos em cascata. Não há prazo automático de expiração configurado, então trate a
                sala como temporária e não guarde informações que você não gostaria de perder.
              </p>
              <p>
                Se você participou e quer que seus dados sejam removidos, peça ao organizador
                para excluir a sala. Como não há conta nem e-mail, não conseguimos localizar
                você por outro meio.
              </p>
            </section>

            <section className="card privacy-card">
              <div className="privacy-card__heading">
                <span>
                  <Lock size={20} aria-hidden="true" />
                </span>
                <h2>Segurança e limitações</h2>
              </div>
              <p>
                O acesso ao banco é feito por funções controladas no servidor, com validação de
                tokens e regras de autorização. As tabelas não são expostas diretamente ao
                navegador, e nenhuma chave administrativa secreta é incluída no frontend.
              </p>
              <p>
                A participação é anônima por apelido, o que tem limites: quem tem acesso ao seu
                dispositivo ou ao seu token pode agir como você. Use um apelido, não compartilhe
                o link de uma sala reservada e saia do dispositivo quando terminar.
              </p>
            </section>

            <section className="card privacy-card">
              <h2>Serviços externos</h2>
              <ul className="check-list">
                <li>
                  <strong>Supabase:</strong> hospeda o banco PostgreSQL e as funções quando o
                  projeto está configurado. Recebe apenas os dados da sala e os votos.
                </li>
                <li>
                  <strong>GitHub Pages:</strong> entrega os arquivos estáticos do frontend.
                </li>
                <li>
                  <strong>Google Fonts:</strong> fornece as fontes tipográficas e pode registrar
                  a requisição de rede conforme a política do Google.
                </li>
                <li>
                  <strong>WhatsApp:</strong> só é acionado quando você clica em compartilhar. A
                  mensagem é montada no seu navegador.
                </li>
              </ul>
            </section>

            <section className="card privacy-card">
              <h2>Idade e consentimento</h2>
              <p>
                O jogo é destinado a pessoas a partir de 16 anos. Ao entrar em uma sala, você
                confirma que leu estas regras, que usará um apelido e que participa por vontade
                própria. O organizador deve garantir que o grupo concorda com a brincadeira.
              </p>
              <p>
                Se algo aqui não estiver claro, fale com o organizador da sua sala ou abra uma
                issue no repositório do projeto.
              </p>
            </section>
          </div>

          <aside className="privacy__aside">
            <div className="card privacy-summary">
              <h2>Resumo em 30 segundos</h2>
              <ul className="check-list">
                <li>Sem e-mail, senha ou telefone.</li>
                <li>Votos secretos durante toda a votação.</li>
                <li>Placar só depois da liberação do organizador.</li>
                <li>Organizador pode excluir a sala e os dados.</li>
                <li>Use apelido e mantenha o humor respeitoso.</li>
              </ul>
              <LinkButton to="/criar" icon={<ShieldCheck size={18} />}>
                Criar com responsabilidade
              </LinkButton>
            </div>

            <div className="card privacy-summary privacy-summary--soft">
              <h3>Regras rápidas para o grupo</h3>
              <ol>
                <li>Nada de corpo, saúde, religião, raça ou orientação sexual.</li>
                <li>Nada de acusações ou segredos que possam constranger.</li>
                <li>Se alguém não está gostando, pare a rodada.</li>
                <li>Não compartilhe prints de votos individuais — eles nem existem na interface.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
