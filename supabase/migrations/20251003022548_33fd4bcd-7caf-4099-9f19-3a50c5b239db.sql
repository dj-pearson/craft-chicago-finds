-- Create compliance audit log table
CREATE TABLE IF NOT EXISTS public.compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actor_id UUID REFERENCES auth.users(id),
  actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'admin'
  action_type TEXT NOT NULL, -- 'verification_approved', 'verification_rejected', 'w9_submitted', etc.
  entity_type TEXT NOT NULL, -- 'seller_verification', 'tax_info', 'disclosure', etc.
  entity_id UUID,
  seller_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_compliance_audit_log_created_at ON public.compliance_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_log_actor_id ON public.compliance_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_log_seller_id ON public.compliance_audit_log(seller_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_log_action_type ON public.compliance_audit_log(action_type);

-- Enable RLS
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.compliance_audit_log
FOR SELECT
USING (is_admin(auth.uid()));

-- System can create audit logs
CREATE POLICY "System can create audit logs"
ON public.compliance_audit_log
FOR INSERT
WITH CHECK (true);

-- Sellers can view their own audit logs
CREATE POLICY "Sellers can view their own audit logs"
ON public.compliance_audit_log
FOR SELECT
USING (auth.uid() = seller_id);

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_compliance_audit_log(
  _actor_id UUID,
  _actor_type TEXT,
  _action_type TEXT,
  _entity_type TEXT,
  _entity_id UUID,
  _seller_id UUID,
  _details JSONB DEFAULT '{}'::jsonb,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.compliance_audit_log (
    actor_id,
    actor_type,
    action_type,
    entity_type,
    entity_id,
    seller_id,
    details,
    metadata
  ) VALUES (
    _actor_id,
    _actor_type,
    _action_type,
    _entity_type,
    _entity_id,
    _seller_id,
    _details,
    _metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Trigger to log verification updates
CREATE OR REPLACE FUNCTION public.log_verification_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log verification status changes
  IF (TG_OP = 'UPDATE' AND OLD.verification_status != NEW.verification_status) THEN
    PERFORM create_compliance_audit_log(
      auth.uid(),
      CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'admin' END,
      CASE 
        WHEN NEW.verification_status = 'approved' THEN 'verification_approved'
        WHEN NEW.verification_status = 'rejected' THEN 'verification_rejected'
        ELSE 'verification_updated'
      END,
      'seller_verification',
      NEW.id,
      NEW.seller_id,
      jsonb_build_object(
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'admin_notes', NEW.admin_notes
      )
    );
  END IF;
  
  -- Log new verification submissions
  IF (TG_OP = 'INSERT') THEN
    PERFORM create_compliance_audit_log(
      NEW.seller_id,
      'user',
      'verification_submitted',
      'seller_verification',
      NEW.id,
      NEW.seller_id,
      jsonb_build_object(
        'verification_type', NEW.verification_type,
        'revenue_annual', NEW.revenue_annual
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for seller_verifications
DROP TRIGGER IF EXISTS trigger_log_verification_changes ON public.seller_verifications;
CREATE TRIGGER trigger_log_verification_changes
AFTER INSERT OR UPDATE ON public.seller_verifications
FOR EACH ROW
EXECUTE FUNCTION public.log_verification_changes();

-- Trigger to log W-9 submissions
CREATE OR REPLACE FUNCTION public.log_tax_info_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM create_compliance_audit_log(
      NEW.seller_id,
      'user',
      'w9_submitted',
      'tax_info',
      NEW.id,
      NEW.seller_id,
      jsonb_build_object(
        'entity_type', NEW.entity_type,
        'legal_name', NEW.legal_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for seller_tax_info
DROP TRIGGER IF EXISTS trigger_log_tax_info_changes ON public.seller_tax_info;
CREATE TRIGGER trigger_log_tax_info_changes
AFTER INSERT ON public.seller_tax_info
FOR EACH ROW
EXECUTE FUNCTION public.log_tax_info_changes();

-- Trigger to log public disclosure submissions
CREATE OR REPLACE FUNCTION public.log_disclosure_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM create_compliance_audit_log(
      NEW.seller_id,
      'user',
      'disclosure_submitted',
      'public_disclosure',
      NEW.id,
      NEW.seller_id,
      jsonb_build_object(
        'business_name', NEW.business_name,
        'is_active', NEW.is_active
      )
    );
  END IF;
  
  IF (TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active) THEN
    PERFORM create_compliance_audit_log(
      auth.uid(),
      CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'admin' END,
      'disclosure_status_changed',
      'public_disclosure',
      NEW.id,
      NEW.seller_id,
      jsonb_build_object(
        'old_status', OLD.is_active,
        'new_status', NEW.is_active
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for seller_public_disclosures
DROP TRIGGER IF EXISTS trigger_log_disclosure_changes ON public.seller_public_disclosures;
CREATE TRIGGER trigger_log_disclosure_changes
AFTER INSERT OR UPDATE ON public.seller_public_disclosures
FOR EACH ROW
EXECUTE FUNCTION public.log_disclosure_changes();