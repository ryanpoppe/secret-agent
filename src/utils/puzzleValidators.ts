/**
 * Validates a Caesar cipher answer by checking if the input matches
 * the expected decrypted text
 */
export function validateCaesarCipher(
  input: string,
  expected: string,
  alternatives?: string[]
): boolean {
  const normalized = input.toUpperCase().trim()
  
  if (normalized === expected.toUpperCase()) {
    return true
  }
  
  if (alternatives) {
    return alternatives.some((alt) => normalized === alt.toUpperCase())
  }
  
  return false
}

/**
 * Decrypts a Caesar cipher with a given shift
 */
export function decryptCaesar(text: string, shift: number): string {
  return text
    .split('')
    .map((char) => {
      if (char.match(/[A-Z]/i)) {
        const base = char === char.toUpperCase() ? 65 : 97
        const code = char.charCodeAt(0)
        const shifted = ((code - base - shift + 26) % 26) + base
        return String.fromCharCode(shifted)
      }
      return char
    })
    .join('')
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Normalizes answer for comparison (uppercase, trimmed, removes extra spaces)
 */
export function normalizeAnswer(answer: string): string {
  return answer.toUpperCase().trim().replace(/\s+/g, ' ')
}

/**
 * Checks if the answer matches any of the acceptable answers
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  alternatives?: string[]
): boolean {
  const normalized = normalizeAnswer(userAnswer)
  
  if (normalized === normalizeAnswer(correctAnswer)) {
    return true
  }
  
  if (alternatives) {
    return alternatives.some(
      (alt) => normalized === normalizeAnswer(alt)
    )
  }
  
  return false
}

/**
 * Intro puzzle validator - specific for the intro screen Caesar cipher
 * Expected answer: "PRINT SERVERS ARE THE WEAKEST LINK"
 */
export function validateIntroPuzzle(answer: string): boolean {
  const normalized = normalizeAnswer(answer)
  const acceptableAnswers = [
    'PRINT SERVERS ARE THE WEAKEST LINK',
    'PRINTSERVERSARETHEWEAKESTLINK',
  ]
  
  return acceptableAnswers.some((acceptable) => 
    normalized === normalizeAnswer(acceptable)
  )
}

