import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Item {
  id: string;
  title: string;
  description: string;
  category: 'lost' | 'found';
  location: string;
  item_date: string;
  status: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itemId } = await req.json();
    console.log("Finding matches for item:", itemId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the source item
    const { data: sourceItem, error: sourceError } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (sourceError || !sourceItem) {
      console.error("Source item not found:", sourceError);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the opposite category
    const oppositeCategory = sourceItem.category === 'lost' ? 'found' : 'lost';

    // Fetch potential matching items (opposite category, active status)
    const { data: potentialMatches, error: matchError } = await supabase
      .from("items")
      .select("*")
      .eq("category", oppositeCategory)
      .eq("status", "active")
      .neq("user_id", sourceItem.user_id)
      .limit(50);

    if (matchError) {
      console.error("Error fetching potential matches:", matchError);
      throw matchError;
    }

    if (!potentialMatches || potentialMatches.length === 0) {
      console.log("No potential matches found");
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${potentialMatches.length} potential matches to analyze`);

    // Use AI to analyze matches
    const prompt = `You are analyzing lost and found items to find potential matches.

Source item (${sourceItem.category}):
- Title: ${sourceItem.title}
- Description: ${sourceItem.description}
- Location: ${sourceItem.location}
- Date: ${sourceItem.item_date}

Potential matching items (${oppositeCategory}):
${potentialMatches.map((item: Item, idx: number) => `
${idx + 1}. ID: ${item.id}
   Title: ${item.title}
   Description: ${item.description}
   Location: ${item.location}
   Date: ${item.item_date}
`).join('\n')}

Analyze each potential match and return matches with a score from 0.0 to 1.0 based on:
- Title and description similarity (same type of item)
- Location proximity (same or nearby location)
- Date proximity (within reasonable timeframe)
- Category matching (e.g., a lost wallet matching a found wallet)

Only return items with score >= 0.5. Return fewer, higher quality matches rather than many low-quality ones.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert at matching lost and found items. Be thorough but only suggest strong matches." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_matches",
              description: "Report the matching items found",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_id: { type: "string", description: "The ID of the matching item" },
                        score: { type: "number", description: "Match score from 0.0 to 1.0" },
                        reason: { type: "string", description: "Brief explanation of why this is a match" },
                      },
                      required: ["item_id", "score", "reason"],
                    },
                  },
                },
                required: ["matches"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_matches" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI response:", JSON.stringify(aiResult));

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log("No tool call in response");
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matchResults = JSON.parse(toolCall.function.arguments);
    const matches = matchResults.matches || [];

    console.log(`AI found ${matches.length} matches`);

    // Store matches in database
    for (const match of matches) {
      if (match.score >= 0.5) {
        const lostItemId = sourceItem.category === 'lost' ? sourceItem.id : match.item_id;
        const foundItemId = sourceItem.category === 'found' ? sourceItem.id : match.item_id;

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("item_matches")
          .select("id")
          .eq("lost_item_id", lostItemId)
          .eq("found_item_id", foundItemId)
          .single();

        if (!existingMatch) {
          const { error: insertError } = await supabase
            .from("item_matches")
            .insert({
              lost_item_id: lostItemId,
              found_item_id: foundItemId,
              match_score: match.score,
              match_reason: match.reason,
            });

          if (insertError) {
            console.error("Error inserting match:", insertError);
          } else {
            // Send notification with email to the matched item owner
            const matchedItem = potentialMatches.find((i: Item) => i.id === match.item_id);
            if (matchedItem) {
              // Notify matched item owner with email
              await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  type: "match",
                  userId: matchedItem.user_id,
                  title: "Potential Match Found!",
                  message: `Your ${matchedItem.category} item "${matchedItem.title}" might match a ${sourceItem.category} item: "${sourceItem.title}"`,
                  itemId: matchedItem.id,
                  relatedItemId: sourceItem.id,
                  sendEmail: true,
                }),
              });

              // Notify source item owner with email
              await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  type: "match",
                  userId: sourceItem.user_id,
                  title: "Potential Match Found!",
                  message: `Your ${sourceItem.category} item "${sourceItem.title}" might match a ${matchedItem.category} item: "${matchedItem.title}"`,
                  itemId: sourceItem.id,
                  relatedItemId: matchedItem.id,
                  sendEmail: true,
                }),
              });

              console.log("Email notifications sent for match between", sourceItem.id, "and", matchedItem.id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ matches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in find-matches:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
