# Testing Guide: Interview Session Management

This guide provides instructions for setting up your environment and testing the interview session management features using our hybrid WebRTC architecture.

> **Note:** For WebRTC-specific testing, see the [WebRTC Testing Guide](WEBRTC_TESTING.md). For a comprehensive overview of the test structure, see the [Test Structure Documentation](docs/development/TEST_STRUCTURE.md).

## Environment Setup

### 1. Set up Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp env.example .env
```

Then edit the `.env` file to add your actual API keys:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI API for transcript processing and AI features
VITE_OPENAI_API_KEY=your-openai-api-key

# Media services (for video/audio) - optional for basic testing
VITE_VIDEOSDK_API_KEY=your-videosdk-api-key

# PDF Processing - optional for basic testing
VITE_PDFCO_API_KEY=your-pdfco-api-key
```

### 2. Verify Environment Configuration

Run the environment checker script:

```bash
node scripts/check-env.js
```

This will validate that all required environment variables are properly set up.

### 3. Start Local Development Server

Start the application:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173` (or whatever port Vite assigns).

## Testing Plan for Interview Session Management

### 1. Session List Page Navigation
- Navigate to `/sessions` by clicking "Sessions" in the sidebar
- Verify the page loads with the correct title and tab structure
- Confirm the "Upcoming" tab is selected by default

### 2. Create Session Flow
- Click "New Session" button on the Sessions page
- Verify navigation to the create session form
- Fill out required fields:
  - Select a candidate from the dropdown
  - Select a position from the dropdown
  - Set a scheduled date and time
  - Select a duration (e.g., 30 minutes)
  - Add optional notes if desired
- Click "Create Interview Session"
- Verify success toast message appears
- Confirm redirection to session details page

### 3. Session Listing & Filtering
- Return to Sessions page
- Verify your new session appears in the list
- Test search functionality:
  - Enter part of the candidate name in the search box
  - Confirm filtering works correctly
- Test status filtering:
  - Select "Scheduled" from the status dropdown
  - Verify only scheduled sessions are displayed
  - Try other status options

### 4. Session Actions
- Locate your test session in the list
- Click the action menu (three dots)
- Verify action menu displays appropriate options:
  - "View Details"
  - "Start Interview" (for scheduled sessions)
  - "Cancel Session" (for scheduled sessions)
- Test "View Details":
  - Click "View Details"
  - Verify navigation to session detail page
  - Confirm session information is displayed correctly
- Return to Sessions page
- Test "Start Interview":
  - Click "Start Interview" for your test session
  - Verify navigation to interview room page
  - Confirm interview interface loads correctly
  - Check that browser asks for camera/microphone permissions

### 5. Interview Room
- In the interview room, verify UI elements:
  - Local video preview
  - Recording controls
  - Transcript panel
- Test basic recording functionality:
  - Click "Start Recording"
  - Speak a few sentences
  - Verify transcript appears in the right panel
  - Click "Stop Recording"
- Test ending the interview:
  - Click "End Interview"
  - Verify return to dashboard/sessions page
  - Check that session status is updated to "completed"

### 6. Responsive Design
- Test the session list on different screen sizes:
  - Resize your browser to mobile width
  - Verify table layout adjusts appropriately
  - Check that all actions remain accessible
- Test the interview room on different screen sizes:
  - Verify video elements resize correctly
  - Confirm controls remain usable

### 7. Edge Cases
- Test pagination:
  - If you have more than 10 sessions, verify pagination controls work
- Test empty state:
  - If possible, filter to a state with no results
  - Verify empty state UI is displayed correctly
- Test invitations:
  - Verify invitation status appears correctly in the sessions list

### 8. Bug Testing
- Try creating a session without selecting required fields
  - Verify validation errors appear appropriately
- Try accessing an interview room with an invalid session ID
  - Verify error handling works correctly
- Test browser reload during an interview session
  - Verify the session resumes correctly

## Troubleshooting

### No Data in Dropdowns
If the candidate or position dropdowns are empty, make sure:
1. You have created at least one candidate in the system
2. You have created at least one position
3. Your Supabase connection is working correctly

### Transcript Not Appearing
If transcript doesn't appear when speaking:
1. Check browser console for errors
2. Verify the OpenAI API key is correct
3. Check that your microphone is properly detected
4. Ensure permission is granted for microphone access

### Video Not Appearing
If the video doesn't appear in the interview room:
1. Check browser console for errors
2. Verify camera permissions are granted
3. Try a different browser (Chrome is recommended)

## Reporting Issues

If you encounter any issues during testing:
1. Take screenshots of the problem
2. Note any console errors (open developer tools with F12)
3. Document the steps to reproduce the issue 