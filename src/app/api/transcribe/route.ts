import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { tmpdir } from 'os'
import { join, extname, basename } from 'path'
import fs from 'fs/promises'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

export const maxDuration = 300 // 5 นาที (300 วินาที)
const GROQ_MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB Groq Whisper limit
const CHUNK_SECONDS = 300 // 5 minutes per chunk

function getGoogleDriveDirectUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.host.toLowerCase()
    const pathname = parsed.pathname

    if (host.endsWith('drive.google.com') || host.endsWith('docs.google.com')) {
      // https://drive.google.com/file/d/ID/view?usp=sharing
      const fileIdMatch = pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`

      // https://drive.google.com/open?id=ID
      const openId = parsed.searchParams.get('id')
      if (openId) return `https://drive.google.com/uc?export=download&id=${openId}`

      // https://drive.google.com/uc?export=download&id=ID
      const ucId = parsed.searchParams.get('id')
      if (ucId) return `https://drive.google.com/uc?export=download&id=${ucId}`

      // if url already is uc with export=download
      if (pathname === '/uc' && parsed.searchParams.get('export') === 'download' && parsed.searchParams.get('id')) {
        return url
      }
    }
  } catch {
    // fall through
  }

  // fallback regexes
  const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (match2) return `https://drive.google.com/uc?export=download&id=${match2[1]}`

  return null
}

