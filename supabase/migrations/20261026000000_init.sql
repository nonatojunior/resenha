-- Resenha Secreta — esquema inicial
-- Todas as operações do app passam por RPCs SECURITY DEFINER.
-- As tabelas têm RLS habilitado sem políticas públicas e privilégios diretos revogados.
-- Tokens de participantes são guardados apenas como hash SHA-256.

create extension if not exists pgcrypto with schema extensions;

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Funções utilitárias
-- ---------------------------------------------------------------------------

create or replace function public.nickname_key(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select lower(
    regexp_replace(
      translate(
        trim(coalesce(p_value, '')),
        'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
        'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  organizer_name text not null,
  group_type text not null,
  custom_group_type text,
  theme text not null default 'livre',
  status text not null default 'lobby',
  visibility text not null default 'link',
  access_code_hash text,
  reveal_at timestamptz,
  allow_late_join boolean not null default true,
  allow_vote_change boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  voting_started_at timestamptz,
  voting_closed_at timestamptz,
  revealed_at timestamptz,
  archived_at timestamptz,
  constraint rooms_code_format check (code ~ '^[A-Z0-9]{6}$'),
  constraint rooms_name_length check (char_length(name) between 3 and 60),
  constraint rooms_organizer_name_length check (char_length(organizer_name) between 2 and 24),
  constraint rooms_group_type_check check (group_type in ('amigos', 'familia', 'trabalho', 'personalizado')),
  constraint rooms_theme_check check (theme in ('livre', 'natal', 'ano-novo', 'aniversario', 'confraternizacao')),
  constraint rooms_status_check check (status in ('lobby', 'voting', 'closed', 'revealed', 'archived')),
  constraint rooms_visibility_check check (visibility in ('link', 'code')),
  constraint rooms_access_code_check check (visibility = 'link' or access_code_hash is not null),
  constraint rooms_custom_group_check check (group_type <> 'personalizado' or custom_group_type is not null)
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null,
  nickname_key text not null,
  role text not null default 'guest',
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint participants_nickname_length check (char_length(nickname) between 2 and 24),
  constraint participants_role_check check (role in ('organizer', 'guest'))
);

create unique index if not exists participants_room_nickname_key_idx
  on public.participants(room_id, nickname_key);
create index if not exists participants_room_id_idx on public.participants(room_id);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  slug text unique,
  name text not null,
  description text not null,
  icon text not null default 'sparkles',
  voting_rule text not null default 'Escolha uma pessoa do grupo — menos você mesmo.',
  is_default boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(name) between 3 and 40),
  constraint categories_description_length check (char_length(description) between 5 and 120),
  constraint categories_custom_has_room check ((is_default and room_id is null and slug is not null) or (not is_default and room_id is not null and slug is null))
);

create index if not exists categories_room_id_idx on public.categories(room_id);
create unique index if not exists categories_room_name_unique_idx
  on public.categories(room_id, lower(name))
  where room_id is not null;

create table if not exists public.room_categories (
  room_id uuid not null references public.rooms(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  position integer not null default 0,
  primary key (room_id, category_id)
);

create index if not exists room_categories_room_id_idx on public.room_categories(room_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  category_id uuid not null,
  voter_id uuid not null references public.participants(id) on delete cascade,
  target_id uuid not null references public.participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_not_self check (voter_id <> target_id),
  constraint votes_category_enabled foreign key (room_id, category_id)
    references public.room_categories(room_id, category_id) on delete cascade,
  constraint votes_one_per_category unique (room_id, category_id, voter_id)
);

create index if not exists votes_room_category_idx on public.votes(room_id, category_id);
create index if not exists votes_room_voter_idx on public.votes(room_id, voter_id);
create index if not exists votes_room_target_idx on public.votes(room_id, target_id);

create or replace function public.validate_vote_room()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.participants
    where id = new.voter_id and room_id = new.room_id
  ) then
    raise exception 'INVALID_TARGET';
  end if;

  if not exists (
    select 1 from public.participants
    where id = new.target_id and room_id = new.room_id
  ) then
    raise exception 'INVALID_TARGET';
  end if;

  if new.voter_id = new.target_id then
    raise exception 'SELF_VOTE';
  end if;

  return new;
end;
$$;

drop trigger if exists votes_validate_room on public.votes;
create trigger votes_validate_room
  before insert or update on public.votes
  for each row execute procedure public.validate_vote_room();

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Categorias iniciais
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, description, icon, is_default, position)
values
  ('ceo-da-enrolacao', 'CEO da Enrolação', 'Quem sempre promete, marca o rolê e nunca entrega.', 'briefcase', true, 0),
  ('fantasma-do-whatsapp', 'Fantasma do WhatsApp', 'Quem aparece, responde "oi" e desaparece por três dias.', 'ghost', true, 1),
  ('prefeito-da-resenha', 'Prefeito da Resenha', 'Quem organiza tudo e ainda cobra presença no grupo.', 'map', true, 2),
  ('agente-do-caos', 'Agente do Caos', 'Quem transforma qualquer situação simples em uma história inexplicável.', 'zap', true, 3),
  ('fiscal-da-ceia', 'Fiscal da Ceia', 'Quem opina sobre cada prato antes mesmo de provar.', 'utensils', true, 4),
  ('rei-das-desculpas', 'Rei ou Rainha das Desculpas', 'Quem sempre tem uma justificativa cinematográfica pronta.', 'speech', true, 5),
  ('emocionado-do-grupo', 'Emocionado do Grupo', 'Quem se empolga primeiro e já quer fazer o próximo encontro.', 'heart', true, 6),
  ('atraso-premium', 'Atraso Premium', 'Quem nunca chega no horário e ainda diz que está saindo de casa.', 'clock', true, 7),
  ('influencer-nao-remunerado', 'Influencer Não Remunerado', 'Quem registra o rolê inteiro como se fosse uma produção de cinema.', 'camera', true, 8),
  ('detetive-da-fofoca', 'Detetive da Fofoca', 'Quem sempre sabe da novidade antes de ela acontecer.', 'search', true, 9),
  ('patrimonio-imaginario', 'Patrimônio Imaginário', 'Quem já comprou três apartamentos, dois carros e uma ilha no plano mental.', 'gem', true, 10),
  ('estou-chegando', '"Estou Chegando"', 'Quem manda "estou chegando" ainda de pijama, com o delivery na porta.', 'car', true, 11),
  ('contador-de-historias', 'Contador de Histórias', 'Quem aumenta cada detalhe até a história virar uma minissérie.', 'book', true, 12),
  ('esqueceria-o-presente', 'Esqueceria o Próprio Presente', 'Quem chega na festa com tudo, menos a lembrança combinada.', 'gift', true, 13),
  ('sem-celular', 'Sobrevivência sem Celular', 'Quem não aguentaria 40 minutos desconectado da bateria e do grupo.', 'smartphone', true, 14),
  ('aventura-de-viagem', 'Aventura de Viagem', 'Quem transformaria uma ida ao mercado em uma expedição internacional.', 'compass', true, 15)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  is_default = true,
  position = excluded.position;

