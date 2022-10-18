const CODE_HASH = '#'.charCodeAt(0)
const CODE_NEWLINE = '\n'.charCodeAt(0)
const CODE_0 = '0'.charCodeAt(0)
const CODE_9 = '9'.charCodeAt(0)

const parseP3 = (buffer: ArrayBuffer, maxValue: number) => {
  const data = new TextDecoder('ascii').decode(buffer)

  return data
    .trim()
    .replace(/#[^\n]*/g, '')
    .split(/\s+/)
    .map(Number)
    .map(value => 255 * value / maxValue)
}

const parseP6 = (buffer: ArrayBuffer, maxValue: number) => {
  const data = maxValue > 0xFF
    ? new Uint16Array(buffer)
    : new Uint8Array(buffer)

  return [...data].map(value => 255 * value / maxValue)
}

export const parsePPMHeader = (buffer: ArrayBuffer) => {
  const content = new Uint8Array(buffer)
  const type = String.fromCharCode(content[0]) + String.fromCharCode(content[1])

  if (!/P[36]/.test(type))
    throw new Error(`Unsupported PPM type: ${type}`)

  const values = []
  let inComment
  let number = 0
  let length = 0
  for (let i = 2; i < content.length; i++) {
    const code = content[i]

    if (code === CODE_HASH) {
      inComment = true
      continue
    }

    if (inComment && code === CODE_NEWLINE)
      inComment = false

    if (inComment)
      continue

    if (values.length === 3 && !/\s/.test(String.fromCharCode(code))) {
      length = i
      break
    }

    if (values.length === 3)
      continue

    if (code >= CODE_0 && code <= CODE_9) {
      number *= 10
      number += code - CODE_0
      continue
    }

    if (number > 0 && /\s/.test(String.fromCharCode(code))) {
      values.push(number)
      number = 0
      continue
    }
  }

  const [width, height, maxValue] = values
  return { width, height, maxValue, length, type }
}

export const parsePPM = async (buffer: ArrayBuffer) => {
  const { length, maxValue, type } = parsePPMHeader(buffer)

  const parserFn = type === 'P3'
    ? parseP3
    : parseP6

  return parserFn(buffer.slice(length), maxValue)
}