async function fetchGoogleDriveFile(url: string): Promise<ArrayBuffer> {
  let currentUrl = url
  let cookies: string[] = []
  
  const fileId = (() => {
    try { return new URL(url).searchParams.get('id') } catch { return null }
  })()

  for (let attempt = 0; attempt < 5; attempt++) {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    }
    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ')
    }

    const res = await fetch(currentUrl, {
      redirect: 'follow',
      headers,
    })

    // Capture cookies for next requests
    const setCookieHeader = (res.headers as any).getSetCookie ? (res.headers as any).getSetCookie() : res.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const newCookies = cookieStrings.map(c => c.split(';')[0].trim());
      cookies = Array.from(new Set([...cookies, ...newCookies]));
    }

    const buffer = await res.arrayBuffer()
    const text = Buffer.from(buffer).slice(0, 32768).toString('utf8')
    const contentType = (res.headers.get('content-type') || '').toLowerCase()

    if (!(contentType.includes('text/html') || /<html/i.test(text))) {
      return buffer
    }

    let nextUrl: string | null = null

    // 1) direct uc download link in the page (handling &amp;)
    const hrefMatch = text.match(/href="([^"]*?uc\?export=download[^"]*)"/i)
    if (hrefMatch) {
      const matchedUrl = hrefMatch[1].replace(/&amp;/g, '&')
      nextUrl = matchedUrl.startsWith('http') ? matchedUrl : `https://drive.google.com${matchedUrl}`
    }

    // 2) confirm token + id (common for large files)
    if (!nextUrl && fileId) {
      // Look for confirm token in various patterns
      const confirmTokenMatch = text.match(/confirm=([0-9A-Za-z_\-]+)/i) ||
                               text.match(/name="confirm"\s+value="([0-9A-Za-z_\-]+)"/i) ||
                               text.match(/value="([0-9A-Za-z_\-]+)"\s+name="confirm"/i)
      if (confirmTokenMatch) {
        nextUrl = `https://drive.google.com/uc?export=download&confirm=${confirmTokenMatch[1]}&id=${fileId}`
      }
    }

    // 3) googleusercontent direct link
    if (!nextUrl) {
      const googleDirectMatch = text.match(/https:\/\/[^\s"'<]*\.googleusercontent\.com\/[^"'<\s]*/i)
      if (googleDirectMatch) {
        nextUrl = googleDirectMatch[0]
      }
    }

    // 4) downloadUrl from JS object
    if (!nextUrl) {
      const downloadUrlMatch = text.match(/\"downloadUrl\"\s*:\s*\"([^\"]+)\"/i)
      if (downloadUrlMatch) {
        nextUrl = downloadUrlMatch[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&')
      }
    }

    if (nextUrl) {
      currentUrl = nextUrl
      continue
    }

    // Still HTML: try forced confirm for large file warnings
    const isWarning = /Google Drive.*(?:virus|warning|ไฟล์|ยืนยัน|too large for Google to scan)/i.test(text)
    if (isWarning && fileId) {
      const forcedConfirm = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=1`
      if (currentUrl !== forcedConfirm) {
        currentUrl = forcedConfirm
        continue
      }
    }

    if (isWarning) {
      throw new Error('Google Drive warning page detected; กรุณาตั้งสิทธิ์เป็น "Anyone with the link" หรือแชร์ public แล้วลองใหม่ หรือลองอัปโหลดไฟล์โดยตรง')
    }

    if (fileId) {
      // 2nd fallback: force confirm URL if no other solution
      const fallbackConfirm = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=1`
      if (currentUrl !== fallbackConfirm) {
        currentUrl = fallbackConfirm
        continue
      }
      throw new Error('ไม่พบลิงก์ดาวน์โหลดในเพจ Google Drive; ตรวจสอบว่าไฟล์เป็น "Anyone with link" และแชร์แบบดูได้')
    }

    throw new Error('Google Drive ส่ง HTML page กลับมา (ไม่ใช่ไฟล์สื่อ)')
  }

  throw new Error('ไม่สามารถดาวน์โหลดไฟล์จาก Google Drive ได้หลังจากพยายามหลายครั้ง')
}

// ─── Groq Whisper (ฟรี, เร็ว, รองรับภาษาไทย) ──────────────────
async function transcribeWithGroq(audioBuffer: Buffer, filename: string, apiKey: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() || 'mp4'
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
    m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg',
    flac: 'audio/flac', mov: 'video/quicktime',
  }
  const mime = mimeMap[ext] || 'audio/mpeg'

  const formData = new FormData()
  const blob = new Blob([audioBuffer], { type: mime })
  formData.append('file', blob, filename)
  formData.append('model', 'whisper-large-v3-turbo') // Groq's fastest Whisper model
  formData.append('language', 'th')
  formData.append('response_format', 'text')
  formData.append('temperature', '0')

  if (audioBuffer.length > GROQ_MAX_FILE_SIZE) {
    throw new Error(`Groq Whisper error: file too large (${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB). Max 100MB.`)
  }

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq Whisper error: ${err}`)
  }

  const text = await res.text()
  return text.trim()
}

let resolvedFfmpegPath: string | null = null

async function resolveFfmpegPath(): Promise<string> {
  if (resolvedFfmpegPath) return resolvedFfmpegPath

  const staticCandidate = join(process.cwd(), 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  const candidates = [
    process.env.FFMPEG_PATH,
    ffmpegPath,
    staticCandidate,
    'ffmpeg',
    'ffmpeg.exe',
  ]
  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      if (candidate === 'ffmpeg' || candidate === 'ffmpeg.exe') {
        await new Promise<void>((resolve, reject) => {
          const proc = spawn(candidate, ['-version'])
          proc.on('error', reject)
          proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`not found`))))
        })
        resolvedFfmpegPath = candidate
        return candidate
      }

      await fs.access(candidate)
      resolvedFfmpegPath = candidate
      return candidate
    } catch {
      continue
    }
  }

  throw new Error('ffmpeg executable not found; install ffmpeg or add it to PATH')
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const bin = await resolveFfmpegPath()
      const proc = spawn(bin, args)
      let stderr = ''
      proc.stderr.on('data', (data) => { stderr += data.toString() })
      proc.on('error', reject)
      proc.on('close', (code) => {
        if (code === 0) return resolve()
        reject(new Error(`ffmpeg exited ${code}: ${stderr}`))
      })
    } catch (err) {
      reject(err)
    }
  })
}

async function convertAudioToMp3(inputBuffer: Buffer, filename: string, tmpDir: string): Promise<Buffer> {
  const ext = extname(filename) || '.mp4'
  const inputPath = join(tmpDir, `input${ext}`)
  const outputPath = join(tmpDir, 'output.mp3')

  await fs.writeFile(inputPath, inputBuffer)
  await runFfmpeg([
    '-y',
    '-i', inputPath,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-b:a', '128k',
    outputPath,
  ])

  return fs.readFile(outputPath)
}

async function splitAudioIntoChunks(inputPath: string, outDir: string): Promise<string[]> {
  const outputPattern = join(outDir, 'chunk-%03d.mp3')
  await runFfmpeg([
    '-y',
    '-i', inputPath,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-b:a', '128k',
    '-f', 'segment',
    '-segment_time', CHUNK_SECONDS.toString(),
    outputPattern,
  ])

  const files = await fs.readdir(outDir)
  const chunks = files
    .filter((file) => file.startsWith('chunk-') && file.endsWith('.mp3'))
    .sort()
    .map((file) => join(outDir, file))

  if (chunks.length === 0) {
    throw new Error('Failed to split audio into chunks')
  }

  return chunks
}

async function transcribeMaybeChunked(audioBuffer: Buffer, filename: string, apiKey: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(join(tmpdir(), 'transcribe-'))
  try {
    const ext = extname(filename) || '.mp4'
    const inputFilePath = join(tmpDir, `input${ext}`)
    await fs.writeFile(inputFilePath, audioBuffer)

    const shouldChunk = audioBuffer.length > GROQ_MAX_FILE_SIZE

    if (!shouldChunk) {
      const converted = await convertAudioToMp3(audioBuffer, filename, tmpDir)
      return transcribeWithGroq(converted, 'audio.mp3', apiKey)
    }

    const chunkPaths = await splitAudioIntoChunks(inputFilePath, tmpDir)
    const transcripts: string[] = []

    for (const chunkPath of chunkPaths) {
      const chunkBuffer = await fs.readFile(chunkPath)
      const chunkTranscript = await transcribeWithGroq(chunkBuffer, basename(chunkPath), apiKey)
      transcripts.push(chunkTranscript)
    }

    return transcripts.join('\n\n---\n\n')
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json({
        error: 'ไม่พบ GROQ_API_KEY — กรุณาตั้งค่าใน .env',
      }, { status: 400 })
    }

    const contentType = req.headers.get('content-type') || ''

    // ─── METHOD 1: Google Drive URL ───────────────────────────────
    if (contentType.includes('application/json')) {
      const { driveUrl } = await req.json()
      if (!driveUrl) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

      const apiKey = groqApiKey

      const directUrl = getGoogleDriveDirectUrl(driveUrl)
      if (!directUrl) {
        return NextResponse.json({
          error: 'ไม่ใช่ Google Drive URL ที่รองรับ\nรูปแบบที่ใช้ได้: drive.google.com/file/d/FILE_ID/view',
        }, { status: 400 })
      }

      let arrayBuffer: ArrayBuffer
      try {
        arrayBuffer = await fetchGoogleDriveFile(directUrl)
      } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 400 })
      }
      const textPreview = Buffer.from(arrayBuffer).slice(0, 128).toString('utf8').trim()
      const isHtml = /^(<\!doctype html|<html)/i.test(textPreview)
      if (contentType.includes('text/html') || isHtml) {
        return NextResponse.json({
          error: 'URL ของ Google Drive กลับมาเป็นเพจ HTML (preview / warning), ไม่ใช่ไฟล์สื่อที่ดาวน์โหลดได้โดยตรง'
        }, { status: 400 })
      }

      const buffer = Buffer.from(arrayBuffer)

      // Detect file type from URL or content-type, fallback mp4
      const extFromUrl = driveUrl.match(/\.(mp3|wav|m4a|mp4|webm|ogg|flac|mov)(\?|$)/i)?.[1]
      const extFromType = contentType.startsWith('audio/') ? contentType.split('/')[1] :
        contentType.startsWith('video/') ? contentType.split('/')[1] : undefined
      const filename = extFromUrl ? `audio.${extFromUrl.toLowerCase()}` :
        extFromType ? `audio.${extFromType.split(';')[0]}` : 'audio.mp4'

      const transcript = await transcribeMaybeChunked(buffer, filename, apiKey)
      return NextResponse.json({ transcript, method: 'drive' })
    }

    // ─── METHOD 2: File Upload ────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

      const buffer = Buffer.from(await file.arrayBuffer())
      const transcript = await transcribeMaybeChunked(buffer, file.name, groqApiKey)
      return NextResponse.json({ transcript, method: 'upload', filename: file.name })
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
  } catch (error) {
    console.error('Transcribe error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
