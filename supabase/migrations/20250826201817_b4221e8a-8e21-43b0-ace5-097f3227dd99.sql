-- Add deleted_at column to contest_applications for soft delete
ALTER TABLE public.contest_applications 
ADD COLUMN deleted_at timestamp with time zone NULL;

-- Update admin function to include deleted applications in a separate section
CREATE OR REPLACE FUNCTION public.get_contest_applications_admin(include_deleted boolean DEFAULT false)
 RETURNS TABLE(
   id uuid, 
   user_id uuid, 
   status text, 
   application_data jsonb, 
   notes text, 
   is_active boolean, 
   submitted_at timestamp with time zone, 
   reviewed_at timestamp with time zone, 
   reviewed_by uuid,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   deleted_at timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ca.id,
    ca.user_id,
    ca.status,
    ca.application_data,
    ca.notes,
    ca.is_active,
    ca.submitted_at,
    ca.reviewed_at,
    ca.reviewed_by,
    ca.created_at,
    ca.updated_at,
    ca.deleted_at
  FROM public.contest_applications ca
  WHERE (
    CASE 
      WHEN include_deleted THEN ca.deleted_at IS NOT NULL
      ELSE ca.deleted_at IS NULL
    END
  )
  ORDER BY 
    CASE WHEN include_deleted THEN ca.deleted_at ELSE ca.submitted_at END DESC;
$function$