'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  papers,
  questions,
  testAttempts,
  sourceTexts,
} from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Get all papers for user
export async function getUserPapers() {
  const userId = await getUserId()
  return db
    .select()
    .from(papers)
    .where(eq(papers.userId, userId))
    .orderBy(desc(papers.createdAt))
}

// Get paper by code
export async function getPaperByCode(code: string) {
  const userId = await getUserId()
  const paper = await db
    .select()
    .from(papers)
    .where(and(eq(papers.code, code), eq(papers.userId, userId)))
    .limit(1)

  if (!paper.length) throw new Error('Paper not found')

  const paperQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, paper[0].id))

  return { paper: paper[0], questions: paperQuestions }
}

// Save paper
export async function savePaper(paperData: {
  code: string
  title: string
  examType: string
  perspectiveMode: string
  paperLanguage: string
  examSubject: string
  maxMarks: string
  paperCode: string
  questions: Array<{
    id: string
    q_en: string
    q_hi: string
    options_en: string[]
    options_hi: string[]
    correct_index: number
    difficulty: string
    exp_en: string
    exp_hi: string
    source_page: string
  }>
}) {
  const userId = await getUserId()

  // Check if paper exists
  const existing = await db
    .select()
    .from(papers)
    .where(and(eq(papers.code, paperData.code), eq(papers.userId, userId)))
    .limit(1)

  let paperId: string

  if (existing.length > 0) {
    // Update existing paper
    paperId = existing[0].id
    await db
      .update(papers)
      .set({
        title: paperData.title,
        examType: paperData.examType,
        perspectiveMode: paperData.perspectiveMode,
        paperLanguage: paperData.paperLanguage,
        examSubject: paperData.examSubject,
        maxMarks: paperData.maxMarks,
        paperCode: paperData.paperCode,
        updatedAt: new Date(),
      })
      .where(eq(papers.id, paperId))

    // Delete existing questions
    await db.delete(questions).where(eq(questions.paperId, paperId))
  } else {
    // Create new paper
    paperId = `paper_${Date.now()}`
    await db.insert(papers).values({
      id: paperId,
      userId,
      code: paperData.code,
      title: paperData.title,
      examType: paperData.examType,
      perspectiveMode: paperData.perspectiveMode,
      paperLanguage: paperData.paperLanguage,
      examSubject: paperData.examSubject,
      maxMarks: paperData.maxMarks,
      paperCode: paperData.paperCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Insert questions
  if (paperData.questions.length > 0) {
    await db.insert(questions).values(
      paperData.questions.map((q, idx) => ({
        id: `q_${paperId}_${idx}`,
        paperId,
        userId,
        questionEn: q.q_en,
        questionHi: q.q_hi,
        optionsEn: q.options_en,
        optionsHi: q.options_hi,
        correctIndex: q.correct_index,
        difficulty: q.difficulty,
        explanationEn: q.exp_en,
        explanationHi: q.exp_hi,
        sourcePage: q.source_page,
        createdAt: new Date(),
      }))
    )
  }

  revalidatePath('/')
  return { paperId, code: paperData.code }
}

// Delete paper
export async function deletePaper(code: string) {
  const userId = await getUserId()

  const paper = await db
    .select()
    .from(papers)
    .where(and(eq(papers.code, code), eq(papers.userId, userId)))
    .limit(1)

  if (!paper.length) throw new Error('Paper not found')

  // Delete questions
  await db.delete(questions).where(eq(questions.paperId, paper[0].id))

  // Delete test attempts
  await db.delete(testAttempts).where(eq(testAttempts.paperId, paper[0].id))

  // Delete paper
  await db.delete(papers).where(eq(papers.id, paper[0].id))

  revalidatePath('/')
}

// Submit test attempt
export async function submitTestAttempt(
  paperId: string,
  answers: Record<string, number>,
  score: string,
  totalMarks: string,
  correctCount: number,
  wrongCount: number,
  unattemptedCount: number
) {
  const userId = await getUserId()

  const attemptId = `attempt_${Date.now()}`
  await db.insert(testAttempts).values({
    id: attemptId,
    userId,
    paperId,
    answers,
    score,
    totalMarks,
    correctCount,
    wrongCount,
    unattemptedCount,
    submittedAt: new Date(),
  })

  revalidatePath('/')
  return attemptId
}

// Get test attempts
export async function getTestAttempts(paperId: string) {
  const userId = await getUserId()
  return db
    .select()
    .from(testAttempts)
    .where(
      and(eq(testAttempts.paperId, paperId), eq(testAttempts.userId, userId))
    )
    .orderBy(desc(testAttempts.submittedAt))
}

// Save source text
export async function saveSourceText(filename: string, content: string) {
  const userId = await getUserId()

  const textId = `text_${Date.now()}`
  await db.insert(sourceTexts).values({
    id: textId,
    userId,
    filename,
    content,
    createdAt: new Date(),
  })

  return textId
}
