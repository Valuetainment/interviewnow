import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  to: string;
  tenantName: string;
  invitationUrl: string;
  companyCode: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Parse request body
    const { to, tenantName, invitationUrl, companyCode }: InvitationRequest =
      await req.json();

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to InterviewNow</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2563eb;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .code-box {
              background-color: #e9ecef;
              padding: 15px;
              border-radius: 6px;
              font-family: monospace;
              font-size: 18px;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to InterviewNow!</h1>
          </div>
          <div class="content">
            <h2>You've been invited to join ${tenantName}</h2>
            <p>
              You've been invited to set up your organization on InterviewNow, 
              the AI-powered interview platform that helps companies hire better, faster.
            </p>
            
            <p><strong>Your invitation code:</strong></p>
            <div class="code-box">${companyCode}</div>
            
            <p>Click the button below to get started:</p>
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
              ${invitationUrl}
            </p>
            
            <p><strong>This invitation expires in 7 days.</strong></p>
            
            <h3>What happens next?</h3>
            <ol>
              <li>Click the link above to access the onboarding page</li>
              <li>Create your admin account</li>
              <li>Set up your organization details</li>
              <li>Start inviting your team and creating interview sessions</li>
            </ol>
          </div>
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} InterviewNow. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // For development, we'll just log the email
    // In production, you would integrate with an email service like SendGrid, Resend, etc.
    console.log("Sending invitation email to:", to);
    console.log("Tenant:", tenantName);
    console.log("Company Code:", companyCode);
    console.log("Invitation URL:", invitationUrl);

    // TODO: Integrate with actual email service
    // Example with Resend (you would need to add the API key to your env vars):
    /*
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    await resend.emails.send({
      from: 'InterviewNow <noreply@interviewnow.com>',
      to: to,
      subject: `You're invited to join ${tenantName} on InterviewNow`,
      html: emailHtml,
    });
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
