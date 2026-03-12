import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, GitBranch, MoreVertical, Search, Clock, Copy, Pencil, Trash2 } from 'lucide-react';
import { useApp, Module } from '../../store/AppContext';
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
              <p className="text-xs text-gray-600 mb-2 font-medium">Delete this module?</p>
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

// ── Module Card ──────────────────────────────────────────────────────────────

interface ModuleCardProps {
  module: Module;
  onEdit: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ModuleCard = ({ module, onEdit, onDuplicate, onRename, onDelete }: ModuleCardProps) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-600 transition-colors">
        <GitBranch size={20} className="text-blue-600 group-hover:text-white transition-colors" />
      </div>
      <KebabMenu
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onRename={onRename}
        onDelete={onDelete}
      />
    </div>
    <h3
      className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
      onClick={onEdit}
    >
      {module.name}
    </h3>
    <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">
      {module.description || 'No description'}
    </p>
    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
        <Clock size={12} />
        <span>{formatRelative(module.updatedAt)}</span>
      </div>
      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
        {module.stepCount} Steps
      </span>
    </div>
  </div>
);

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
        <h3 className="font-bold text-gray-900 mb-4">Rename Module</h3>
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

const SORT_OPTIONS = ['Modified', 'Name', 'Created'] as const;

export const ModulesView = ({
  onEditModule,
}: {
  onEditModule: (id: string | null) => void;
}) => {
  const { modules, duplicateModule, deleteModule, updateModule } = useApp();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('Modified');
  const [renamingModule, setRenamingModule] = useState<Module | null>(null);

  const filtered = useMemo(() => {
    let result = [...modules];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Created')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return result;
  }, [modules, search, sortBy]);

  const handleDuplicate = (mod: Module) => {
    duplicateModule(mod.id);
    toast.success(`"${mod.name}" duplicated`);
  };

  const handleDelete = (mod: Module) => {
    deleteModule(mod.id);
    toast.success(`"${mod.name}" deleted`);
  };

  const handleRename = (name: string) => {
    if (!renamingModule) return;
    updateModule(renamingModule.id, { name });
    toast.success('Module renamed');
    setRenamingModule(null);
  };

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Logic Modules</h1>
          <p className="text-sm text-gray-500">Reusable logic components for your workflows</p>
        </div>
        <button
          onClick={() => onEditModule(null)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Create Module</span>
        </button>
      </div>

      {/* Search + Sort */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
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

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-500 mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {/* Grid or Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <GitBranch size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {modules.length === 0 ? 'No modules yet' : 'No modules match your search'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            {modules.length === 0
              ? 'Create reusable logic modules to share across your workflows.'
              : 'Try adjusting your search.'}
          </p>
          {modules.length === 0 && (
            <button
              onClick={() => onEditModule(null)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Create Module
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onEdit={() => onEditModule(mod.id)}
              onDuplicate={() => handleDuplicate(mod)}
              onRename={() => setRenamingModule(mod)}
              onDelete={() => handleDelete(mod)}
            />
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renamingModule && (
        <RenameModal
          initialName={renamingModule.name}
          onConfirm={handleRename}
          onClose={() => setRenamingModule(null)}
        />
      )}
    </div>
  );
};

export default ModulesView;
