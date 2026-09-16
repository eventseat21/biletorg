-- Enable Row-Level Security (RLS) on all tables
-- This script fixes the critical security vulnerability where tables are publicly accessible
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_checkers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "halls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seat_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_policy" ON "users";
DROP POLICY IF EXISTS "users_insert_policy" ON "users";
DROP POLICY IF EXISTS "users_update_policy" ON "users";
DROP POLICY IF EXISTS "users_delete_policy" ON "users";

DROP POLICY IF EXISTS "organizers_select_policy" ON "organizers";
DROP POLICY IF EXISTS "organizers_insert_policy" ON "organizers";
DROP POLICY IF EXISTS "organizers_update_policy" ON "organizers";

DROP POLICY IF EXISTS "ticket_checkers_select_policy" ON "ticket_checkers";
DROP POLICY IF EXISTS "ticket_checkers_insert_policy" ON "ticket_checkers";
DROP POLICY IF EXISTS "ticket_checkers_update_policy" ON "ticket_checkers";

DROP POLICY IF EXISTS "halls_select_policy" ON "halls";
DROP POLICY IF EXISTS "halls_insert_policy" ON "halls";
DROP POLICY IF EXISTS "halls_update_policy" ON "halls";

DROP POLICY IF EXISTS "seats_select_policy" ON "seats";
DROP POLICY IF EXISTS "seats_insert_policy" ON "seats";
DROP POLICY IF EXISTS "seats_update_policy" ON "seats";

DROP POLICY IF EXISTS "seat_categories_select_policy" ON "seat_categories";
DROP POLICY IF EXISTS "seat_categories_insert_policy" ON "seat_categories";
DROP POLICY IF EXISTS "seat_categories_update_policy" ON "seat_categories";

DROP POLICY IF EXISTS "events_select_policy" ON "events";
DROP POLICY IF EXISTS "events_insert_policy" ON "events";
DROP POLICY IF EXISTS "events_update_policy" ON "events";

DROP POLICY IF EXISTS "ticket_categories_select_policy" ON "ticket_categories";
DROP POLICY IF EXISTS "ticket_categories_insert_policy" ON "ticket_categories";
DROP POLICY IF EXISTS "ticket_categories_update_policy" ON "ticket_categories";

DROP POLICY IF EXISTS "orders_select_policy" ON "orders";
DROP POLICY IF EXISTS "orders_insert_policy" ON "orders";
DROP POLICY IF EXISTS "orders_update_policy" ON "orders";

DROP POLICY IF EXISTS "tickets_select_policy" ON "tickets";
DROP POLICY IF EXISTS "tickets_insert_policy" ON "tickets";
DROP POLICY IF EXISTS "tickets_update_policy" ON "tickets";

DROP POLICY IF EXISTS "password_resets_select_policy" ON "password_resets";
DROP POLICY IF EXISTS "password_resets_insert_policy" ON "password_resets";
DROP POLICY IF EXISTS "password_resets_update_policy" ON "password_resets";

-- Create RLS policies
-- Note: Service role key bypasses RLS automatically, so server-side operations via Prisma will work
-- These policies restrict client-side access only

-- Users table: Allow authenticated users to read their own data, admins to read all
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = id OR
    role = 'ADMIN'
  );

-- Users table: Allow registration (insert) for public
CREATE POLICY "users_insert_policy" ON "users"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users table: Allow users to update their own data, admins to update all
CREATE POLICY "users_update_policy" ON "users"
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = id OR
    role = 'ADMIN'
  );

-- Users table: Only admins can delete users
CREATE POLICY "users_delete_policy" ON "users"
  FOR DELETE
  TO authenticated
  USING (role = 'ADMIN');

-- Organizers table: Allow reading own organizer profile
CREATE POLICY "organizers_select_policy" ON "organizers"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = "organizers"."userId" 
      AND ("users".id = auth.uid()::text OR "users".role = 'ADMIN')
    )
  );

-- Organizers table: Allow creating organizer profile for own user
CREATE POLICY "organizers_insert_policy" ON "organizers"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

-- Organizers table: Allow updating own organizer profile
CREATE POLICY "organizers_update_policy" ON "organizers"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = "organizers"."userId" 
      AND ("users".id = auth.uid()::text OR "users".role = 'ADMIN')
    )
  );

-- Ticket checkers table: Allow reading own checker profile
CREATE POLICY "ticket_checkers_select_policy" ON "ticket_checkers"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = "ticket_checkers"."userId" 
      AND ("users".id = auth.uid()::text OR "users".role = 'ADMIN')
    )
  );

-- Ticket checkers table: Allow creating checker profile for own user
CREATE POLICY "ticket_checkers_insert_policy" ON "ticket_checkers"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

-- Ticket checkers table: Allow updating own checker profile
CREATE POLICY "ticket_checkers_update_policy" ON "ticket_checkers"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = "ticket_checkers"."userId" 
      AND ("users".id = auth.uid()::text OR "users".role = 'ADMIN')
    )
  );

-- Halls table: Allow reading own halls or published events' halls
CREATE POLICY "halls_select_policy" ON "halls"
  FOR SELECT
  TO authenticated, anon
  USING (
    "organizerId" IN (
      SELECT id FROM "organizers" 
      WHERE "userId" = auth.uid()::text
    ) OR
    EXISTS (
      SELECT 1 FROM "events" 
      WHERE "events"."hallId" = "halls".id 
      AND "events"."isPublished" = true
    )
  );

