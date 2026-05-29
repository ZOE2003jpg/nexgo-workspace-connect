
-- 1. Fix UNAUTHENTICATED_WALLET_INSERT: wallets are created by SECURITY DEFINER trigger,
-- so no public INSERT policy is needed.
DROP POLICY IF EXISTS "System can insert wallets" ON public.wallets;

-- 2. Fix MISSING_ORDERS_UPDATE_RESTRICTION: students may only update non-sensitive fields.
DROP POLICY IF EXISTS "Students update own orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.restrict_student_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when the caller is the student who owns the order.
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.student_id
     AND NOT has_role(auth.uid(), 'admin')
     AND auth.uid() <> COALESCE(OLD.rider_id, '00000000-0000-0000-0000-000000000000'::uuid)
     AND NOT EXISTS (
       SELECT 1 FROM public.restaurants r
       WHERE r.id = OLD.restaurant_id AND r.owner_id = auth.uid()
     )
  THEN
    IF NEW.delivery_otp IS DISTINCT FROM OLD.delivery_otp
       OR NEW.delivery_otp_expires_at IS DISTINCT FROM OLD.delivery_otp_expires_at
       OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
       OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
       OR NEW.rider_id IS DISTINCT FROM OLD.rider_id
       OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.order_number IS DISTINCT FROM OLD.order_number
    THEN
      RAISE EXCEPTION 'Students cannot modify sensitive order fields';
    END IF;
    -- Students may only set status to cancelled directly; other status changes must go through validate_order_transition.
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
      RAISE EXCEPTION 'Students cannot change order status except to cancelled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_student_order_updates_trg ON public.orders;
CREATE TRIGGER restrict_student_order_updates_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restrict_student_order_updates();

CREATE POLICY "Students update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- 3. Fix REALTIME_UNRESTRICTED_CHANNEL_ACCESS: lock down realtime.messages so broadcast
-- subscribers can only read topics scoped to their own auth.uid().
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own scoped realtime topics" ON realtime.messages;
CREATE POLICY "Users read own scoped realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  topic LIKE 'user:' || auth.uid()::text || ':%'
  OR topic = 'user:' || auth.uid()::text
);

DROP POLICY IF EXISTS "Users write own scoped realtime topics" ON realtime.messages;
CREATE POLICY "Users write own scoped realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  topic LIKE 'user:' || auth.uid()::text || ':%'
  OR topic = 'user:' || auth.uid()::text
);

-- 4. Fix SECURITY DEFINER function executable findings: revoke broad EXECUTE and grant
-- only to the roles that legitimately call each function. Trigger functions need none;
-- RPCs called by the app need authenticated. Nothing should be callable by anon.

-- Trigger-only functions: no execute grant needed.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_wallet() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_orders_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_order_inputs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_dispatch_inputs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restrict_student_order_updates() FROM PUBLIC, anon, authenticated;

-- RPC / helper functions: restrict to authenticated only (no anon).
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.validate_order_transition(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_order_transition(uuid, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.generate_delivery_otp(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_delivery_otp(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.verify_delivery_otp(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_delivery_otp(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.deduct_wallet(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_wallet(uuid, integer, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.accept_order_as_rider(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_order_as_rider(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.topup_wallet(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.topup_wallet(uuid, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.refund_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_order(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_update_setting(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_setting(uuid, text, integer) TO authenticated, service_role;