-- ---------------------------------------------------------------------------
-- Serialização de sala e sessão (helpers internos)
-- ---------------------------------------------------------------------------

create or replace function public.build_room(p_room public.rooms)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', r.id,
    'code', r.code,
    'name', r.name,
    'organizerName', r.organizer_name,
    'groupType', r.group_type,
    'customGroupType', r.custom_group_type,
    'theme', r.theme,
    'status', r.status,
    'visibility', r.visibility,
    'hasAccessCode', r.access_code_hash is not null,
    'revealAt', r.reveal_at,
    'allowLateJoin', r.allow_late_join,
    'allowVoteChange', r.allow_vote_change,
    'participantCount', (select count(*)::int from public.participants p where p.room_id = r.id),
    'categories', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'slug', c.slug,
            'name', c.name,
            'description', c.description,
            'icon', c.icon,
            'votingRule', c.voting_rule,
            'isCustom', c.room_id is not null,
            'position', rc.position
          )
          order by rc.position, c.name
        )
        from public.room_categories rc
        join public.categories c on c.id = rc.category_id
        where rc.room_id = r.id
      ),
      '[]'::jsonb
    ),
    'votingSummary', jsonb_build_object(
      'started', (
        select count(distinct v.voter_id)::int
        from public.votes v
        where v.room_id = r.id
      ),
      'completed', (
        select count(*)::int
        from (
          select v.voter_id
          from public.votes v
          where v.room_id = r.id
          group by v.voter_id
          having count(*) >= (
            select count(*) from public.room_categories rc where rc.room_id = r.id
          )
        ) completed
      ),
      'totalParticipants', (
        select count(*)::int from public.participants p where p.room_id = r.id
      ),
      'totalCategories', (
        select count(*)::int from public.room_categories rc where rc.room_id = r.id
      )
    ),
    'createdAt', r.created_at,
    'votingStartedAt', r.voting_started_at,
    'votingClosedAt', r.voting_closed_at,
    'revealedAt', r.revealed_at
  )
  from public.rooms r
  where r.id = p_room.id;
