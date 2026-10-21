import React from 'react';
import {
  ShieldAlert,
  Flame,
  Users,
  Server,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  HOURLY_ATTACK_ACTIVITY,
  ATTACK_TYPE_DISTRIBUTION,
  SEVERITY_DISTRIBUTION
} from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function OverviewPage() {
  const { events, honeypots, attackers, setSelectedEventId } = useHoneynet();
  const navigate = useNavigate();

  // Summary Metrics from live events
  const totalEvents = events.length;
  const uniqueAttackerCount = new Set(events.map((e) => e.src_ip || e.sourceIp).filter(Boolean)).size || attackers.length;
  const activeHoneypotsCount = honeypots.filter((h) => h.status === 'active').length || 1;
  const criticalThreatsCount = events.filter((e) => e.severity === 'Critical').length;

  const statCards = [
    {
      title: 'Total Attack Events',
      value: totalEvents.toLocaleString(),
      change: '+18.4% last hour',
      isIncrease: true,
      icon: Activity,
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      bgGlow: 'bg-blue-500/5'
    },
    {
      title: 'Unique Attacker IPs',
      value: uniqueAttackerCount,
      change: '+4 new today',
      isIncrease: true,
      icon: Users,
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      bgGlow: 'bg-purple-500/5'
    },
    {
      title: 'Active Honeypots',
      value: `${activeHoneypotsCount} / 3 Decoys`,
      change: '100% Docker healthy',
      isIncrease: true,
      icon: Server,
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/5'
    },
    {
      title: 'Critical Threats',
      value: criticalThreatsCount,
      change: 'AI confidence >90%',
      isIncrease: false,
      icon: ShieldAlert,
      borderColor: 'border-red-500/40',
      iconColor: 'text-red-400',
      bgGlow: 'bg-red-500/5'
    }
  ];

  const handleInspectEvent = (id) => {
    setSelectedEventId(id);
    navigate('/ai-analysis');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Decoy Security Operations Center"
        subtitle="Real-time multi-honeypot telemetry, machine-assisted threat classification, and decoy infrastructure state"
      />

      <div className="p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl border ${card.borderColor} ${card.bgGlow} bg-slate-900/60 p-4 transition-all hover:border-slate-600`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <div className={`p-2 rounded-lg bg-slate-800/80 ${card.iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
                    {card.value}
                  </div>
                </div>
                <div className="mt-2 flex items-center text-[11px] text-slate-400 gap-1.5 font-mono">
                  {card.isIncrease ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                  )}
                  <span>{card.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Activity Over Time (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200">Attack Activity Over Time</h2>
                <p className="text-xs text-slate-400">
                  Total vs. Critical event volume intercepted by decoy containers
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Total Attacks
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Critical Severity
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={HOURLY_ATTACK_ACTIVITY}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalEvents"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Events"
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCritical)"
                    name="Critical"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attack Types Distribution (1 col) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm flex flex-col">
            <div className="mb-2">
              <h2 className="text-sm font-bold text-slate-200">Attack Types Distribution</h2>
              <p className="text-xs text-slate-400">Classified decoy ingress vectors</p>
            </div>

            <div className="h-52 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ATTACK_TYPE_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {ATTACK_TYPE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              {ATTACK_TYPE_DISTRIBUTION.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Severity Distribution & Honeypot Quick Status */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {SEVERITY_DISTRIBUTION.map((sev, idx) => (
            <div
              key={idx}
              className={`rounded-xl border ${sev.border} ${sev.bg} p-4 flex items-center justify-between`}
            >
              <div>
                <span className="text-xs text-slate-400 font-medium block">{sev.name}</span>
                <span className={`text-xl font-bold font-mono ${sev.color}`}>{sev.count}</span>
              </div>
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center border"
                style={{ borderColor: sev.fill, backgroundColor: `${sev.fill}15` }}
              >
                <Flame className="h-4 w-4" style={{ color: sev.fill }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Attack Events Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Recent Intercepted Events</h2>
              <p className="text-xs text-slate-400">
                Latest live decoy telemetry (simulated RFC 5737 demo events)
              </p>
            </div>
            <button
              onClick={() => navigate('/live-attacks')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              View Full Live Stream <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Attacker IP</th>
                  <th className="py-3 px-4">Target Decoy</th>
                  <th className="py-3 px-4">Attack Vector</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {events.slice(0, 5).map((evt) => {
                  const isCrit = evt.severity === 'Critical';
                  const isHigh = evt.severity === 'High';
                  const isMed = evt.severity === 'Medium';

                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => handleInspectEvent(evt.id)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-200">{evt.id}</td>
                      <td className="py-3 px-4 text-slate-400">{evt.timestamp}</td>
                      <td className="py-3 px-4 text-emerald-400 font-medium">{evt.sourceIp}</td>
                      <td className="py-3 px-4 text-slate-300">{evt.destinationService}</td>
                      <td className="py-3 px-4 text-slate-300">{evt.attackType}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isCrit
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : isHigh
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                              : isMed
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">{evt.riskScore}/100</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectEvent(evt.id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition-colors"
                        >
                          AI Triage &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
