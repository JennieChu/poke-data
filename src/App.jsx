import { useState, useEffect, useRef } from 'react'
import './index.css'

const HUMAN_HEIGHT_M = 1.7
const VIEWPORT_HEIGHT_PX = window.innerHeight
const HEADER_HEIGHT_PX = 64
const GROUND_PADDING_PX = 56
const CHART_HEIGHT_PX = VIEWPORT_HEIGHT_PX - HEADER_HEIGHT_PX - GROUND_PADDING_PX

const POKEMON_COUNT = 151 // Gen 1

function PokemonCard({ pokemon, pxPerMeter }) {
  const heightPx = pokemon.height * pxPerMeter
  const imgSize = Math.max(32, heightPx * 0.85)

  return (
    <div
      className="flex flex-col items-center justify-end"
      style={{ height: CHART_HEIGHT_PX, minWidth: 72, paddingBottom: 8 }}
    >
      <div
        className="flex flex-col items-center justify-end cursor-pointer group"
        style={{ height: heightPx, overflow: 'visible' }}
        title={`${pokemon.name} — ${pokemon.height}m`}
      >
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity mb-1"
          style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 99,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: '#6d28d9',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          {pokemon.height}m
        </div>
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          className="pokemon-img object-contain transition-all group-hover:drop-shadow-lg group-hover:scale-105"
          style={{ width: imgSize, height: imgSize }}
        />
        <div
          className="text-center mt-1 capitalize transition-all"
          style={{
            fontSize: 10,
            fontWeight: 700,
            maxWidth: 68,
            lineHeight: '1.2',
            background: 'rgba(255,255,255,0.75)',
            borderRadius: 99,
            padding: '2px 6px',
            color: '#4c1d95',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pokemon.name}
        </div>
      </div>
    </div>
  )
}

function HumanSilhouette({ pxPerMeter }) {
  const heightPx = HUMAN_HEIGHT_M * pxPerMeter
  return (
    <div
      className="flex flex-col items-center justify-end"
      style={{ height: CHART_HEIGHT_PX, minWidth: 56, paddingBottom: 8 }}
    >
      <div className="flex flex-col items-center justify-end" style={{ height: heightPx }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>1.7m</span>
        <svg width="28" height={heightPx - 20} viewBox="0 0 28 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="7" r="6" fill="#93c5fd" />
          <rect x="10" y="14" width="8" height="28" rx="2" fill="#93c5fd" />
          <rect x="2" y="16" width="7" height="20" rx="2" fill="#93c5fd" />
          <rect x="19" y="16" width="7" height="20" rx="2" fill="#93c5fd" />
          <rect x="10" y="42" width="7" height="24" rx="2" fill="#93c5fd" />
          <rect x="11" y="42" width="7" height="24" rx="2" fill="#93c5fd" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>human</span>
      </div>
    </div>
  )
}

function PokeballLoader({ progress }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5">
      {/* Bouncing pokeball */}
      <div className="bounce-load" style={{ width: 48, height: 48 }}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="white" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M2 24 Q2 2 24 2 Q46 2 46 24" fill="#f87171" />
          <line x1="2" y1="24" x2="46" y2="24" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="7" fill="white" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="3.5" fill="#f1f5f9" />
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#4c1d95' }}>
        Loading Pokémon…
      </div>
      <div
        style={{
          width: 220,
          height: 10,
          background: '#ddd6fe',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(progress / POKEMON_COUNT) * 100}%`,
            background: 'linear-gradient(to right, #a78bfa, #f472b6)',
            borderRadius: 99,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>
        {progress} / {POKEMON_COUNT}
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
    <div
      className="flex flex-col"
      style={{
        height: '100vh',
        background: 'linear-gradient(to bottom, #bfdbfe 0%, #ddd6fe 60%, #c7d2fe 100%)',
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 shrink-0"
        style={{
          height: HEADER_HEIGHT_PX,
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 1px 8px rgba(167,139,250,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              background: 'linear-gradient(to right, #7c3aed, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            PokéSize ✨
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#7c3aed',
              background: '#ede9fe',
              borderRadius: 99,
              padding: '2px 10px',
              letterSpacing: '0.05em',
            }}
          >
            Gen I
          </span>
        </div>
        {!loading && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#7c3aed',
              background: 'rgba(237,233,254,0.8)',
              borderRadius: 99,
              padding: '4px 12px',
            }}
          >
            Scroll → to see taller Pokémon · Drag to pan
          </span>
        )}
      </header>

      {/* Main */}
      {loading ? (
        <PokeballLoader progress={progress} />
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
            {/* Grass ground */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: GROUND_PADDING_PX,
                background: 'linear-gradient(to top, #86efac, #bbf7d0)',
                borderTop: '3px solid #4ade80',
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
                  <div
                    className="w-full"
                    style={{ borderTop: '1px dashed rgba(99,102,241,0.18)' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#6d28d9',
                      background: 'rgba(255,255,255,0.75)',
                      borderRadius: 99,
                      padding: '1px 6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                    }}
                  >
                    {m}m
                  </span>
                </div>
              )
            })}

            {/* Human reference */}
            <div className="mr-4 shrink-0 relative z-10">
              <HumanSilhouette pxPerMeter={pxPerMeter} />
            </div>

            {/* Divider */}
            <div
              className="shrink-0 mr-4"
              style={{
                width: 1,
                height: CHART_HEIGHT_PX,
                background: 'rgba(124,58,237,0.15)',
              }}
            />

            {/* Pokémon */}
            {pokemon.map((p) => (
              <div key={p.id} className="mx-1 shrink-0 relative z-10" style={{ overflow: 'visible' }}>
                <PokemonCard pokemon={p} pxPerMeter={pxPerMeter} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
