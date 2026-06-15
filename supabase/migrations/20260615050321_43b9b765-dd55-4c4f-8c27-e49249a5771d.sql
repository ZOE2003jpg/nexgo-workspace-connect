
CREATE TABLE public.rider_locations (
  rider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.rider_locations TO authenticated;
GRANT ALL ON public.rider_locations TO service_role;

ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

-- Rider can upsert/read own row
CREATE POLICY "Rider manages own location"
  ON public.rider_locations
  FOR ALL
  USING (auth.uid() = rider_id)
  WITH CHECK (auth.uid() = rider_id);

-- Students can read the rider currently assigned to one of their active orders
CREATE POLICY "Student reads assigned rider order location"
  ON public.rider_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.rider_id = rider_locations.rider_id
        AND o.student_id = auth.uid()
        AND o.status IN ('ready','out_for_delivery','accepted','preparing')
    )
    OR EXISTS (
      SELECT 1 FROM public.dispatches d
      WHERE d.rider_id = rider_locations.rider_id
        AND d.student_id = auth.uid()
        AND d.status NOT IN ('delivered','Delivered','cancelled','Done')
    )
  );

-- Admin can read all
CREATE POLICY "Admin reads all rider locations"
  ON public.rider_locations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
