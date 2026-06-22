# ExamMind AI - Deployment Guide

## Production Deployment Steps

### 1. Environment Variables

Add the following environment variables to your Vercel project:

```env
DATABASE_URL=postgresql://...          # From Neon
BETTER_AUTH_SECRET=<random_32_char>    # Generate: openssl rand -base64 32
GEMINI_API_KEY=<your_gemini_key>       # From Google AI Studio
```

### 2. Deploy to Vercel

```bash
# Option 1: Using Vercel CLI
npm install -g vercel
vercel deploy

# Option 2: GitHub Integration
# Connect repo to Vercel, push to main branch
git push origin main
```

### 3. Database Setup

The Neon database tables will be created automatically when you run the first deployment if they don't exist.

To verify tables exist:
```bash
npx drizzle-kit check
```

### 4. Verify Deployment

After deployment:
1. Visit your Vercel URL
2. Try signing up at `/sign-up`
3. Test paper generation with sample text
4. Verify papers can be saved to database

## Environment Variables Reference

| Variable | Purpose | Required | Notes |
|----------|---------|----------|-------|
| `DATABASE_URL` | Neon PostgreSQL connection | Yes | Auto-provided by Neon integration |
| `BETTER_AUTH_SECRET` | Session signing key | Yes | Generate randomly, 32+ chars |
| `GEMINI_API_KEY` | Google Generative AI API | Yes | Get from https://aistudio.google.com |

## Troubleshooting

### Auth not working
- Check `BETTER_AUTH_SECRET` is set and 32+ characters
- Verify database connection with `DATABASE_URL`

### API generation fails
- Verify `GEMINI_API_KEY` is valid and has API quota
- Check browser console for error messages

### Database errors
- Ensure all Neon tables were created (papers, questions, testAttempts, sourceTexts)
- Verify user has proper permissions in database

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:3000
```

## Production Performance Tips

1. Enable image optimization in Vercel
2. Use Vercel Analytics for monitoring
3. Set up database connection pooling in Neon
4. Consider caching generated questions in Redis (optional)
