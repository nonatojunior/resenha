# Prompt para OpenCode — Resenha Secreta: Quem é Quem no Grupo?

## 1. Objetivo do projeto

Atue como um desenvolvedor Full Stack sênior, especialista em TypeScript, JavaScript, interfaces modernas, experiência do usuário, aplicações web responsivas, segurança e boas práticas de desenvolvimento.

Construa uma aplicação web chamada **Resenha Secreta — Quem é Quem no Grupo?**, um jogo social de humor para grupos de amigos, famílias, colegas de trabalho e confraternizações de Natal e Ano-Novo.

A aplicação deve permitir que uma pessoa crie uma resenha, compartilhe um link pelo WhatsApp, convide os participantes, organize votações em categorias engraçadas e revele os resultados em um placar divertido.

O objetivo é criar uma experiência que gere risadas, incentive o compartilhamento e seja fácil de usar mesmo para pessoas sem conhecimentos técnicos.

**Não construa apenas uma landing page ou um protótipo visual.** Desenvolva uma aplicação funcional, com persistência de dados, validações, navegação completa e integração real com o serviço de backend escolhido.

Antes de começar, inspecione o repositório existente. Se estiver vazio, inicialize o projeto. Se já houver código, preserve o que estiver funcionando e evite alterações desnecessárias.

## 2. Público-alvo e idioma

- Idioma principal: português brasileiro (pt-BR).
- Público: pessoas a partir de 16 anos, grupos de amigos, famílias e equipes.
- Interface informal, divertida, acolhedora e fácil de entender.
- Textos curtos, linguagem natural brasileira e humor sem ofensas graves.
- Formatação brasileira para datas e números.

## 3. Tecnologias obrigatórias

Utilize as seguintes tecnologias:

- **Frontend:** TypeScript com React.
- **Build:** Vite.
- **Estilização:** CSS moderno, com variáveis CSS e componentes reutilizáveis.
- **Backend e banco de dados:** Supabase, utilizando PostgreSQL e recursos de autenticação ou acesso anônimo quando apropriado.
- **Hospedagem do frontend:** GitHub Pages.
- **Controle de versão:** Git.
- **Testes:** Vitest e React Testing Library para as funcionalidades principais.
- **Qualidade:** ESLint e TypeScript em modo estrito.

Utilize versões estáveis e compatíveis das dependências no momento da implementação.

A aplicação deve funcionar sem um servidor Rails próprio, sem Docker obrigatório em produção e sem serviços pagos obrigatórios.

Não inclua chaves secretas no frontend. Utilize variáveis de ambiente para a configuração pública e documente como configurar o Supabase.

O GitHub Pages hospeda somente o frontend estático. Os dados compartilhados entre dispositivos devem ser armazenados no Supabase, e não somente em localStorage.

## 4. Conceito visual

Crie uma identidade visual própria, com aparência de jogo social brasileiro.

Direção visual:

- Tema de festa, resenha, confraternização e memes.
- Cores vibrantes, como roxo, amarelo, laranja e rosa, com contraste adequado.
- Cards arredondados, sombras suaves, ícones e pequenos detalhes festivos.
- Tipografia legível e títulos expressivos.
- Animações leves para votos, revelações e celebrações.
- Confetes na revelação dos vencedores, sem prejudicar a performance.
- Layout mobile-first, com excelente experiência em celulares.
- Botões grandes e fáceis de tocar.
- Estados de carregamento, sucesso, erro e ausência de dados.

Evite uma aparência genérica de dashboard administrativo. A interface deve parecer um jogo que as pessoas tenham vontade de compartilhar nos grupos de WhatsApp.

Crie componentes visuais consistentes e evite emojis excessivos. Utilize ícones de uma biblioteca consistente, se necessário.

## 5. Funcionalidades principais

### 5.1. Página inicial

Crie uma landing page com:

- Nome e identidade visual do jogo.
- Frase principal: “Seu grupo merece um prêmio. Ou uma exposição pública.”
- Explicação rápida de como funciona.
- Botão principal: “Criar minha resenha”.
- Botão secundário: “Entrar em uma resenha”.
- Demonstração visual de categorias engraçadas.
- Seção explicando as etapas: criar, convidar, votar e revelar.
- Aviso de que o jogo é recreativo e depende das regras definidas pelo organizador.

Não apresente resultados fictícios como se fossem resultados reais de usuários.

### 5.2. Criar uma resenha

Permita que um organizador crie uma nova sala informando:

