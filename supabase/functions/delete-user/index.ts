import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('User is not an admin');
    }

    const { userId, email } = await req.json();
    
    if (!userId && !email) {
      throw new Error('userId or email is required');
    }

    let targetUserId = userId;

    // If email provided, find user by email
    if (email && !userId) {
      const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
      const foundUser = authUser?.users?.find(u => u.email === email);
      
      if (!foundUser) {
        throw new Error('User not found');
      }
      
      targetUserId = foundUser.id;
    }

    console.log('🗑️ Deleting user:', { userId: targetUserId, email });

    // Delete user from auth.users (will cascade to related tables)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log('✅ User deleted successfully:', targetUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        userId: targetUserId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while deleting user'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
