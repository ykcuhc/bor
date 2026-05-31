-- ============================================================
-- MyCloset — PostgreSQL / Supabase Database Schema
-- Run in the Supabase SQL editor or any Postgres instance
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
create table users (
  id              uuid primary key default uuid_generate_v4(),
  username        text unique not null,
  email           text unique not null,
  display_name    text not null,
  avatar          text default '',
  header_image    text default '',
  bio             text default '',
  location        text default 'Kuwait',
  followers_count int  default 0,
  following_count int  default 0,
  listings_count  int  default 0,
  sold_count      int  default 0,
  average_rating  numeric(3,2) default 0,
  total_ratings   int  default 0,
  is_verified     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── Listings ─────────────────────────────────────────────────────────────────
create type listing_status    as enum ('available', 'sold', 'reserved');
create type item_condition    as enum ('NWT', 'NWOT', 'Excellent', 'Good', 'Fair');
create type item_category     as enum ('Women','Men','Kids','Home','Electronics','Beauty','Pets','Garden');

create table listings (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       uuid not null references users(id) on delete cascade,
  title           text not null,
  description     text default '',
  images          text[]  not null default '{}',   -- ordered; images[0] = cover
  category        item_category not null,
  sub_category    text default '',
  brand           text default '',
  size            text default '',
  condition       item_condition not null,
  color           text[] default '{}',
  original_price  numeric(10,3) not null,           -- KWD
  listing_price   numeric(10,3) not null,
  quantity        int default 1,
  tags            text[] default '{}',
  likes_count     int default 0,
  comments_count  int default 0,
  shares_count    int default 0,
  views_count     int default 0,
  status          listing_status default 'available',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_listings_seller      on listings(seller_id);
create index idx_listings_category    on listings(category);
create index idx_listings_status      on listings(status);
create index idx_listings_created_at  on listings(created_at desc);

-- ─── Likes ────────────────────────────────────────────────────────────────────
create table likes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id)    on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, listing_id)
);

-- Trigger: keep listings.likes_count in sync
create or replace function update_likes_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update listings set likes_count = likes_count + 1 where id = NEW.listing_id;
  elsif TG_OP = 'DELETE' then
    update listings set likes_count = likes_count - 1 where id = OLD.listing_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_likes_count
after insert or delete on likes
for each row execute function update_likes_count();

-- ─── Comments ─────────────────────────────────────────────────────────────────
create table comments (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid not null references listings(id) on delete cascade,
  author_id   uuid not null references users(id)    on delete cascade,
  body        text not null,
  mentions    text[] default '{}',   -- usernames mentioned via @
  created_at  timestamptz default now()
);

create index idx_comments_listing on comments(listing_id, created_at desc);

create or replace function update_comments_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update listings set comments_count = comments_count + 1 where id = NEW.listing_id;
  elsif TG_OP = 'DELETE' then
    update listings set comments_count = comments_count - 1 where id = OLD.listing_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_comments_count
after insert or delete on comments
for each row execute function update_comments_count();

-- ─── Follows ──────────────────────────────────────────────────────────────────
create table follows (
  id           uuid primary key default uuid_generate_v4(),
  follower_id  uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at   timestamptz default now(),
  unique(follower_id, following_id),
  check(follower_id <> following_id)
);

-- ─── Offers ───────────────────────────────────────────────────────────────────
create type offer_status as enum ('pending','accepted','declined','expired','countered');

create table offers (
  id             uuid primary key default uuid_generate_v4(),
  listing_id     uuid not null references listings(id) on delete cascade,
  buyer_id       uuid not null references users(id)    on delete cascade,
  amount         numeric(10,3) not null,
  status         offer_status default 'pending',
  message        text,
  counter_amount numeric(10,3),
  expires_at     timestamptz not null default (now() + interval '24 hours'),
  created_at     timestamptz default now()
);

-- ─── Orders ───────────────────────────────────────────────────────────────────
create type order_status as enum ('pending','shipped','delivered','completed','disputed');

create table orders (
  id                uuid primary key default uuid_generate_v4(),
  listing_id        uuid not null references listings(id),
  buyer_id          uuid not null references users(id),
  seller_id         uuid not null references users(id),
  amount            numeric(10,3) not null,
  shipping_fee      numeric(10,3) not null default 1.500,   -- 1.500 KWD flat
  platform_fee      numeric(10,3) not null,                 -- 20% of amount
  seller_earnings   numeric(10,3) not null,                 -- amount - platform_fee
  status            order_status default 'pending',
  tracking_number   text,
  shipping_provider text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── Notifications ────────────────────────────────────────────────────────────
create type notification_type as enum (
  'new_like','new_comment','new_offer','offer_accepted',
  'offer_declined','new_follower','item_sold','new_share'
);

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  type        notification_type not null,
  actor_id    uuid not null references users(id),
  listing_id  uuid references listings(id) on delete set null,
  read        boolean default false,
  created_at  timestamptz default now()
);

create index idx_notifications_user on notifications(user_id, created_at desc);

-- ─── Row Level Security (Supabase) ───────────────────────────────────────────
-- Enable RLS so users only see/modify their own data where required
alter table users         enable row level security;
alter table listings      enable row level security;
alter table likes         enable row level security;
alter table comments      enable row level security;
alter table follows       enable row level security;
alter table offers        enable row level security;
alter table orders        enable row level security;
alter table notifications enable row level security;

-- Public read for listings and users (marketplace is publicly browsable)
create policy "public read listings"  on listings  for select using (true);
create policy "public read users"     on users     for select using (true);
create policy "public read comments"  on comments  for select using (true);

-- Authenticated write policies
create policy "owner create listing"  on listings  for insert with check (auth.uid() = seller_id);
create policy "owner update listing"  on listings  for update using (auth.uid() = seller_id);
create policy "owner delete listing"  on listings  for delete using (auth.uid() = seller_id);

create policy "auth like"      on likes    for all using (auth.uid() = user_id);
create policy "auth comment"   on comments for insert with check (auth.uid() = author_id);
create policy "auth follow"    on follows  for all using (auth.uid() = follower_id);
create policy "auth offer"     on offers   for all using (auth.uid() = buyer_id);

create policy "buyer or seller read order" on orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "own notifications" on notifications
  for all using (auth.uid() = user_id);
