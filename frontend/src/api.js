const BASE = import.meta.env.VITE_API_URL || '/api'

export async function predict(payload) {
  const res = await fetch(`${BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function getHealth() {
  try {
    const res = await fetch(`${BASE}/health`)
    return res.json()
  } catch {
    return { status: 'offline' }
  }
}

export async function getSkills() {
  const res = await fetch(`${BASE}/skills`)
  return res.json()
}
