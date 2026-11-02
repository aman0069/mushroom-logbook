import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Activity,
  Beaker,
  ClipboardCheck,
  AlertTriangle,
  QrCode,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Printer,
  Filter,
  FlaskConical,
  Disc,
  Flame,
  ShieldCheck,
  Database,
  RefreshCw,
  RotateCcw,
  Search,
  ScanLine,
} from 'lucide-react';
import './f43-console.css';

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(`cml_f43_${key}`);
      return saved ? (JSON.parse(saved) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(`cml_f43_${key}`, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private or embedded browser contexts.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function DeterministicQrSvg({ value, size = 92 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        if (active) setSrc(dataUrl);
      })
      .catch(() => {
        if (active) setSrc('');
      });

    return () => {
      active = false;
    };
  }, [size, value]);

  return src ? (
    <img
      width={size}
      height={size}
      src={src}
      alt={`QR code for ${value}`}
      className="bg-white p-1 rounded border border-slate-300 shrink-0"
    />
  ) : (
    <div
      aria-label={`Generating QR code for ${value}`}
      className="bg-white border border-slate-300 rounded shrink-0 grid place-items-center text-slate-500 text-[9px]"
      style={{ width: size, height: size }}
    >
      QR
    </div>
  );
}

const SEED_CULTURE_MASTER_VOLUMES = [
  900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800,
];

const NAV_TABS = [
  { id: 'DASHBOARD', label: 'HA Live Dashboard & Lineage', icon: Activity },
  { id: 'SOP_F43', label: 'SOP-CM-F43-V3 Scaling & LSFM', icon: Beaker },
  { id: 'AGAR_LOG', label: 'SOP-CML-PD-01 Agar Log', icon: Disc },
  { id: 'LC_LOG', label: 'SOP-CML-LC-01 Liquid Culture & Sieve', icon: Filter },
  { id: 'AUTOCLAVE_INOC', label: 'SOP-CML-LOG-02 Autoclave & Inoc', icon: Flame },
  { id: 'QR_ENV', label: '58mm QR Stickers & Contam Audit', icon: QrCode },
] as const;

type F43SectionId = (typeof NAV_TABS)[number]['id'];

