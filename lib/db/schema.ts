import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  schema,
} from 'drizzle-orm/pg-core'

// Reference the existing Better Auth tables (in neon_auth schema)
// We'll just reference them, not redefine them
export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').unique(),
    emailVerified: boolean('emailVerified'),
    image: text('image'),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt'),
  },
  (table) => ({
    schema: 'neon_auth',
  })
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt'),
    token: text('token').unique(),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull(),
  },
  (table) => ({
    schema: 'neon_auth',
  })
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId'),
    providerId: text('providerId'),
    userId: text('userId').notNull(),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt'),
  },
  (table) => ({
    schema: 'neon_auth',
  })
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier'),
    value: text('value'),
    expiresAt: timestamp('expiresAt'),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt'),
  },
  (table) => ({
    schema: 'neon_auth',
  })
)

// ExamMind AI Tables (in public schema)

// Papers table - stores exam papers
export const papers = pgTable('papers', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  code: text('code').unique().notNull(),
  title: text('title').notNull(),
  examType: text('examType'),
  perspectiveMode: text('perspectiveMode'),
  paperLanguage: text('paperLanguage').default('Bilingual'),
  examSubject: text('examSubject'),
  maxMarks: text('maxMarks'),
  paperCode: text('paperCode'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// Questions table - stores individual questions
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  paperId: text('paperId').notNull(),
  userId: text('userId').notNull(),
  questionEn: text('questionEn').notNull(),
  questionHi: text('questionHi').notNull(),
  optionsEn: jsonb('optionsEn').notNull(), // array of strings
  optionsHi: jsonb('optionsHi').notNull(), // array of strings
  correctIndex: integer('correctIndex').notNull(),
  difficulty: text('difficulty'), // Easy, Moderate, Hard
  explanationEn: text('explanationEn'),
  explanationHi: text('explanationHi'),
  sourcePage: text('sourcePage'),
  createdAt: timestamp('createdAt').defaultNow(),
})

// Test attempts - stores student attempts
export const testAttempts = pgTable('testAttempts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  paperId: text('paperId').notNull(),
  answers: jsonb('answers').notNull(), // { questionId: selectedIndex }
  score: text('score'),
  totalMarks: text('totalMarks'),
  correctCount: integer('correctCount'),
  wrongCount: integer('wrongCount'),
  unattemptedCount: integer('unattemptedCount'),
  submittedAt: timestamp('submittedAt').defaultNow(),
})

// Source texts - stores uploaded PDFs/texts
export const sourceTexts = pgTable('sourceTexts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  filename: text('filename'),
  content: text('content'),
  createdAt: timestamp('createdAt').defaultNow(),
})
