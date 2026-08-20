-- Machines become typed entries: [{ "type": "espresso_machine" | "grinder" |
-- "brewer" | "roaster" | "other", "name": "La Marzocco Linea" }, ...]

alter table public.coffee_shops
  alter column machines drop default,
  alter column machines type jsonb using to_jsonb(machines),
  alter column machines set default '[]'::jsonb;

-- Convert legacy plain-string entries, guessing grinders by name.
update public.coffee_shops
set machines = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'type',
        case
          when m ilike '%ek43%' or m ilike '%mahlkönig%' or m ilike '%mythos%'
            or m ilike '%niche%' or m ilike '%grinder%' then 'grinder'
          else 'espresso_machine'
        end,
        'name', m
      )
    )
    from jsonb_array_elements_text(machines) as m
  ),
  '[]'::jsonb
)
where exists (
  select 1 from jsonb_array_elements(machines) as e
  where jsonb_typeof(e) = 'string'
);
