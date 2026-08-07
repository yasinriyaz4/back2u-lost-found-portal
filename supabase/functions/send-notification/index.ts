import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationRequest {
  type: 'match' | 'message' | 'status_change';
  userId: string;
  title: string;
  message: string;
  itemId?: string;
  relatedItemId?: string;
  sendEmail?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequest = await req.json();
    console.log("Sending notification:", payload);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        item_id: payload.itemId || null,
        related_item_id: payload.relatedItemId || null,
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      throw notificationError;
    }

    // Check if user wants email notifications
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name, email_notifications")
      .eq("id", payload.userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Send email if enabled
    if (profile?.email_notifications && payload.sendEmail !== false) {
      const emailSubject = getEmailSubject(payload.type, payload.title);
      const emailHtml = getEmailHtml(payload.type, payload.title, payload.message, profile.name);

      try {
        const emailResponse = await resend.emails.send({
          from: "Back2U <onboarding@resend.dev>",
          to: [profile.email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log("Email sent:", emailResponse);
      } catch (emailError) {
        // Don't fail the whole request if email fails
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getEmailSubject(type: string, title: string): string {
  switch (type) {
    case 'match':
      return `🎉 ${title} - Back2U`;
    case 'message':
      return `💬 New Message - Back2U`;
    case 'status_change':
      return `📋 ${title} - Back2U`;
    default:
      return `Back2U Notification`;
  }
}

function getEmailHtml(type: string, title: string, message: string, userName: string): string {
  const iconMap: Record<string, string> = {
    match: '🎉',
    message: '💬',
    status_change: '📋',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Back2U</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Lost & Found Portal</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName || 'there'}!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
          <h2 style="margin: 0 0 10px 0; font-size: 20px;">${iconMap[type] || '📢'} ${title}</h2>
          <p style="margin: 0; color: #4b5563;">${message}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://back2u.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View on Back2U</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          You're receiving this email because you have notifications enabled on Back2U.<br>
          <a href="https://back2u.lovable.app/profile" style="color: #667eea;">Manage your notification preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
