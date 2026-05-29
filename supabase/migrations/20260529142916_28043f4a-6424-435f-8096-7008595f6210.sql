-- ─── Phase 9 prep: add 'school' to app_role enum ─────────────
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school';

-- ─── Phase 5: trip_routes vehicle_type + dual pricing ───────
ALTER TABLE public.trip_routes
  ADD COLUMN IF NOT EXISTS price_private integer,
  ADD COLUMN IF NOT EXISTS price_public integer,
  ADD COLUMN IF NOT EXISTS vehicle_type text NOT NULL DEFAULT 'public';
UPDATE public.trip_routes
  SET price_public = COALESCE(price_public, price),
      price_private = COALESCE(price_private, price * 3)
  WHERE price_public IS NULL OR price_private IS NULL;

-- ─── Phase 3: pickup code tables ────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_pickup_codes (
  order_id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_pickup_codes TO authenticated;
GRANT ALL ON public.order_pickup_codes TO service_role;
ALTER TABLE public.order_pickup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student owner can read pickup code" ON public.order_pickup_codes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.student_id = auth.uid()));
CREATE POLICY "Vendor can read pickup code" ON public.order_pickup_codes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON r.id = o.restaurant_id
    WHERE o.id = order_id AND r.owner_id = auth.uid()));