- Nome da resenha.
- Nome ou apelido do organizador.
- Tipo de grupo: amigos, família, trabalho ou personalizado.
- Tema opcional: Natal, Ano-Novo, aniversário, confraternização ou resenha livre.
- Categorias que deseja incluir.
- Data e horário opcionais para revelar os resultados.
- Visibilidade e regras de participação.

Gere um código curto e único para a sala, além de um link compartilhável.

O link deve permitir que os convidados entrem diretamente na sala, respeitando as regras de acesso.

O organizador deve conseguir copiar o link e compartilhá-lo pelo WhatsApp.

### 5.3. Entrar em uma resenha

O participante deve conseguir entrar usando um link ou código da sala.

Solicite apenas o necessário:

- Apelido.
- Código de acesso, se configurado.
- Aceitação das regras de convivência.

Evite exigir cadastro com e-mail ou senha para jogar.

Não permita que qualquer pessoa entre em uma sala privada apenas por conhecer seu nome. Utilize códigos de convite ou tokens de acesso adequados.

Implemente prevenção de nomes duplicados ou ambíguos dentro da mesma sala, respeitando a privacidade dos participantes.

### 5.4. Lista de participantes

Crie uma tela com:

- Participantes que já entraram.
- Indicador de quem está participando da votação, quando essa informação puder ser exibida sem comprometer o sigilo.
- Link de convite.
- Quantidade de participantes.
- Instruções para iniciar a votação.

O organizador deve poder configurar quando a votação começa e quando os resultados são revelados.

Não exponha publicamente informações privadas dos participantes.

### 5.5. Categorias engraçadas

Crie um conjunto inicial de categorias, permitindo ao organizador selecionar, remover ou adicionar categorias personalizadas.

Exemplos:

- CEO da Enrolação — quem sempre promete e nunca entrega.
- Fantasma do WhatsApp — quem desaparece por dias.
- Prefeito da Resenha — quem organiza os encontros.
- Agente do Caos — quem transforma qualquer situação em confusão engraçada.
- Fiscal da Ceia — quem opina sobre toda comida.
- Rei ou Rainha das Desculpas — quem sempre tem uma justificativa.
- Emocionado do Grupo — quem se empolga primeiro.
- Atraso Premium — quem nunca chega no horário.
- Influencer Não Remunerado — quem registra tudo.
- Detetive da Fofoca — quem sempre sabe das novidades.
- Patrimônio Imaginário — quem vive falando de riqueza futura.
- Pessoa que diz “estou chegando” sem ter saído de casa.
- Melhor contador de histórias exageradas.
- Quem provavelmente esqueceria o próprio presente.
- Quem sobreviveria menos tempo sem o celular.
- Quem transformaria uma viagem simples em uma aventura.

Cada categoria deve conter:

- Nome.
- Descrição curta e engraçada.
- Ícone ou elemento visual.
- Regras de votação.
- Possibilidade de ativação ou desativação pelo organizador.

Evite categorias que incentivem humilhação, discriminação, exposição de informações íntimas, acusações criminais ou ataques a características físicas, religião, raça, orientação sexual, saúde ou outras características pessoais sensíveis.

Permita que o organizador remova qualquer categoria inadequada.

### 5.6. Sistema de votação

Implemente uma votação real, compartilhada entre os dispositivos dos participantes.

Regras padrão:

- O participante vota em outra pessoa para cada categoria.
- O participante não pode votar em si mesmo.
- Cada participante pode registrar apenas um voto por categoria.
- O voto não deve ser alterado depois da confirmação, salvo se o organizador habilitar explicitamente uma regra de edição antes do encerramento.
- As categorias podem ser respondidas individualmente.
- A votação deve ser secreta até o encerramento.
- O sistema deve registrar votos de forma consistente no banco de dados.
- O participante deve visualizar seu progresso.
- A aplicação deve recuperar o progresso após atualizar a página ou trocar de dispositivo, desde que a identidade ou sessão do participante seja recuperada com segurança.

Implemente validações no backend ou nas políticas e funções do banco. Não confie apenas nas validações do React.

Evite votos duplicados utilizando restrições de banco de dados e operações seguras contra concorrência.

A votação deve ter estados claros:

1. Sala aguardando participantes.
2. Votação aberta.
3. Votação encerrada.
4. Resultados liberados.

Não permita votar quando a votação estiver encerrada.

### 5.7. Experiência durante a votação

Crie uma tela agradável e simples para votar.

