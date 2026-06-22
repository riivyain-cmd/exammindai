import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const {
      targetCount,
      sourceText,
      examType,
      perspectiveMode,
      paperLanguage,
      topicFocus,
      distEasy,
      distModerate,
      distHard,
      distFactual,
      distConceptual,
      distAdvanced,
    } = body

    const easyN = Math.round((targetCount * distEasy) / 100)
    const modN = Math.round((targetCount * distModerate) / 100)
    const hardN = targetCount - easyN - modN

    let stylePrompt = `Question Style/Pattern: ${perspectiveMode}`
    if (perspectiveMode === 'Custom Mix (Percentage)') {
      const facN = Math.round((targetCount * distFactual) / 100)
      const conN = Math.round((targetCount * distConceptual) / 100)
      const advN = targetCount - facN - conN
      stylePrompt = `Question Style Distribution: Generate exactly ${facN} Factual/Direct questions, ${conN} Conceptual/Analytical questions, and ${advN} Advanced (Statement-based / Assertion-Reason / Match the Following) questions.`
    }

    let langInstruction = 'bilingual (English & Hindi)'
    if (paperLanguage === 'Hindi Only') {
      langInstruction =
        'strictly in HINDI language only. Important: For the JSON response, put the exact same Hindi text in BOTH the "_en" and "_hi" fields to ensure the schema remains valid.'
    } else if (paperLanguage === 'English Only') {
      langInstruction =
        'strictly in ENGLISH language only. Important: For the JSON response, put the exact same English text in BOTH the "_en" and "_hi" fields to ensure the schema remains valid.'
    }

    const safeText = sourceText.substring(0, 60000)

    const schema = {
      type: 'OBJECT',
      properties: {
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              q_en: { type: 'STRING' },
              q_hi: { type: 'STRING' },
              options_en: { type: 'ARRAY', items: { type: 'STRING' } },
              options_hi: { type: 'ARRAY', items: { type: 'STRING' } },
              correct_index: { type: 'INTEGER' },
              difficulty: { type: 'STRING' },
              exp_en: { type: 'STRING' },
              exp_hi: { type: 'STRING' },
              source_page: { type: 'STRING' },
            },
            required: [
              'q_en',
              'q_hi',
              'options_en',
              'options_hi',
              'correct_index',
              'difficulty',
              'exp_en',
              'exp_hi',
              'source_page',
            ],
          },
        },
      },
    }

    const prompt = `Generate EXACTLY ${targetCount} UNIQUE, high-quality ${langInstruction} MCQs from the provided text.
Exam Standard: ${examType}
${stylePrompt}
${topicFocus?.trim() ? `FOCUS AREA: "${topicFocus}"` : ''}
Difficulty: ${easyN} Easy, ${modN} Moderate, ${hardN} Hard.
Provide exactly 4 options. Keep the options concise like a real exam.
Give thorough explanations.
IMPORTANT: The source text contains page markers like [PAGE 1]. You MUST include the exact "source_page" number (e.g., "1") for each question based on where the fact was found. If no markers exist, set it to "N/A".
Source Text: ${safeText}`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [
            {
              text: 'You are an expert exam paper setter. Provide highly accurate answer keys. Keep options short.',
            },
          ],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const parsedData = JSON.parse(data.candidates[0].content.parts[0].text)

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
