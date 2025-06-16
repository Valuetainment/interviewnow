-- Migration: Create audit log table
-- Purpose: Track sensitive operations for security and compliance
-- Date: 2025-01-15
-- Priority: MEDIUM

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY admin_view_audit_logs ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- No one can modify audit logs (insert only via trigger functions)
CREATE POLICY no_update_audit_logs ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY no_delete_audit_logs ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current user and tenant
  v_user_id := auth.uid();
  
  -- Get tenant_id from users table or JWT
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    (SELECT tenant_id FROM public.users WHERE id = v_user_id)
  ) INTO v_tenant_id;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    v_tenant_id,
    v_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    (auth.jwt() ->> 'ip')::inet,
    auth.jwt() ->> 'user_agent'
  );
END;
$$;

-- Create triggers for sensitive tables

-- Audit trigger for users table
CREATE OR REPLACE FUNCTION audit_users_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log('create', 'users', NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if role changed
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      PERFORM public.create_audit_log('update', 'users', NEW.id, 
        jsonb_build_object('role', OLD.role), 
        jsonb_build_object('role', NEW.role)
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_log('delete', 'users', OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION audit_users_changes();

-- Audit trigger for interview_sessions (for status changes)
CREATE OR REPLACE FUNCTION audit_interview_session_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Only log if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.create_audit_log('status_change', 'interview_sessions', NEW.id, 
        jsonb_build_object('status', OLD.status), 
        jsonb_build_object('status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_interview_sessions_trigger
AFTER UPDATE ON public.interview_sessions
FOR EACH ROW EXECUTE FUNCTION audit_interview_session_changes();

-- Audit trigger for candidate_assessments (track all assessment creations)
CREATE OR REPLACE FUNCTION audit_assessment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log('create', 'candidate_assessments', NEW.id, 
      NULL, 
      jsonb_build_object('session_id', NEW.session_id, 'weighted_score', NEW.weighted_score)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_assessments_trigger
AFTER INSERT ON public.candidate_assessments
FOR EACH ROW EXECUTE FUNCTION audit_assessment_changes();

-- Add comments
COMMENT ON TABLE public.audit_logs IS 'Audit trail for sensitive operations';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (create, update, delete, status_change, etc)';
COMMENT ON COLUMN public.audit_logs.table_name IS 'Table where the action occurred';
COMMENT ON COLUMN public.audit_logs.record_id IS 'ID of the affected record';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values (for updates/deletes)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values (for inserts/updates)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the user (if available in JWT)';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent string (if available in JWT)'; 