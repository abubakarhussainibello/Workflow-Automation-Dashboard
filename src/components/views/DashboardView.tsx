import React from 'react';
import {
  GitBranch,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp, Execution } from '../../store/AppContext';

const chartData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const StatCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={20} />
      </div>
      <div
        className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}
      >
        {change}
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      </div>
    </div>
    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-xs sm:text-sm text-gray-500">{title}</p>
  </div>
);

function formatRelative(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ExecutionRow = ({ exec }: { exec: Execution }) => {
  const isRunning = exec.status === 'running';
  const isSuccess = exec.status === 'success';

  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 shrink-0">
        {isRunning ? (
          <Loader2 size={14} className="text-blue-500 animate-spin" />
        ) : isSuccess ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : (
          <XCircle size={14} className="text-red-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 font-medium truncate">{exec.workflowName}</p>
        <p className="text-xs text-gray-500">
          {formatRelative(exec.startedAt)}
          {exec.duration && ` · ${(exec.duration / 1000).toFixed(1)}s`}
          {exec.error && ` · ${exec.error}`}
        </p>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
          isRunning
            ? 'bg-blue-50 text-blue-600'
            : isSuccess
            ? 'bg-green-50 text-green-600'
            : 'bg-red-50 text-red-600'
        }`}
      >
        {exec.status}
      </span>
    </div>
  );
};

export const DashboardView = () => {
  const { workflows, executions } = useApp();

  const activeCount = workflows.filter(w => w.status === 'active').length;
  const totalExecs = executions.length;
  const failedExecs = executions.filter(e => e.status === 'failed').length;
  const successExecs = executions.filter(e => e.status === 'success').length;
  const successRate =
    totalExecs > 0 ? ((successExecs / totalExecs) * 100).toFixed(1) + '%' : '—';

  const recentExecs = executions.slice(0, 8);

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your automation performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Total Workflows"
          value={workflows.length}
          change={`${activeCount} active`}
          trend="up"
          icon={GitBranch}
          color="bg-blue-500 text-blue-500"
        />
        <StatCard
          title="Total Executions"
          value={totalExecs}
          change={`${successExecs} succeeded`}
          trend="up"
          icon={Activity}
          color="bg-purple-500 text-purple-500"
        />
        <StatCard
          title="Failed Executions"
          value={failedExecs}
          change={failedExecs === 0 ? 'None' : `${failedExecs} failed`}
          trend={failedExecs === 0 ? 'up' : 'down'}
          icon={AlertTriangle}
          color="bg-orange-500 text-orange-500"
        />
        <StatCard
          title="Success Rate"
          value={successRate}
          change={totalExecs > 0 ? `${totalExecs} runs` : 'No runs yet'}
          trend="up"
          icon={CheckCircle2}
          color="bg-emerald-500 text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">
            Execution Traffic
          </h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Recent Executions
          </h3>
          {recentExecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
              <Activity size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No executions yet. Run a workflow to see activity here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {recentExecs.map((exec) => (
                <ExecutionRow key={exec.id} exec={exec} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
