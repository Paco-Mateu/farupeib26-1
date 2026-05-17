type FetchJsonOptions = RequestInit & {
  timeoutMs?: number
  retryCount?: number
  retryDelayMs?: number
}

function shouldRetry(method: string, status?: number, error?: unknown) {
  const safeMethod = ['GET', 'HEAD'].includes(method.toUpperCase())
  if (!safeMethod) return false
  if (status && [408, 429, 502, 503, 504].includes(status)) return true
  if (error instanceof Error && ['AbortError', 'TypeError'].includes(error.name)) return true
  return false
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseErrorDetail(response: Response) {
  let detail = `Error ${response.status}`

  try {
    const payload = (await response.json()) as { detail?: string; message?: string }
    detail = payload.detail || payload.message || detail
  } catch {
    try {
      const text = await response.text()
      if (text.trim()) detail = text
    } catch {
      // Keep fallback message if the body cannot be parsed.
    }
  }

  return detail
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: FetchJsonOptions): Promise<T> {
  const {
    timeoutMs = 8000,
    retryCount,
    retryDelayMs = 250,
    signal,
    ...requestInit
  } = init ?? {}

  const method = (requestInit.method ?? 'GET').toUpperCase()
  const retries = retryCount ?? (['GET', 'HEAD'].includes(method) ? 1 : 0)

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const abortHandler = () => controller.abort()
    signal?.addEventListener('abort', abortHandler)

    try {
      const response = await fetch(input, {
        ...requestInit,
        signal: controller.signal,
      })

      if (!response.ok) {
        const detail = await parseErrorDetail(response)
        const error = new Error(detail) as Error & { status?: number }
        error.status = response.status

        if (attempt < retries && shouldRetry(method, response.status, error)) {
          await wait(retryDelayMs * (attempt + 1))
          continue
        }

        throw error
      }

      return (await response.json()) as T
    } catch (error) {
      if (attempt < retries && shouldRetry(method, undefined, error)) {
        await wait(retryDelayMs * (attempt + 1))
        continue
      }
      throw error
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abortHandler)
    }
  }

  throw new Error('No se ha podido completar la solicitud.')
}
