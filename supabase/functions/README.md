# Supabase Edge Functions Setup

This directory contains Edge Functions for generating AI-powered content using Google's Gemini API.

## Functions

### 1. `generate_lessons`
Generates comprehensive lesson content for subjects using Gemini AI.

### 2. `generate_quiz`
Creates multiple-choice quiz questions from lesson content using Gemini AI.

## Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Link to your Supabase project
```bash
supabase link --project-ref qtrngmzhilkrgjmefpra
```

### 3. Set the Gemini API Key as a secret
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyDa0N41_2KFypxWxn5gHiyDxU-D1szHe3w
```

Optional: Set a specific model (defaults to `gemini-pro`)
```bash
supabase secrets set GEMINI_MODEL=gemini-pro
```

### 4. Deploy the functions
```bash
supabase functions deploy generate_lessons
supabase functions deploy generate_quiz
```

## Testing Locally

### 1. Start the local Supabase environment
```bash
supabase start
```

### 2. Serve functions locally with secrets
```bash
supabase functions serve --env-file ./supabase/.env.local
```

Create `supabase/.env.local` with:
```
GEMINI_API_KEY=AIzaSyDa0N41_2KFypxWxn5gHiyDxU-D1szHe3w
GEMINI_MODEL=gemini-pro
```

### 3. Test the functions
```bash
# Test generate_lessons
curl -X POST http://localhost:54321/functions/v1/generate_lessons \
  -H "Content-Type: application/json" \
  -d '{"subject": "biology", "base": [{"title": "Cell Structure", "content": "Basic cell components"}]}'

# Test generate_quiz
curl -X POST http://localhost:54321/functions/v1/generate_quiz \
  -H "Content-Type: application/json" \
  -d '{"lesson": {"title": "Cell Structure", "content": "Cells have a nucleus..."}, "count": 5}'
```

## Fallback Behavior

The application has multi-tier fallback:
1. **Supabase Edge Functions** (using Gemini) - Preferred
2. **Direct Gemini API** from client (using `VITE_GEMINI_API_KEY`)
3. **Local generation** - Basic quiz/lesson generation without AI

Make sure `VITE_GEMINI_API_KEY` is set in your `.env` file for client-side fallback.

## Checking Function Status

```bash
# List all functions
supabase functions list

# View function logs
supabase functions logs generate_lessons
supabase functions logs generate_quiz
```
