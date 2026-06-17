-- Invitation acceptance must run with elevated rights: the invited client
-- cannot read the invitations row (owner-only RLS) nor insert their own
-- gallery_memberships row. This SECURITY DEFINER function validates the
-- token and performs the whole acceptance atomically.

create or replace function public.accept_invitation(invite_token_hash text)
returns uuid -- gallery_id
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invitations%rowtype;
  uid uuid := auth.uid();
  user_email text;
begin
  if uid is null then
    raise exception 'Must be authenticated to accept an invitation';
  end if;

  select email into user_email from auth.users where id = uid;

  select * into inv
  from invitations
  where token_hash = invite_token_hash and status = 'pending'
  for update;

  if not found then
    raise exception 'Invalid or expired invitation';
  end if;

  if lower(inv.email) <> lower(user_email) then
    raise exception 'Email does not match invitation';
  end if;

  if inv.expires_at < now() then
    update invitations set status = 'expired' where id = inv.id;
    raise exception 'Invitation has expired';
  end if;

  insert into gallery_memberships (gallery_id, client_user_id)
  values (inv.gallery_id, uid)
  on conflict (gallery_id, client_user_id) do nothing;

  update invitations
  set status = 'accepted', accepted_at = now()
  where id = inv.id;

  return inv.gallery_id;
end;
$$;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;
