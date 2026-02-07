import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { subject, message } = await req.json();

    const emailSubject = subject || "Update from Lost & Found Portal";
    const emailMessage = message || "Thank you for being part of our community! We're working hard to help reunite people with their lost items.";

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Sending broadcast email to ${profiles?.length || 0} users`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) {
        console.log(`Skipping user ${profile.id} - no email`);
        continue;
      }

      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Lost & Found</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px;">Hi ${profile.name || "there"},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">${emailMessage}</p>
              <div style="text-align: center; margin: 30px 0;">
                 <a href="https://id-preview--bd5bdb4a-10bf-4b7e-af76-a1b3c4d2cd41.lovable.app" 
                   style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                   Visit Portal
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                You're receiving this because you're a member of our community.
              </p>
            </div>
          </div>
        `;

        const result = await resend.emails.send({
          from: "Lost & Found <onboarding@resend.dev>",
          to: [profile.email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Email sent to ${profile.email}:`, result);
        sent++;
      } catch (emailError: any) {
        console.error(`Failed to send to ${profile.email}:`, emailError.message);
        failed++;
        errors.push(`${profile.email}: ${emailError.message}`);
      }
    }

    console.log(`Broadcast complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ sent, failed, total: profiles?.length || 0, errors }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
