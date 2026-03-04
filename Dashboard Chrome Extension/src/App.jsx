import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Target, Activity, FileText, ChevronDown, 
  Link as LinkIcon, RefreshCw, AlertCircle, Search, Zap, TrendingUp, TrendingDown
} from 'lucide-react';

export default function App() {
  const [week, setWeek] = useState('week3');
  const [csvUrl, setCsvUrl] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const simulationData = {
    week3: {
      companyName: "Strategic Guardian Corp",
      startDate: "2024-11-01",
      wwhtbt: "Customers will pay a 20% premium for 24-hour delivery window.",
      limits: "Win Rate: 15% - 25%",
      variance: "Common Cause",
      statusText: "STRATEGY VALIDATED",
      statusColors: "bg-emerald-50 text-emerald-700 border-emerald-200",
      statusIcon: <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />,
      winRate: 18, winRateHistory: [16, 19, 17, 18], focus: 92, contradictions: 1,
      mandate: ["Logic Holding: Prospective data supports the premium assumption.", "Maintain focus: Team is successfully avoiding 'Special Cause' noise."],
      mandateColors: "bg-emerald-50 border-emerald-500 text-emerald-900",
    },
    week6: {
      companyName: "Strategic Guardian Corp",
      startDate: "2024-11-01",
      wwhtbt: "Customers will pay a 20% premium for 24-hour delivery window.",
      limits: "Win Rate: 15% - 25%",
      variance: "Special Cause",
      statusText: "CRITICAL LOGIC BREACH",
      statusColors: "bg-rose-50 text-rose-700 border-rose-200",
      statusIcon: <AlertTriangle className="w-5 h-5 text-rose-500 mr-2" />,
      winRate: 8, winRateHistory: [18, 14, 11, 8], focus: 55, contradictions: 5,
      mandate: ["Halt Logic: The 20% premium assumption has failed the Skeptic's Contract.", "Pivot Required: Re-evaluate the 'Barrier to Choice' immediately."],
      mandateColors: "bg-rose-50 border-rose-500 text-rose-900",
    }
  };

  const handleLoadCsv = async () => {
    if (!csvUrl) return;
    setLoading(true); setError(null);

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Network response failed. Ensure CSV is 'Published to Web'.");
      const csvText = await response.text();
      
      const parseCSV = (str) => {
        const arr = [];
        let quote = false;
        let row = 0, col = 0;
        for (let c = 0; c < str.length; c++) {
          let cc = str[c], nc = str[c+1];
          arr[row] = arr[row] || [];
          arr[row][col] = arr[row][col] || '';
          if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
          if (cc === '"') { quote = !quote; continue; }
          if (cc === ',' && !quote) { ++col; continue; }
          if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
          if (cc === '\n' && !quote) { ++row; col = 0; continue; }
          if (cc === '\r' && !quote) { ++row; col = 0; continue; }
          arr[row][col] += cc;
        }
        return arr;
      };

      const allRows = parseCSV(csvText);
      if (allRows.length < 4) throw new Error("CSV structure is invalid. Please rebuild Tracker Sheet.");

      let compName = "Unnamed Strategy";
      if (allRows[0] && allRows[0].length > 1 && allRows[0][1]) {
        compName = allRows[0][1].trim();
        if (compName.includes("[ Type")) compName = "Strategy Monitor";
      }

      let headerIndex = allRows.findIndex(row => row.includes('Core_WWHTBT_Tested'));
      if (headerIndex === -1) headerIndex = 2;
      
      const headers = allRows[headerIndex].map(h => h.trim());
      const dataRows = allRows.slice(headerIndex + 1).filter(row => row.join('').trim() !== '');
      if (dataRows.length === 0) throw new Error("No data rows found below headers.");

      const rows = dataRows.map(row => {
        let parsedRow = row;
        
        // --- JAM DETECTOR & AUTO-RECOVERY ---
        // Detects if the user pasted all comma-separated text into a single Google Sheets cell
        const isJammed = row.length > 1 ? row.slice(1).every(c => !c || c.trim() === '') : true;
        if (isJammed && typeof row[0] === 'string' && row[0].includes(',')) {
          const recovery = parseCSV(row[0]);
          if (recovery && recovery[0]) parsedRow = recovery[0];
        }

        return headers.reduce((obj, header, i) => ({ ...obj, [header]: parsedRow[i] ? parsedRow[i].trim() : '' }), {});
      });

      const latest = rows[rows.length - 1];
      
      const parseNum = (val) => Number(String(val || '').replace(/[^0-9.-]+/g, '')) || 0;

      const history = rows.slice(-4).map(r => {
        const s = parseNum(r.ProposalsSent);
        const w = parseNum(r.ProposalsWon);
        return s > 0 ? Math.round((w / s) * 100) : 0;
      });
      while (history.length < 4) history.unshift(history[0] || 0);

      const wr = (parseNum(latest.ProposalsSent) > 0) ? Math.round((parseNum(latest.ProposalsWon) / parseNum(latest.ProposalsSent)) * 100) : 0;
      const f = parseNum(latest.Focus);
      const c = parseNum(latest.Contradictions_Found);
      const v = latest.Variance_Type || "Common Cause";

      const isRed = (wr > 0 && wr < 10) || (f > 0 && f < 60) || c >= 5 || v === "Special Cause";
      const isYellow = !isRed && ((wr > 0 && wr < 15) || (f > 0 && f < 75) || c >= 3);

      setLiveData({
        companyName: compName,
        startDate: rows[0].Meeting_Date || "N/A",
        wwhtbt: latest.Core_WWHTBT_Tested || "No active assumption.",
        limits: latest.Target_Control_Limits || "No limits set.",
        variance: v, winRate: wr, winRateHistory: history, focus: f, contradictions: c,
        statusText: isRed ? "CRITICAL LOGIC BREACH" : (isYellow ? "STRATEGIC DRIFT WARNING" : "STRATEGY VALIDATED"),
        statusColors: isRed ? "bg-rose-50 text-rose-700 border-rose-200" : (isYellow ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"),
        statusIcon: isRed ? <AlertTriangle className="w-5 h-5 text-rose-500 mr-2" /> : (isYellow ? <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" /> : <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />),
        mandate: isRed ? ["Stop and Fix: Logic is currently broken.", "Review Variance breach.", "Halt capital deployment."] : ["Monitor closely.", "Maintain focus.", "Keep logic valid."],
        mandateColors: isRed ? "bg-rose-50 border-rose-500 text-rose-900" : "bg-emerald-50 border-emerald-500 text-emerald-900",
      });
      setLoading(false);
    } catch (err) {
      setError(`Sync failed: ${err.message}`); setLoading(false);
    }
  };

  const current = liveData || simulationData[week];

  const maxScale = Math.max(...current.winRateHistory, 30);
  const mapY = (val) => 100 - ((val / maxScale) * 100);
  const polyPoints = current.winRateHistory.map((val, i) => `${i * 33.33},${mapY(val)}`).join(' ');
  const areaPoints = `0,100 ${polyPoints} 100,100`;
  const isRedState = (current.winRate > 0 && current.winRate < 10) || current.variance === 'Special Cause';
  const isYellowState = !isRedState && (current.winRate > 0 && current.winRate < 15);
  const trendColor = isRedState ? "#f43f5e" : (isYellowState ? "#f59e0b" : "#10b981");
  const radius = 40; const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (current.focus / 100) * circumference;
  const focusColor = (current.focus > 0 && current.focus < 60) ? "text-rose-500" : ((current.focus > 0 && current.focus < 75) ? "text-amber-500" : "text-emerald-500");

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* SYNC PANEL */}
        <div className="bg-white p-2 rounded-2xl flex flex-col md:flex-row gap-2 items-center shadow-sm border border-slate-200">
          <div className="flex-1 w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            <LinkIcon className="text-slate-400 w-4 h-4 mr-3" />
            <input 
              className="flex-1 bg-transparent text-slate-700 text-sm focus:outline-none placeholder-slate-400"
              placeholder="Paste Published CSV Link from Google Sheets..." 
              value={csvUrl} onChange={e => setCsvUrl(e.target.value)} 
            />
          </div>
          <button onClick={handleLoadCsv} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors">
            {loading ? <RefreshCw className="animate-spin w-4 h-4 mr-2"/> : "Sync Validity Engine"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center border border-rose-200">
            <AlertCircle className="mr-3 w-5 h-5 shrink-0"/><span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{current.companyName}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">90-Day Strategy Monitor &nbsp;•&nbsp; Commenced: {current.startDate}</p>
          </div>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 py-2 pl-4 pr-10 rounded-lg text-sm font-semibold text-slate-700 shadow-sm cursor-pointer hover:border-slate-300 transition-colors" value={liveData ? 'live' : week} onChange={e => e.target.value !== 'live' && (setLiveData(null), setWeek(e.target.value))}>
              {liveData && <option value="live">🟢 Live External Data</option>}
              <option value="week3">Simulation: Baseline Logic</option>
              <option value="week6">Simulation: Logic Breach</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* TOP LEVEL LOGIC ANCHORS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center"><Search className="w-3.5 h-3.5 mr-1.5 text-slate-400"/> Core WWHTBT</span>
            <p className="text-sm font-semibold text-slate-700 leading-snug flex-1">{current.wwhtbt}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center"><FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400"/> Skeptic's Contract</span>
            <p className="text-sm font-semibold text-slate-700 flex-1">{current.limits}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center"><Zap className="w-3.5 h-3.5 mr-1.5 text-slate-400"/> SPC Variance Check</span>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${current.variance === 'Special Cause' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {current.variance === 'Special Cause' ? <TrendingDown className="w-3 h-3 mr-1"/> : <TrendingUp className="w-3 h-3 mr-1"/>}{current.variance}
              </span>
            </div>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className={`p-4 rounded-xl border font-bold text-sm flex items-center shadow-sm ${current.statusColors}`}>
          {current.statusIcon}{current.statusText}
        </div>

        {/* PREMIUM KPI VISUALIZATIONS (50/50 STRICT SPLIT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Win Rate Trajectory</h3>
                <p className="text-sm text-slate-500 font-medium">Rolling 4-Week Tracking</p>
              </div>
              <div className="text-right"><span className={`text-4xl font-bold tracking-tight ${isRedState ? 'text-rose-600' : (isYellowState ? 'text-amber-500' : 'text-slate-900')}`}>{current.winRate}%</span></div>
            </div>
            <div className="flex-1 w-full relative mt-8 min-h-[250px]">
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none">
                <defs><linearGradient id="gradientArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={trendColor} stopOpacity="0.25" /><stop offset="100%" stopColor={trendColor} stopOpacity="0.0" /></linearGradient></defs>
                {[25, 50, 75].map(y => (<line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />))}
                <polygon points={areaPoints} fill="url(#gradientArea)" className="transition-all duration-700 ease-in-out" />
                <polyline points={polyPoints} fill="none" stroke={trendColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-in-out" />
                {current.winRateHistory.map((val, i) => (<circle key={i} cx={i * 33.33} cy={mapY(val)} r="2.5" fill="white" stroke={trendColor} strokeWidth="2" className="transition-all duration-700 ease-in-out"/>))}
              </svg>
              <div className="absolute -top-4 right-0 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shadow-sm z-10">Target Zone (&gt;15%)</div>
              <div className="absolute -bottom-4 right-0 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shadow-sm z-10">Breach Zone (&lt;10%)</div>
            </div>
          </div>

          <div className="flex flex-col gap-6 h-full">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col items-center justify-center min-h-[180px]">
              <div className="w-full flex justify-between items-start mb-2"><h3 className="text-sm font-bold text-slate-900">Strategic Focus</h3><Target className="w-4 h-4 text-slate-400"/></div>
              <div className="relative w-28 h-28 flex-shrink-0 mt-2">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`${focusColor} transition-all duration-1000 ease-out`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                  <span className={`text-3xl font-bold tracking-tighter leading-none ${focusColor}`}>{current.focus}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Alignment</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start mb-4"><h3 className="text-sm font-bold text-slate-900">Market Anomalies</h3><span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">Limit: 5</span></div>
              <div className="flex gap-1.5 h-8 mb-4 w-full">
                {[1, 2, 3, 4, 5].map((level) => {
                  let bgColor = "bg-slate-100"; 
                  if (current.contradictions >= level) {
                    if (current.contradictions >= 5) bgColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
                    else if (current.contradictions >= 3) bgColor = "bg-amber-400";
                    else bgColor = "bg-emerald-400";
                  }
                  return (<div key={level} className={`flex-1 rounded-sm border border-black/5 transition-all duration-500 ${bgColor}`} />);
                })}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <span className={`text-4xl font-bold tracking-tight leading-none ${current.contradictions >= 5 ? 'text-rose-600' : 'text-slate-900'}`}>{current.contradictions}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">Contradictions<br/>Found</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border-l-4 shadow-sm transition-colors ${current.mandateColors}`}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center opacity-80"><Activity className="w-4 h-4 mr-2"/> Recommended Action</h3>
          <ul className="space-y-3">
            {current.mandate.map((m, i) => (
              <li key={i} className="flex items-start text-sm font-medium"><span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 mt-1.5 mr-3 shrink-0" /><span className="opacity-90">{m}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
