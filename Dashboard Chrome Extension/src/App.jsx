import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Target, Activity, FileText, ChevronDown, Link as LinkIcon, RefreshCw, AlertCircle, Search, Zap } from 'lucide-react';

export default function App() {
  const [week, setWeek] = useState('week3');
  const [csvUrl, setCsvUrl] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- SIMULATION DATA ---
  const simulationData = {
    week3: {
      companyName: "Acme Corp",
      startDate: "2024-11-01",
      wwhtbt: "Customers will pay a 20% premium for 24-hour delivery window.",
      limits: "Win Rate: 15% - 25%",
      variance: "Common Cause",
      statusText: "STATUS: NOMINAL - LOGIC VALIDATED",
      statusColors: "bg-emerald-50 text-emerald-800 border-emerald-200",
      statusIcon: <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />,
      winRate: 18,
      winRateHistory: [15, 17, 19, 18], 
      focus: 85,
      contradictions: 1,
      mandate: [
        "Logic Holding: Prospective data supports the 24-hour delivery premium assumption.",
        "Maintain focus: Team is successfully avoiding 'Special Cause' operational noise.",
        "Capability Check: Continue MHC training for the dispatch team."
      ],
      mandateColors: "bg-slate-50 border-l-4 border-emerald-500",
    },
    week6: {
      companyName: "Acme Corp",
      startDate: "2024-11-01",
      wwhtbt: "Customers will pay a 20% premium for 24-hour delivery window.",
      limits: "Win Rate: 15% - 25%",
      variance: "Special Cause",
      statusText: "ALERT: LOGIC BREACH - SPECIAL CAUSE DETECTED",
      statusColors: "bg-rose-50 text-rose-800 border-rose-300",
      statusIcon: <AlertTriangle className="w-5 h-5 text-rose-600 mr-2" />,
      winRate: 8,
      winRateHistory: [16, 14, 11, 8],
      focus: 55,
      contradictions: 5,
      mandate: [
        "Halt Logic: The 20% premium assumption has failed the Skeptic's Contract.",
        "Address Variance: Special Cause detected in sales focus; investigate drift.",
        "Pivot Discussion: Re-evaluate the Barrier to Choice with the leadership team."
      ],
      mandateColors: "bg-rose-50 border-l-4 border-rose-500",
    }
  };

  const handleLoadCsv = async () => {
    if (!csvUrl) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const csvText = await response.text();
      // Split by newline, keeping empty rows temporarily to maintain line indexes
      const allLines = csvText.split(/\r?\n/);
      
      if (allLines.length < 4) throw new Error("The CSV file does not match the Elite Tracking format.");

      // 1. Extract Global Variables (Row 1 / Index 0 in CSV)
      // We look at the second column (Index 1) for the Company Name
      const row1Values = allLines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      let compName = "Unknown Client";
      if (row1Values.length > 1 && row1Values[1]) {
        compName = row1Values[1].replace(/^"|"$/g, '').trim();
        if (compName === "[ Type Company Name Here ]" || compName === "") {
          compName = "Unnamed Client";
        }
      }

      // 2. Extract Headers (Row 3 / Index 2 in CSV)
      const headers = allLines[2].split(',').map(h => h.replace(/^"|"$/g, '').trim());

      // 3. Extract Data Rows (Row 4 and beyond)
      // Filter out any completely empty rows (where all commas are empty)
      const dataLines = allLines.slice(3).filter(line => line.replace(/,/g, '').trim() !== '');
      
      if (dataLines.length === 0) throw new Error("No data rows found in the sheet.");

      const rows = dataLines.map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        return headers.reduce((obj, header, i) => ({ ...obj, [header]: values[i] }), {});
      });

      const latest = rows[rows.length - 1];
      
      // Calculate history based on ProposalsWon / ProposalsSent
      const history = rows.slice(-4).map(r => {
        const s = Number(r.ProposalsSent) || 0;
        const w = Number(r.ProposalsWon) || 0;
        return s > 0 ? Math.round((w / s) * 100) : 0;
      });

      // Pad history to ensure chart renders 4 points
      while (history.length < 4) history.unshift(history[0] || 0);

      // Start Date is now the Meeting_Date or Week of the very first recorded data row
      const sDate = rows[0].Meeting_Date || rows[0].Week || "TBD";

      const wr = (Number(latest.ProposalsSent) > 0) ? Math.round((Number(latest.ProposalsWon) / Number(latest.ProposalsSent)) * 100) : 0;
      const f = Number(latest.Focus) || 0;
      const c = Number(latest.Contradictions_Found) || 0;
      const v = latest.Variance_Type || "Common Cause";

      // Roger Martin Tripwire Rules
      const isRed = wr < 10 || f < 60 || c >= 5 || v === "Special Cause";
      const isYellow = !isRed && (wr < 15 || f < 75 || c >= 3);

      let mandateList = [];
      if (isRed) {
        mandateList = [
          "Stop and Fix: Logic is currently broken or unvalidated.",
          "Review Variance: Investigate the root cause of the structural breach.",
          "Do not deploy further capital into this specific assumption."
        ];
      } else if (isYellow) {
        mandateList = [
          "Warning: Metric degradation detected. Monitor closely.",
          "Protect Focus: Shield the team from operational distractions.",
          "Prepare to revisit core logic if trend continues."
        ];
      } else {
        mandateList = [
          "Logic Holding: Prospective data supports the core assumption.",
          "Maintain Focus: Continue execution without tampering.",
          "Keep operations strictly aligned with the tested WWHTBT."
        ];
      }

      setLiveData({
        companyName: compName,
        startDate: sDate,
        wwhtbt: latest.Core_WWHTBT_Tested || "No active assumption logged.",
        limits: latest.Target_Control_Limits || "No control limits set.",
        variance: v,
        winRate: wr,
        winRateHistory: history,
        focus: f,
        contradictions: c,
        statusText: isRed ? "ALERT: LOGIC BREACH - SPECIAL CAUSE DETECTED" : (isYellow ? "WARNING: DEGRADATION DETECTED" : "STATUS: NOMINAL - LOGIC VALIDATED"),
        statusColors: isRed ? "bg-rose-50 text-rose-800 border-rose-300" : (isYellow ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-800 border-emerald-200"),
        statusIcon: isRed ? <AlertTriangle className="w-5 h-5 text-rose-600 mr-2" /> : (isYellow ? <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" /> : <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />),
        mandate: mandateList,
        mandateColors: isRed ? "bg-rose-50 border-l-4 border-rose-500" : (isYellow ? "bg-amber-50 border-l-4 border-amber-500" : "bg-slate-50 border-l-4 border-emerald-500"),
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(`Sync failed: ${err.message}. Ensure CSV is published and layout matches the Elite format.`);
      setLoading(false);
    }
  };

  const current = liveData || simulationData[week];
  
  // Helpers for charting
  const mapY = (val) => 100 - (val * 4); // Maps 0-25% to 100-0 height
  const points = current.winRateHistory.map((val, i) => `${i * 66.6},${mapY(val)}`).join(' ');
  const offset = ((100 - current.focus) / 100) * 45;
  const dotX = 50 + offset * Math.cos(Math.PI / 4);
  const dotY = 50 - offset * Math.sin(Math.PI / 4); 

  // Format Date Safely
  let formattedDate = current.startDate;
  if (formattedDate !== "TBD" && !isNaN(Date.parse(formattedDate))) {
      formattedDate = new Date(formattedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* SYNC PANEL */}
        <div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center shadow-lg">
          <div className="flex-1 w-full flex items-center bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-sky-500">
            <LinkIcon className="text-sky-400 w-4 h-4 mr-2" />
            <input 
              className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-500"
              placeholder="Paste published CSV link here..." 
              value={csvUrl} onChange={e => setCsvUrl(e.target.value)} 
            />
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <button 
              onClick={handleLoadCsv} 
              disabled={loading || !csvUrl}
              className="flex-1 md:flex-none bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-bold flex items-center justify-center transition-colors shadow-sm"
            >
              {loading ? <RefreshCw className="animate-spin w-4 h-4 mr-2"/> : "Sync Validity Engine"}
            </button>
            {liveData && (
              <button 
                onClick={() => setLiveData(null)} 
                className="text-sm font-medium text-slate-400 hover:text-white underline px-2 whitespace-nowrap"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-100 text-rose-800 rounded-lg flex items-center border border-rose-200">
            <AlertCircle className="mr-2 w-5 h-5 shrink-0"/>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{current.companyName} Strategy Monitor</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              90-Day Validation Engine &nbsp;•&nbsp; Commenced: <span className="text-slate-700">{formattedDate}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 relative">
            <select 
              className={`appearance-none border py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer font-medium shadow-sm transition-colors ${liveData ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
              value={liveData ? 'live' : week} 
              onChange={e => {
                if (e.target.value !== 'live') {
                  setLiveData(null);
                  setWeek(e.target.value);
                }
              }}
            >
              {liveData && <option value="live">🟢 Live External Data Linked</option>}
              <option value="week3">Simulation: Week 3 (Common Cause)</option>
              <option value="week6">Simulation: Week 6 (Special Cause)</option>
            </select>
            <ChevronDown className={`absolute right-3 top-2.5 w-4 h-4 pointer-events-none ${liveData ? 'text-sky-600' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* STRATEGIC ANCHORS (THE MARTIN LAYER) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-2 bg-sky-50 rounded-lg shrink-0"><Search className="text-sky-600 w-5 h-5"/></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Logic (WWHTBT)</p>
              <p className="text-sm font-medium mt-1 leading-snug">{current.wwhtbt}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-2 bg-amber-50 rounded-lg shrink-0"><FileText className="text-amber-600 w-5 h-5"/></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skeptic's Contract</p>
              <p className="text-sm font-medium mt-1">{current.limits}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className={`p-2 rounded-lg shrink-0 ${current.variance === 'Special Cause' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
              <Zap className={`w-5 h-5 ${current.variance === 'Special Cause' ? 'text-rose-600' : 'text-emerald-600'}`}/>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variance Type</p>
              <p className={`text-sm font-bold mt-1 ${current.variance === 'Special Cause' ? 'text-rose-600' : 'text-emerald-600'}`}>{current.variance}</p>
            </div>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className={`p-4 rounded-lg border font-bold text-sm flex items-center shadow-sm transition-colors duration-500 ${current.statusColors}`}>
          {current.statusIcon}
          {current.statusText}
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <Activity className="w-5 h-5 text-slate-400 mr-2"/> 
                  Tolerance Band (Win Rate)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Pre-agreed Limits: 4-Week Trajectory</p>
              </div>
              <span className={`text-4xl font-light transition-colors duration-500 ${current.winRate < 10 || current.variance === 'Special Cause' ? 'text-rose-600' : (current.winRate < 15 ? 'text-amber-500' : 'text-slate-800')}`}>
                {current.winRate}%
              </span>
            </div>
            <div className="flex-1 relative w-full h-48 bg-slate-50 border border-slate-100 rounded-md overflow-hidden">
               <svg viewBox="0 0 200 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                {/* Background Zones */}
                <rect x="0" y="0" width="200" height="40" fill="#f0fdf4" opacity="0.6" />
                <rect x="0" y="40" width="200" height="20" fill="#fefce8" opacity="0.6" />
                <rect x="0" y="60" width="200" height="40" fill="#fff1f2" opacity="0.6" />
                
                {/* Y-Axis Grid Lines */}
                <line x1="0" y1="40" x2="200" y2="40" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="60" x2="200" y2="60" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />

                <polyline 
                  points={points} 
                  fill="none" 
                  stroke={current.winRate < 10 || current.variance === 'Special Cause' ? "#e11d48" : (current.winRate < 15 ? "#f59e0b" : "#059669")} 
                  strokeWidth="3" 
                  className="transition-all duration-700 ease-in-out"
                />
                
                {current.winRateHistory.map((val, i) => (
                  <circle 
                    key={i} 
                    cx={i * 66.6} 
                    cy={mapY(val)} 
                    r="4" 
                    fill="white" 
                    stroke={current.winRate < 10 || current.variance === 'Special Cause' ? "#e11d48" : (current.winRate < 15 ? "#f59e0b" : "#059669")} 
                    strokeWidth="2"
                    className="transition-all duration-700 ease-in-out"
                  />
                ))}
              </svg>
              <div className="absolute top-2 left-2 text-[10px] font-medium text-emerald-700">Healthy (&gt;15%)</div>
              <div className="absolute top-[42%] left-2 text-[10px] font-medium text-amber-600">Warning (10-15%)</div>
              <div className="absolute bottom-2 left-2 text-[10px] font-medium text-rose-700">Tripwire (&lt;10%)</div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative">
               <div className="w-full flex justify-between items-start absolute top-6 left-6 right-6">
                 <div>
                   <h3 className="text-sm font-semibold text-slate-800">Strategic Drift</h3>
                   <p className="text-xs text-slate-400">Target: Center (100%)</p>
                 </div>
                 <Target className="w-5 h-5 text-slate-300"/>
               </div>
               <div className="w-32 h-32 mt-8 relative">
                 <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  <circle cx="50" cy="50" r="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="50" y1="5" x2="50" y2="95" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="#e2e8f0" strokeWidth="1" />
                  <circle 
                    cx={dotX} cy={dotY} r="5" 
                    fill={current.focus < 60 ? "#e11d48" : (current.focus < 75 ? "#f59e0b" : "#059669")} 
                    className="transition-all duration-1000 ease-out"
                  >
                    <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                  </circle>
                 </svg>
               </div>
               <div className="mt-4 text-center">
                 <p className={`text-2xl font-light ${current.focus < 60 ? 'text-rose-600' : (current.focus < 75 ? 'text-amber-500' : 'text-slate-800')}`}>{current.focus}%</p>
                 <span className="text-xs text-slate-500 block uppercase tracking-wider">Focus Alignment</span>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
               <h3 className="text-sm font-semibold text-slate-800 mb-1">Market Friction</h3>
               <p className="text-xs text-slate-400 mb-4">Assumption Contradictions</p>
               
               <div className="flex justify-between items-end mb-2">
                 <p className={`text-3xl font-light ${current.contradictions >= 5 ? 'text-rose-600' : (current.contradictions >= 3 ? 'text-amber-500' : 'text-slate-800')}`}>
                   {current.contradictions}
                 </p>
                 <span className="text-xs text-slate-400 font-medium">Max Limit: 5</span>
               </div>
               <div className="flex gap-1 h-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`flex-1 rounded-sm transition-colors duration-500 ${current.contradictions >= i ? (current.contradictions >= 5 ? 'bg-rose-500' : (current.contradictions >= 3 ? 'bg-amber-400' : 'bg-emerald-500')) : 'bg-slate-100'}`} />
                ))}
               </div>
            </div>
          </div>
        </div>

        {/* MANDATE */}
        <div className={`mt-6 p-6 rounded-xl shadow-sm transition-colors duration-500 ${current.mandateColors}`}>
          <div className="flex items-start">
            <FileText className={`w-6 h-6 mr-3 mt-1 ${current.variance === 'Special Cause' || current.winRate < 10 || current.focus < 60 || current.contradictions >= 5 ? 'text-rose-600' : 'text-emerald-600'}`} />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Executive Decision Memo</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm font-medium text-slate-800">
                {current.mandate.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