-- Halls table: Allow creating halls for own organizer profile
CREATE POLICY "halls_insert_policy" ON "halls"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "organizerId" IN (
      SELECT id FROM "organizers" 
      WHERE "userId" = auth.uid()::text
    )
  );

-- Halls table: Allow updating own halls
CREATE POLICY "halls_update_policy" ON "halls"
  FOR UPDATE
  TO authenticated
  USING (
    "organizerId" IN (
      SELECT id FROM "organizers" 
      WHERE "userId" = auth.uid()::text
    )
  );

-- Seats table: Allow reading seats for accessible halls
CREATE POLICY "seats_select_policy" ON "seats"
  FOR SELECT
  TO authenticated, anon
  USING (
    "hallId" IN (
      SELECT id FROM "halls" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM "events" 
        WHERE "events"."hallId" = "halls".id 
        AND "events"."isPublished" = true
      )
    )
  );

-- Seats table: Allow creating seats for own halls
CREATE POLICY "seats_insert_policy" ON "seats"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "hallId" IN (
      SELECT id FROM "halls" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Seats table: Allow updating seats for own halls
CREATE POLICY "seats_update_policy" ON "seats"
  FOR UPDATE
  TO authenticated
  USING (
    "hallId" IN (
      SELECT id FROM "halls" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Seat categories table: Allow reading for accessible halls
CREATE POLICY "seat_categories_select_policy" ON "seat_categories"
  FOR SELECT
  TO authenticated, anon
  USING (
    "hallId" IN (
      SELECT id FROM "halls" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM "events" 
        WHERE "events"."hallId" = "halls".id 
        AND "events"."isPublished" = true
      )
    )
  );

-- Seat categories table: Allow creating for own halls
CREATE POLICY "seat_categories_insert_policy" ON "seat_categories"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "hallId" IN (
      SELECT id FROM "halls" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Seat categories table: Allow updating for own halls
CREATE POLICY "seat_categories_update_policy" ON "seat_categories"
  FOR UPDATE
  TO authenticated
  USING (
    "hallId" IN (
      SELECT id FROM "halls" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Events table: Allow reading published events or own events
CREATE POLICY "events_select_policy" ON "events"
  FOR SELECT
  TO authenticated, anon
  USING (
    "isPublished" = true OR
    "organizerId" IN (
      SELECT id FROM "organizers" 
      WHERE "userId" = auth.uid()::text
    )
  );

-- Events table: Allow creating events for own organizer profile
CREATE POLICY "events_insert_policy" ON "events"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "organizerId" IN (
      SELECT id FROM "organizers" 
      WHERE "userId" = auth.uid()::text
    )
  );

-- Events table: Allow updating own events
CREATE POLICY "events_update_policy" ON "events"
  FOR UPDATE
  TO authenticated
  USING (
    "organizerId" IN (
      SELECT id FROM "organizers" 
      WHERE "userId" = auth.uid()::text
    )
  );

-- Ticket categories table: Allow reading for accessible events
CREATE POLICY "ticket_categories_select_policy" ON "ticket_categories"
  FOR SELECT
  TO authenticated, anon
  USING (
    "eventId" IN (
      SELECT id FROM "events" 
      WHERE "isPublished" = true OR
      "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Ticket categories table: Allow creating for own events
CREATE POLICY "ticket_categories_insert_policy" ON "ticket_categories"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "eventId" IN (
      SELECT id FROM "events" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Ticket categories table: Allow updating for own events
CREATE POLICY "ticket_categories_update_policy" ON "ticket_categories"
  FOR UPDATE
  TO authenticated
  USING (
    "eventId" IN (
      SELECT id FROM "events" 
      WHERE "organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Orders table: Allow reading own orders
CREATE POLICY "orders_select_policy" ON "orders"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM "events" 
      WHERE "events".id = "orders"."eventId" 
      AND "events"."organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    ) OR
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = auth.uid()::text 
      AND "users".role = 'ADMIN'
    )
  );

-- Orders table: Allow creating own orders
CREATE POLICY "orders_insert_policy" ON "orders"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

-- Orders table: Allow updating own orders or organizer's event orders
CREATE POLICY "orders_update_policy" ON "orders"
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM "events" 
      WHERE "events".id = "orders"."eventId" 
      AND "events"."organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Tickets table: Allow reading own tickets
CREATE POLICY "tickets_select_policy" ON "tickets"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM "events" 
      WHERE "events".id = "tickets"."eventId" 
      AND "events"."organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    ) OR
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = auth.uid()::text 
      AND "users".role = 'ADMIN'
    )
  );

-- Tickets table: Allow creating tickets for own orders (server-side typically)
CREATE POLICY "tickets_insert_policy" ON "tickets"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

-- Tickets table: Allow updating own tickets (check-in) or organizer's event tickets
CREATE POLICY "tickets_update_policy" ON "tickets"
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM "events" 
      WHERE "events".id = "tickets"."eventId" 
      AND "events"."organizerId" IN (
        SELECT id FROM "organizers" 
        WHERE "userId" = auth.uid()::text
      )
    )
  );

-- Password resets table: Allow reading own password resets
CREATE POLICY "password_resets_select_policy" ON "password_resets"
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid()::text);

-- Password resets table: Allow creating password resets (public for forgot password)
CREATE POLICY "password_resets_insert_policy" ON "password_resets"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Password resets table: Allow updating own password resets
CREATE POLICY "password_resets_update_policy" ON "password_resets"
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid()::text);

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
