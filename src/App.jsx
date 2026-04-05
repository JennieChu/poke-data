import { useState, useEffect, useRef } from 'react'
import './index.css'

const POKEMON_COUNT = 151
const MAX_HEIGHT_M = 15
const PX_PER_METER = 800
const TOTAL_HEIGHT_PX = MAX_HEIGHT_M * PX_PER_METER
const GAUGE_WIDTH = 176
const HUMAN_HEIGHT_M = 1.7
const NUM_LANES = 3
const LANE_GAP = 20 // min vertical gap between items in same lane

// Real-world height references (heights in metres, factual)
const REFERENCES = [
  { h: 0.25, emoji: '🐱', label: 'house cat' },
  { h: 0.46, emoji: '🎳', label: 'bowling pin' },
  { h: 0.63, emoji: '🐕', label: 'golden retriever' },
  { h: 1.00, emoji: '🧒', label: '5-yr-old child' },
  { h: 2.10, emoji: '🚪', label: 'standard door' },
  { h: 3.05, emoji: '🏀', label: 'basketball hoop' },
  { h: 5.00, emoji: '🦒', label: 'giraffe' },
  { h: 8.50, emoji: '🏠', label: '2-story house' },
]

// Pre-compute non-overlapping positions using lane assignment.
// pokemon must already be sorted by height ascending.
function computePositions(pokemonList) {
  const laneBottoms = Array(NUM_LANES).fill(-Infinity)

  return pokemonList.map((p) => {
    const spriteSize = Math.min(220, Math.max(48, p.height * 52))
    const itemHeight = spriteSize + 76 // sprite + name + height label + dex number + gaps
    const idealTop = (p.height / MAX_HEIGHT_M) * TOTAL_HEIGHT_PX - spriteSize / 2

    // Pick the lane that lets us place this item closest to its ideal position
    let bestLane = 0
    let bestTop = Infinity
    for (let l = 0; l < NUM_LANES; l++) {
      const candidate = Math.max(idealTop, laneBottoms[l] + LANE_GAP)
      if (candidate < bestTop) {
        bestTop = candidate
        bestLane = l
      }
    }

    laneBottoms[bestLane] = bestTop + itemHeight
    return { ...p, computedTop: bestTop, lane: bestLane, spriteSize }
  })
}

const ZONES = [
  {
    min: 0,
    max: 0.5,
    name: 'Underground',
    sub: '0 – 0.5 m',
    bg: 'linear-gradient(to bottom, #1a1209 0%, #2d1f0e 40%, #3d2a12 100%)',
    accent: '#a0764a',
  },
  {
    min: 0.5,
    max: 2,
    name: 'Ground Level',
    sub: '0.5 – 2 m',
    bg: 'linear-gradient(to bottom, #2d4a1e 0%, #3d6b28 30%, #4a7a30 60%, #5c8c3a 100%)',
    accent: '#8fcf5a',
  },
  {
    min: 2,
    max: 5,
    name: 'Forest',
    sub: '2 – 5 m',
    bg: 'linear-gradient(to bottom, #1a3d1a 0%, #1e4a22 30%, #16391a 70%, #122e16 100%)',
    accent: '#5dba6a',
  },
  {
    min: 5,
    max: 10,
    name: 'Open Sky',
    sub: '5 – 10 m',
    bg: 'linear-gradient(to bottom, #1a3a5c 0%, #1e5080 30%, #2060a0 60%, #2a70b8 100%)',
    accent: '#7ec8f0',
  },
  {
    min: 10,
    max: 15,
    name: 'High Altitude',
    sub: '10 – 15 m',
    bg: 'linear-gradient(to bottom, #2a70b8 0%, #4a8fcc 30%, #a0c8e8 60%, #d8ecf8 100%)',
    accent: '#e0f4ff',
  },
]

function getZone(heightM) {
  return ZONES.find(z => heightM >= z.min && heightM < z.max) ?? ZONES[ZONES.length - 1]
}

