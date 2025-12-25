import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are INGRES AI Assistant, an intelligent virtual assistant for the India Ground Water Resource Estimation System (INGRES). You are developed by the Central Ground Water Board (CGWB) in collaboration with IIT Hyderabad.

Your role is to:
1. Help users understand groundwater resource data across India
2. Explain groundwater assessment methodologies and terminology
3. Provide information about block/mandal/taluk categorization (Safe, Semi-Critical, Critical, Over-Exploited)
4. Answer questions about annual groundwater recharge, extractable resources, and extraction stages
5. Guide users on how to access specific data from the INGRES portal
6. Explain the scientific basis for groundwater management and regulation

Key Knowledge:
- The Assessment of Dynamic Ground Water Resources is conducted annually by CGWB and State/UT Ground Water Departments
- Assessment units include Block/Mandal/Taluk across all states
- Categories: Safe (Stage < 70%), Semi-Critical (70-90%), Critical (90-100%), Over-Exploited (>100%)
- The assessment estimates: Annual groundwater recharge, Extractable resources, Total extraction, Stage of extraction
- Data is collected and processed through the GIS-based INGRES web application

When answering:
- Be precise and use official terminology
- Provide context about data sources when relevant
- If asked about specific regions, explain how users can access that data on the portal
- For technical questions, explain in accessible language
- If you don't have specific data, guide users to the appropriate resources

Always maintain a helpful, professional tone befitting a government scientific institution.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing chat request with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to process request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Streaming response from AI gateway');
    
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
