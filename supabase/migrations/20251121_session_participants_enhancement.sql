-- Enhancement migration for session_participants table
-- Ensures all necessary columns and indexes are present

-- Add any missing columns (if table was modified)
DO $$ 
BEGIN
  -- Add notification preferences column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'session_participants' 
    AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE public.session_participants 
    ADD COLUMN email_notifications BOOLEAN DEFAULT true;
  END IF;

  -- Add attendance tracking column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'session_participants' 
    AND column_name = 'attended'
  ) THEN
    ALTER TABLE public.session_participants 
    ADD COLUMN attended BOOLEAN DEFAULT false;
  END IF;

  -- Add left_at timestamp if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'session_participants' 
    AND column_name = 'left_at'
  ) THEN
    ALTER TABLE public.session_participants 
    ADD COLUMN left_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id 
  ON public.session_participants(session_id);

CREATE INDEX IF NOT EXISTS idx_session_participants_user_id 
  ON public.session_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_session_participants_joined_at 
  ON public.session_participants(joined_at);

-- Add function to update session participant count
CREATE OR REPLACE FUNCTION public.update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the cached count on sessions table if it exists
  IF TG_OP = 'INSERT' THEN
    UPDATE public.sessions 
    SET participants_count = (
      SELECT COUNT(*) 
      FROM public.session_participants 
      WHERE session_id = NEW.session_id
    )
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.sessions 
    SET participants_count = (
      SELECT COUNT(*) 
      FROM public.session_participants 
      WHERE session_id = OLD.session_id
    )
    WHERE id = OLD.session_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add participants_count column to sessions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions' 
    AND column_name = 'participants_count'
  ) THEN
    ALTER TABLE public.sessions 
    ADD COLUMN participants_count INT DEFAULT 0;
    
    -- Backfill existing counts
    UPDATE public.sessions s
    SET participants_count = (
      SELECT COUNT(*) 
      FROM public.session_participants sp 
      WHERE sp.session_id = s.id
    );
  END IF;
END $$;

-- Create trigger to auto-update participant count
DROP TRIGGER IF EXISTS update_participant_count_trigger ON public.session_participants;
CREATE TRIGGER update_participant_count_trigger
  AFTER INSERT OR DELETE ON public.session_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_participant_count();

-- Add comments for documentation
COMMENT ON TABLE public.session_participants IS 'Tracks which users have joined/reserved study sessions';
COMMENT ON COLUMN public.session_participants.is_waitlisted IS 'True if user is on waitlist (session at capacity)';
COMMENT ON COLUMN public.session_participants.email_notifications IS 'Whether user wants email reminders for this session';
COMMENT ON COLUMN public.session_participants.attended IS 'Marked true after user actually attends the session';
COMMENT ON COLUMN public.session_participants.left_at IS 'Timestamp when user left the session (for attendance tracking)';
