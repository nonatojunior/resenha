-- Teste de fumaça do backend (executar em um PostgreSQL local com a migração aplicada).
-- Uso: psql -h /tmp -p 55432 -U postgres -v ON_ERROR_STOP=1 -f supabase/tests/smoke.sql

\set ON_ERROR_STOP on
set role anon;

-- ---------------------------------------------------------------------------
-- Criação da sala, sessão do organizador e categoria personalizada
-- ---------------------------------------------------------------------------

select
  created->>'token' as org_token,
  created->'session'->'room'->>'code' as room_code,
  created->'session'->'room'->'categories'->0->>'id' as cat1,
  created->'session'->'participant'->>'id' as org_id
from (
  select public.create_room(
    'Confraternização do Time',
    'Nonato',
    'trabalho',
    null,
    'confraternizacao',
    'link',
    null,
    null,
    array['ceo-da-enrolacao', 'atraso-premium', 'agente-do-caos'],
    '[{"name":"Melhor Abraço","description":"Quem sempre resolve tudo com um abraço."}]'::jsonb,
    true,
    false
  ) as created
) data
\gset

select set_config('test.room_code', :'room_code', false),
       set_config('test.org_token', :'org_token', false),
       set_config('test.cat1', :'cat1', false),
       set_config('test.org_id', :'org_id', false);

do $$
declare
  v_room jsonb;
begin
  v_room := public.get_session(current_setting('test.room_code'), current_setting('test.org_token'))->'room';
  if v_room->>'status' <> 'lobby' then
    raise exception 'TEST_FAIL: sala deveria começar em lobby';
  end if;
  if jsonb_array_length(v_room->'categories') <> 4 then
    raise exception 'TEST_FAIL: a sala deveria ter 3 categorias padrão + 1 personalizada';
  end if;
  if v_room->'participantCount' <> '1'::jsonb then
    raise exception 'TEST_FAIL: a sala deveria começar com 1 participante';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Entrada de participante + apelido duplicado
-- ---------------------------------------------------------------------------

select
  joined->>'token' as guest_token,
  joined->'session'->'participant'->>'id' as guest_id
from (
  select public.join_room(current_setting('test.room_code'), 'Bia', null) as joined
) data
\gset

select set_config('test.guest_token', :'guest_token', false),
       set_config('test.guest_id', :'guest_id', false);

do $$
begin
  begin
    perform public.join_room(current_setting('test.room_code'), '  bia  ', null);
    raise exception 'TEST_FAIL: apelido duplicado foi aceito';
  exception when others then
    if sqlerrm <> 'NICKNAME_TAKEN' then
      raise;
    end if;
  end;
end
$$;

-- ---------------------------------------------------------------------------
-- Autorização: convidado não pode iniciar a votação
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    perform public.start_voting(
      current_setting('test.room_code'),
      current_setting('test.guest_token')
    );
    raise exception 'TEST_FAIL: convidado iniciou a votação';
  exception when others then
    if sqlerrm <> 'UNAUTHORIZED' then
      raise;
    end if;
  end;
end
$$;

-- ---------------------------------------------------------------------------
-- Votação: um voto por categoria, sem voto em si, sem alteração por padrão
-- ---------------------------------------------------------------------------

select public.start_voting(
  current_setting('test.room_code'),
  current_setting('test.org_token')
) as started
\gset

select set_config('test.started', :'started', false);

do $$
begin
  if (current_setting('test.started')::jsonb)->'room'->>'status' <> 'voting' then
    raise exception 'TEST_FAIL: a votação não abriu';
  end if;
end
$$;

select public.submit_vote(
  current_setting('test.room_code'),
  current_setting('test.org_token'),
  current_setting('test.cat1')::uuid,
  current_setting('test.guest_id')::uuid
) as org_vote
\gset

select public.submit_vote(
  current_setting('test.room_code'),
  current_setting('test.guest_token'),
  current_setting('test.cat1')::uuid,
  current_setting('test.org_id')::uuid
) as guest_vote
\gset

do $$
declare
  v_guest_session jsonb;
  v_org_session jsonb;
begin
  v_guest_session := public.get_session(
    current_setting('test.room_code'),
    current_setting('test.guest_token')
  );
  v_org_session := public.get_session(
    current_setting('test.room_code'),
    current_setting('test.org_token')
  );

  if v_guest_session::text like '%targetId%' or v_guest_session::text like '%voterId%' then
    raise exception 'TEST_FAIL: sessão expôs estrutura de votos individuais';
  end if;
  if (select count(*) from jsonb_object_keys(v_guest_session->'myVotes')) <> 1 then
    raise exception 'TEST_FAIL: convidado deveria ver apenas o próprio voto';
  end if;
  if jsonb_array_length(v_org_session->'votingProgress') <> 2 then
    raise exception 'TEST_FAIL: organizador deveria ver o progresso agregado';
  end if;

  begin
    perform public.submit_vote(
      current_setting('test.room_code'),
      current_setting('test.org_token'),
      current_setting('test.cat1')::uuid,
      current_setting('test.guest_id')::uuid
    );
    raise exception 'TEST_FAIL: voto duplicado foi aceito';
  exception when others then
    if sqlerrm <> 'DUPLICATE_VOTE' then
      raise;
    end if;
  end;

  begin
    perform public.submit_vote(
      current_setting('test.room_code'),
      current_setting('test.org_token'),
      current_setting('test.cat1')::uuid,
      current_setting('test.org_id')::uuid
    );
    raise exception 'TEST_FAIL: voto em si mesmo foi aceito';
  exception when others then
    if sqlerrm <> 'SELF_VOTE' then
      raise;
    end if;
  end;
