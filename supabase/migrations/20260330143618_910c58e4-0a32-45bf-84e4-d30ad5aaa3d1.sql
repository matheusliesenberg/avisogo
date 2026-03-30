
-- Fix overly permissive UPDATE policy on tasks
DROP POLICY "Assignee can update task status" ON public.tasks;
CREATE POLICY "Assignee can update task status" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assignee = (SELECT display_name FROM public.profiles WHERE user_id = auth.uid()));

-- Fix overly permissive INSERT policy on announcements
DROP POLICY "Supervisors and admins can insert announcements" ON public.announcements;
CREATE POLICY "Authenticated can insert announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
