import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Target, Activity, FileText, ChevronDown, Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [week, setWeek] = useState('week3');
  const [csvUrl, setCsvUrl] = useState('');
  
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- HARDCODED SIMULATION DATA ---
  const simulationData = {
    week3: {
      companyName: "Acme Corporation",
      startDate: "2024-11-01",
      title: "Week 3: Nominal",
      statusText: "STATUS: NOMINAL - EXECUTION ON TRACK",
      statusColors: "bg-emerald-50 text-emerald-800 border-emerald-200",
      statusIcon: <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />,
      winRate: 18,
      winRateHistory: [15, 17, 19, 18], 
      focus: 85,
      contradictions: 1,
      mandate: [
        "Maintain current velocity: Operational focus is perfectly aligned with Day 0 strategy.",
        "Protect team focus: Shield the execution team from daily operational distractions.",
        "Capital expenditure remains strictly locked until Day 91 validation is complete."
      ],
      mandateColors: "bg-slate-50 border-l-4 border-emerald-500",
    },
    week6: {
      companyName: "Acme Corporation",
      startDate: "2024-11-01",
      title: "Week 6: Tripwire Alert",
      statusText: "ALERT: TRIPWIRE BREACHED - ACTION REQUIRED",
      statusColors: "bg-rose-50 text-rose-800 border-rose-300",
      statusIcon: <AlertTriangle className="w-5 h-5 text-rose-600 mr-2" />,
      winRate: 8,
      winRateHistory: [16, 14, 11, 8],
      focus: 55,
      contradictions: 5,
      mandate: [
        "Halt execution immediately: Do not release Phase 2 capital or approve new hires.",
        "Schedule 45-minute logic review: Significant market friction has been detected.",
        "Re-evaluate pricing assumptions: Address major pushback across 4 separate lead accounts."
      ],
      mandateColors: "bg-rose-50 border-l-4 border-rose-500",
    }
  };

  // --- NATIVE CSV PARSING & LOGIC ENGINE ---
  const handleLoadCsv = async () => {
    if (!csvUrl) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const csvText = await response.text();
      
      const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) throw new Error("The CSV file is empty or missing data.");
      
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      const rows = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
          
      const recentRows = rows.slice(-4);
      const latestRow = recentRows[recentRows.length - 1];
      
      const history = recentRows.map(row => {
        const sent = Number(row.ProposalsSent) || 0;
        const won = Number(row.ProposalsWon) || 0;
        return sent > 0 ? Math.round((won / sent) * 100) : 0;
      });

      while (history.length < 4) history.unshift(history[0] || 0);

      // Extract metadata from the sheet (fallback to first row if latest is empty)
      const compName = latestRow.CompanyName || rows[0].CompanyName || '';
      const sDate = latestRow.StartDate || rows[0].StartDate || '';

      const sent = Number(latestRow.ProposalsSent) || 0;
      const won = Number(latestRow.ProposalsWon) || 0;
      const currentWinRate = sent > 0 ? Math.round((won / sent) * 100) : 0;
      const currentFocus = Number(latestRow.Focus) || 0;
      const currentContradictions = Number(latestRow.Contradictions) || 0;

      let isRed = false;
      let isYellow = false;
      const mandates = [];

      if (currentWinRate < 10) { 
        isRed = true; 
        mandates.push(`Halt execution: Win Rate tripwire breached (${currentWinRate}%). Review sales logic.`); 
      } else if (currentWinRate < 15) { 
        isYellow = true; 
        mandates.push("Caution: Win rate is dropping into the yellow zone. Monitor closely."); 
      }

      if (currentFocus < 60) { 
        isRed = true; 
        mandates.push(`Realign team immediately: Strategic focus has dropped to ${currentFocus}%.`); 
      } else if (currentFocus < 75) { 
        isYellow = true; 
        mandates.push("Protect team focus: Operational noise is creeping in and distracting the team."); 
      }

      if (currentContradictions >= 5) { 
        isRed = true; 
        mandates.push("Schedule Logic Review: Severe market friction detected. Assumptions may be breaking."); 
      } else if (currentContradictions >= 3) { 
        isYellow = true; 
        mandates.push("Monitor market feedback closely: Contradictions are rising."); 
      }

      if (!isRed && !isYellow) {
        mandates.push("Maintain current velocity: Operational focus is perfectly aligned with Day 0 strategy.");
        mandates.push("Protect team focus: Shield the execution team from daily operational distractions.");
        mandates.push("Capital expenditure remains strictly locked until Day 91 validation is complete.");
      }

      const processedData = {
        companyName: compName,
        startDate: sDate,
        title: `Live Data: ${latestRow.Week}`,
        statusText: isRed ? "ALERT: TRIPWIRE BREACHED - ACTION REQUIRED" : (isYellow ? "WARNING: DEGRADATION DETECTED" : "STATUS: NOMINAL - EXECUTION ON TRACK"),
        statusColors: isRed ? "bg-rose-50 text-rose-800 border-rose-300" : (isYellow ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-800 border-emerald-200"),
        statusIcon: isRed ? <AlertTriangle className="w-5 h-5 text-rose-600 mr-2" /> : (isYellow ? <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" /> : <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />),
        winRate: currentWinRate,
        winRateHistory: history,
        focus: currentFocus,
        contradictions: currentContradictions,
        mandate: mandates,
        mandateColors: isRed ? "bg-rose-50 border-l-4 border-rose-500" : (isYellow ? "bg-amber-50 border-l-4 border-amber-500" : "bg-slate-50 border-l-4 border-emerald-500"),
      };

      setLiveData(processedData);
      setLoading(false);
    } catch (err) {
      setError(`Fetch failed: ${err.message}. Ensure the sheet is published to the web.`);
      setLoading(false);
    }
  };

  const currentData = liveData || simulationData[week];

  // Helper for Tolerance Band SVG points
  const mapY = (val) => 100 - (val * 4);
  const points = currentData.winRateHistory.map((val, i) => `${i * 66.6},${mapY(val)}`).join(' ');

  // Helper for Radar Dot position
  const offsetRadius = ((100 - currentData.focus) / 100) * 45;
  const dotX = 50 + offsetRadius * Math.cos(Math.PI / 4);
  const dotY = 50 - offsetRadius * Math.sin(Math.PI / 4); 

  // Format the date nicely if provided from data
  const formattedDate = currentData.startDate 
    ? new Date(currentData.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Pending Setup';

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* LIVE DATA SYNC BAR */}
        <div className="bg-slate-900 p-5 rounded-xl shadow-lg">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">
            Live Data Source (Google Sheets CSV Link)
          </label>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1 w-full">
              <LinkIcon className="w-4 h-4 text-sky-400 shrink-0" />
              <input
                type="text"
                placeholder="Paste published CSV link here..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200 placeholder-slate-500"
                value={csvUrl}
                onChange={(e) => setCsvUrl(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <button
                onClick={handleLoadCsv}
                disabled={loading || !csvUrl}
                className="flex-1 md:flex-none bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded text-sm font-semibold flex items-center justify-center transition-colors shadow-sm whitespace-nowrap text-white"
              >
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Sync Data"}
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
        </div>

        {error && (
          <div className="flex items-center p-4 rounded-lg bg-rose-900 text-rose-200 border border-rose-800 shadow-sm">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Dynamic Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {currentData.companyName ? `${currentData.companyName} ` : 'Client '}Strategy Monitor
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              90-Day Validation Dashboard &nbsp;•&nbsp; Commenced: <span className="text-slate-700">{formattedDate}</span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 relative group">
            <select 
              className={`appearance-none border py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer font-medium shadow-sm transition-colors ${liveData ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
              value={liveData ? 'live' : week}
              onChange={(e) => {
                if (e.target.value !== 'live') {
                  setLiveData(null);
                  setWeek(e.target.value);
                }
              }}
            >
              {liveData && <option value="live">🟢 Live External Data Linked</option>}
              <option value="week3">Simulation: Week 3 (Healthy)</option>
              <option value="week6">Simulation: Week 6 (Tripwire)</option>
            </select>
            <ChevronDown className={`absolute right-3 top-2.5 w-4 h-4 pointer-events-none ${liveData ? 'text-sky-600' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center p-4 rounded-lg border transition-colors duration-500 shadow-sm ${currentData.statusColors}`}>
          {currentData.statusIcon}
          <span className="font-semibold tracking-wide text-sm">{currentData.statusText}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Tolerance Band (Spans 2 columns) */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <Activity className="w-5 h-5 text-slate-400 mr-2"/> 
                  Tolerance Band (Win Rate)
                </h2>
                <p className="text-xs text-slate-400 mt-1">Target: &gt;15% | 4-Week Trajectory</p>
              </div>
              <div className="text-right">
                <span className={`text-4xl font-light transition-colors duration-500 ${currentData.winRate >= 15 ? 'text-emerald-600' : (currentData.winRate >= 10 ? 'text-amber-500' : 'text-rose-600')}`}>
                  {currentData.winRate}%
                </span>
              </div>
            </div>
            
            <div className="flex-1 relative w-full h-48 bg-slate-50 border border-slate-100 rounded-md overflow-hidden">
              <svg viewBox="0 0 200 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                <rect x="0" y="0" width="200" height="40" fill="#f0fdf4" opacity="0.6" />
                <rect x="0" y="40" width="200" height="20" fill="#fefce8" opacity="0.6" />
                <rect x="0" y="60" width="200" height="40" fill="#fff1f2" opacity="0.6" />
                
                <line x1="0" y1="40" x2="200" y2="40" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="60" x2="200" y2="60" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />

                <polyline 
                  points={points} 
                  fill="none" 
                  stroke={currentData.winRate >= 15 ? "#059669" : (currentData.winRate >= 10 ? "#f59e0b" : "#e11d48")} 
                  strokeWidth="3" 
                  className="transition-all duration-700 ease-in-out"
                />
                
                {currentData.winRateHistory.map((val, i) => (
                  <circle 
                    key={i} 
                    cx={i * 66.6} 
                    cy={mapY(val)} 
                    r="4" 
                    fill="white" 
                    stroke={currentData.winRate >= 15 ? "#059669" : (currentData.winRate >= 10 ? "#f59e0b" : "#e11d48")} 
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

          {/* Right Column: Stacked Cards */}
          <div className="flex flex-col gap-6">
            
            {/* Strategic Drift Radar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center relative">
              <div className="w-full flex justify-between items-start absolute top-6 left-6 right-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Strategic Drift</h2>
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
                    cx={dotX} 
                    cy={dotY} 
                    r="6" 
                    fill={currentData.focus >= 80 ? "#0ea5e9" : (currentData.focus >= 60 ? "#f59e0b" : "#e11d48")} 
                    className="transition-all duration-1000 ease-out"
                  >
                    <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle 
                    cx={dotX} 
                    cy={dotY} 
                    r="12" 
                    fill={currentData.focus >= 80 ? "#0ea5e9" : (currentData.focus >= 60 ? "#f59e0b" : "#e11d48")} 
                    opacity="0.2"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
              </div>
              <div className="mt-4 text-center">
                <span className={`text-2xl font-light ${currentData.focus >= 80 ? 'text-slate-700' : (currentData.focus >= 60 ? 'text-amber-500' : 'text-rose-600')}`}>{currentData.focus}%</span>
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Focus Alignment</span>
              </div>
            </div>

            {/* Friction Heatmap */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-1">Market Friction</h2>
              <p className="text-xs text-slate-400 mb-4">Assumption Contradictions</p>
              
              <div className="flex justify-between items-end mb-2">
                <span className={`text-3xl font-light ${currentData.contradictions < 3 ? 'text-slate-700' : (currentData.contradictions < 5 ? 'text-amber-500' : 'text-rose-600')}`}>
                  {currentData.contradictions}
                </span>
                <span className="text-xs text-slate-400 font-medium">Max Limit: 3</span>
              </div>
              
              <div className="flex gap-1 h-3">
                {[1, 2, 3, 4, 5].map((level) => {
                  let bgColor = "bg-slate-100";
                  if (currentData.contradictions >= level) {
                    if (currentData.contradictions <= 2) bgColor = "bg-sky-400";
                    else if (currentData.contradictions === 3 || currentData.contradictions === 4) bgColor = "bg-amber-400";
                    else bgColor = "bg-rose-500";
                  }
                  return (
                    <div 
                      key={level} 
                      className={`flex-1 rounded-sm transition-colors duration-500 ${bgColor}`}
                    />
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Executive Mandate Footer */}
        <div className={`mt-6 p-6 rounded-xl shadow-sm transition-colors duration-500 ${currentData.mandateColors}`}>
          <div className="flex items-start">
            <FileText className={`w-6 h-6 mr-3 mt-1 ${currentData.winRate >= 15 && currentData.focus >= 60 && currentData.contradictions < 5 ? 'text-emerald-600' : 'text-rose-600'}`} />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Executive Action Memo</h3>
              <ul className="text-slate-700 font-medium leading-relaxed list-disc pl-5 space-y-2">
                {currentData.mandate.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