$$;

create or replace function public.build_session(
  p_room public.rooms,
  p_participant public.participants
)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'room', public.build_room(p_room),
    'participant', jsonb_build_object(
      'id', p_participant.id,
      'nickname', p_participant.nickname,
      'role', p_participant.role,
      'joinedAt', p_participant.created_at
    ),
    'participants', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'nickname', p.nickname,
            'role', p.role,
            'joinedAt', p.created_at
          )
          order by p.created_at, p.nickname
        )
        from public.participants p
        where p.room_id = p_room.id
      ),
      '[]'::jsonb
    ),
    'myVotes', coalesce(
      (
        select jsonb_object_agg(v.category_id::text, v.target_id)
        from public.votes v
        where v.room_id = p_room.id and v.voter_id = p_participant.id
      ),
      '{}'::jsonb
    ),
    'votingProgress', case
      when p_participant.role = 'organizer' then coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'participantId', p.id,
              'nickname', p.nickname,
              'answered', (
                select count(*)::int
                from public.votes v
                where v.room_id = p_room.id and v.voter_id = p.id
              ),
              'total', (
                select count(*)::int
                from public.room_categories rc
                where rc.room_id = p_room.id
              )
            )
            order by p.created_at, p.nickname
          )
          from public.participants p
          where p.room_id = p_room.id
        ),
        '[]'::jsonb
      )
      else null
    end
  );
$$;

-- ---------------------------------------------------------------------------
-- Categorias da sala
-- ---------------------------------------------------------------------------

