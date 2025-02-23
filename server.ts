import { serve } from 'bun'

const SEARXNG_URL = Bun.env.SEARXNG_URL
const SEARXNG_PREFERENCES = Bun.env.SEARXNG_PREFERENCES

const SEARXNG_CUSTOM_PARAMS =
  Bun.env.SEARXNG_CUSTOM_PARAMS || '&format=json&safesearch=0'

const SEARXNG_PARAMS = SEARXNG_PREFERENCES
  ? `&preferences=${SEARXNG_PREFERENCES}${SEARXNG_CUSTOM_PARAMS}`
  : SEARXNG_CUSTOM_PARAMS

const PORT = Bun.env.PORT || 3000

console.log(`SearXNG Parameters: "${SEARXNG_PARAMS}"`)

// Handle single query
async function processQuery(
  query: string,
  maxResults: number,
  excludeDomains: string[]
) {
  try {
    // Exclude domains
    const excludeQuery = excludeDomains.map((d) => ` -site:${d}`).join('')
    const fullQuery = encodeURIComponent(query + excludeQuery)

    const url = new URL(
      `${SEARXNG_URL}/search?${SEARXNG_PARAMS}&max_results=${maxResults}&q=${fullQuery}`
    )
    console.log(`Processing query ${query}`)

    const response = await fetch(url.toString())
    const data = await response.json()

    return {
      query: query,
      links: data.results.slice(0, maxResults).map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        content: result.content || '',
      })),
    }
  } catch (error) {
    console.error(`Error processing query "${query}":`, error)
    return { query: query, links: [] }
  }
}

// Run server
serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(req) {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    // Only handle POST requests to /search path
    const url = new URL(req.url)
    if (url.pathname === '/search' && req.method === 'POST') {
      try {
        const body = await req.json()

        // Validate request body
        if (!body.queries || !Array.isArray(body.queries)) {
          return new Response(
            JSON.stringify({ error: 'Invalid request format' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }

        // Process all queries in parallel
        const results = await Promise.all(
          body.queries.map((query: string) =>
            processQuery(
              query,
              body.max_results || 10,
              body.exclude_domains || []
            )
          )
        )

        return new Response(JSON.stringify({ results }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (error) {
        console.error('Request processing error:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Server running on http://localhost:${PORT}`)
