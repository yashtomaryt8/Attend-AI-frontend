import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button, Badge, Toggle, Card, CardHeader, CardTitle, CardBody, Empty } from './ui';
import { api } from '../utils/api';

const SCAN_MS = 800;

export default function Scanner() {
  const webcamRef  = useRef(null);
  const canvasRef  = useRef(null);
  const scanRef    = useRef(null);
  const fpsRef     = useRef({ count: 0, last: Date.now() });

  const [mode,       setMode]       = useState('entry');
  const [paused,     setPaused]     = useState(false);
  const [facingMode, setFacing]     = useState('user');
  const [detections, setDetections] = useState([]);
  const [log,        setLog]        = useState([]);
  const [active,     setActive]     = useState(false);
  const [fps,        setFps]        = useState(0);

  // Draw bounding boxes on the canvas overlay
  const drawBoxes = useCallback((dets, containerW, containerH, srcW = 640, srcH = 480) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = containerW;
    canvas.height = containerH;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, containerW, containerH);

    // object-fit: contain letterboxing offsets
    const scale = Math.min(containerW / srcW, containerH / srcH);
    const imgW  = srcW * scale;
    const imgH  = srcH * scale;
    const offX  = (containerW - imgW) / 2;
    const offY  = (containerH - imgH) / 2;

    dets.forEach(d => {
      if (!d.bbox) return;
      const [x1, y1, x2, y2] = d.bbox;
      const rx1 = offX + x1 * scale;
      const ry1 = offY + y1 * scale;
      const rw  = (x2 - x1) * scale;
      const rh  = (y2 - y1) * scale;

      const known = d.name !== 'Unknown';
      const color = known ? '#16a34a' : '#dc2626';

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(rx1, ry1, rw, rh);

      // Top label
      ctx.font     = 'bold 11px Inter, sans-serif';
      const label  = `${d.name}  ${d.confidence}%`;
      const tw     = ctx.measureText(label).width;
      const lh     = 18;
      ctx.fillStyle = color;
      ctx.fillRect(rx1, ry1 - lh, tw + 8, lh);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, rx1 + 4, ry1 - 5);

      // Bottom event tag
      if (d.event_type) {
        const tag = d.event_type.toUpperCase() + (d.logged ? ' ✓' : '');
        const tw2 = ctx.measureText(tag).width;
        ctx.fillStyle = color;
        ctx.fillRect(rx1, ry1 + rh, tw2 + 8, lh);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tag, rx1 + 4, ry1 + rh + 13);
      }
    });
  }, []);

  // One scan cycle
  const scan = useCallback(async () => {
    if (paused || !webcamRef.current) return;
    const src = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!src) return;

    try {
      const blob = await (await fetch(src)).blob();
      const form = new FormData();
      form.append('image',      blob,   'frame.jpg');
      form.append('event_type', mode);

      const res  = await api.scan(form);
      const dets = res.detections || [];

      setDetections(dets);
      setActive(true);

      // Update canvas
      const container = canvasRef.current?.parentElement;
      if (container) {
        drawBoxes(dets, container.clientWidth, container.clientHeight);
      }

      // Log only marked events
      const marked = dets.filter(d => d.logged);
      if (marked.length) {
        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLog(prev => [...marked.map(d => ({ ...d, ts })), ...prev].slice(0, 40));
      }

      // FPS
      fpsRef.current.count++;
      const now = Date.now();
      if (now - fpsRef.current.last >= 3000) {
        setFps(Math.round(fpsRef.current.count / ((now - fpsRef.current.last) / 1000)));
        fpsRef.current = { count: 0, last: now };
      }
    } catch (_) {}
  }, [paused, mode, drawBoxes]);

  // Auto-start on mount
  useEffect(() => {
    const t = setInterval(scan, SCAN_MS);
    scanRef.current = t;
    return () => clearInterval(t);
  }, [scan]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">Live Scanner</h1>
        <p className="text-xs text-gray-400 mt-0.5">Auto-scanning · {fps > 0 ? `${fps} fps` : 'warming up…'}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Mode</p>
        <Toggle
          value={mode}
          onChange={v => setMode(v)}
          options={[
            { value: 'entry', label: '→ Entry' },
            { value: 'exit',  label: '← Exit'  },
          ]}
        />
        <div className={`ml-auto w-2 h-2 rounded-full shrink-0 transition-colors ${active && !paused ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
      </div>

      {/* Camera area — object-fit: contain via CSS class */}
      <div className="camera-wrapper aspect-[4/3]">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480, facingMode }}
          mirrored={facingMode === 'user'}
          className="camera-contain"
        />
        <canvas ref={canvasRef} className="overlay" />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          variant={paused ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setPaused(p => !p)}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}>
          ⟳ Flip
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setLog([]); setDetections([]); }}>
          ✕ Clear
        </Button>
      </div>

      {/* Live face chips */}
      {detections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {detections.map((d, i) => {
            const known = d.name !== 'Unknown';
            return (
              <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium
                ${known ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${known ? 'bg-green-500' : 'bg-red-500'}`} />
                {d.name} · {d.confidence}%
              </div>
            );
          })}
        </div>
      )}

      {/* Attendance event log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Events</CardTitle>
            <Badge variant={mode === 'entry' ? 'green' : 'yellow'}>{mode} mode</Badge>
          </div>
        </CardHeader>
        {log.length === 0 ? (
          <Empty icon="◎" title="No events logged yet" sub="Detected faces will be logged here" />
        ) : (
          <div className="divide-y divide-gray-50">
            {log.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {d.name !== 'Unknown' ? d.name[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{d.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {[d.student_id, d.department].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={d.event_type === 'entry' ? 'green' : 'yellow'}>{d.event_type}</Badge>
                  <span className="text-[10px] text-gray-400 font-mono">{d.ts}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="h-2" />
    </div>
  );
}
