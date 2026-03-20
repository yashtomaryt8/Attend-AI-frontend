import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Badge, Spinner } from './ui';
import { api } from '../utils/api';

const MAX = 10;

export default function Register() {
  const webcamRef = useRef(null);
  const fileRef   = useRef(null);
  const [name,       setName]   = useState('');
  const [sid,        setSid]    = useState('');
  const [dept,       setDept]   = useState('');
  const [photos,     setPhotos] = useState([]);
  const [loading,    setLoad]   = useState(false);
  const [msg,        setMsg]    = useState(null);
  const [facing,     setFacing] = useState('user');
  const [showCam,    setShowCam]= useState(true);

  const capture = useCallback(() => {
    if (photos.length >= MAX) return;
    const src = webcamRef.current?.getScreenshot({ width: 640, height: 480 });
    if (!src) return;
    fetch(src).then(r => r.blob()).then(blob => setPhotos(p => [...p, { blob, url: src }]));
  }, [photos.length]);

  const onFiles = e => {
    const files = Array.from(e.target.files || []).slice(0, MAX - photos.length);
    setPhotos(p => [...p, ...files.map(f => ({ blob: f, url: URL.createObjectURL(f) }))].slice(0, MAX));
    e.target.value = '';
  };

  const submit = async () => {
    if (!name.trim()) return setMsg({ ok: false, text: 'Name is required.' });
    if (!photos.length) return setMsg({ ok: false, text: 'Add at least 1 photo.' });
    setLoad(true); setMsg(null);
    const form = new FormData();
    form.append('name', name.trim());
    form.append('student_id', sid.trim());
    form.append('department', dept.trim());
    photos.forEach((p, i) => form.append(`image_${i}`, p.blob, `p${i}.jpg`));
    try {
      const r = await api.register(form);
      setMsg({ ok: true, text: r.message });
      setName(''); setSid(''); setDept(''); setPhotos([]);
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setLoad(false); }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">Register Student</h1>
        <p className="text-xs text-gray-400 mt-0.5">Capture multiple angles for best accuracy</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Input label="Full Name *" placeholder="e.g. Sneha Sharma" value={name} onChange={e => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Student ID" placeholder="CS2201" value={sid} onChange={e => setSid(e.target.value)} />
            <Input label="Department" placeholder="CSE" value={dept} onChange={e => setDept(e.target.value)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Face Photos</CardTitle>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setShowCam(v => !v)}>{showCam ? 'Hide cam' : 'Show cam'}</Button>
              <Button variant="ghost" size="sm" onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}>⟳</Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {showCam && (
            <>
              <div className="camera-wrapper aspect-[4/3]">
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 640, height: 480, facingMode: facing }}
                  mirrored={facing === 'user'} className="camera-contain" />
              </div>
              <Button onClick={capture} disabled={photos.length >= MAX} className="w-full" size="sm">
                📸 Capture Photo ({photos.length}/{MAX})
              </Button>
            </>
          )}
          <div className="flex flex-wrap gap-1.5">
            {['Front', 'Left tilt', 'Right tilt', 'With mask', 'With glasses', 'Hoodie'].map(t => (
              <span key={t} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">{t}</span>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
            ↑ Upload from Gallery
          </Button>
        </CardBody>
      </Card>

      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Captured ({photos.length})</CardTitle>
              <Badge variant={photos.length >= 5 ? 'green' : 'yellow'}>{photos.length >= 5 ? 'Good' : 'Add more'}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center">✕</button>
                </div>
              ))}
              {photos.length < MAX && (
                <button onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-gray-500 transition-colors text-2xl">
                  +
                </button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {msg.ok ? '✓ ' : '⚠ '}{msg.text}
        </div>
      )}

      <Button className="w-full" disabled={loading || !name.trim() || !photos.length} onClick={submit}>
        {loading ? <><Spinner size={14} /> Registering…</> : `Register · ${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
      </Button>
      <div className="h-2" />
    </div>
  );
}