create or replace function public.apply_room_categories(
  p_room_id uuid,
  p_category_slugs text[],
  p_custom_categories jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_slug text;
  v_category public.categories%rowtype;
  v_custom jsonb;
  v_name text;
  v_description text;
  v_position integer := 0;
  v_custom_id uuid;
  v_custom_count integer;
begin
  if p_category_slugs is null or array_length(p_category_slugs, 1) is null then
    raise exception 'NOT_ENOUGH_CATEGORIES';
  end if;
  if array_length(p_category_slugs, 1) > 20 then
    raise exception 'INVALID_CATEGORY';
  end if;
  if p_custom_categories is null or jsonb_typeof(p_custom_categories) <> 'array' then
    raise exception 'INVALID_INPUT';
  end if;

  v_custom_count := jsonb_array_length(p_custom_categories);
  if v_custom_count > 6 then
    raise exception 'INVALID_INPUT';
  end if;

  delete from public.room_categories where room_id = p_room_id;
  delete from public.categories where room_id = p_room_id;

  foreach v_slug in array p_category_slugs loop
    select * into v_category
    from public.categories
    where slug = v_slug and is_default = true;

    if not found then
      raise exception 'INVALID_CATEGORY';
    end if;

    if not exists (
      select 1 from public.room_categories
      where room_id = p_room_id and category_id = v_category.id
    ) then
      insert into public.room_categories (room_id, category_id, position)
      values (p_room_id, v_category.id, v_position);
      v_position := v_position + 1;
    end if;
  end loop;

  for v_custom in select * from jsonb_array_elements(p_custom_categories)
  loop
    v_name := regexp_replace(trim(coalesce(v_custom->>'name', '')), '\s+', ' ', 'g');
    v_description := regexp_replace(trim(coalesce(v_custom->>'description', '')), '\s+', ' ', 'g');

    if char_length(v_name) < 3 or char_length(v_name) > 40 then
      raise exception 'INVALID_INPUT';
    end if;
    if char_length(v_description) < 5 or char_length(v_description) > 120 then
      raise exception 'INVALID_INPUT';
    end if;

    if exists (
      select 1
      from public.room_categories rc
      join public.categories c on c.id = rc.category_id
      where rc.room_id = p_room_id
        and public.nickname_key(c.name) = public.nickname_key(v_name)
    ) then
      raise exception 'INVALID_INPUT';
    end if;

    insert into public.categories (room_id, name, description, icon, is_default, position)
    values (p_room_id, v_name, v_description, 'sparkles', false, v_position)
    returning id into v_custom_id;

    insert into public.room_categories (room_id, category_id, position)
    values (p_room_id, v_custom_id, v_position);

    v_position := v_position + 1;
  end loop;

  if v_position = 0 then
    raise exception 'NOT_ENOUGH_CATEGORIES';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs públicas
-- ---------------------------------------------------------------------------

create or replace function public.create_room(
  p_name text,
  p_organizer_name text,
  p_group_type text,
  p_custom_group_type text,
  p_theme text,
  p_visibility text,
  p_access_code text,
  p_reveal_at timestamptz,
  p_category_slugs text[],
  p_custom_categories jsonb,
  p_allow_late_join boolean,
  p_allow_vote_change boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_code text;
  v_token text;
  v_name text;
  v_nickname text;
  v_access_hash text;
  i integer;
begin
  v_name := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_nickname := regexp_replace(trim(coalesce(p_organizer_name, '')), '\s+', ' ', 'g');

  if char_length(v_name) < 3 or char_length(v_name) > 60 then
    raise exception 'INVALID_INPUT';
  end if;
  if char_length(v_nickname) < 2 or char_length(v_nickname) > 24
     or v_nickname !~ '^[A-Za-zÀ-ÿ0-9 ._-]+$' then
    raise exception 'INVALID_NICKNAME';
  end if;
  if p_group_type not in ('amigos', 'familia', 'trabalho', 'personalizado') then
    raise exception 'INVALID_INPUT';
  end if;
  if p_group_type = 'personalizado' then
    if p_custom_group_type is null
       or char_length(trim(p_custom_group_type)) < 3
       or char_length(trim(p_custom_group_type)) > 30 then
      raise exception 'INVALID_INPUT';
    end if;
  end if;
  if p_theme not in ('livre', 'natal', 'ano-novo', 'aniversario', 'confraternizacao') then
    raise exception 'INVALID_INPUT';
  end if;
  if p_visibility not in ('link', 'code') then
    raise exception 'INVALID_INPUT';
  end if;
  if p_visibility = 'code' then
    if p_access_code is null or trim(p_access_code) !~ '^[A-Za-z0-9]{4,16}$' then
      raise exception 'ACCESS_CODE_REQUIRED';
    end if;
    v_access_hash := encode(digest(upper(trim(p_access_code)), 'sha256'), 'hex');
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
        (get_byte(gen_random_bytes(1), 0) % 32) + 1,
        1
      );
    end loop;
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.rooms (
    code, name, organizer_name, group_type, custom_group_type, theme,
    visibility, access_code_hash, reveal_at, allow_late_join, allow_vote_change
  )
  values (
    v_code, v_name, v_nickname, p_group_type,
    case when p_group_type = 'personalizado' then trim(p_custom_group_type) else null end,
    p_theme, p_visibility, v_access_hash, p_reveal_at,
    coalesce(p_allow_late_join, true), coalesce(p_allow_vote_change, false)
  )
  returning * into v_room;

  insert into public.participants (room_id, nickname, nickname_key, role, token_hash)
  values (
    v_room.id,
    v_nickname,
    public.nickname_key(v_nickname),
    'organizer',
    encode(digest(v_token, 'sha256'), 'hex')
  )
  returning * into v_participant;

  perform public.apply_room_categories(v_room.id, p_category_slugs, p_custom_categories);

  return jsonb_build_object(
    'token', v_token,
    'session', public.build_session(v_room, v_participant)
  );
end;
$$;

create or replace function public.get_room_preview(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')));

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'code', v_room.code,
    'name', v_room.name,
    'status', v_room.status,
    'visibility', v_room.visibility,
    'hasAccessCode', v_room.access_code_hash is not null,
    'groupType', v_room.group_type,
    'theme', v_room.theme,
    'participantCount', (
      select count(*)::int from public.participants p where p.room_id = v_room.id
    ),
    'createdAt', v_room.created_at
  );
end;
$$;

create or replace function public.join_room(
  p_code text,
  p_nickname text,
  p_access_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_token text;
  v_nickname text;
  v_count integer;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.status = 'archived' then
    raise exception 'ROOM_ARCHIVED';
  end if;
  if v_room.status in ('closed', 'revealed') then
    raise exception 'ROOM_CLOSED';
  end if;
  if v_room.status = 'voting' and not v_room.allow_late_join then
    raise exception 'VOTING_CLOSED';
  end if;

  if v_room.visibility = 'code' then
    if p_access_code is null or trim(p_access_code) = '' then
      raise exception 'ACCESS_CODE_REQUIRED';
    end if;
    if v_room.access_code_hash <> encode(digest(upper(trim(p_access_code)), 'sha256'), 'hex') then
      raise exception 'INVALID_ACCESS_CODE';
    end if;
  end if;

  v_nickname := regexp_replace(trim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  if char_length(v_nickname) < 2 or char_length(v_nickname) > 24
     or v_nickname !~ '^[A-Za-zÀ-ÿ0-9 ._-]+$' then
    raise exception 'INVALID_NICKNAME';
  end if;

  select count(*)::int into v_count
  from public.participants
  where room_id = v_room.id;

  if v_count >= 80 then
    raise exception 'INVALID_INPUT';
  end if;

  if exists (
    select 1 from public.participants
    where room_id = v_room.id and nickname_key = public.nickname_key(v_nickname)
  ) then
    raise exception 'NICKNAME_TAKEN';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  begin
    insert into public.participants (room_id, nickname, nickname_key, role, token_hash)
    values (
      v_room.id,
      v_nickname,
      public.nickname_key(v_nickname),
      'guest',
      encode(digest(v_token, 'sha256'), 'hex')
    )
    returning * into v_participant;
  exception when unique_violation then
    raise exception 'NICKNAME_TAKEN';
  end;

  return jsonb_build_object(
    'token', v_token,
    'session', public.build_session(v_room, v_participant)
  );
end;
$$;

create or replace function public.get_session(p_code text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')));

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.participants
  set last_seen_at = now()
  where id = v_participant.id;

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.update_room(
  p_code text,
  p_token text,
  p_name text,
  p_category_slugs text[],
  p_custom_categories jsonb,
  p_allow_late_join boolean,
  p_allow_vote_change boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_name text;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found or v_participant.role <> 'organizer' then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status <> 'lobby' then
    raise exception 'VOTING_NOT_OPEN';
  end if;

  v_name := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if char_length(v_name) < 3 or char_length(v_name) > 60 then
    raise exception 'INVALID_INPUT';
  end if;

  update public.rooms
  set
    name = v_name,
    allow_late_join = coalesce(p_allow_late_join, allow_late_join),
    allow_vote_change = coalesce(p_allow_vote_change, allow_vote_change)
  where id = v_room.id
  returning * into v_room;

  perform public.apply_room_categories(v_room.id, p_category_slugs, p_custom_categories);

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.start_voting(p_code text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_count integer;
  v_categories integer;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found or v_participant.role <> 'organizer' then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status <> 'lobby' then
    raise exception 'VOTING_NOT_OPEN';
  end if;

  select count(*)::int into v_count from public.participants where room_id = v_room.id;
  select count(*)::int into v_categories from public.room_categories where room_id = v_room.id;

  if v_count < 2 then
    raise exception 'NOT_ENOUGH_PARTICIPANTS';
  end if;
  if v_categories < 1 then
    raise exception 'NOT_ENOUGH_CATEGORIES';
  end if;

  update public.rooms
  set status = 'voting', voting_started_at = now()
  where id = v_room.id
  returning * into v_room;

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.close_voting(p_code text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found or v_participant.role <> 'organizer' then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status <> 'voting' then
    raise exception 'VOTING_NOT_OPEN';
  end if;

  update public.rooms
  set status = 'closed', voting_closed_at = now()
  where id = v_room.id
  returning * into v_room;

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.reveal_results(p_code text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found or v_participant.role <> 'organizer' then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status <> 'closed' then
    raise exception 'REVEAL_NOT_READY';
  end if;

  update public.rooms
  set status = 'revealed', revealed_at = now()
  where id = v_room.id
  returning * into v_room;

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.archive_room(p_code text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found or v_participant.role <> 'organizer' then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status not in ('closed', 'revealed') then
    raise exception 'INVALID_INPUT';
  end if;

  update public.rooms
  set status = 'archived', archived_at = now()
  where id = v_room.id
  returning * into v_room;

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.delete_room(p_code text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found or v_participant.role <> 'organizer' then
    raise exception 'UNAUTHORIZED';
  end if;

  delete from public.rooms where id = v_room.id;

  return jsonb_build_object('deleted', true);
end;
$$;

create or replace function public.submit_vote(
  p_code text,
  p_token text,
  p_category_id uuid,
  p_target_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_vote_id uuid;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status <> 'voting' then
    if v_room.status in ('closed', 'revealed', 'archived') then
      raise exception 'VOTING_CLOSED';
    end if;
    raise exception 'VOTING_NOT_OPEN';
  end if;

  if not exists (
    select 1 from public.room_categories
    where room_id = v_room.id and category_id = p_category_id
  ) then
    raise exception 'INVALID_CATEGORY';
  end if;

  if not exists (
    select 1 from public.participants
    where id = p_target_id and room_id = v_room.id
  ) then
    raise exception 'INVALID_TARGET';
  end if;

  if p_target_id = v_participant.id then
    raise exception 'SELF_VOTE';
  end if;

  select id into v_vote_id
  from public.votes
  where room_id = v_room.id
    and category_id = p_category_id
    and voter_id = v_participant.id;

  if found then
    if not v_room.allow_vote_change then
      raise exception 'DUPLICATE_VOTE';
    end if;
    update public.votes
    set target_id = p_target_id, created_at = now()
    where id = v_vote_id;
  else
    begin
      insert into public.votes (room_id, category_id, voter_id, target_id)
      values (v_room.id, p_category_id, v_participant.id, p_target_id);
    exception when unique_violation then
      if not v_room.allow_vote_change then
        raise exception 'DUPLICATE_VOTE';
      end if;
      update public.votes
      set target_id = p_target_id, created_at = now()
      where room_id = v_room.id
        and category_id = p_category_id
        and voter_id = v_participant.id;
    end;
  end if;

  return public.build_session(v_room, v_participant);
end;
$$;

create or replace function public.build_results(p_room public.rooms)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_category public.categories%rowtype;
  v_categories jsonb := '[]'::jsonb;
  v_winners jsonb;
  v_runner_ups jsonb;
  v_total integer;
  v_max integer;
  v_runner integer;
  v_total_voters integer;
  v_total_participants integer;
  v_position integer;
begin
  v_room := p_room;

  for v_category in
    select c.*
    from public.room_categories rc
    join public.categories c on c.id = rc.category_id
    where rc.room_id = v_room.id
    order by rc.position, c.name
  loop
    v_position := (
      select rc.position
      from public.room_categories rc
      where rc.room_id = v_room.id and rc.category_id = v_category.id
    );
    v_winners := '[]'::jsonb;
    v_runner_ups := '[]'::jsonb;
    v_max := 0;
    v_runner := 0;

    select count(*)::int into v_total
    from public.votes
    where room_id = v_room.id and category_id = v_category.id;

    if v_total > 0 then
      select max(cnt)::int into v_max
      from (
        select count(*) as cnt
        from public.votes
        where room_id = v_room.id and category_id = v_category.id
        group by target_id
      ) counts;

      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'participantId', p.id,
            'nickname', p.nickname,
            'votes', c.cnt,
            'percentage', round((c.cnt::numeric / v_total::numeric) * 100, 1)
          )
          order by c.cnt desc, p.nickname
        ),
        '[]'::jsonb
      )
      into v_winners
      from (
        select target_id, count(*)::int as cnt
        from public.votes
        where room_id = v_room.id and category_id = v_category.id
        group by target_id
      ) c
      join public.participants p on p.id = c.target_id
      where c.cnt = v_max;

      select coalesce(max(cnt)::int, 0) into v_runner
      from (
        select count(*)::int as cnt
        from public.votes
        where room_id = v_room.id and category_id = v_category.id
        group by target_id
      ) counts
      where cnt < v_max;

      if v_runner > 0 then
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'participantId', p.id,
              'nickname', p.nickname,
              'votes', c.cnt,
              'percentage', round((c.cnt::numeric / v_total::numeric) * 100, 1)
            )
            order by c.cnt desc, p.nickname
          ),
          '[]'::jsonb
        )
        into v_runner_ups
        from (
          select target_id, count(*)::int as cnt
          from public.votes
          where room_id = v_room.id and category_id = v_category.id
          group by target_id
        ) c
        join public.participants p on p.id = c.target_id
        where c.cnt = v_runner;
      end if;
    end if;

    v_categories := v_categories || jsonb_build_array(
      jsonb_build_object(
        'category', jsonb_build_object(
          'id', v_category.id,
          'slug', v_category.slug,
          'name', v_category.name,
          'description', v_category.description,
          'icon', v_category.icon,
          'votingRule', v_category.voting_rule,
          'isCustom', v_category.room_id is not null,
          'position', v_position
        ),
        'totalVotes', v_total,
        'winners', v_winners,
        'runnerUps', v_runner_ups,
        'tie', jsonb_array_length(v_winners) > 1
      )
    );
  end loop;

  select count(distinct voter_id)::int into v_total_voters
  from public.votes
  where room_id = v_room.id;

  select count(*)::int into v_total_participants
  from public.participants
  where room_id = v_room.id;

  return jsonb_build_object(
    'room', public.build_room(v_room),
    'categories', v_categories,
    'totalVoters', v_total_voters,
    'totalParticipants', v_total_participants
  );
end;
$$;

create or replace function public.get_results(p_code text, p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')));

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_participant
  from public.participants
  where room_id = v_room.id
    and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found then
    raise exception 'UNAUTHORIZED';
  end if;
  if v_room.status not in ('revealed', 'archived') then
    raise exception 'REVEAL_NOT_READY';
  end if;

  return public.build_results(v_room);
end;
$$;

create or replace function public.get_public_results(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_room public.rooms%rowtype;
begin
  select * into v_room
  from public.rooms
  where code = upper(trim(coalesce(p_code, '')));

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.status not in ('revealed', 'archived') then
    raise exception 'REVEAL_NOT_READY';
  end if;

  return public.build_results(v_room);
end;
$$;

-- ---------------------------------------------------------------------------
-- Segurança: RLS sem acesso direto + permissões mínimas
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.categories enable row level security;
alter table public.room_categories enable row level security;
alter table public.votes enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on table public.rooms from public, anon, authenticated;
revoke all on table public.participants from public, anon, authenticated;
revoke all on table public.categories from public, anon, authenticated;
revoke all on table public.room_categories from public, anon, authenticated;
revoke all on table public.votes from public, anon, authenticated;

revoke all on function public.nickname_key(text) from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.validate_vote_room() from public, anon, authenticated;
revoke all on function public.build_room(public.rooms) from public, anon, authenticated;
revoke all on function public.build_session(public.rooms, public.participants) from public, anon, authenticated;
revoke all on function public.build_results(public.rooms) from public, anon, authenticated;
revoke all on function public.apply_room_categories(uuid, text[], jsonb) from public, anon, authenticated;

revoke all on function public.create_room(text, text, text, text, text, text, text, timestamptz, text[], jsonb, boolean, boolean) from public, anon, authenticated;
revoke all on function public.get_room_preview(text) from public, anon, authenticated;
revoke all on function public.join_room(text, text, text) from public, anon, authenticated;
revoke all on function public.get_session(text, text) from public, anon, authenticated;
revoke all on function public.update_room(text, text, text, text[], jsonb, boolean, boolean) from public, anon, authenticated;
revoke all on function public.start_voting(text, text) from public, anon, authenticated;
revoke all on function public.close_voting(text, text) from public, anon, authenticated;
revoke all on function public.reveal_results(text, text) from public, anon, authenticated;
revoke all on function public.archive_room(text, text) from public, anon, authenticated;
revoke all on function public.delete_room(text, text) from public, anon, authenticated;
revoke all on function public.submit_vote(text, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_results(text, text) from public, anon, authenticated;
revoke all on function public.get_public_results(text) from public, anon, authenticated;

grant execute on function public.create_room(text, text, text, text, text, text, text, timestamptz, text[], jsonb, boolean, boolean) to anon, authenticated;
grant execute on function public.get_room_preview(text) to anon, authenticated;
grant execute on function public.join_room(text, text, text) to anon, authenticated;
grant execute on function public.get_session(text, text) to anon, authenticated;
grant execute on function public.update_room(text, text, text, text[], jsonb, boolean, boolean) to anon, authenticated;
grant execute on function public.start_voting(text, text) to anon, authenticated;
grant execute on function public.close_voting(text, text) to anon, authenticated;
grant execute on function public.reveal_results(text, text) to anon, authenticated;
grant execute on function public.archive_room(text, text) to anon, authenticated;
grant execute on function public.delete_room(text, text) to anon, authenticated;
grant execute on function public.submit_vote(text, text, uuid, uuid) to anon, authenticated;
grant execute on function public.get_results(text, text) to anon, authenticated;
grant execute on function public.get_public_results(text) to anon, authenticated;

comment on table public.votes is 'Votos individuais. Nunca expostos diretamente; apenas agregados por get_results/get_public_results após a revelação.';
comment on table public.participants is 'Tokens de sessão são armazenados como hash SHA-256. Nenhum acesso direto é permitido.';
comment on function public.get_results(text, text) is 'Retorna apenas resultados agregados e somente após a liberação pelo organizador.';
comment on function public.get_public_results(text) is 'Resultados agregados públicos por código, disponíveis apenas após a revelação.';
