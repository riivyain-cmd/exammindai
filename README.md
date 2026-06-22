# ExamMind AI - AI-Powered Mock Test Generator

A production-ready Next.js 16 application that generates AI-powered mock exam papers with bilingual support (English & Hindi) for UPSC, SSC, Banking, Railway, and other competitive exams.

## Features

- **AI-Powered Question Generation** - Uses Google Gemini API to generate high-quality MCQs
- **Bilingual Support** - English, Hindi, or Bilingual (Hindi-English twin-column) format
- **Multiple Exam Types** - UPSC, SSC CGL, State PCS, Banking PO, Railway, CTET, NEET, JEE
- **Customizable Difficulty** - Adjust Easy/Moderate/Hard distribution
- **Question Patterns** - Analytical, Factual, Conceptual, PYQ Pattern, Assertion-Reason, and more
- **Live Test Taking** - Practice mode with instant answer reveal or exam mode with final scoring
- **Cloud Storage** - Save papers with unique shareable codes
- **Export Options** - Download as PDF or Word (.doc) format
- **Study Tools** - Quick notes, mnemonics, flashcards, study plans, key facts extraction
- **User Authentication** - Email/password auth with Better Auth + Neon PostgreSQL

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with email/password
- **AI**: Google Gemini API for question generation
- **UI Icons**: Lucide React
- **Export**: HTML2PDF for PDF generation

## Prerequisites

- Node.js 18+ / npm 9+
- Neon PostgreSQL database
- Google Gemini API key
- Better Auth secret

## Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd exammind-ai
npm install
```

2. **Set up environment variables**

Create a `.env.development.local` file in the root:

```env
DATABASE_URL=postgresql://user:password@neon-region.neon.tech/dbname
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
GEMINI_API_KEY=your-google-gemini-api-key
```

Generate a secure `BETTER_AUTH_SECRET`:
```bash
openssl rand -base64 32
```

3. **Create database tables**

The Better Auth tables are auto-created. For ExamMind tables, run:

```bash
npm run seed  # (if seed script is added)
```

Or manually create tables using the Neon dashboard.

4. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
  layout.tsx              # Root layout
  page.tsx                # Protected dashboard
  sign-in/page.tsx        # Sign-in page
  sign-up/page.tsx        # Sign-up page
  api/auth/[...all]/      # Better Auth handler
  actions/papers.ts       # Server actions
  globals.css             # Global styles

lib/
  auth.ts                 # Better Auth config
  auth-client.ts          # Client-side auth
  db/
    index.ts              # Drizzle setup
    schema.ts             # Database schema

components/
  exam-generator.tsx      # Main exam generator UI
  auth-form.tsx           # Sign-in/sign-up form
```

## Database Schema

### Papers Table
- `id` - Unique identifier
- `userId` - User who created the paper
- `code` - Unique shareable code (e.g., BDR-ABCD12)
- `title` - Paper title
- `examType` - UPSC, SSC, etc.
- `paperLanguage` - Bilingual/English/Hindi
- `questions` - JSON array of questions

### Questions Table
- `id` - Unique identifier
- `paperId` - Reference to paper
- `userId` - Question owner
- `questionEn/Hi` - Question in English/Hindi
- `optionsEn/Hi` - Multiple choice options
- `correctIndex` - Correct answer (0-3)
- `difficulty` - Easy/Moderate/Hard
- `explanationEn/Hi` - Detailed explanation

### Test Attempts Table
- Records student test submissions
- Tracks scores, answers, attempts

## Key Features Explained

### AI Question Generation

1. Upload PDF/text content
2. Specify exam type, difficulty distribution, question count
3. Click "Generate MCQs"
4. AI generates high-quality questions using Gemini API

### Bilingual Support

Papers can be generated in three formats:
- **Bilingual**: Twin-column layout with Hindi on left, English on right
- **Hindi Only**: Single-column Hindi format
- **English Only**: Single-column English format

### Test Taking

- **Practice Mode**: Show answers instantly, reveal explanations
- **Exam Mode**: Hide answers until submission, get final score
- Real-time timer
- One-click export to PDF/Word

### Cloud Storage

Every paper gets a unique code (e.g., `BDR-XYZ123`) for easy sharing.

## API Endpoints

### Auth
- `POST /api/auth/sign-up` - Create account
- `POST /api/auth/sign-in` - Login
- `GET /api/auth/session` - Get session
- `POST /api/auth/sign-out` - Logout

### Papers (Server Actions)
- `savePaper()` - Save/update paper
- `deletePaper()` - Delete paper
- `getUserPapers()` - Get all papers for user
- `getPaperByCode()` - Load paper by code
- `submitTestAttempt()` - Record test submission

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET
vercel env add GEMINI_API_KEY
```

## Google Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create API key
3. Add to `.env.development.local`:
   ```
   GEMINI_API_KEY=your-api-key
   ```

## Troubleshooting

### "Unauthorized" on dashboard
- Ensure Better Auth secret is set
- Check DATABASE_URL is correct
- Verify auth tables exist in Neon

### Questions not generating
- Check GEMINI_API_KEY in env
- Verify input text is not empty
- Check browser console for API errors

### Export fails
- Ensure html2pdf script loads
- Check PDF viewer permissions
- Try different browser

## Future Enhancements

- [ ] Collaborative paper creation
- [ ] Question bank management
- [ ] Advanced analytics & performance tracking
- [ ] Mobile app with offline support
- [ ] Plagiarism detection
- [ ] Community question sharing
- [ ] Teacher/Institute dashboard
- [ ] Integration with LMS platforms

## License

MIT

## Support

For issues and feature requests, please create an issue on GitHub.
