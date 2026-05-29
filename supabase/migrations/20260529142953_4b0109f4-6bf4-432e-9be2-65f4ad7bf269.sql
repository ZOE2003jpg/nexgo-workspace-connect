-- Revoke broad execute on trigger-only / internal helpers
REVOKE ALL ON FUNCTION public.generate_pickup_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_order_pickup_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_dispatch_pickup_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_new_order() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_new_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_newsletter() FROM PUBLIC, anon, authenticated;

-- Restrict callable RPCs to authenticated only
REVOKE ALL ON FUNCTION public.confirm_pickup_by_code(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_pickup_by_code(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_rider_approval(uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_rider_approval(uuid, uuid, boolean) TO authenticated;

-- Tighten newsletter anon insert: only brand-new emails, only subscribed=true, no user_id spoofing
DROP POLICY IF EXISTS "Anyone can subscribe by email" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe by email"
  ON public.newsletter_subscribers
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND subscribed = true);