Para cada categoria, mostre:

- Nome da categoria.
- Descrição engraçada.
- Lista de participantes elegíveis.
- Botões ou cards para escolher uma pessoa.
- Confirmação do voto.
- Indicador de progresso.
- Ação para avançar para a próxima categoria.

Exiba mensagens divertidas e curtas, sem revelar antecipadamente o placar.

Exemplos de feedback:

- “Voto registrado. Sua consciência que lute.”
- “Mais uma categoria resolvida!”
- “Você está quase liberado para descobrir a verdade.”

Não mostre quem votou em quem.

### 5.8. Placar e revelação

Após o encerramento e a liberação pelo organizador, apresente os resultados.

Para cada categoria, mostre:

- Categoria e descrição.
- Participante vencedor.
- Quantidade de votos.
- Percentual de votos válidos, quando aplicável.
- Segundo colocado, apenas se houver dados suficientes e isso fizer sentido.
- Animação de revelação.
- Mensagem engraçada criada a partir de modelos de texto locais.

Exemplos:

- “O grupo decidiu: o prêmio Atraso Premium vai para…”
- “Não é uma fase. É um estilo de vida.”
- “A democracia falou. Agora aguente as consequências.”
- “A coroa é sua. A responsabilidade também.”

Implemente tratamento para empates. Quando houver empate, mostre todos os vencedores empatados ou utilize uma regra de desempate claramente definida antes da votação.

Nunca invente votos, nomes ou resultados.

Utilize atualizações em tempo real, quando viável, para atualizar o estado da sala e os resultados após sua liberação.

### 5.9. Cards compartilháveis

Gere cards visuais para compartilhar os resultados em redes sociais e grupos.

Cada card deve conter:

- Nome da categoria.
- Nome ou apelido do vencedor.
- Frase engraçada.
- Identidade visual do jogo.
- Referência à resenha, se o organizador permitir.

Utilize SVG, HTML para captura ou Canvas, escolhendo uma solução estável e compatível com navegadores móveis.

Permita:

- Baixar o card como imagem PNG.
- Compartilhar usando a Web Share API quando disponível.
- Copiar uma mensagem pronta.
- Compartilhar o link da resenha pelo WhatsApp.

Exemplo de mensagem:

“🏆 O prêmio CEO da Enrolação foi para [apelido] na Resenha Secreta! O grupo votou e não aceita recurso 😂”

Use URLs oficiais de compartilhamento e codifique os textos corretamente.

Quando a API de compartilhamento ou o download não estiver disponível, ofereça uma alternativa simples.

### 5.10. Painel do organizador

O organizador deve conseguir:

- Editar o nome da sala antes da votação.
- Gerenciar categorias antes do início.
- Compartilhar convites.
- Iniciar a votação.
- Acompanhar o andamento sem ver votos individuais.
- Encerrar a votação.
- Liberar os resultados.
- Encerrar a sala.
- Excluir a sala, respeitando as permissões e a política de retenção de dados.

Proteja ações administrativas com validações de autorização no backend.

Não confie em um simples indicador de administrador armazenado no navegador.

## 6. Banco de dados

Projete um modelo relacional no PostgreSQL do Supabase.

Considere entidades como:

- `rooms`: salas e configurações.
- `participants`: participantes de cada sala.
- `categories`: categorias disponíveis.
- `room_categories`: categorias habilitadas em cada sala.
- `votes`: votos registrados.
- `room_events`, somente se necessário para auditoria ou sincronização.

Ajuste os nomes e relacionamentos se uma modelagem melhor for identificada.

Requisitos:

- Chaves primárias e estrangeiras.
- Restrições de unicidade.
- Índices para consultas frequentes.
- Datas de criação e atualização quando apropriado.
- Regras de exclusão em cascata bem definidas.
- Migrações SQL versionadas no repositório.
- Dados iniciais de categorias.
- Separação adequada entre dados públicos e privados.

Crie as políticas de Row Level Security (RLS) para proteger os dados.

A política deve impedir que participantes não autorizados leiam votos individuais ou alterem votos de terceiros.

Avalie cuidadosamente a estratégia de identidade dos participantes, convites, permissões de organizador e acesso anônimo. Se forem necessárias funções SQL ou Edge Functions para garantir as regras, implemente-as e documente-as.

Nunca exponha a chave `service_role` no frontend.

Não use o `localStorage` como banco principal. Ele pode ser utilizado apenas para preferências não sensíveis ou para apoiar a recuperação de uma sessão de forma segura.

