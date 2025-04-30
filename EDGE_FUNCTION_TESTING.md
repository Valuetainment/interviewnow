# Edge Function Testing Guide

This guide provides instructions for testing the Edge Functions used in the interview system, particularly the transcript processor.

## Prerequisites

### 1. Install Supabase CLI

Install the Supabase CLI globally:

```bash
# Using npm
npm install -g supabase

# Alternative with npx
npx supabase --version # to check if it's available
```

If you encounter permission issues:

```bash
# Using npm with sudo (macOS/Linux)
sudo npm install -g supabase

# Or install it locally and use npx
npm install supabase --save-dev
npx supabase --version
```

### 2. Install Deno (Required for Edge Functions)

#### macOS Installation

Using Homebrew:
```bash
brew install deno
```

Or using the shell script:
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

Then add Deno to your PATH in your shell profile (~/.zshrc or ~/.bash_profile):
```bash
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

#### Windows Installation

Using PowerShell:
```powershell
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

#### Verify Deno Installation

After installation, open a new terminal window and verify Deno is installed:
```bash
deno --version
```

## Testing the Transcript Processor

### 1. Set up Local Environment Variables

Create a `.env` file in the project root if you haven't already:

```
OPENAI_API_KEY=your_openai_api_key
```

### 2. Test OpenAI API Connectivity

Navigate to the transcript-processor directory and run the API test:

```bash
cd supabase/functions/transcript-processor
deno run --allow-env --allow-net check-api.ts
```

You should see a success message if your OpenAI API key is configured correctly.

### 3. Start Local Supabase Environment

From the project root:

```bash
supabase start
```

This will start the local Supabase development environment, including Auth, Database, and Edge Functions.

### 4. Serve Edge Functions Locally

From the project root:

```bash
supabase functions serve
```

This will serve all Edge Functions locally, allowing you to test them without deployment.

### 5. Testing the Transcript Processor Edge Function

You can test the transcript processor with sample audio using curl:

```bash
curl -X POST http://localhost:54321/functions/v1/transcript-processor \
  -H "Authorization: Bearer $(supabase auth token -i)" \
  -H "Content-Type: application/json" \
  --data '{
    "session_id": "test-session-id",
    "tenant_id": "test-tenant-id",
    "audio_chunk": "BASE64_ENCODED_AUDIO",
    "speaker": "Test User",
    "sequence_number": 1
  }'
```

Replace `BASE64_ENCODED_AUDIO` with a base64-encoded WebM audio chunk.

## Troubleshooting Edge Functions

### Common Issues

1. **Command not found: deno**
   - Make sure Deno is installed correctly
   - Check if Deno is in your PATH by running `which deno`
   - You might need to restart your terminal after installation
   - On macOS, ensure PATH settings are properly set in ~/.zshrc or ~/.bash_profile

2. **OpenAI API Key Issues**
   - Ensure your OpenAI API key is correctly set in the environment
   - Check for spaces or extra characters in the key
   - Verify the key has sufficient permissions and quota

3. **Deno Runtime Errors**
   - Make sure you're using npm: prefixed imports (e.g., `npm:openai@4.29.0`)
   - Check for syntax errors specific to Deno

4. **Supabase Client Issues**
   - If the Edge Function can't access the database, verify the JWT configuration
   - Check RLS policies to ensure proper access based on JWT claims

5. **CORS Issues**
   - Ensure the Edge Function includes proper CORS headers
   - Check that the browser request includes the correct credentials

### Advanced Debug

For advanced debugging, you can use the Deno developer tools:

```bash
deno run --inspect-brk supabase/functions/transcript-processor/index.ts
```

Then open Chrome and navigate to `chrome://inspect` to attach the debugger.

## Best Practices for Edge Function Development

1. **Keep Functions Focused**
   - Each Edge Function should have a single responsibility
   - Limit dependencies to what's absolutely necessary

2. **Error Handling**
   - Always include comprehensive error handling
   - Return appropriate HTTP status codes
   - Include helpful error messages

3. **Security**
   - Validate all input data
   - Use RLS policies to protect database access
   - Don't expose sensitive information in responses

4. **Performance**
   - Keep Edge Functions lightweight
   - Use caching where appropriate
   - Limit memory usage 