const createOpaqueQrId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export default function F43Console({ onReturnToLogbook }: { onReturnToLogbook: () => void }) {
  const [activeTab, setActiveTab] = useState<F43SectionId>('DASHBOARD');

  // SOP-CM-F43-V3 Calculator States
  const [customSeedVolMl, setCustomSeedVolMl] = usePersistentState<number>('seed-volume-ml', 1800);
  const [targetJarCount, setTargetJarCount] = usePersistentState<number>('target-jar-count', 144);
  const [fixLsfmTransposition, setFixLsfmTransposition] = usePersistentState<boolean>('fix-lsfm-transposition', true);
  const [lsfmOveragePct, setLsfmOveragePct] = usePersistentState<number>('lsfm-overage-pct', 10);

  // SOP-CML-PD-01 Agar States
  const [agarBatchId, setAgarBatchId] = usePersistentState('agar-batch-id', '#AGAR-2026-1101');
  const [agarPrepDate, setAgarPrepDate] = usePersistentState('agar-prep-date', '2026-11-01');
  const [agarVolumeL, setAgarVolumeL] = usePersistentState('agar-volume-liters', 1.0);
  const [agarAntibiotic, setAgarAntibiotic] = usePersistentState<'None' | 'Chloramphenicol' | 'Gentamicin'>('agar-antibiotic', 'None');
  const [agarPlateSize, setAgarPlateSize] = usePersistentState<'90mm' | '60mm'>('agar-plate-size', '90mm');
  const [agarYieldPlates, setAgarYieldPlates] = usePersistentState('agar-yield-plates', 42);
  const [agarGenRef, setAgarGenRef] = usePersistentState<'Master (G0)' | 'G1 Expansion' | 'G2 Production'>('agar-generation-ref', 'G1 Expansion');
  const [agarSourceId, setAgarSourceId] = usePersistentState('agar-source-id', 'Agripie F43 Master Slant #04');

  // SOP-CML-LC-01 Liquid Culture States
  const [lcBatchId, setLcBatchId] = usePersistentState('lc-batch-id', '#LC-2026-1101');
  const [lcPrepDate, setLcPrepDate] = usePersistentState('lc-prep-date', '2026-11-01');
  const [lcFlaskCount, setLcFlaskCount] = usePersistentState('lc-flask-count', 16);
  const [lcActualPh, setLcActualPh] = usePersistentState('lc-actual-ph', 6.2);
  const [lcRpm, setLcRpm] = usePersistentState('lc-rpm', 200);
  const [ss304SieveVerified, setSs304SieveVerified] = usePersistentState('ss304-sieve-verified', false);
  const [sieveMicron, setSieveMicron] = usePersistentState('sieve-micron', 500);

  // SOP-CML-LOG-02 Daily Autoclave & Morning Inoculation States
  const [autoclaveDate, setAutoclaveDate] = usePersistentState('autoclave-date', '2026-11-01');
  const [masterBatchLabel, setMasterBatchLabel] = usePersistentState('master-batch-label', '#MB-2026-1101');
  const [inocBatchId, setInocBatchId] = usePersistentState('inoc-batch-id', '#INOC-2026-1102');
  const [inocDate, setInocDate] = usePersistentState('inoc-date', '2026-11-02');
  const [cycles, setCycles] = usePersistentState('autoclave-cycles', [
    { cycle: 1, startEnd: '09:00 / 10:15', tempPsi: '121C / 15 psi', holdMin: 35, jars: 48, ref: 'Rice + LSFM #1', pass: true },
    { cycle: 2, startEnd: '11:30 / 12:45', tempPsi: '121C / 15 psi', holdMin: 35, jars: 48, ref: 'Rice + LSFM #2', pass: true },
    { cycle: 3, startEnd: '14:15 / 15:30', tempPsi: '121C / 15 psi', holdMin: 35, jars: 48, ref: 'Rice + LSFM #3', pass: true },
  ]);
  const [culledJars, setCulledJars] = usePersistentState('culled-jars', 2);
  const [wetHarvestG, setWetHarvestG] = usePersistentState('wet-harvest-g', 3120);
  const [dryYieldG, setDryYieldG] = usePersistentState('dry-yield-g', 418);

  // QR Sticker Range (58mm POSiFLOW PSF20 compatible)
  const [qrCount, setQrCount] = usePersistentState('qr-count', 12);
  const [qrStartJar, setQrStartJar] = usePersistentState('qr-start-jar', 1);
  const [qrOpaqueIds, setQrOpaqueIds] = usePersistentState<Record<string, string>>('qr-opaque-ids', {});
  const [transferDate, setTransferDate] = usePersistentState('transfer-date', '');
  const [operatorInitials, setOperatorInitials] = usePersistentState('operator-initials', '');
  const [qrSearch, setQrSearch] = useState('');
  const [qrLookupResult, setQrLookupResult] = useState<string | null>(null);

  // Seeded demo snapshot; refreshed from the existing HA health route on request.
  const [haRooms, setHaRooms] = usePersistentState('ha-rooms', [
    {
      room: 'Inoculation Cleanroom',
      stage: 'Aseptic Laminar Flow Zone',
      entityPrefix: 'sensor.cordyceps_cleanroom',
      temp: 20.3,
      targetTemp: '18-22 C',
      rh: 52,
      targetRh: '45-60%',
      co2: 610,
      targetCo2: '< 1000 ppm',
      lux: 650,
      targetLux: 'Work Light',
    },
    {
      room: 'Dark Incubation Room',
      stage: 'Stage I: Dark Mycelial Run (Days 1-4)',
      entityPrefix: 'sensor.cordyceps_dark_room',
      temp: 20.8,
      targetTemp: '18-24 C',
      rh: 68,
      targetRh: '65-70%',
      co2: 840,
      targetCo2: 'Ambient',
      lux: 0,
      targetLux: '0 Lux (100% Dark)',
    },
    {
      room: 'Carotenoid & Pinning Zone',
      stage: 'Stages II & III: Pigmentation & Pinning (Days 5-14)',
      entityPrefix: 'sensor.cordyceps_pinning_room',
      temp: 19.8,
      targetTemp: '18-22 C (Strict)',
      rh: 83,
      targetRh: '80-85%',
      co2: 1090,
      targetCo2: '< 1500 ppm',
      lux: 760,
      targetLux: '500-1000 Lux (10-12h)',
    },
    {
      room: 'Stroma Fruiting Chamber',
      stage: 'Stages IV & V: Stroma Elongation & Maturation (Weeks 3-8)',
      entityPrefix: 'sensor.cordyceps_fruiting_room',
      temp: 19.2,
      targetTemp: '18-20 C',
      rh: 86,
      targetRh: '80-90%',
      co2: 1210,
      targetCo2: '< 1500 ppm',
      lux: 880,
      targetLux: '500-1000 Lux (12h)',
    },
  ]);
  const [telemetrySource, setTelemetrySource] = usePersistentState<'demo' | 'homeassistant_supervisor' | 'local_simulation' | 'fallback_simulation' | 'unavailable'>('telemetry-source', 'demo');
  const [unavailableMetrics, setUnavailableMetrics] = usePersistentState<Record<string, string[]>>('unavailable-metrics', {});
  const [lastPollAt, setLastPollAt] = usePersistentState<string | null>('last-poll-at', null);
  const [isPolling, setIsPolling] = useState(false);
  const [printAllMode, setPrintAllMode] = useState(false);
  const [contaminationEvents, setContaminationEvents] = usePersistentState<Array<{
    id: string;
    timestamp: string;
    token: string;
    stage: string;
    reason: string;
    rootCause: string;
    jarsCulled: number;
  }>>('contamination-events', []);
  const [newContamination, setNewContamination] = useState({
    jarNumber: '001',
    stage: 'Stage III · Pinning',
    reason: 'Visible contamination / abnormal growth',
    rootCause: 'Investigation pending',
    jarsCulled: 1,
  });
  const metricUnavailable = (room: string, metric: string) =>
    telemetrySource === 'unavailable' || unavailableMetrics[room]?.includes(metric) === true;

  const totalSterilizedToday = cycles.reduce((acc, c) => acc + Number(c.jars || 0), 0);
  const darkRoomInstalled = Math.max(0, totalSterilizedToday - culledJars);
  const totalDryRiceSubstrateG = darkRoomInstalled * 20;
  const biologicalEfficiencyPct =
    totalDryRiceSubstrateG > 0 ? ((wetHarvestG / totalDryRiceSubstrateG) * 100).toFixed(1) : '0.0';
  const dryYieldPerJar = darkRoomInstalled > 0 ? (dryYieldG / darkRoomInstalled).toFixed(2) : '0.00';
  const lsfmTotalMl = Math.round(targetJarCount * 30 * (1 + lsfmOveragePct / 100));
  const lsfmTotalLiters = lsfmTotalMl / 1000;

  useEffect(() => {
    const resetPrintMode = () => setPrintAllMode(false);
    window.addEventListener('afterprint', resetPrintMode);
    return () => window.removeEventListener('afterprint', resetPrintMode);
  }, []);

  useEffect(() => {
    const tokens = Array.from({ length: qrCount }, (_, index) =>
      `${inocBatchId}-J${String(index + qrStartJar).padStart(3, '0')}`,
    );
    setQrOpaqueIds((current) => {
      let changed = false;
      const next = { ...current };
      for (const token of tokens) {
        if (!next[token]) {
          next[token] = createOpaqueQrId();
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [inocBatchId, qrCount, qrStartJar, setQrOpaqueIds]);

  const pollHomeAssistant = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
      const payload = (await response.json()) as {
        ha?: {
          source?: string;
          cleanroom?: { tempC?: number; rh?: number; co2Ppm?: number; lux?: number };
          darkRoom?: { tempC?: number; rh?: number; co2Ppm?: number; lux?: number };
          pinningRoom?: { tempC?: number; rh?: number; co2Ppm?: number; lux?: number };
          fruitingRoom?: { tempC?: number; rh?: number; co2Ppm?: number; lux?: number };
        };
      };
      if (!payload.ha) throw new Error('Sensor snapshot was not returned');
      const sensors = [
        payload.ha.cleanroom,
        payload.ha.darkRoom,
        payload.ha.pinningRoom,
        payload.ha.fruitingRoom,
      ];
      setUnavailableMetrics(
        Object.fromEntries(
          sensors.map((sample, index) => [
            haRooms[index]?.room,
            ['temperature', 'humidity', 'co2', 'lux'].filter((metric) => {
              if (metric === 'temperature') return typeof sample?.tempC !== 'number';
              if (metric === 'humidity') return typeof sample?.rh !== 'number';
              if (metric === 'co2') return typeof sample?.co2Ppm !== 'number';
              return typeof sample?.lux !== 'number';
            }),
          ]),
        ),
      );
      setHaRooms((rooms) =>
        rooms.map((room, index) => {
          const sample = sensors[index];
          return {
            ...room,
            temp: sample?.tempC ?? room.temp,
            rh: sample?.rh ?? room.rh,
            co2: sample?.co2Ppm ?? room.co2,
            lux: sample?.lux ?? room.lux,
          };
        }),
      );
      const source = payload.ha.source;
      setTelemetrySource(
        source === 'homeassistant_supervisor'
          ? 'homeassistant_supervisor'
          : source === 'fallback_simulation'
            ? 'fallback_simulation'
            : 'local_simulation',
      );
      setLastPollAt(new Date().toISOString());
    } catch {
      setTelemetrySource('unavailable');
      setLastPollAt(new Date().toISOString());
    } finally {
      setIsPolling(false);
    }
  };

  const simulateSensorSample = () => {
    setUnavailableMetrics({});
    setHaRooms((rooms) =>
      rooms.map((room) => ({
        ...room,
        temp: Number((room.temp + (Math.random() - 0.5) * 0.4).toFixed(1)),
        rh: Number((room.rh + (Math.random() - 0.5) * 1.2).toFixed(1)),
        co2: Math.max(410, Math.round(room.co2 + (Math.random() - 0.5) * 35)),
      })),
    );
    setTelemetrySource('local_simulation');
    setLastPollAt(new Date().toISOString());
  };

  const resetDemo = () => {
    if (!window.confirm('Reset the console to its demo defaults? Saved log entries will be cleared.')) return;
    setCustomSeedVolMl(1800);
    setTargetJarCount(144);
    setFixLsfmTransposition(true);
    setLsfmOveragePct(10);
    setAgarBatchId('#AGAR-2026-1101');
    setAgarPrepDate('2026-11-01');
    setAgarVolumeL(1);
    setAgarAntibiotic('None');
    setAgarPlateSize('90mm');
    setAgarYieldPlates(42);
    setAgarGenRef('G1 Expansion');
    setAgarSourceId('Agripie F43 Master Slant #04');
    setLcBatchId('#LC-2026-1101');
    setLcPrepDate('2026-11-01');
    setLcFlaskCount(16);
    setLcActualPh(6.2);
    setLcRpm(200);
    setSs304SieveVerified(false);
    setSieveMicron(500);
    setAutoclaveDate('2026-11-01');
    setMasterBatchLabel('#MB-2026-1101');
    setInocBatchId('#INOC-2026-1102');
    setInocDate('2026-11-02');
    setCycles([
      { cycle: 1, startEnd: '09:00 / 10:15', tempPsi: '121C / 15 psi', holdMin: 35, jars: 48, ref: 'Rice + LSFM #1', pass: true },
      { cycle: 2, startEnd: '11:30 / 12:45', tempPsi: '121C / 15 psi', holdMin: 35, jars: 48, ref: 'Rice + LSFM #2', pass: true },
      { cycle: 3, startEnd: '14:15 / 15:30', tempPsi: '121C / 15 psi', holdMin: 35, jars: 48, ref: 'Rice + LSFM #3', pass: true },
    ]);
    setCulledJars(2);
    setWetHarvestG(3120);
    setDryYieldG(418);
    setQrCount(12);
    setQrStartJar(1);
    setHaRooms((rooms) =>
      rooms.map((room, index) => ({
        ...room,
        temp: [20.3, 20.8, 19.8, 19.2][index],
        rh: [52, 68, 83, 86][index],
        co2: [610, 840, 1090, 1210][index],
        lux: [650, 0, 760, 880][index],
      })),
    );
    setContaminationEvents([]);
    setTelemetrySource('demo');
    setUnavailableMetrics({});
    setLastPollAt(null);
  };

  const printCurrent = (all: boolean) => {
    setPrintAllMode(all);
    window.setTimeout(() => window.print(), 180);
  };

  const lookupQrToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = qrSearch.trim();
    if (!token) {
      setQrLookupResult('Enter a batch or jar token to search.');
      return;
    }

    try {
      const response = await fetch(`/api/qr/${encodeURIComponent(token)}`);
      if (response.ok) {
        const record = (await response.json()) as { type?: string };
        setQrLookupResult(`Server record found · ${record.type ?? 'record'} · ${token}`);
        return;
      }
    } catch {
      // Fall through to the local-first register lookup below.
    }

    const resolvedToken = Object.entries(qrOpaqueIds).find(([, opaqueId]) => opaqueId === token)?.[0] ?? token;
    const contamination = contaminationEvents.find((entry) => entry.token.toLowerCase() === resolvedToken.toLowerCase());
    if (contamination) {
      setQrLookupResult(`Contamination audit · ${contamination.stage} · ${contamination.reason}`);
      return;
    }
    if (resolvedToken === inocBatchId || resolvedToken === masterBatchLabel || resolvedToken === lcBatchId || resolvedToken === agarBatchId) {
      setQrLookupResult(`Local batch record · ${resolvedToken} · Agripie F43`);
      return;
    }
    const jarPrefix = `${inocBatchId}-J`;
    const jarIndex = resolvedToken.toLowerCase().startsWith(jarPrefix.toLowerCase())
      ? Number(resolvedToken.slice(jarPrefix.length))
      : NaN;
    if (Number.isInteger(jarIndex) && jarIndex > 0 && jarIndex <= totalSterilizedToday) {
      setQrLookupResult(`Local jar label · ${resolvedToken} · ${ss304SieveVerified ? 'sieve verified' : 'filtration not verified'}`);
      return;
    }
    setQrLookupResult(`No local or server record found for ${resolvedToken}.`);
  };

  const addContaminationEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const jarNumber = Number(newContamination.jarNumber);
    const culled = Math.max(1, Number(newContamination.jarsCulled) || 1);
    if (!Number.isInteger(jarNumber) || jarNumber < 1 || jarNumber > totalSterilizedToday) return;

    const token = `${inocBatchId}-J${String(jarNumber).padStart(3, '0')}`;
    setContaminationEvents((events) => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        token,
        stage: newContamination.stage,
        reason: newContamination.reason.trim() || 'Finding not specified',
        rootCause: newContamination.rootCause.trim() || 'Investigation pending',
        jarsCulled: culled,
      },
      ...events,
    ]);
    setCulledJars((count) => count + culled);
    setNewContamination((value) => ({ ...value, rootCause: 'Investigation pending' }));
  };

  return (
    <div className={`f43-console app-shell min-h-screen bg-slate-950 text-slate-100 flex flex-col ${printAllMode ? 'print-all-mode' : ''}`}>
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">
                  Cordyceps Lab Console
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Agripie F43
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                  telemetrySource === 'homeassistant_supervisor'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {telemetrySource === 'homeassistant_supervisor' ? 'Supervisor connected' : 'Telemetry unverified'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Local-first SOP registers · seeded demo values · F43 batch traceability
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={onReturnToLogbook}
              className="toolbar-button inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
            >
              <Activity className="w-3.5 h-3.5" />
              Activity Logbook
            </button>
            <button
              onClick={() => printCurrent(false)}
              className="toolbar-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print active view
            </button>
            <button
              onClick={() => printCurrent(true)}
              className="toolbar-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 border border-amber-400"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Print full packet
            </button>
            <button
              onClick={resetDemo}
              className="toolbar-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
              title="Restore demo values and clear local contamination entries"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset demo
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Lab console sections" className="section-nav max-w-7xl mx-auto px-4 flex flex-wrap gap-1 border-t border-slate-800/80 pt-2 pb-2">
          <label className="mobile-section-picker">
            <span className="eyebrow">Section {NAV_TABS.findIndex((tab) => tab.id === activeTab) + 1} of {NAV_TABS.length}</span>
            <select
              aria-label="Choose lab console section"
              value={activeTab}
              onChange={(event) => setActiveTab(event.target.value as typeof activeTab)}
            >
              {NAV_TABS.map((tab, index) => (
                <option key={tab.id} value={tab.id}>{index + 1}. {tab.label}</option>
              ))}
            </select>
          </label>
          <div className="desktop-section-tabs">
          {NAV_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {index + 1}. {tab.label}
              </button>
            );
          })}
          </div>
        </nav>
      </header>

      <div className="print-packet" aria-hidden={!printAllMode}>
        <div className="packet-header">
          <div>
            <p className="packet-kicker">CORDYCEPS MILITARIS · QUALITY CONTROL REGISTER</p>
            <h1>Agripie F43 · Production packet</h1>
            <p>Generated {new Date().toLocaleString()} · Operator copy</p>
          </div>
          <div className="packet-stamp">DEMO DATA<br />VERIFY BEFORE USE</div>
        </div>
        <p className="packet-note">Seeded demonstration values are not production records. Verify or replace every ID, date, operator, sensor reading, cycle, observation and yield before use.</p>

        <section className="packet-section">
          <h2>01 · Media scaling</h2>
          <p>400 mL jar plan · {targetJarCount} jars · {lsfmOveragePct}% LSFM overage</p>
          <table>
            <thead><tr><th>Material</th><th>Calculated requirement</th><th>Basis</th></tr></thead>
            <tbody>
              <tr><td>Parboiled dry rice</td><td>{targetJarCount * 20} g</td><td>20 g / jar</td></tr>
              <tr><td>LSFM broth</td><td>{lsfmTotalMl} mL</td><td>30 mL / jar + overage</td></tr>
              <tr><td>Filtered F43 spawn</td><td>{targetJarCount * 10} mL</td><td>10 mL / jar</td></tr>
              <tr><td>Seed culture batch</td><td>{customSeedVolMl} mL</td><td>Supports {Math.floor(customSeedVolMl / 10)} jars at 10 mL / jar</td></tr>
            </tbody>
          </table>
          <p className="packet-note">Critical F43 control: use spore-dominant liquid spawn; verify sterile 200–1000 µm SS304 filtration before inoculation.</p>
        </section>

        <section className="packet-section">
          <h2>02 · Agar preparation &amp; transfer</h2>
          <table>
            <tbody>
              <tr><th>Batch / source</th><td>{agarBatchId} · {agarSourceId}</td></tr>
              <tr><th>Preparation date / generation</th><td>{agarPrepDate} · {agarGenRef}</td></tr>
              <tr><th>Media volume / plate setup</th><td>{agarVolumeL} L · {agarPlateSize} · {agarYieldPlates} plates</td></tr>
              <tr><th>Antibiotic option</th><td>{agarAntibiotic}</td></tr>
              <tr><th>Enriched PDA formula</th><td>TM MEDIA PDA { (39 * agarVolumeL).toFixed(1) } g · Peptone { (10 * agarVolumeL).toFixed(1) } g · MgSO₄·7H₂O { (0.5 * agarVolumeL).toFixed(2) } g</td></tr>
            </tbody>
          </table>
        </section>

        <section className="packet-section">
          <h2>03 · Liquid culture &amp; filtration gate</h2>
          <table>
            <tbody>
              <tr><th>LC batch / prep date</th><td>{lcBatchId} · {lcPrepDate}</td></tr>
              <tr><th>Shaker / broth pH</th><td>{lcFlaskCount} flasks · {lcRpm} RPM · pH {lcActualPh}</td></tr>
              <tr><th>SS304 verification</th><td>{ss304SieveVerified ? `VERIFIED · ${sieveMicron} µm` : 'NOT VERIFIED · HOLD INOCULATION'}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="packet-section">
          <h2>04 · Autoclave &amp; inoculation register</h2>
          <p>{autoclaveDate} · Master {masterBatchLabel} · Inoculation {inocBatchId} ({inocDate})</p>
          <table>
            <thead><tr><th>Cycle</th><th>Start / end</th><th>Temp / pressure</th><th>Hold</th><th>Intact jars</th><th>Media reference</th></tr></thead>
            <tbody>{cycles.map((cycle) => (
              <tr key={cycle.cycle}><td>{cycle.cycle}</td><td>{cycle.startEnd}</td><td>{cycle.tempPsi}</td><td>{cycle.holdMin} min</td><td>{cycle.jars}</td><td>{cycle.ref}</td></tr>
            ))}</tbody>
          </table>
          <p>Sterilized {totalSterilizedToday} · Culled {culledJars} · Active {darkRoomInstalled} · Wet harvest {wetHarvestG} g · Dry yield {dryYieldG} g · BE {biologicalEfficiencyPct}% · Dry / jar {dryYieldPerJar} g</p>
        </section>

        <section className="packet-section">
          <h2>05 · Jar labels &amp; contamination audit</h2>
          <p>QR batch: {inocBatchId} · sticker range J{String(qrStartJar).padStart(3, '0')}–J{String(qrStartJar + qrCount - 1).padStart(3, '0')} · source {lcBatchId}</p>
          {contaminationEvents.length > 0 ? (
            <table>
              <thead><tr><th>Logged</th><th>Jar token</th><th>Stage</th><th>Finding / root cause</th><th>Culled</th></tr></thead>
              <tbody>{contaminationEvents.map((entry) => (
                <tr key={entry.id}><td>{entry.timestamp}</td><td>{entry.token}</td><td>{entry.stage}</td><td>{entry.reason} · {entry.rootCause}</td><td>{entry.jarsCulled}</td></tr>
              ))}</tbody>
            </table>
          ) : <p>No contamination events recorded in this local register.</p>}
        </section>

        <section className="packet-section">
          <h2>06 · Environmental snapshot</h2>
          <p>Source: {telemetrySource === 'homeassistant_supervisor' ? 'Supervisor API response · missing metrics unavailable' : telemetrySource === 'unavailable' ? 'Unavailable · no measurements shown' : 'Demo / simulated snapshot · not live'}{lastPollAt ? ` · Last attempt ${new Date(lastPollAt).toLocaleString()}` : ''}</p>
          <table>
            <thead><tr><th>Room</th><th>Temperature</th><th>RH</th><th>CO₂</th><th>Light</th></tr></thead>
            <tbody>{haRooms.map((room) => (
              <tr key={room.room}>
                <td>{room.room}</td>
                <td>{metricUnavailable(room.room, 'temperature') ? 'Unavailable' : `${room.temp} °C`}</td>
                <td>{metricUnavailable(room.room, 'humidity') ? 'Unavailable' : `${room.rh}%`}</td>
                <td>{metricUnavailable(room.room, 'co2') ? 'Unavailable' : `${room.co2} ppm`}</td>
                <td>{metricUnavailable(room.room, 'lux') ? 'Unavailable' : `${room.lux} lux`}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>

        <footer className="packet-footer">Cordyceps Lab Console · Local-first operator copy · Review before use</footer>
      </div>

      {/* Main Content */}
      <main className="app-main max-w-7xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        {/* Critical Strain Rule Banner */}
        <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-amber-100">
            <span className="font-bold text-amber-300 uppercase tracking-wide">
              Critical Strain Rule (Agripie F43 Liquid Spawn):
            </span>{' '}
            Liquid spawn for the F43 strain must be <strong>spore-dominant</strong>. Avoid heavy mycelial clumps. Prior to inoculation, pass liquid spawn through a sterile{' '}
            <strong>200–1000 um SS304 sieve</strong> or sterile cotton filter. Unfiltered mycelial lumps cause early yellow-coat formation on the substrate surface, resulting in nutrient depletion and severe primordia inhibition.
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <section className="sensor-toolbar" aria-label="Sensor snapshot controls">
              <div className="sensor-source">
                <span className={`source-indicator ${telemetrySource === 'homeassistant_supervisor' ? 'source-live' : ''}`} aria-hidden="true" />
                <div>
                  <p className="eyebrow">Environmental telemetry</p>
                  <strong>
                    {telemetrySource === 'homeassistant_supervisor'
                      ? 'Supervisor API response · missing metrics unavailable'
                      : telemetrySource === 'unavailable'
                        ? 'Connection unavailable'
                        : telemetrySource === 'demo'
                          ? 'Demo snapshot · not live'
                          : 'Simulated snapshot · not live'}
                  </strong>
                  <span>{lastPollAt ? `Last attempt ${new Date(lastPollAt).toLocaleString()}` : 'No API check this session'}</span>
                </div>
              </div>
              <div className="sensor-actions no-print">
                <button type="button" onClick={pollHomeAssistant} disabled={isPolling} className="secondary-action">
                  <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                  {isPolling ? 'Checking…' : 'Poll HA API'}
                </button>
                <button type="button" onClick={simulateSensorSample} className="secondary-action">
                  <Activity className="w-3.5 h-3.5" />
                  Simulate sample
                </button>
              </div>
            </section>

            {/* End-to-End Lineage Pipeline */}
            <section className="lineage-board bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="lineage-heading">
                <div>
                  <p className="eyebrow">One strain · five control points</p>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 mt-1 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    Batch lineage
                  </h2>
                </div>
                <div className="lineage-mark" aria-hidden="true"><span>F43</span><i /></div>
              </div>
              <div className="lineage-track grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <button type="button" onClick={() => setActiveTab('AGAR_LOG')} className="lineage-node lineage-step-agar p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-left">
                  <div className="lineage-step-label"><span>01</span><span>AGAR · EXPANSION</span></div>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">{agarBatchId}</div>
                  <div className="text-xs text-slate-300 mt-1">{agarGenRef} ({agarYieldPlates} plates)</div>
                </button>
                <button type="button" onClick={() => setActiveTab('LC_LOG')} className="lineage-node lineage-step-lc p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-left">
                  <div className="lineage-step-label"><span>02</span><span>LIQUID CULTURE</span></div>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">{lcBatchId}</div>
                  <div className="text-xs text-emerald-400 mt-1">
                    {ss304SieveVerified ? `SS304 ${sieveMicron}um Filtered` : 'Pending Filtration'}
                  </div>
                </button>
                <button type="button" onClick={() => setActiveTab('AUTOCLAVE_INOC')} className="lineage-node lineage-step-sterile p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-left">
                  <div className="lineage-step-label"><span>03</span><span>STERILIZED SUBSTRATE</span></div>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">{masterBatchLabel}</div>
                  <div className="text-xs text-slate-300 mt-1">{totalSterilizedToday} x 400mL Jars (20g Rice + 30mL LSFM)</div>
                </button>
                <button type="button" onClick={() => setActiveTab('AUTOCLAVE_INOC')} className="lineage-node lineage-step-inoc p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-left">
                  <div className="lineage-step-label"><span>04</span><span>INOCULATION RUN</span></div>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">{inocBatchId}</div>
                  <div className="text-xs text-slate-300 mt-1">{darkRoomInstalled} Active Jars (10mL Spawn/Jar)</div>
                </button>
                <button type="button" onClick={() => setActiveTab('AUTOCLAVE_INOC')} className="lineage-node lineage-step-yield p-3.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-left">
                  <div className="lineage-step-label"><span>05</span><span>HARVEST · YIELD</span></div>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    BE: {biologicalEfficiencyPct}%
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Dry: {dryYieldG}g ({dryYieldPerJar} g/jar)
                  </div>
                </button>
              </div>
            </section>

            {/* Home Assistant ESPHome Sensor Snapshot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {haRooms.map((rm) => (
                <div
                  key={rm.room}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-amber-400">{rm.entityPrefix}_*</span>
                      <h3 className="font-bold text-base text-white mt-0.5">{rm.room}</h3>
                      <p className="text-xs text-slate-400">{rm.stage}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      telemetrySource === 'homeassistant_supervisor'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {telemetrySource === 'homeassistant_supervisor'
                        ? unavailableMetrics[rm.room]?.length
                          ? 'PARTIAL'
                          : 'API RESPONSE'
                        : telemetrySource === 'unavailable'
                          ? 'UNAVAILABLE'
                          : telemetrySource === 'demo'
                            ? 'DEMO'
                            : 'SIMULATED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temp
                      </div>
                      <div className="text-sm font-bold text-white mt-1">{metricUnavailable(rm.room, 'temperature') ? 'Unavailable' : `${rm.temp} C`}</div>
                      <div className="text-[10px] text-slate-400">SOP: {rm.targetTemp}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Droplets className="w-3.5 h-3.5 text-sky-400" /> Humidity
                      </div>
                      <div className="text-sm font-bold text-white mt-1">{metricUnavailable(rm.room, 'humidity') ? 'Unavailable' : `${rm.rh}%`}</div>
                      <div className="text-[10px] text-slate-400">SOP: {rm.targetRh}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Wind className="w-3.5 h-3.5 text-emerald-400" /> CO2
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {metricUnavailable(rm.room, 'co2') ? 'Unavailable' : `${rm.co2} ppm`}
                      </div>
                      <div className="text-[10px] text-slate-400">SOP: {rm.targetCo2}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Sun className="w-3.5 h-3.5 text-amber-400" /> Light
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {metricUnavailable(rm.room, 'lux') ? 'Unavailable' : `${rm.lux} Lux`}
                      </div>
                      <div className="text-[10px] text-slate-400">SOP: {rm.targetLux}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="rounded border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-300">
              Not mapped in this console: VPD, airflow, door state and actuator feedback. No values are inferred for these channels.
            </p>
          </div>
        )}

        {/* TAB 2: SOP-CM-F43-V3 SCALING & LSFM */}
        {activeTab === 'SOP_F43' && (
          <div className="space-y-6">
            {/* Interactive 400mL Jar & Custom Seed Calculator */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  400 mL Glass Jar Ratio &amp; Batch Broth Calculator
                </h2>
                <p className="text-xs text-slate-300">
                  Standardized bottle parameters: <strong>20.00 g Parboiled Dry Rice</strong> +{' '}
                  <strong>30.00 mL LSFM Broth</strong> (1.50 mL/g dry rice) +{' '}
                  <strong>10.00 mL Filtered Spore-Dominant Spawn</strong> per 400 mL jar.
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="target-jar-count" className="text-xs font-semibold text-slate-300">Target 400 mL Jar Count:</label>
                  <input
                    id="target-jar-count"
                    type="number"
                    min={1}
                    value={targetJarCount}
                    onChange={(e) => setTargetJarCount(Math.max(1, Number(e.target.value) || 1))}
                    className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-sm font-mono w-32 text-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="lsfm-overage" className="text-xs font-semibold text-slate-300">LSFM reserve:</label>
                  <input
                    id="lsfm-overage"
                    type="number"
                    min={0}
                    max={50}
                    value={lsfmOveragePct}
                    onChange={(e) => setLsfmOveragePct(Math.min(50, Math.max(0, Number(e.target.value) || 0)))}
                    className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-sm font-mono w-20 text-white"
                  />
                  <span className="text-xs text-slate-400">% overage</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Parboiled Dry Rice</div>
                    <div className="text-base font-bold text-white mt-1">
                      {(targetJarCount * 20).toFixed(0)} g
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ({((targetJarCount * 20) / 1000).toFixed(2)} kg total)
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">LSFM Nutrient Broth</div>
                    <div className="text-base font-bold text-amber-400 mt-1">
                      {lsfmTotalMl} mL
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ({lsfmTotalLiters.toFixed(2)} L incl. reserve)
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Filtered F43 Spawn</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">
                      {(targetJarCount * 10).toFixed(0)} mL
                    </div>
                    <div className="text-[11px] text-slate-400">10.00 mL / jar</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Custom Seed Culture (Liquid Spawn) Volume Scaler
                </h2>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-300">Seed Batch Volume (mL):</label>
                  <input
                    type="number"
                    step={100}
                    value={customSeedVolMl}
                    onChange={(e) => setCustomSeedVolMl(Math.max(100, Number(e.target.value)))}
                    className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-sm font-mono w-32 text-white"
                  />
                  <span className="text-xs text-slate-400">
                    Inoculates ~{Math.floor(customSeedVolMl / 10)} jars @ 10 mL/jar
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  {[
                    { name: 'Glucose', g: (customSeedVolMl * 0.015).toFixed(2) },
                    { name: 'Peptone', g: (customSeedVolMl * 0.005).toFixed(2) },
                    { name: 'Yeast Ext.', g: (customSeedVolMl * 0.0025).toFixed(2) },
                    { name: 'KH2PO4', g: (customSeedVolMl * 0.003).toFixed(2) },
                    { name: 'K2HPO4', g: (customSeedVolMl * 0.001).toFixed(2) },
                    { name: 'MgSO4.7H2O', g: (customSeedVolMl * 0.0005).toFixed(2) },
                    { name: 'NaCl', g: (customSeedVolMl * 0.0005).toFixed(2) },
                  ].map((item) => (
                    <div key={item.name} className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">{item.name}</div>
                      <div className="text-sm font-bold text-white mt-0.5">{item.g} g</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">LSFM ingredient scale</h3>
                  <p className="text-xs text-slate-400 mt-1">Calculated for {lsfmTotalLiters.toFixed(2)} L · concentrations from the F43 reference recipe.</p>
                </div>
                <span className="text-xs font-mono text-amber-300">{lsfmTotalMl} mL total</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { name: 'D-Glucose', gramsPerL: 10 },
                  { name: 'Sucrose', gramsPerL: 14 },
                  { name: 'Peptone', gramsPerL: 10 },
                  { name: 'Yeast extract', gramsPerL: 10 },
                  { name: 'Malt extract', gramsPerL: 10 },
                  { name: 'MgSO₄·7H₂O', gramsPerL: 0.5 },
                  { name: 'KH₂PO₄', gramsPerL: 3 },
                  { name: 'K₂HPO₄', gramsPerL: 1 },
                  { name: 'Ca(NO₃)₂', gramsPerL: 1 },
                ].map((ingredient) => (
                  <div key={ingredient.name} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400">{ingredient.name}</div>
                    <div className="text-sm font-bold font-mono text-white mt-1">{(ingredient.gramsPerL * lsfmTotalLiters).toFixed(2)} g</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 1: Seed Culture Master Table (900mL - 4800mL) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3">
                1. Seed Culture (Liquid Spawn) Scaling Master Table (900 mL – 4800 mL, 180–220 RPM @ 20–22 C for 4–7 Days)
              </h3>
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300 bg-slate-950">
                    <th className="p-2">Batch Vol. (mL)</th>
                    <th className="p-2">Glucose (g)</th>
                    <th className="p-2">Peptone (g)</th>
                    <th className="p-2">Yeast Ext. (g)</th>
                    <th className="p-2">KH2PO4 (g)</th>
                    <th className="p-2">K2HPO4 (g)</th>
                    <th className="p-2">MgSO4.7H2O (g)</th>
                    <th className="p-2">NaCl (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {SEED_CULTURE_MASTER_VOLUMES.map((vol) => (
                    <tr
                      key={vol}
                      className={`border-b border-slate-800/70 ${
                        vol === customSeedVolMl ? 'bg-amber-500/15 text-amber-200 font-bold' : ''
                      }`}
                    >
                      <td className="p-2">{vol} mL</td>
                      <td className="p-2">{(vol * 0.015).toFixed(2)}</td>
                      <td className="p-2">{(vol * 0.005).toFixed(2)}</td>
                      <td className="p-2">{(vol * 0.0025).toFixed(2)}</td>
                      <td className="p-2">{(vol * 0.003).toFixed(2)}</td>
                      <td className="p-2">{(vol * 0.001).toFixed(2)}</td>
                      <td className="p-2">{(vol * 0.0005).toFixed(2)}</td>
                      <td className="p-2">{(vol * 0.0005).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 2: LSFM Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  2. Liquid Supplement for Fruiting Media (LSFM) — Peptone Formulation
                </h3>
                <button
                  onClick={() => setFixLsfmTransposition(!fixLsfmTransposition)}
                  className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                >
                  {fixLsfmTransposition
                    ? 'Showing True Concentration Math (1.0L vs 2.5L Fixed)'
                    : 'Showing Raw Printed PDF Values'}
                </button>
              </div>
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300 bg-slate-950">
                    <th className="p-2">Ingredient</th>
                    <th className="p-2">Conc. (%)</th>
                    <th className="p-2">Per 1.0 Liter</th>
                    <th className="p-2">Per 2.5 Liters (2500 mL)</th>
                    <th className="p-2">Per 5.0 Liters</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'D-Glucose', pct: '1.00%', l1: '10.00 g', l25: '25.00 g', l5: '50.00 g' },
                    { name: 'Sucrose', pct: '1.40%', l1: '14.00 g', l25: '35.00 g', l5: '70.00 g' },
                    { name: 'Peptone', pct: '1.00%', l1: '10.00 g', l25: '25.00 g', l5: '50.00 g' },
                    { name: 'Yeast Extract', pct: '1.00%', l1: '10.00 g', l25: '25.00 g', l5: '50.00 g' },
                    {
                      name: 'Malt Extract',
                      pct: '1.00%',
                      l1: fixLsfmTransposition ? '10.00 g' : '25.00 g',
                      l25: fixLsfmTransposition ? '25.00 g' : '10.00 g',
                      l5: '50.00 g',
                    },
                    {
                      name: 'MgSO4.7H2O',
                      pct: '0.05%',
                      l1: fixLsfmTransposition ? '0.50 g' : '1.25 g',
                      l25: fixLsfmTransposition ? '1.25 g' : '0.50 g',
                      l5: '2.50 g',
                    },
                    {
                      name: 'KH2PO4',
                      pct: '0.30%',
                      l1: fixLsfmTransposition ? '3.00 g' : '7.50 g',
                      l25: fixLsfmTransposition ? '7.50 g' : '3.00 g',
                      l5: '15.00 g',
                    },
                    { name: 'K2HPO4', pct: '0.10%', l1: '1.00 g', l25: '2.50 g', l5: '5.00 g' },
                    { name: 'Ca(NO3)2', pct: '0.10%', l1: '1.00 g', l25: '2.50 g', l5: '5.00 g' },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-slate-800/70">
                      <td className="p-2 font-sans font-semibold text-white">{row.name}</td>
                      <td className="p-2 text-amber-400">{row.pct}</td>
                      <td className="p-2">{row.l1}</td>
                      <td className="p-2">{row.l25}</td>
                      <td className="p-2">{row.l5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SOP-CML-PD-01 AGAR LOG */}
        {activeTab === 'AGAR_LOG' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-amber-400">Form ID: SOP-CML-PD-01 (Rev 2.0)</span>
                <h2 className="text-lg font-bold text-white">
                  Petri Dish Media Preparation &amp; Culture Transfer Log
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <DeterministicQrSvg value={`${agarBatchId}|${agarSourceId}|${agarGenRef}|${agarPrepDate}`} size={72} />
                <div className="text-xs font-mono">
                  <div className="text-amber-400 font-bold">{agarBatchId}</div>
                  <div className="text-slate-300">{agarGenRef}</div>
                  <div className="text-slate-400">{agarPrepDate}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Agar Batch ID</label>
                <input
                  value={agarBatchId}
                  onChange={(e) => setAgarBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Prep / Transfer Date</label>
                <input
                  type="date"
                  value={agarPrepDate}
                  onChange={(e) => setAgarPrepDate(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Batch Volume (Liters)</label>
                <input
                  type="number"
                  step="0.5"
                  value={agarVolumeL}
                  onChange={(e) => setAgarVolumeL(Math.max(0.25, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-amber-400">
                Enriched PDA Formula Auto-Scaled for {agarVolumeL} L (Sterilize: 121 C / 15 psi for 20 mins):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div>TM MEDIA PDA: {(39 * agarVolumeL).toFixed(1)} g</div>
                <div>Peptone: {(10 * agarVolumeL).toFixed(1)} g</div>
                <div>MgSO4.7H2O: {(0.5 * agarVolumeL).toFixed(2)} g</div>
                <div>Distilled Water: {agarVolumeL.toFixed(2)} L</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Source Master ID</label>
                <input
                  value={agarSourceId}
                  onChange={(e) => setAgarSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Generation Ref</label>
                <select
                  value={agarGenRef}
                  onChange={(e) => setAgarGenRef(e.target.value as 'Master (G0)' | 'G1 Expansion' | 'G2 Production')}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Master (G0)">Master (G0)</option>
                  <option value="G1 Expansion">G1 Expansion</option>
                  <option value="G2 Production">G2 Production</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Plate Size</label>
                <select
                  value={agarPlateSize}
                  onChange={(e) => setAgarPlateSize(e.target.value as '90mm' | '60mm')}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="90mm">90mm (~20-25 mL/plate)</option>
                  <option value="60mm">60mm (~8-10 mL/plate)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Total Plates Poured</label>
                <input
                  type="number"
                  value={agarYieldPlates}
                  onChange={(e) => setAgarYieldPlates(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Optional antibiotic</label>
                <select
                  value={agarAntibiotic}
                  onChange={(e) => setAgarAntibiotic(e.target.value as 'None' | 'Chloramphenicol' | 'Gentamicin')}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option>None</option>
                  <option>Chloramphenicol</option>
                  <option>Gentamicin</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOP-CML-LC-01 LIQUID CULTURE & SS304 SIEVE GATE */}
        {activeTab === 'LC_LOG' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-amber-400">Form ID: SOP-CML-LC-01 (Rev 2.0)</span>
                <h2 className="text-lg font-bold text-white">
                  Liquid Culture (LC) Broth Prep, 16-Flask Rotary Shaker &amp; SS304 Filtration Log
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <DeterministicQrSvg value={`${lcBatchId}|${agarBatchId}|RPM:${lcRpm}|SIEVE:${ss304SieveVerified}`} size={72} />
                <div className="text-xs font-mono">
                  <div className="text-amber-400 font-bold">{lcBatchId}</div>
                  <div className="text-slate-300">Source: {agarBatchId}</div>
                  <div className="text-emerald-400">{lcFlaskCount} Flasks @ {lcRpm} RPM</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">LC Batch ID</label>
                <input
                  value={lcBatchId}
                  onChange={(e) => setLcBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Rotary Shaker Flask Count (Max 16)</label>
                <input
                  type="number"
                  max={16}
                  value={lcFlaskCount}
                  onChange={(e) => setLcFlaskCount(Math.min(16, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Pre-Autoclave Actual pH (Target 6.0–6.5)</label>
                <input
                  type="number"
                  step="0.1"
                  value={lcActualPh}
                  onChange={(e) => setLcActualPh(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Orbital Shaker RPM (SOP: 180–220)</label>
                <input
                  type="number"
                  value={lcRpm}
                  onChange={(e) => setLcRpm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                />
              </div>
            </div>

            {/* Mandatory F43 SS304 Filtration Gate */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              ss304SieveVerified ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-amber-950/30 border-amber-500/40'
            }`}>
              <div className="space-y-1">
                <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  ss304SieveVerified ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  Mandatory Agripie F43 QQC &amp; SS304 Sieve Filtration Verification
                </div>
                <p className="text-xs text-slate-300">
                  Before inoculation, pass culture through a sterile SS304 mesh (200–1000 um) to remove heavy aggregates and retain a spore-dominant suspension.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-2 font-semibold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ss304SieveVerified}
                    onChange={(e) => setSs304SieveVerified(e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  {ss304SieveVerified ? 'SS304 verified' : 'SS304 not verified'} · {sieveMicron} µm
                </label>
                <label className="sr-only" htmlFor="sieve-micron">Sieve aperture in microns</label>
                <input
                  id="sieve-micron"
                  aria-label="Sieve aperture in microns"
                  type="range"
                  min={200}
                  max={1000}
                  step={50}
                  value={sieveMicron}
                  onChange={(e) => setSieveMicron(Number(e.target.value))}
                  className="w-28 accent-emerald-400"
                  disabled={!ss304SieveVerified}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SOP-CML-LOG-02 DAILY AUTOCLAVE & MORNING INOCULATION */}
        {activeTab === 'AUTOCLAVE_INOC' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-amber-400">Form ID: SOP-CML-LOG-02 (Rev 3.0)</span>
                <h2 className="text-lg font-bold text-white">
                  Daily Sterilization (3 Cycles/Day) &amp; Next-Morning Inoculation Register
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <DeterministicQrSvg
                  value={`${inocBatchId}|${masterBatchLabel}|${lcBatchId}|JARS:${darkRoomInstalled}`}
                  size={72}
                />
                <div className="text-xs font-mono">
                  <div className="text-amber-400 font-bold">{inocBatchId}</div>
                  <div className="text-slate-300">Master: {masterBatchLabel}</div>
                  <div className="text-emerald-400">Active: {darkRoomInstalled} Jars</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label htmlFor="autoclave-date" className="text-slate-400 block mb-1">Autoclave date</label>
                <input id="autoclave-date" type="date" value={autoclaveDate} onChange={(e) => setAutoclaveDate(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white" />
              </div>
              <div>
                <label htmlFor="master-batch" className="text-slate-400 block mb-1">Sterilized master batch</label>
                <input id="master-batch" value={masterBatchLabel} onChange={(e) => setMasterBatchLabel(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white" />
              </div>
              <div>
                <label htmlFor="inoc-batch" className="text-slate-400 block mb-1">Inoculation batch ID</label>
                <input id="inoc-batch" value={inocBatchId} onChange={(e) => setInocBatchId(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white" />
              </div>
              <div>
                <label htmlFor="inoc-date" className="text-slate-400 block mb-1">Inoculation date</label>
                <input id="inoc-date" type="date" value={inocDate} onChange={(e) => setInocDate(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white" />
              </div>
            </div>

            {!ss304SieveVerified && (
              <div role="alert" className="rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-xs text-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Inoculation hold: record sterile SS304 sieve verification in the Liquid Culture tab before proceeding.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-950 text-slate-300">
                    <th className="p-2.5">Cycle</th>
                    <th className="p-2.5">Start / End Time</th>
                    <th className="p-2.5">Temp / Pressure</th>
                    <th className="p-2.5">Hold Time (min)</th>
                    <th className="p-2.5">400mL Jars Intact</th>
                    <th className="p-2.5">Substrate / Media Ref</th>
                    <th className="p-2.5">Indicator Strip</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((c, i) => (
                    <tr key={c.cycle} className="border-b border-slate-800">
                      <td className="p-2.5 font-bold text-amber-400">Cycle {c.cycle}</td>
                      <td className="p-2.5">
                        <input
                          aria-label={`Cycle ${c.cycle} start and end time`}
                          value={c.startEnd}
                          onChange={(e) => setCycles((current) => current.map((cycle, index) => index === i ? { ...cycle, startEnd: e.target.value } : cycle))}
                          className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          aria-label={`Cycle ${c.cycle} temperature and pressure`}
                          value={c.tempPsi}
                          onChange={(e) => setCycles((current) => current.map((cycle, index) => index === i ? { ...cycle, tempPsi: e.target.value } : cycle))}
                          className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            aria-label={`Cycle ${c.cycle} hold time in minutes`}
                            type="number"
                            min={0}
                            value={c.holdMin}
                            onChange={(e) => setCycles((current) => current.map((cycle, index) => index === i ? { ...cycle, holdMin: Number(e.target.value) || 0 } : cycle))}
                            className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                          />
                          <span>min</span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          value={c.jars}
                          aria-label={`Cycle ${c.cycle} intact jar count`}
                          onChange={(e) => setCycles((current) => current.map((cycle, index) => index === i ? { ...cycle, jars: Number(e.target.value) || 0 } : cycle))}
                          className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          aria-label={`Cycle ${c.cycle} substrate and media reference`}
                          value={c.ref}
                          onChange={(e) => setCycles((current) => current.map((cycle, index) => index === i ? { ...cycle, ref: e.target.value } : cycle))}
                          className="w-36 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <label className="inline-flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={c.pass}
                            onChange={(e) => setCycles((current) => current.map((cycle, index) => index === i ? { ...cycle, pass: e.target.checked } : cycle))}
                          />
                          <span className={c.pass ? 'text-emerald-400 font-bold' : 'text-rose-300 font-bold'}>{c.pass ? 'PASS' : 'HOLD'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Total Sterilized Today</div>
                <div className="text-lg font-bold text-white mt-1">{totalSterilizedToday} Jars</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Culled (Broken/Contam)</div>
                <input
                  type="number"
                  value={culledJars}
                  onChange={(e) => setCulledJars(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Wet / Dry Harvest (g)</div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={wetHarvestG}
                    onChange={(e) => setWetHarvestG(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white"
                  />
                  <input
                    type="number"
                    value={dryYieldG}
                    onChange={(e) => setDryYieldG(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white"
                  />
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/40">
                <div className="text-slate-400">Dry Yield / Jar &amp; BE%</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {dryYieldPerJar} g/jar ({biologicalEfficiencyPct}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: 58MM THERMAL QR STICKER SHEET & CONTAMINATION AUDIT */}
        {activeTab === 'QR_ENV' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 no-print">
                <div>
                  <h2 className="text-base font-bold text-white">
                    58mm Thermal Printer Jar QR Sticker Sheet (SOP-CML-ENV-03)
                  </h2>
                  <p className="text-xs text-slate-400">
                    QR contains only a local opaque identifier; readable label details stay outside the code.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label htmlFor="qr-start" className="text-slate-400">Start jar:</label>
                  <input
                    id="qr-start"
                    type="number"
                    min={1}
                    max={999}
                    value={qrStartJar}
                    onChange={(e) => setQrStartJar(Math.min(999, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-16 px-2.5 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                  />
                  <label htmlFor="qr-count" className="text-slate-400">Labels:</label>
                  <input
                    id="qr-count"
                    type="number"
                    min={1}
                    max={48}
                    value={qrCount}
                    onChange={(e) => setQrCount(Math.min(48, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-20 px-2.5 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white"
                  />
                </div>
              </div>

              <div className="no-print grid gap-3 sm:grid-cols-2">
                <label className="field">
                  Transfer date
                  <input type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} />
                </label>
                <label className="field">
                  Operator initials
                  <input maxLength={8} value={operatorInitials} onChange={(event) => setOperatorInitials(event.target.value)} placeholder="Not recorded" />
                </label>
              </div>
              <p className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                Seeded demonstration labels: verify the batch/jar ID, strain, source and dates before printing or applying.
              </p>

              <div className="sticker-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: qrCount }).map((_, idx) => {
                  const jarNum = String(idx + qrStartJar).padStart(3, '0');
                  const token = `${inocBatchId}-J${jarNum}`;
                  return (
                    <div
                      key={token}
                      className="sticker-card p-3 rounded-lg bg-white text-slate-950 border border-slate-300 flex items-center gap-2.5"
                    >
                      {qrOpaqueIds[token]
                        ? <DeterministicQrSvg value={qrOpaqueIds[token]} size={64} />
                        : <div className="grid h-16 w-16 shrink-0 place-items-center border border-slate-300 text-center text-[8px] text-slate-500">Preparing<br />opaque ID</div>}
                      <div className="sticker-copy font-mono text-[10px] leading-tight">
                        <div className="sticker-token font-bold text-xs" aria-label={`Jar ID ${token}`}>{token}</div>
                        <div>Strain: Agripie F43</div>
                        <div className="sticker-source">LC: {lcBatchId}</div>
                        <div>Inoc: {inocDate}</div>
                        <div>Transfer: {transferDate || 'not recorded'}</div>
                        <div>Operator: {operatorInitials.trim() || 'not recorded'}</div>
                        <div className="font-bold mt-0.5">400mL (20g/30mL/10mL)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-5">
              <form onSubmit={lookupQrToken} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <p className="eyebrow">Traceability</p>
                  <h2 className="text-base font-bold text-white mt-1">QR / batch lookup</h2>
                  <p className="text-xs text-slate-400 mt-1">Searches the existing server QR endpoint first, then this browser's saved register.</p>
                </div>
                <label htmlFor="qr-search" className="sr-only">Batch or jar token</label>
                <div className="flex gap-2">
                  <input
                    id="qr-search"
                    value={qrSearch}
                    onChange={(e) => setQrSearch(e.target.value)}
                    placeholder={`${inocBatchId}-J001`}
                    className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-sm text-white"
                  />
                  <button type="submit" className="primary-action">
                    <Search className="w-4 h-4" /> Look up
                  </button>
                </div>
                {qrLookupResult ? (
                  <div role="status" className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200">{qrLookupResult}</div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">No token searched yet.</div>
                )}
              </form>

              <form onSubmit={addContaminationEvent} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <p className="eyebrow">Quality event</p>
                  <h2 className="text-base font-bold text-white mt-1">Contamination / cull audit</h2>
                  <p className="text-xs text-slate-400 mt-1">Local register only; saved in this browser and reflected in the active jar count.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="contam-jar" className="text-slate-400 block mb-1">Jar number</label>
                    <input id="contam-jar" type="number" min={1} max={Math.max(1, totalSterilizedToday)} value={newContamination.jarNumber} onChange={(e) => setNewContamination((value) => ({ ...value, jarNumber: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white" />
                  </div>
                  <div>
                    <label htmlFor="contam-stage" className="text-slate-400 block mb-1">Cultivation stage</label>
                    <select id="contam-stage" value={newContamination.stage} onChange={(e) => setNewContamination((value) => ({ ...value, stage: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white">
                      <option>Stage I · Dark run</option>
                      <option>Stage II · Pigmentation</option>
                      <option>Stage III · Pinning</option>
                      <option>Stage IV · Stroma growth</option>
                      <option>Stage V · Maturation</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contam-reason" className="text-slate-400 block mb-1">Finding</label>
                    <input id="contam-reason" value={newContamination.reason} onChange={(e) => setNewContamination((value) => ({ ...value, reason: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white" />
                  </div>
                  <div>
                    <label htmlFor="contam-cause" className="text-slate-400 block mb-1">Root cause / notes</label>
                    <input id="contam-cause" value={newContamination.rootCause} onChange={(e) => setNewContamination((value) => ({ ...value, rootCause: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white" />
                  </div>
                  <div>
                    <label htmlFor="contam-count" className="text-slate-400 block mb-1">Jars culled</label>
                    <input id="contam-count" type="number" min={1} value={newContamination.jarsCulled} onChange={(e) => setNewContamination((value) => ({ ...value, jarsCulled: Number(e.target.value) || 1 }))} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-white" />
                  </div>
                </div>
                <button type="submit" disabled={totalSterilizedToday < 1} className="primary-action">
                  <ClipboardCheck className="w-4 h-4" /> Log event &amp; update cull count
                </button>
              </form>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="eyebrow">Audit trail</p>
                  <h2 className="text-base font-bold text-white mt-1">Recorded quality events</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">{contaminationEvents.length} entries</span>
              </div>
              {contaminationEvents.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-2">Logged</th><th className="p-2">Jar token</th><th className="p-2">Stage</th><th className="p-2">Finding / cause</th><th className="p-2">Culled</th></tr></thead>
                    <tbody>{contaminationEvents.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-800">
                        <td className="p-2 whitespace-nowrap text-slate-400">{entry.timestamp}</td>
                        <td className="p-2 font-mono text-amber-300">{entry.token}</td>
                        <td className="p-2">{entry.stage}</td>
                        <td className="p-2">{entry.reason}<span className="block text-slate-400 mt-0.5">{entry.rootCause}</span></td>
                        <td className="p-2">{entry.jarsCulled}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-register">
                  <ScanLine className="w-5 h-5 text-slate-500" />
                  <p>No contamination events recorded.</p>
                  <span>New events appear here and are included in the full packet.</span>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