## 7. Segurança e privacidade

Implemente:

- Validação de dados no frontend e no backend.
- Sanitização e tratamento seguro de entradas.
- Proteção contra SQL injection por meio de consultas parametrizadas e APIs seguras.
- Políticas de autorização no banco.
- Limites de tamanho para nomes, mensagens e categorias.
- Proteção contra spam e criação abusiva de salas, dentro das capacidades do serviço.
- Tokens de convite difíceis de adivinhar, quando utilizados.
- Tratamento de erros sem expor credenciais ou informações internas.
- Política de privacidade simples e clara.
- Regras de retenção e exclusão de dados.
- Aviso de que os participantes devem usar apelidos e não publicar dados pessoais.

O organizador não deve ter acesso aos votos individuais durante a votação.

Os resultados agregados só devem ser acessíveis de acordo com o estado da sala.

Documente as limitações de segurança da participação anônima e implemente a estratégia mais segura possível dentro do escopo e dos recursos gratuitos escolhidos.

## 8. Responsividade e acessibilidade

A aplicação deve funcionar bem em:

- Celulares Android.
- iPhone.
- Tablets.
- Notebooks e desktops.

Requisitos:

- Layout mobile-first.
- Contraste adequado.
- Navegação por teclado.
- Estados de foco visíveis.
- Rótulos acessíveis.
- Botões com áreas de toque adequadas.
- Respeito à preferência por movimento reduzido.
- Mensagens de erro compreensíveis.
- Compatibilidade com navegadores modernos.

Evite dependências desnecessárias e mantenha a aplicação rápida mesmo em celulares modestos.

## 9. Rotas e navegação

Implemente rotas para:

- `/` — página inicial.
- `/criar` — criação de resenha.
- `/entrar` — entrada por código.
- `/resenha/:codigo` — sala e participantes.
- `/resenha/:codigo/votar` — votação.
- `/resenha/:codigo/resultado` — resultados.
- `/privacidade` — política de privacidade.
- Uma página de erro para links inválidos ou salas encerradas.

Configure o roteamento para funcionar no GitHub Pages, incluindo o tratamento de URLs diretas e recarregamento de páginas.

Configure corretamente a opção `base` do Vite para o caminho do repositório no GitHub Pages. Documente como ajustar a implantação para um domínio próprio.

## 10. Testes obrigatórios

Escreva testes para os principais fluxos:

- Criar uma sala.
- Entrar em uma sala.
- Validar apelidos.
- Impedir voto em si mesmo.
- Impedir votos duplicados.
- Impedir votação fora do período permitido.
- Não revelar votos individuais antes da liberação dos resultados.
- Calcular corretamente vencedores e empates.
- Tratar salas inexistentes ou encerradas.
- Proteger operações exclusivas do organizador.
- Gerar e compartilhar cards.
- Tratar erros de rede.

Separe testes unitários de testes de integração.

Não considere o projeto concluído apenas porque o frontend compila.

## 11. Organização do código

Organize o projeto em módulos coesos, com responsabilidades claras.

Sugestão de estrutura:

- `src/components`
- `src/pages`
- `src/features/rooms`
- `src/features/participants`
- `src/features/voting`
- `src/features/results`
- `src/features/sharing`
- `src/hooks`
- `src/lib`
- `src/services`
- `src/types`
- `src/styles`
- `src/utils`
- `supabase/migrations`
- `supabase/functions`
- `tests`

Ajuste a estrutura conforme necessário, sem criar abstrações excessivas.

Requisitos de código:

- TypeScript estrito.
- Tipos explícitos para entidades e respostas.
- Componentes pequenos e reutilizáveis.
- Lógica de negócio separada da interface.
- Tratamento centralizado de erros quando apropriado.
- Nomes claros e consistentes.
- Evitar duplicação.
- Não utilizar `any` sem justificativa.
- Não deixar botões sem funcionalidade.
- Não deixar funções críticas com `TODO`.
- Não usar dados simulados como se fossem dados reais.

## 12. Experiência de desenvolvimento e configuração

Crie um arquivo `.env.example` contendo apenas as variáveis públicas necessárias, por exemplo:

`VITE_SUPABASE_URL=`
`VITE_SUPABASE_ANON_KEY=`

Não coloque credenciais reais no repositório.

Adicione um `.gitignore` adequado.

Crie um `README.md` em português com:

