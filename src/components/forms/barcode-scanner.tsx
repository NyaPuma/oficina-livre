"use client";

import { ScanLine } from "lucide-react";
import { useRef, useState } from "react";

type ScannablePart = { code: string; description: string; stockQty: number };

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;

export function BarcodeScanner({ parts }: { parts: ScannablePart[] }) {
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const matches = query.trim()
    ? parts.filter((part) => part.code.toLowerCase().includes(query.toLowerCase()) || part.description.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  async function startScanner() {
    const Constructor = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!Constructor) {
      setMessage("Leitura por câmara não suportada neste navegador. Use o campo de pesquisa.");
      return;
    }

    setScanning(true);
    setMessage("A abrir a câmara…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new Constructor({ formats: ["code_128", "ean_13", "ean_8", "qr_code"] });

      const tick = async () => {
        if (!videoRef.current || !videoRef.current.videoWidth) {
          requestAnimationFrame(() => void tick());
          return;
        }
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          setQuery(codes[0].rawValue);
          setMessage(`Código lido: ${codes[0].rawValue}`);
          stream.getTracks().forEach((track) => track.stop());
          if (videoRef.current) videoRef.current.srcObject = null;
          setScanning(false);
          return;
        }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      setMessage("Não foi possível aceder à câmara. Use o campo de pesquisa.");
      setScanning(false);
    }
  }

  return (
    <div>
      <label className="block">
        <span className="eyebrow mb-2 block normal-case tracking-normal">Pesquisar peça</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Código, descrição ou código lido" className="field-input" />
      </label>
      <button type="button" onClick={() => void startScanner()} disabled={scanning} className="btn-secondary mt-2">
        <ScanLine size={14} /> {scanning ? "A ler…" : "Ler código de barras"}
      </button>
      <video ref={videoRef} className={`mt-3 w-full rounded-lg ${scanning ? "block" : "hidden"}`} playsInline muted />
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
      {matches.length > 0 ? (
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {matches.map((part) => (
            <li key={part.code} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-ink">{part.description}</p>
                <p className="font-mono text-xs text-slate-400">{part.code}</p>
              </div>
              <span className="text-xs text-slate-500">{part.stockQty} em stock</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