CREATE POLICY "Admin can read pickup code" ON public.order_pickup_codes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.dispatch_pickup_codes (
  dispatch_id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dispatch_pickup_codes TO authenticated;
GRANT ALL ON public.dispatch_pickup_codes TO service_role;
ALTER TABLE public.dispatch_pickup_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student owner can read dispatch pickup code" ON public.dispatch_pickup_codes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dispatches d WHERE d.id = dispatch_id AND d.student_id = auth.uid()));
CREATE POLICY "Admin can read dispatch pickup code" ON public.dispatch_pickup_codes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- generator (after tables exist)
CREATE OR REPLACE FUNCTION public.generate_pickup_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _code text; _exists boolean;
BEGIN
  LOOP
    _code := 'NX-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
    SELECT EXISTS (SELECT 1 FROM public.order_pickup_codes WHERE code = _code)
        OR EXISTS (SELECT 1 FROM public.dispatch_pickup_codes WHERE code = _code)
      INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  RETURN _code;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_pickup_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.order_pickup_codes(order_id, code)
  VALUES (NEW.id, generate_pickup_code())
  ON CONFLICT (order_id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_create_order_pickup_code ON public.orders;
CREATE TRIGGER trg_create_order_pickup_code AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_order_pickup_code();

CREATE OR REPLACE FUNCTION public.create_dispatch_pickup_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.dispatch_pickup_codes(dispatch_id, code)
  VALUES (NEW.id, generate_pickup_code())
  ON CONFLICT (dispatch_id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_create_dispatch_pickup_code ON public.dispatches;
CREATE TRIGGER trg_create_dispatch_pickup_code AFTER INSERT ON public.dispatches
  FOR EACH ROW EXECUTE FUNCTION public.create_dispatch_pickup_code();

INSERT INTO public.order_pickup_codes(order_id, code)
  SELECT id, generate_pickup_code() FROM public.orders
  WHERE id NOT IN (SELECT order_id FROM public.order_pickup_codes);
INSERT INTO public.dispatch_pickup_codes(dispatch_id, code)
  SELECT id, generate_pickup_code() FROM public.dispatches
  WHERE id NOT IN (SELECT dispatch_id FROM public.dispatch_pickup_codes);

CREATE OR REPLACE FUNCTION public.confirm_pickup_by_code(_code text, _rider_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _opc RECORD; _order RECORD; _dpc RECORD; _disp RECORD; _student RECORD;
BEGIN
  SELECT * INTO _opc FROM public.order_pickup_codes WHERE code = _code;
  IF FOUND THEN
    SELECT * INTO _order FROM public.orders WHERE id = _opc.order_id;
    IF _order.rider_id IS DISTINCT FROM _rider_id THEN
      RETURN jsonb_build_object('success', false, 'message', 'Not your delivery');
    END IF;
    UPDATE public.orders SET status = 'delivered' WHERE id = _order.id;
    SELECT full_name INTO _student FROM public.profiles WHERE id = _order.student_id;
    RETURN jsonb_build_object('success', true, 'kind', 'order',
      'student_name', _student.full_name,
      'dropoff', _order.delivery_address);
  END IF;
  SELECT * INTO _dpc FROM public.dispatch_pickup_codes WHERE code = _code;
  IF FOUND THEN
    SELECT * INTO _disp FROM public.dispatches WHERE id = _dpc.dispatch_id;
    IF _disp.rider_id IS DISTINCT FROM _rider_id THEN
      RETURN jsonb_build_object('success', false, 'message', 'Not your delivery');
    END IF;
    UPDATE public.dispatches SET status = 'delivered' WHERE id = _disp.id;
    SELECT full_name INTO _student FROM public.profiles WHERE id = _disp.student_id;
    RETURN jsonb_build_object('success', true, 'kind', 'dispatch',
      'student_name', _student.full_name,
      'dropoff', _disp.dropoff_location);
  END IF;
  RETURN jsonb_build_object('success', false, 'message', 'Invalid pickup code');
END; $$;

-- ─── Phase 4: rider onboarding ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.rider_profiles (
  user_id uuid PRIMARY KEY,
  approved boolean NOT NULL DEFAULT false,
  full_name text,
  phone text,
  vehicle text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rider_profiles TO authenticated;
GRANT ALL ON public.rider_profiles TO service_role;
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rider can view own profile" ON public.rider_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Rider can upsert own profile" ON public.rider_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Rider can update own profile basics" ON public.rider_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND approved = (SELECT approved FROM public.rider_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin manage rider profiles" ON public.rider_profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.rider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rider_documents TO authenticated;
GRANT ALL ON public.rider_documents TO service_role;
ALTER TABLE public.rider_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rider view own docs" ON public.rider_documents
  FOR SELECT TO authenticated USING (auth.uid() = rider_id);
CREATE POLICY "Rider upload own docs" ON public.rider_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = rider_id);
CREATE POLICY "Admin manage rider docs" ON public.rider_documents
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
  VALUES ('rider-docs', 'rider-docs', false)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Rider upload own doc files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rider-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Rider read own doc files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'rider-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'admin')));

CREATE OR REPLACE FUNCTION public.admin_set_rider_approval(_admin_id uuid, _rider_id uuid, _approved boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
  END IF;
  INSERT INTO public.rider_profiles(user_id, approved, reviewed_by, reviewed_at)
    VALUES (_rider_id, _approved, _admin_id, now())
    ON CONFLICT (user_id) DO UPDATE SET approved = _approved, reviewed_by = _admin_id, reviewed_at = now(), updated_at = now();
  RETURN jsonb_build_object('success', true);
END; $$;

-- ─── Phase 6: notifications ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid; _rname text;
BEGIN
  SELECT owner_id, name INTO _owner, _rname FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF _owner IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, data)
      VALUES (_owner, 'new_order', 'New order received',
        'Order ' || NEW.order_number || ' • Deliver to: ' || COALESCE(NEW.delivery_address,'(no address)'),
        jsonb_build_object('order_id', NEW.id, 'address', NEW.delivery_address));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_on_new_order AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_order();

CREATE OR REPLACE FUNCTION public.notify_on_new_dispatch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _admin RECORD;
BEGIN
  FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LOOP
    INSERT INTO public.notifications(user_id, type, title, body, data)
      VALUES (_admin.user_id, 'new_dispatch', 'New dispatch request',
        'From ' || NEW.pickup_location || ' to ' || NEW.dropoff_location,
        jsonb_build_object('dispatch_id', NEW.id, 'pickup', NEW.pickup_location, 'dropoff', NEW.dropoff_location));
  END LOOP;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_on_new_dispatch ON public.dispatches;
CREATE TRIGGER trg_notify_on_new_dispatch AFTER INSERT ON public.dispatches
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_dispatch();

-- ─── Phase 7: chat ──────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  ref_id uuid NOT NULL,
  student_id uuid NOT NULL,
  rider_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() IN (student_id, rider_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Student creates conversation" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants update conversation" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() IN (student_id, rider_id));

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON public.messages
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
      AND (auth.uid() IN (c.student_id, c.rider_id) OR has_role(auth.uid(),'admin'))));
CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
      AND auth.uid() IN (c.student_id, c.rider_id)));
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- ─── Phase 8: newsletter ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL UNIQUE,
  subscribed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
GRANT INSERT ON public.newsletter_subscribers TO anon;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own subscription" ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can subscribe by email" ON public.newsletter_subscribers
  FOR INSERT TO anon WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user_newsletter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers(user_id, email)
    VALUES (NEW.id, NEW.email) ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_new_user_newsletter ON auth.users;
CREATE TRIGGER trg_new_user_newsletter AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_newsletter();