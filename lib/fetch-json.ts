export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
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

    throw new Error(detail)
  }

  return (await response.json()) as T
}
