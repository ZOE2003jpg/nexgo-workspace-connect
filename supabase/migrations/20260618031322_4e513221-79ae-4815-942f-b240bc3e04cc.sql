
-- Account status enum
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add status to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.account_status NOT NULL DEFAULT 'pending';

-- Auto-approve existing users so we don't lock anyone out
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- Update handle_new_user: vendors/riders default pending (need approval),
-- students auto-approved, admins/school approved
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role app_role; _status account_status;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  _status := CASE WHEN _role IN ('admin','school') THEN 'approved'::account_status
                  ELSE 'pending'::account_status END;
  INSERT INTO public.profiles (id, full_name, email, status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, _status);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- Admin RPC to change status
CREATE OR REPLACE FUNCTION public.admin_set_user_status(_admin_id uuid, _target_user_id uuid, _new_status account_status)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
  END IF;
  IF _admin_id = _target_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot change your own status');
  END IF;
  UPDATE public.profiles SET status = _new_status, updated_at = now() WHERE id = _target_user_id;
  RETURN jsonb_build_object('success', true, 'message', 'Status updated to ' || _new_status::text);
END;
$$;
