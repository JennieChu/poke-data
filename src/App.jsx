import { useState, useEffect, useRef } from 'react'
import './index.css'

const HUMAN_HEIGHT_M = 1.7
const VIEWPORT_HEIGHT_PX = window.innerHeight
const HEADER_HEIGHT_PX = 64
const GROUND_PADDING_PX = 48
const CHART_HEIGHT_PX = VIEWPORT_HEIGHT_PX - HEADER_HEIGHT_PX - GROUND_PADDING_PX

// How many px = 1 meter (based on fitting a ~human-height reference)
const PX_PER_METER = CHART_HEIGHT_PX / 20 // tallest pokemon (wailord ~14.5m) fits with headroom

const POKEMON_COUNT = 151 // Gen 1

function PokemonCard({ pokemon, pxPerMeter }) {
  const heightPx = pokemon.height * pxPerMeter
  const imgSize = Math.max(48, Math.min(heightPx * 0.9, 160))

  return (
    <div
      className="flex flex-col items-center justify-end"
      style={{ height: CHART_HEIGHT_PX, minWidth: 80, paddingBottom: 8 }}
    >
      <div
        className="flex flex-col items-center justify-end cursor-pointer group"
        style={{ height: heightPx }}
        title={`${pokemon.name} — ${pokemon.height}m`}
      >
        <span
          className="text-xs text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          style={{ fontSize: 10 }}
        >
          {pokemon.height}m
        </span>
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          className="pokemon-img object-contain group-hover:brightness-125 transition-all"
          style={{ width: imgSize, height: imgSize }}
        />
        <span
          className="text-center text-gray-400 mt-1 group-hover:text-white transition-colors capitalize"
          style={{ fontSize: 11, maxWidth: 72, lineHeight: '1.2' }}
        >
          {pokemon.name}
        </span>
      </div>
    </div>
  )
}

function HumanSilhouette({ pxPerMeter }) {
  const heightPx = HUMAN_HEIGHT_M * pxPerMeter
  return (
    <div
      className="flex flex-col items-center justify-end"
      style={{ height: CHART_HEIGHT_PX, minWidth: 64, paddingBottom: 8 }}
    >
      <div className="flex flex-col items-center justify-end" style={{ height: heightPx }}>
        <span className="text-xs text-gray-600 mb-1" style={{ fontSize: 10 }}>1.7m</span>
        <svg width="28" height={heightPx - 20} viewBox="0 0 28 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="7" r="6" fill="#374151" />
          <rect x="10" y="14" width="8" height="28" rx="2" fill="#374151" />
          <rect x="2" y="16" width="7" height="20" rx="2" fill="#374151" />
          <rect x="19" y="16" width="7" height="20" rx="2" fill="#374151" />
          <rect x="10" y="42" width="7" height="24" rx="2" fill="#374151" />
          <rect x="11" y="42" width="7" height="24" rx="2" fill="#374151" />
        </svg>
        <span className="text-gray-600 mt-1" style={{ fontSize: 10 }}>human</span>
      </div>
    </div>
  )
}

export default function App() {
  const [pokemon, setPokemon] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    async function fetchAll() {
      const results = []
      const batchSize = 20

      for (let i = 1; i <= POKEMON_COUNT; i += batchSize) {
        const batch = Array.from(
          { length: Math.min(batchSize, POKEMON_COUNT - i + 1) },
          (_, j) => i + j
        )
        const fetched = await Promise.all(
          batch.map(async (id) => {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
            const data = await res.json()
            return {
              id: data.id,
              name: data.name,
              height: data.height / 10, // decimetres → metres
              sprite:
                data.sprites?.other?.['official-artwork']?.front_default ||
                data.sprites?.front_default,
            }
          })
        )
        results.push(...fetched)
        setProgress(Math.min(results.length, POKEMON_COUNT))
      }

      results.sort((a, b) => a.height - b.height)
      setPokemon(results)
      setLoading(false)
    }

    fetchAll()
  }, [])

  // Drag to scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const onMouseDown = (e) => {
      isDown = true
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
      el.style.cursor = 'grabbing'
    }
    const onMouseUp = () => { isDown = false; el.style.cursor = 'grab' }
    const onMouseMove = (e) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      el.scrollLeft = scrollLeft - (x - startX)
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('mousemove', onMouseMove)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('mousemove', onMouseMove)
    }
  }, [loading])

  const tallest = pokemon.length > 0 ? pokemon[pokemon.length - 1].height : 20
  const pxPerMeter = CHART_HEIGHT_PX / (tallest * 1.15)

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#0f0f1a' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 shrink-0 border-b border-white/5"
        style={{ height: HEADER_HEIGHT_PX }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white tracking-tight">PokéSize</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Gen I height chart</span>
        </div>
        {!loading && (
          <span className="text-xs text-gray-600">
            Scroll → to reveal taller Pokémon · Drag to pan
          </span>
        )}
      </header>

      {/* Main */}
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="text-gray-400 text-sm">Loading Pokémon data…</div>
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(progress / POKEMON_COUNT) * 100}%` }}
            />
          </div>
          <div className="text-gray-600 text-xs">{progress} / {POKEMON_COUNT}</div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scroll-container flex-1 select-none"
          style={{ cursor: 'grab' }}
        >
          <div
            className="flex items-end relative"
            style={{
              height: CHART_HEIGHT_PX + GROUND_PADDING_PX,
              paddingLeft: 24,
              paddingRight: 48,
              paddingBottom: GROUND_PADDING_PX,
            }}
          >
            {/* Ground line */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: GROUND_PADDING_PX,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'linear-gradient(to top, rgba(99,102,241,0.05), transparent)',
              }}
            />

            {/* Height grid lines */}
            {[1, 2, 5, 10, 15].map((m) => {
              const y = CHART_HEIGHT_PX - m * pxPerMeter
              if (y < 0) return null
              return (
                <div
                  key={m}
                  className="absolute left-0 right-0 flex items-center"
                  style={{ bottom: GROUND_PADDING_PX + m * pxPerMeter }}
                >
                  <div className="w-full border-t border-white/5 border-dashed" />
                  <span
                    className="text-gray-700 shrink-0 pl-2"
                    style={{ fontSize: 10, position: 'absolute', left: 4 }}
                  >
                    {m}m
                  </span>
                </div>
              )
            })}

            {/* Human reference */}
            <div className="mr-6 shrink-0">
              <HumanSilhouette pxPerMeter={pxPerMeter} />
            </div>

            {/* Divider */}
            <div
              className="shrink-0 mr-6"
              style={{
                width: 1,
                height: CHART_HEIGHT_PX,
                background: 'rgba(255,255,255,0.06)',
              }}
            />

            {/* Pokémon */}
            {pokemon.map((p) => (
              <div key={p.id} className="mx-1 shrink-0">
                <PokemonCard pokemon={p} pxPerMeter={pxPerMeter} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
