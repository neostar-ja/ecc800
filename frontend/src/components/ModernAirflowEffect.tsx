import React, { useEffect, useRef } from 'react';
import { Group, Path, Circle, Sprite, Rect } from 'react-konva';

type Vec = { x: number; y: number };

// smoother ease-in-out cubic for nicer progress along streams
const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const ModernAirflowEffect: React.FC<{
  start: Vec;
  end: Vec;
  type?: 'cold' | 'hot';
  intensity?: 'normal' | 'high';
  direction?: 'horizontal' | 'vertical';
  offsetX?: number;
  particleCount?: number;
  showPath?: boolean;
  trailLength?: number;
  // optional bounding rects representing rack areas where particles should fade
  rackRects?: Array<{ x: number; y: number; width: number; height: number }>;
  // fan positions (optional) to render small rotating fan sprites
  fans?: Array<{ x: number; y: number; size?: number; rpm?: number }>;
}> = ({ start, end, type = 'cold', intensity = 'normal', direction = 'horizontal', particleCount, showPath = false, trailLength = 6 }) => {
  const groupRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const isHorizontal = direction === 'horizontal';
  // Softer translucent palette for dashboard airflow (polished)
  const color = type === 'cold' ? 'rgba(96,165,250,0.62)' : 'rgba(244,63,94,0.5)';
  const glowColor = type === 'cold' ? 'rgba(96,165,250,0.48)' : 'rgba(249,115,115,0.38)';

  const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1;
  const defaultPerf = (ModernAirflowEffect as any).defaultPerfMode || 'high';
  // reduce particle base counts to keep visuals subtle and lightweight
  // more conservative base counts for a modern, elegant look; keep perf-aware scaling
  const particlesBase = particleCount ?? Math.max(10, Math.round((intensity === 'high' ? 48 : 28) / dpr));
  const particles = defaultPerf === 'low' ? Math.max(6, Math.round(particlesBase * 0.5)) : particlesBase;

  const buildPath = () => {
    if (isHorizontal) {
      return `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${start.y + (type === 'cold' ? -18 : 18)} ${end.x} ${end.y}`;
    }
    return `M ${start.x} ${start.y} Q ${start.x + (type === 'cold' ? -18 : 18)} ${(start.y + end.y) / 2} ${end.x} ${end.y}`;
  };

  // helper: interpolate three-color ramp (0..1) using HSL-like interpolation for smoother tones
  const interpolateColor = (cold: string, mid: string, hot: string, t: number) => {
    // simple hex -> rgb and linear interpolation (keeps it lightweight)
    const hexToRgb = (h: string) => {
      const hx = h.replace('#', '');
      return {
        r: parseInt(hx.substring(0, 2), 16),
        g: parseInt(hx.substring(2, 4), 16),
        b: parseInt(hx.substring(4, 6), 16),
      };
    };
    const lerp = (a: number, b: number, t2: number) => Math.round(a + (b - a) * t2);
    const c = hexToRgb(cold);
    const m = hexToRgb(mid);
    const h = hexToRgb(hot);
    // crossfade between cold -> mid -> hot with eased ramps
    const easeT = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    if (t <= 0.5) {
      const tt = easeT(t / 0.5);
      return `rgb(${lerp(c.r, m.r, tt)}, ${lerp(c.g, m.g, tt)}, ${lerp(c.b, m.b, tt)})`;
    }
    const tt = easeT((t - 0.5) / 0.5);
    return `rgb(${lerp(m.r, h.r, tt)}, ${lerp(m.g, h.g, tt)}, ${lerp(m.b, h.b, tt)})`;
  };

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

      try {
        const rect = node.getClientRect ? node.getClientRect() : null;
        if (rect) {
          node.cache({ x: rect.x - 8, y: rect.y - 8, width: rect.width + 16, height: rect.height + 16, pixelRatio: dpr });
        }
      } catch (e) {
        // ignore caching errors
      }

  // maintain a small ring buffer of previous particle positions to render trails (longer trails, softer opacities)
  const trails: Array<Array<{ x: number; y: number }>> = Array.from({ length: particles }, () => []);

  // lightweight fan rotation state (if fans are provided in props via closure)
  const fanStates: Array<{ angle: number; rpm: number }> = [];

    const animate = () => {
      const now = Date.now();
      const children = node.getChildren ? node.getChildren() : [];
      // first pass: rotate any fan sprites (Sprite uses rotation prop on parent groups)
      for (let fi = 0; fi < children.length; fi++) {
        const child = children[fi];
        if (child.className === 'Group' && child.name && child.name().startsWith('fan-')) {
          // rotation stored in shape.attrs._rotation (we'll read/write via attr)
          const rpm = child.getAttr ? child.getAttr('rpm') || 120 : 120;
          const dt = 16 / 1000; // approx per-frame seconds
          const angleDelta = (rpm / 60) * 360 * dt;
          const cur = child.rotation() || 0;
          child.rotation(cur + angleDelta);
        }
      }

      // particle update pass (smoother motion, gentler trails)
      let particleIndex = 0;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.className === 'Group' && child.name && child.name().startsWith('particle-')) {
          // root group contains an inner Circle as the visible particle
          const circle = child.findOne && child.findOne('.main-dot');
          if (!circle) continue;

          // phase spacing tuned to 0.35 for pleasing spacing between droplets
          const phaseOffset = 0.35;
          const t = ((now * 0.001) + particleIndex * phaseOffset) % 1;
          // progress along the path with smoother ease
          const progress = ease(t);

          // thermal color interpolation: cold -> warm -> hot
          const tempRatio = type === 'cold' ? (progress * 0.25) : (0.5 + progress * 0.5);
          // compute position along straight line then apply a subtle swirl/jitter for realism
          // apply optional horizontal offset so multiple streams can be visually separated
          const offsetX = (groupRef.current && groupRef.current.getAttr && groupRef.current.getAttr('offsetX')) || 0;
          const baseX = start.x + (end.x - start.x) * progress + offsetX;
          const baseY = start.y + (end.y - start.y) * progress;
          // subtle, low-frequency swirl + tiny high-frequency vibration
          const swirl = Math.sin((now * 0.0009) + particleIndex * 0.8) * (type === 'cold' ? 0.9 : 1.2);
          const vibrate = Math.sin((now * 0.005) + particleIndex * 1.3) * 0.6;
          const nx = baseX + (swirl * (type === 'cold' ? -0.55 : 0.65)) + vibrate * 0.25;
          const ny = baseY + Math.cos((now * 0.00105) + particleIndex * 0.6) * (type === 'cold' ? 0.8 : 1.05);

          // fade when crossing any rack rect if provided
          let rackFade = 1;
          try {
            const rackRects = (groupRef.current && groupRef.current.getAttr && groupRef.current.getAttr('rackRects')) || [];
            for (let r = 0; r < rackRects.length; r++) {
              const rr = rackRects[r];
              if (nx >= rr.x && nx <= rr.x + rr.width && ny >= rr.y && ny <= rr.y + rr.height) {
                // linear fade inside rack area
                rackFade = 0.18;
                break;
              }
            }
          } catch (e) {}

          trails[particleIndex].push({ x: nx, y: ny });
          // slightly longer trails for a modern, flowing look
          const targetTrail = Math.max(trailLength, 6);
          if (trails[particleIndex].length > targetTrail) trails[particleIndex].shift();

          // original droplet sizing (reverted) but keep slightly higher base scale for subtle visibility
          circle.x(nx);
          circle.y(ny);
          // spread particle phase a bit more so droplets don't overlap; multiplier tuned for 0.35 spacing
          // scale varies slightly by index to suggest depth
          const baseScale = 0.6 + 0.45 * Math.abs(Math.sin(now * 0.0018 + particleIndex * 0.7 + (particleIndex % 2 ? 0.25 : 0)));
          circle.scaleX(baseScale);
          circle.scaleY(baseScale * (type === 'cold' ? 0.86 : 1));
          // color blend cold->warm->hot
          const fill = interpolateColor('#4BC3FF', '#FFD27A', '#FF6B6B', tempRatio);
          circle.fill(fill);
          // softer falloff: particles fade as they approach the rack face but remain visible in the aisle
          circle.opacity(((0.82 * (1 - progress)) + 0.12) * rackFade);

          // update ghost trail circles (if present)
          const ghost = child.find('.ghost');
          if (ghost && ghost.length) {
            for (let gi = 0; gi < ghost.length; gi++) {
              const g = ghost[gi];
              const idxBack = Math.max(0, trails[particleIndex].length - 1 - gi);
              const pos = trails[particleIndex][idxBack] || { x: nx, y: ny };
              g.x(pos.x);
              g.y(pos.y);
              // ghost opacity decreases smoothly along the trail
              g.opacity((0.12 * (1 - gi * 0.18)) * rackFade);
              // progressively smaller ghosts for a tapered trail
              g.radius(1 + Math.max(0, 1 - gi * 0.35));
            }
          }

          particleIndex++;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { node.clearCache(); } catch (e) {}
    };
  }, [start.x, start.y, end.x, end.y, particles, dpr, type]);

  const path = buildPath();

  // attach rackRects/fans as attributes on the group so animation loop can query them
  const groupProps: any = { listening: false };
  // @ts-ignore attach metadata
  if ((ModernAirflowEffect as any).defaultRackRects) groupProps.rackRects = (ModernAirflowEffect as any).defaultRackRects;
  // attach flag whether fans should be shown
  const defaultFansEnabled = (ModernAirflowEffect as any).defaultFansEnabled !== false;
  if (typeof defaultFansEnabled === 'boolean') groupProps.fansEnabled = defaultFansEnabled;

  return (
    <Group ref={groupRef} {...groupProps}>
      {showPath && (
        <>
          <Path
            data={path}
            stroke={color}
            strokeWidth={6}
            lineCap="round"
            opacity={0.85}
            shadowEnabled
            shadowColor={glowColor}
            shadowBlur={8}
            shadowOpacity={0.5}
          />

          <Path
            data={path}
            stroke={glowColor}
            strokeWidth={3}
            lineCap="round"
            opacity={0.35}
          />
        </>
      )}

      {[...Array(particles)].map((_, i) => {
        // create a small trail of 3 ghost circles for visual flow
        const dots = [0, 1, 2, 3].map(j => {
          // initial positions for ghosts — they'll be repositioned by the RAF loop
          const f = (j + 1) / 6;
          const px = start.x + (end.x - start.x) * (f * 0.4);
          const py = start.y + (end.y - start.y) * (f * 0.4);
          return (
            <Circle
              key={`ghost-${i}-${j}`}
              name="ghost"
              x={px}
              y={py}
              radius={1 + Math.max(0, 1 - j * 0.4)}
              fill={glowColor}
              opacity={0.12 * (1 - j * 0.18)}
            />
          );
        });

        return (
          <Group key={`particle-${i}`} name={`particle-${i}`}>
            {dots}
            <Circle
              name="main-dot"
              x={start.x}
              y={start.y}
              radius={2 + (i % 2)}
              fill={i % 2 === 0 ? '#ffffff' : glowColor}
              opacity={0.9}
              shadowEnabled
              shadowColor={glowColor}
              shadowBlur={4}
              shadowOpacity={0.9}
            />
          </Group>
        );
      })}

      {/* fans: small rotating groups */}
      { defaultFansEnabled && ( (ModernAirflowEffect as any).defaultFans || [] ).map((f: any, fi: number) => (
        <Group key={`fan-${fi}`} name={`fan-${fi}`} x={f.x} y={f.y} rpm={f.rpm || 180}>
          {/* simple fan: 4-blade visual using small rectangles rotated inside */}
          <Circle radius={(f.size || 20) / 2} fill={'rgba(255,255,255,0.02)'} />
          {[0,1,2,3].map(n => (
            <Rect key={n} x={-2} y={- (f.size || 20) / 2 + 2} width={4} height={(f.size || 20) / 2} fill={'rgba(200,200,200,0.6)'} rotation={n * 90} offsetX={0} offsetY={0} />
          ))}
        </Group>
      ))}
    </Group>
  );
};

export default ModernAirflowEffect;
