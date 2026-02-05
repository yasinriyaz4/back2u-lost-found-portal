import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface PointsNotificationRequest {
  userId: string;
  points: number;
  actionType: string;
  itemId?: string;
  previousRank?: number;
  newRank?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PointsNotificationRequest = await req.json();
    console.log("Sending points notification:", payload);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name, email_notifications")
      .eq("id", payload.userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    // Get user's current total points
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", payload.userId)
      .single();

    const totalPoints = userPoints?.total_points ?? payload.points;

    // Get action type display name
    const actionDisplayNames: Record<string, string> = {
      found_item_posted: "posting a found item",
      item_returned: "successfully returning an item",
      report_verified: "a verified report",
      false_claim: "a false claim penalty",
      reported_misuse: "reported misuse penalty",
    };

    const actionName = actionDisplayNames[payload.actionType] || payload.actionType;
    const isPositive = payload.points > 0;
    
    // Build notification message
    let title = isPositive ? "🎉 You Earned Points!" : "📉 Points Deducted";
    let message = isPositive 
      ? `You earned ${payload.points} points for ${actionName}! Your total: ${totalPoints} points.`
      : `${Math.abs(payload.points)} points were deducted for ${actionName}. Your total: ${totalPoints} points.`;

    // Add rank change info if provided
    if (payload.previousRank && payload.newRank && payload.newRank < payload.previousRank) {
      title = "🏆 You Moved Up in Rank!";
      message = `Congratulations! You moved from rank #${payload.previousRank} to #${payload.newRank}! ${message}`;
    }

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.userId,
        type: "status_change",
        title,
        message,
        item_id: payload.itemId || null,
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    // Send email if user has email notifications enabled
    if (profile?.email_notifications) {
      try {
        const emailHtml = getPointsEmailHtml(
          profile.name || "there",
          payload.points,
          totalPoints,
          actionName,
          payload.previousRank,
          payload.newRank
        );

        const emailResponse = await resend.emails.send({
          from: "Back2U <noreply@gprec.in>",
          to: [profile.email],
          subject: title + " - Back2U",
          html: emailHtml,
        });

        console.log("Points email sent:", emailResponse);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-points-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getPointsEmailHtml(
  userName: string,
  points: number,
  totalPoints: number,
  actionName: string,
  previousRank?: number,
  newRank?: number
): string {
  const isPositive = points > 0;
  const pointsColor = isPositive ? "#22c55e" : "#ef4444";
  const pointsIcon = isPositive ? "🎉" : "📉";
  
  let rankSection = "";
  if (previousRank && newRank && newRank < previousRank) {
    rankSection = `
      <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
        <h3 style="color: white; margin: 0 0 10px 0; font-size: 18px;">🏆 Rank Up!</h3>
        <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
          #${previousRank} → #${newRank}
        </p>
      </div>
    `;
  }

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
        <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName}!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">${pointsIcon}</div>
          <h2 style="margin: 0 0 10px 0; font-size: 24px;">
            ${isPositive ? "+" : ""}${points} Points
          </h2>
          <p style="margin: 0; color: #4b5563;">
            ${isPositive ? "You earned points for" : "Points were deducted for"} <strong>${actionName}</strong>
          </p>
        </div>

        <div style="background: ${pointsColor}; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">Total Points</p>
          <p style="color: white; margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">${totalPoints}</p>
        </div>

        ${rankSection}
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://back2u.lovable.app/leaderboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Leaderboard</a>
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