end
$$;

-- ---------------------------------------------------------------------------
-- Resultados bloqueados até a revelação e cálculo de empate
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    perform public.get_results(
      current_setting('test.room_code'),
      current_setting('test.org_token')
    );
    raise exception 'TEST_FAIL: resultados liberados antes da revelação';
  exception when others then
    if sqlerrm <> 'REVEAL_NOT_READY' then
      raise;
    end if;
  end;
end
$$;

select public.close_voting(
  current_setting('test.room_code'),
  current_setting('test.org_token')
) as closed
\gset

do $$
begin
  begin
    perform public.submit_vote(
      current_setting('test.room_code'),
      current_setting('test.org_token'),
      current_setting('test.cat1')::uuid,
      current_setting('test.guest_id')::uuid
    );
    raise exception 'TEST_FAIL: voto aceito após o encerramento';
  exception when others then
    if sqlerrm <> 'VOTING_CLOSED' then
      raise;
    end if;
  end;
end
$$;

select public.reveal_results(
  current_setting('test.room_code'),
  current_setting('test.org_token')
) as revealed
\gset

select public.get_results(
  current_setting('test.room_code'),
  current_setting('test.org_token')
) as results
\gset

select set_config('test.results', :'results', false);

do $$
declare
  v_results jsonb := current_setting('test.results')::jsonb;
  v_public jsonb;
  v_first jsonb;
begin
  v_first := v_results->'categories'->0;
  if (v_results->'room'->>'status') <> 'revealed' then
    raise exception 'TEST_FAIL: sala não foi revelada';
  end if;
  if v_first->>'tie' <> 'true' then
    raise exception 'TEST_FAIL: empate 1x1 não foi detectado';
  end if;
  if jsonb_array_length(v_first->'winners') <> 2 then
    raise exception 'TEST_FAIL: empate deveria listar os dois vencedores';
  end if;
  if ((v_first->'winners'->0->>'percentage')::numeric) <> 50 then
    raise exception 'TEST_FAIL: percentual do empate incorreto';
  end if;
  if (v_results->>'totalVoters') <> '2' then
    raise exception 'TEST_FAIL: total de votantes incorreto';
  end if;

  v_public := public.get_public_results(current_setting('test.room_code'));
  if v_public <> v_results then
    raise exception 'TEST_FAIL: resultado público difere do resultado autenticado';
  end if;

  begin
    perform public.get_results(current_setting('test.room_code'), 'token-invalido');
    raise exception 'TEST_FAIL: token inválido acessou resultados';
  exception when others then
    if sqlerrm <> 'UNAUTHORIZED' then
      raise;
    end if;
  end;
end
$$;

-- ---------------------------------------------------------------------------
-- Acesso direto às tabelas deve ser negado (RLS + grants)
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    perform count(*) from public.votes;
    raise exception 'TEST_FAIL: anon conseguiu ler votos diretamente';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

-- ---------------------------------------------------------------------------
-- Sala com código de acesso e validação do código
-- ---------------------------------------------------------------------------

select
  created->>'token' as private_org_token,
  created->'session'->'room'->>'code' as private_code
from (
  select public.create_room(
    'Resenha Secreta da Família',
    'Tia Ana',
    'familia',
    null,
    'natal',
    'code',
    'NOEL2026',
    null,
    array['fiscal-da-ceia'],
    '[]'::jsonb,
    false,
    false
  ) as created
) data
\gset

select set_config('test.private_code', :'private_code', false),
       set_config('test.private_org_token', :'private_org_token', false);

do $$
begin
  if (public.get_room_preview(current_setting('test.private_code'))->>'hasAccessCode') <> 'true' then
    raise exception 'TEST_FAIL: preview não informou o código de acesso';
  end if;

  begin
    perform public.join_room(current_setting('test.private_code'), 'Primo', 'ERRADO');
    raise exception 'TEST_FAIL: código de acesso incorreto foi aceito';
  exception when others then
    if sqlerrm <> 'INVALID_ACCESS_CODE' then
      raise;
    end if;
  end;

  perform public.join_room(current_setting('test.private_code'), 'Primo', 'noel2026');
end
$$;

-- ---------------------------------------------------------------------------
-- Limpeza
-- ---------------------------------------------------------------------------

select public.delete_room(
  current_setting('test.room_code'),
  current_setting('test.org_token')
) as deleted_first
\gset

select public.delete_room(
  current_setting('test.private_code'),
  current_setting('test.private_org_token')
) as deleted_second
\gset

\echo 'SMOKE TEST OK'