- Descrição do projeto.
- Requisitos para desenvolvimento.
- Instalação das dependências.
- Configuração do Supabase.
- Execução das migrações.
- Configuração das políticas RLS.
- Configuração de variáveis de ambiente.
- Execução local.
- Execução dos testes.
- Build de produção.
- Publicação no GitHub Pages.
- Limitações do plano gratuito e dependências de serviços externos.
- Recomendações para manter os dados protegidos.

Disponibilize scripts claros no `package.json`, como:

- `dev`
- `build`
- `preview`
- `lint`
- `typecheck`
- `test`

Configure uma GitHub Action para executar verificações e publicar a aplicação no GitHub Pages após um push na branch principal, seguindo as práticas atuais recomendadas pelo GitHub.

## 13. Etapas de implementação

Trabalhe em etapas e valide cada uma antes de avançar.

### Etapa 1 — Inspeção e planejamento
- Inspecione o repositório.
- Identifique o que já existe.
- Defina a arquitetura.
- Proponha o modelo de dados.
- Identifique os riscos de segurança.
- Apresente um plano de implementação curto e objetivo.

### Etapa 2 — Estrutura inicial
- Configure Vite, React e TypeScript.
- Configure estilos, rotas e componentes base.
- Crie a identidade visual.
- Garanta que a aplicação execute localmente.

### Etapa 3 — Banco e segurança
- Crie as migrações SQL.
- Configure tabelas, índices e restrições.
- Implemente RLS.
- Implemente as operações necessárias para criar salas, entrar, votar e revelar resultados.
- Teste as permissões e os casos de acesso indevido.

### Etapa 4 — Fluxos principais
- Implementar criação e entrada em salas.
- Implementar participantes e convites.
- Implementar categorias e votação.
- Implementar encerramento e liberação dos resultados.

### Etapa 5 — Resultados e compartilhamento
- Implementar placar.
- Tratar empates.
- Criar cards PNG.
- Implementar compartilhamento e mensagens para WhatsApp.

### Etapa 6 — Testes e revisão
- Executar testes.
- Executar lint e verificação de tipos.
- Executar build.
- Corrigir erros.
- Revisar acessibilidade, segurança, responsividade e desempenho.

### Etapa 7 — Publicação
- Configurar GitHub Pages.
- Criar workflow de publicação.
- Documentar configuração do Supabase.
- Validar a aplicação publicada.
- Confirmar que links diretos e recarregamentos funcionam.

## 14. Critérios de conclusão

Considere o projeto concluído somente quando:

1. Um usuário consegue criar uma sala real.
2. Outras pessoas conseguem entrar por link ou código.
3. A sala é compartilhada entre dispositivos diferentes.
4. Os participantes conseguem votar nas categorias.
5. O banco impede votos duplicados e ações não autorizadas.
6. Os votos individuais permanecem secretos durante a votação.
7. Os resultados são calculados a partir dos votos reais.
8. Empates são tratados corretamente.
9. Os cards podem ser compartilhados ou baixados.
10. A aplicação funciona em celulares e desktops.
11. Os testes, o lint, o typecheck e o build passam.
12. O frontend pode ser publicado no GitHub Pages.
13. As instruções para configurar o backend estão completas.
14. Nenhuma chave secreta está exposta no frontend.
15. As funcionalidades essenciais não dependem de dados fictícios.

## 15. Instruções finais para o agente

- Comece inspecionando o repositório e apresentando o plano.
- Em seguida, implemente o projeto em etapas, sem parar apenas na documentação.
- Tome decisões técnicas coerentes e explique brevemente as decisões importantes.
- Prefira soluções simples, robustas e de baixo custo.
- Não adicione serviços pagos como dependência obrigatória.
- Não presuma que o Supabase está configurado: crie os arquivos e explique os passos necessários.
- Se uma credencial ou ação externa for necessária, deixe a configuração preparada e informe exatamente o que precisa ser feito manualmente.
- Não afirme que uma funcionalidade foi testada se ela não foi executada.
- Ao final de cada etapa, informe os arquivos criados ou alterados, os comandos executados, os resultados dos testes e eventuais pendências.
- Se encontrar um problema, investigue a causa antes de aplicar uma correção.
- Mantenha o código organizado, tipado e fácil de evoluir.

**Resultado esperado:** uma aplicação funcional, divertida e compartilhável, pronta para ser configurada com o Supabase e publicada no GitHub Pages, com uma experiência de uso que incentive grupos de amigos a participar, votar e compartilhar os resultados da Resenha Secreta.

