import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus, Zap, MoreVertical, Search, Clock, Globe, Calendar,
  Play, Loader2, CheckCircle2, XCircle, Copy, Pencil, Trash2
} from 'lucide-react';
import { useApp, Workflow, Execution, TriggerType } from '../../store/AppContext';
import { toast } from 'sonner';

function formatRelative(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

const TRIGGER_ICON_MAP: Record<string, React.ElementType> = {
  'Webhook': Globe,
  'Shopify Webhook': Globe,
  'Schedule': Calendar,
};

function getTriggerIcon(triggerType: string): React.ElementType {
  return TRIGGER_ICON_MAP[triggerType] || Zap;
}

// ── Kebab Menu ──────────────────────────────────────────────────────────────

interface KebabMenuProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const KebabMenu = ({ onEdit, onDuplicate, onRename, onDelete }: KebabMenuProps) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = () => { setOpen(false); setConfirmDelete(false); };

  return (
    <div ref={ref} className="relative">
      <button
        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); setConfirmDelete(false); }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 bg-white rounded-lg border border-gray-200 shadow-lg py-1 text-sm">
          {confirmDelete ? (
            <div className="px-3 py-2">
              <p className="text-xs text-gray-600 mb-2 font-medium">Delete this workflow?</p>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                  onClick={(e) => { e.stopPropagation(); onDelete(); close(); }}
                >
                  Delete
                </button>
                <button
                  className="flex-1 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                onClick={(e) => { e.stopPropagation(); onEdit(); close(); }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                onClick={(e) => { e.stopPropagation(); onRename(); close(); }}
              >
                <Pencil size={14} /> Rename
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                onClick={(e) => { e.stopPropagation(); onDuplicate(); close(); }}
              >
                <Copy size={14} /> Duplicate
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Workflow Card ────────────────────────────────────────────────────────────

interface WorkflowCardProps {
  workflow: Workflow;
  latestExecution?: Execution;
  onEdit: () => void;
  onRun: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const WorkflowCard = ({
  workflow,
  latestExecution,
  onEdit,
  onRun,
  onDuplicate,
  onRename,
  onDelete,
}: WorkflowCardProps) => {
  const TriggerIcon = getTriggerIcon(workflow.triggerType);
  const isRunning = latestExecution?.status === 'running';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-lg transition-colors ${
            isRunning ? 'bg-blue-100' : 'bg-amber-50 group-hover:bg-amber-500'
          }`}
        >
          {isRunning ? (
            <Loader2 size={20} className="text-blue-600 animate-spin" />
          ) : (
            <TriggerIcon size={20} className="text-amber-600 group-hover:text-white transition-colors" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              workflow.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
            }`}
          >
            {workflow.status}
          </span>
          <KebabMenu
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onRename={onRename}
            onDelete={onDelete}
          />
        </div>
      </div>

      <h3
        className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
        onClick={onEdit}
      >
        {workflow.name}
      </h3>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">
        {workflow.description || 'No description'}
      </p>

      {latestExecution && (
        <div
          className={`mb-3 flex items-center gap-1.5 text-[10px] rounded px-2 py-1 ${
            latestExecution.status === 'success'
              ? 'bg-green-50 text-green-700'
              : latestExecution.status === 'failed'
              ? 'bg-red-50 text-red-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {latestExecution.status === 'success' ? (
            <CheckCircle2 size={10} />
          ) : latestExecution.status === 'failed' ? (
            <XCircle size={10} />
          ) : (
            <Loader2 size={10} className="animate-spin" />
          )}
          Last run: {latestExecution.status}
          {latestExecution.duration && ` · ${(latestExecution.duration / 1000).toFixed(1)}s`}
          {' · '}{formatRelative(latestExecution.startedAt)}
        </div>
      )}

      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <Clock size={12} />
          <span>{formatRelative(workflow.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">
            {workflow.triggerType}
          </span>
          <button
            className={`p-1.5 rounded transition-colors ${
              isRunning
                ? 'bg-blue-50 text-blue-400 cursor-not-allowed'
                : 'bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600'
            }`}
            title={isRunning ? 'Running…' : 'Run Now'}
            onClick={(e) => { e.stopPropagation(); if (!isRunning) onRun(); }}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Rename Modal ─────────────────────────────────────────────────────────────

interface RenameModalProps {
  initialName: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

const RenameModal = ({ initialName, onConfirm, onClose }: RenameModalProps) => {
  const [value, setValue] = useState(initialName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-900 mb-4">Rename Workflow</h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onConfirm(value.trim());
            if (e.key === 'Escape') onClose();
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (value.trim()) onConfirm(value.trim()); }}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            disabled={!value.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main View ────────────────────────────────────────────────────────────────

const TRIGGER_TYPES: TriggerType[] = [
  'Webhook', 'Shopify Webhook', 'Schedule', 'Form Submit', 'Manual Trigger', 'Incoming SFTP',
];

const SORT_OPTIONS = ['Modified', 'Name', 'Created'] as const;

export const WorkflowsView = ({
  onEditWorkflow,
}: {
  onEditWorkflow: (id: string | null) => void;
}) => {
  const { workflows, executions, runWorkflow, duplicateWorkflow, deleteWorkflow, updateWorkflow } =
    useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [triggerFilter, setTriggerFilter] = useState('All');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('Modified');
  const [renamingWorkflow, setRenamingWorkflow] = useState<Workflow | null>(null);

  // Latest execution per workflow
  const latestByWorkflow = useMemo(() => {
    const map: Record<string, Execution> = {};
    for (const exec of executions) {
      const existing = map[exec.workflowId];
      if (!existing || new Date(exec.startedAt) > new Date(existing.startedAt)) {
        map[exec.workflowId] = exec;
      }
    }
    return map;
  }, [executions]);

  const filtered = useMemo(() => {
    let result = [...workflows];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((w) => w.status === statusFilter);
    }
    if (triggerFilter !== 'All') {
      result = result.filter((w) => w.triggerType === triggerFilter);
    }
    result.sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Created')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return result;
  }, [workflows, search, statusFilter, triggerFilter, sortBy]);

  const handleRun = (wf: Workflow) => {
    runWorkflow(wf.id);
    toast.info(`Running "${wf.name}"…`);
  };

  const handleDuplicate = (wf: Workflow) => {
    duplicateWorkflow(wf.id);
    toast.success(`"${wf.name}" duplicated`);
  };

  const handleDelete = (wf: Workflow) => {
    deleteWorkflow(wf.id);
    toast.success(`"${wf.name}" deleted`);
  };

  const handleRename = (name: string) => {
    if (!renamingWorkflow) return;
    updateWorkflow(renamingWorkflow.id, { name });
    toast.success('Workflow renamed');
    setRenamingWorkflow(null);
  };

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-500">
            Automate your business logic with triggers and modules
          </p>
        </div>
        <button
          onClick={() => onEditWorkflow(null)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Create Workflow</span>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Triggers</option>
            {TRIGGER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof SORT_OPTIONS[number])}
            className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>Sort: {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {(search || statusFilter !== 'All' || triggerFilter !== 'All') && (
        <p className="text-xs text-gray-500 mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && ` for "${search}"`}
        </p>
      )}

      {/* Grid or Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {workflows.length === 0 ? 'No workflows yet' : 'No workflows match your filters'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            {workflows.length === 0
              ? 'Create your first workflow to start automating your business logic.'
              : 'Try adjusting your search or filters.'}
          </p>
          {workflows.length === 0 && (
            <button
              onClick={() => onEditWorkflow(null)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Create Workflow
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              latestExecution={latestByWorkflow[wf.id]}
              onEdit={() => onEditWorkflow(wf.id)}
              onRun={() => handleRun(wf)}
              onDuplicate={() => handleDuplicate(wf)}
              onRename={() => setRenamingWorkflow(wf)}
              onDelete={() => handleDelete(wf)}
            />
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renamingWorkflow && (
        <RenameModal
          initialName={renamingWorkflow.name}
          onConfirm={handleRename}
          onClose={() => setRenamingWorkflow(null)}
        />
      )}
    </div>
  );
};

export default WorkflowsView;
