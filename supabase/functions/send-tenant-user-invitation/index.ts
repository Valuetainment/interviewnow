import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  to: string;
  inviterName: string;
  tenantName: string;
  invitationUrl: string;
  companyCode: string;
  role: string;
  companyNames?: string[];
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
    const {
      to,
      inviterName,
      tenantName,
      invitationUrl,
      companyCode,
      role,
      companyNames = [],
    }: InvitationRequest = await req.json();

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Check if we're in development mode
    const isDevelopment =
      Deno.env.get("DENO_ENV") === "development" ||
      Deno.env.get("IS_LOCAL") === "true";

    // In development, redirect emails to test account
    const actualRecipient = isDevelopment ? "chriscelaya@gmail.com" : to;

    // Generate role display text
    const roleDisplay =
      role === "tenant_admin" ? "Administrator" : "Interviewer";

    // Generate company access text
    const companyAccessText =
      companyNames.length > 0
        ? `<p>You will have access to the following companies:</p>
         <ul>
           ${companyNames.map((name) => `<li>${name}</li>`).join("")}
         </ul>`
        : "";

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invitation to join ${tenantName}</title>
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
            .tenant-box {
              background-color: #e3f2fd;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              border-left: 4px solid #2563eb;
            }
            ul {
              margin: 10px 0;
              padding-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>You're Invited to InterviewNow!</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>
              ${inviterName} has invited you to join <strong>${tenantName}</strong> on InterviewNow 
              as a${
                roleDisplay === "Administrator" ? "n" : ""
              } <strong>${roleDisplay}</strong>.
            </p>
            
            <div class="tenant-box">
              <strong>Organization:</strong> ${tenantName}<br>
              <strong>Your Role:</strong> ${roleDisplay}
            </div>
            
            ${companyAccessText}
            
            <p><strong>Your invitation code:</strong></p>
            <div class="code-box">${companyCode}</div>
            
            <p>Click the button below to accept this invitation and create your account:</p>
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
              <li>Click the link above to access the signup page</li>
              <li>Create your account using this email address</li>
              <li>Enter the invitation code when prompted</li>
              <li>Start conducting interviews on InterviewNow!</li>
            </ol>
            
            ${
              isDevelopment
                ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 20px 0; border-radius: 4px;">
              <strong>Development Mode:</strong> This email was intended for ${to} but was redirected to ${actualRecipient} for testing.
            </div>`
                : ""
            }
          </div>
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} InterviewNow. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "InterviewNow <noreply@vthire.ai>",
        to: [actualRecipient],
        subject: `${inviterName} invited you to join ${tenantName} on InterviewNow`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(
        `Failed to send email: ${errorData.message || "Unknown error"}`
      );
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email sent successfully",
        emailId: emailResult.id,
        developmentMode: isDevelopment,
        actualRecipient: actualRecipient,
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