function PokeballLoader({ progress }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0f0a06',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        zIndex: 1000,
      }}
    >
      <div className="bounce-load" style={{ width: 52, height: 52 }}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#1a1209" stroke="#3d2a12" strokeWidth="2" />
          <path d="M2 24 Q2 2 24 2 Q46 2 46 24" fill="#c0392b" />
          <line x1="2" y1="24" x2="46" y2="24" stroke="#f0ebe0" strokeWidth="2" />
          <circle cx="24" cy="24" r="7" fill="#1a1209" stroke="#f0ebe0" strokeWidth="2" />
          <circle cx="24" cy="24" r="3.5" fill="#2d1f0e" />
        </svg>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: '#f0ebe0', letterSpacing: '-0.3px' }}>
        Loading Pokémon…
      </div>
      <div style={{ width: 200, height: 3, background: '#2d1f0e', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${(progress / POKEMON_COUNT) * 100}%`,
            background: 'linear-gradient(to right, #a0764a, #c0392b)',
            borderRadius: 99,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#6b5a42', fontFamily: "'DM Mono', monospace" }}>
        {progress} / {POKEMON_COUNT}
      </div>
    </div>
  )
}

// Converts a real-world height (metres) to its viewport y position in the gauge
function heightToGaugeY(h, scrollY) {
  return (TOTAL_HEIGHT_PX - h * PX_PER_METER) - scrollY
}

function HeightGauge({ scrollY, currentHeightM, windowHeight }) {
  const zone = getZone(currentHeightM)

  const ticks = []
  for (let m = 0; m <= MAX_HEIGHT_M; m += 0.5) {
    const isMajor = Number.isInteger(m)
    const y = heightToGaugeY(m, scrollY)
    if (y < -20 || y > windowHeight + 20) continue
    ticks.push({ m, isMajor, y })
  }

  const visibleRefs = REFERENCES
    .map(r => ({ ...r, y: heightToGaugeY(r.h, scrollY) }))
    .filter(r => r.y >= -30 && r.y <= windowHeight + 30)

  const humanY = heightToGaugeY(HUMAN_HEIGHT_M, scrollY)
  const humanVisible = humanY >= -60 && humanY <= windowHeight + 60

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: GAUGE_WIDTH,
        height: '100vh',
        background: 'rgba(10, 7, 3, 0.92)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(240,235,224,0.08)',
        zIndex: 100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header: current height readout + zone */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(240,235,224,0.07)',
          flexShrink: 0,
        }}
      >
        <div style={{
          fontSize: 9,
          letterSpacing: '0.15em',
          color: '#5a4a32',
          marginBottom: 8,
          textTransform: 'uppercase',
          fontFamily: "'DM Mono', monospace",
        }}>
          Height
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 500,
          color: zone.accent,
          letterSpacing: '-1px',
          lineHeight: 1,
          transition: 'color 0.6s ease',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: "'DM Mono', monospace",
        }}>
          {currentHeightM.toFixed(1)}
          <span style={{ fontSize: 14, color: '#6a5840', marginLeft: 4, letterSpacing: 0 }}>m</span>
        </div>
        <div style={{
          marginTop: 8,
          fontSize: 11,
          fontFamily: "'Fraunces', serif",
          fontStyle: 'italic',
          color: zone.accent,
          opacity: 0.7,
          transition: 'color 0.6s ease',
          letterSpacing: '0.01em',
        }}>
          {zone.name}
        </div>
      </div>

      {/* Ruler — ticks + reference marks */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Regular tick marks */}
        {ticks.map(({ m, isMajor, y }) => (
          <div
            key={m}
            style={{ position: 'absolute', top: y, left: 0, right: 0, display: 'flex', alignItems: 'center' }}
          >
            {isMajor && (
              <span style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                color: 'rgba(240,235,224,0.35)',
                paddingLeft: 12,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {m}m
              </span>
            )}
            <div style={{
              position: 'absolute',
              right: 0,
              height: 1,
              width: isMajor ? 24 : 12,
              background: isMajor ? 'rgba(240,235,224,0.3)' : 'rgba(240,235,224,0.12)',
            }} />
          </div>
        ))}

        {/* Real-world reference marks */}
        {visibleRefs.map((ref) => (
          <div
            key={ref.h}
            style={{
              position: 'absolute',
              top: ref.y,
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {/* Full-width accent line */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(240,235,224,0.12)',
            }} />
            {/* Emoji + label row */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              paddingLeft: 10,
              paddingTop: 3,
            }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{ref.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  color: 'rgba(240,235,224,0.6)',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {ref.label}
                </div>
                <div style={{
                  fontSize: 8,
                  fontFamily: "'DM Mono', monospace",
                  color: 'rgba(240,235,224,0.25)',
                  letterSpacing: '0.04em',
                  marginTop: 1,
                }}>
                  {ref.h} m
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Human reference mark */}
        {humanVisible && (
          <div
            style={{
              position: 'absolute',
              top: humanY,
              left: 0,
              right: 0,
              transform: 'translateY(-100%)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {/* Green accent line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(143, 207, 90, 0.55)',
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              paddingLeft: 10,
              paddingBottom: 4,
            }}>
              <svg width="18" height="36" viewBox="0 0 18 48" fill="none">
                <circle cx="9" cy="5" r="4" fill="#8fcf5a" opacity="0.85" />
                <rect x="5" y="10" width="8" height="18" rx="2" fill="#8fcf5a" opacity="0.85" />
                <rect x="0" y="12" width="6" height="13" rx="2" fill="#8fcf5a" opacity="0.85" />
                <rect x="12" y="12" width="6" height="13" rx="2" fill="#8fcf5a" opacity="0.85" />
                <rect x="5" y="28" width="4" height="14" rx="2" fill="#8fcf5a" opacity="0.85" />
                <rect x="9" y="28" width="4" height="14" rx="2" fill="#8fcf5a" opacity="0.85" />
              </svg>
              <div>
                <div style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  color: '#8fcf5a',
                  letterSpacing: '0.03em',
                  opacity: 0.85,
                }}>
                  avg. human
                </div>
                <div style={{
                  fontSize: 8,
                  fontFamily: "'DM Mono', monospace",
                  color: 'rgba(143,207,90,0.45)',
                  letterSpacing: '0.04em',
                  marginTop: 1,
                }}>
                  1.7 m
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone accent bar at bottom */}
      <div style={{
        height: 3,
        background: zone.accent,
        transition: 'background 0.8s ease',
        flexShrink: 0,
      }} />
    </div>
  )
}


function ZoneLabel({ currentZone }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: GAUGE_WIDTH + 20,
        zIndex: 99,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13,
          fontStyle: 'italic',
          color: currentZone.accent,
          transition: 'color 0.8s ease',
          letterSpacing: '0.02em',
          opacity: 0.85,
        }}
      >
        {currentZone.name}
      </div>
      <div
        style={{
          fontSize: 9,
          color: 'rgba(240,235,224,0.35)',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.1em',
          marginTop: 2,
        }}
      >
        {currentZone.sub}
      </div>
    </div>
  )
}

// Lane → horizontal position config
// lane 0: left column, label right
// lane 1: center column, label right
// lane 2: right column, label left
const LANE_CONFIG = [
  { posStyle: { left: GAUGE_WIDTH + 24 },           labelAlign: 'left',  flexDir: 'row' },
  { posStyle: { left: 'calc(50% + 30px)' },          labelAlign: 'left',  flexDir: 'row' },
  { posStyle: { right: 24 },                         labelAlign: 'right', flexDir: 'row-reverse' },
]

function PokemonEntry({ pokemon, computedTop, lane, spriteSize }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const cfg = LANE_CONFIG[lane] ?? LANE_CONFIG[0]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '100px 0px 100px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const zone = getZone(pokemon.height)
  const isLeft = cfg.flexDir === 'row'

  return (
    <div
      ref={ref}
      className={`pokemon-entry${visible ? ' visible' : ''}${!isLeft ? ' left' : ''}`}
      style={{
        position: 'absolute',
        top: computedTop,
        ...cfg.posStyle,
        display: 'flex',
        flexDirection: cfg.flexDir,
        alignItems: 'center',
        gap: 12,
        animationDelay: '0.04s',
      }}
    >
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        className="pokemon-img"
        style={{
          width: spriteSize,
          height: spriteSize,
          objectFit: 'contain',
          flexShrink: 0,
          filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.55))',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          textAlign: cfg.labelAlign,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: Math.min(26, Math.max(12, spriteSize * 0.22)),
            fontWeight: 600,
            color: '#f0ebe0',
            textTransform: 'capitalize',
            letterSpacing: '-0.3px',
            lineHeight: 1,
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap',
          }}
        >
          {pokemon.name}
        </div>
        <div
          style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: zone.accent,
            letterSpacing: '0.08em',
          }}
        >
          {pokemon.height} m
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'rgba(240,235,224,0.28)',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.1em',
          }}
        >
          #{String(pokemon.id).padStart(3, '0')}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [positioned, setPositioned] = useState([]) // sorted + lane-assigned positions
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)

  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
              height: data.height / 10,
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
      setPositioned(computePositions(results))
      setLoading(false)
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (loading) return
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading])

  // Current height: scroll from bottom = taller pokemon further down page
  // scrollY=0 → top of page → tiny pokemon
  // scrollY=max → tallest pokemon
  const maxScroll = TOTAL_HEIGHT_PX - windowHeight
  const currentHeightM = maxScroll > 0
    ? (scrollY / maxScroll) * MAX_HEIGHT_M
    : 0
  const currentZone = getZone(currentHeightM)

  if (loading) return <PokeballLoader progress={progress} />

  return (
    <div style={{ position: 'relative' }}>
      {/* Fixed gauge */}
      <HeightGauge scrollY={scrollY} currentHeightM={currentHeightM} windowHeight={windowHeight} />

      {/* Fixed zone label */}
      <ZoneLabel currentZone={currentZone} />

      {/* Fixed title */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 24,
          zIndex: 99,
          textAlign: 'right',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 17,
            fontWeight: 700,
            color: '#f0ebe0',
            letterSpacing: '-0.3px',
          }}
        >
          PokéSize
        </div>
        <div style={{ fontSize: 9, color: 'rgba(240,235,224,0.3)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', marginTop: 2 }}>
          GEN I · SCROLL TO EXPLORE
        </div>
      </div>

      {/* Scroll container */}
      <div
        style={{
          position: 'relative',
          height: TOTAL_HEIGHT_PX,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Zone background bands */}
        {ZONES.map((zone) => (
          <div
            key={zone.name}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (zone.min / MAX_HEIGHT_M) * TOTAL_HEIGHT_PX,
              height: ((zone.max - zone.min) / MAX_HEIGHT_M) * TOTAL_HEIGHT_PX,
              background: zone.bg,
            }}
          />
        ))}

        {/* Subtle horizontal grid lines at each meter */}
        {Array.from({ length: MAX_HEIGHT_M + 1 }, (_, m) => (
          <div
            key={m}
            style={{
              position: 'absolute',
              left: GAUGE_WIDTH,
              right: 0,
              top: (m / MAX_HEIGHT_M) * TOTAL_HEIGHT_PX,
              height: 1,
              background: 'rgba(255,255,255,0.04)',
            }}
          />
        ))}

        {/* Ground line */}
        <div
          style={{
            position: 'absolute',
            left: GAUGE_WIDTH,
            right: 0,
            bottom: 0,
            height: 3,
            background: 'rgba(160, 118, 74, 0.4)',
          }}
        />

        {/* Pokémon entries */}
        {positioned.map((p) => (
          <PokemonEntry
            key={p.id}
            pokemon={p}
            computedTop={p.computedTop}
            lane={p.lane}
            spriteSize={p.spriteSize}
          />
        ))}
      </div>
    </div>
  )
}
