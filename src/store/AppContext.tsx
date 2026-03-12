import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type TriggerType =
  | 'Webhook'
  | 'Schedule'
  | 'Form Submit'
  | 'Manual Trigger'
  | 'Incoming SFTP'
  | 'Shopify Webhook';

export type WorkflowStatus = 'active' | 'draft';
export type ExecutionStatus = 'success' | 'failed' | 'running';

export interface Step {
  id: string;
  type: string;
  label: string;
  tag?: string;
  config: any;
  children?: Step[];
  branch?: 'true' | 'false';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  triggers: Step[];
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  stepCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

interface AppState {
  workflows: Workflow[];
  modules: Module[];
  executions: Execution[];
}

interface AppContextValue extends AppState {
  createWorkflow: (name: string) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => void;
  runWorkflow: (id: string) => void;
  createModule: (name: string) => Module;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  duplicateModule: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'flowbuild_app_state';

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function now() {
  return new Date().toISOString();
}

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf1',
    name: 'Shopify Order Synchronization',
    description: 'Syncs new orders to the ERP and notifies the warehouse team via Slack.',
    status: 'active',
    triggerType: 'Shopify Webhook',
    triggers: [{ id: 't1', type: 'Shopify Webhook', label: 'Trigger', config: {} }],
    steps: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'wf2',
    name: 'Daily Inventory Cleanup',
    description: 'Runs every midnight to archive out-of-stock items and update catalog status.',
    status: 'active',
    triggerType: 'Schedule',
    triggers: [{ id: 't2', type: 'Schedule', label: 'Trigger', config: {} }],
    steps: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'wf3',
    name: 'Customer Support Webhook',
    description: 'Processes incoming support tickets from the external form submission.',
    status: 'draft',
    triggerType: 'Form Submit',
    triggers: [{ id: 't3', type: 'Form Submit', label: 'Trigger', config: {} }],
    steps: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const INITIAL_MODULES: Module[] = [
  {
    id: 'mod1',
    name: 'Standard Order Enrichment',
    description: 'Fetches customer tiers and applies discount logic based on loyalty status.',
    steps: [],
    stepCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'mod2',
    name: 'Customer Data Cleansing',
    description: 'Normalizes phone numbers, validates emails, and formats address strings.',
    steps: [],
    stepCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'mod3',
    name: 'VAT Calculation Engine',
    description: 'Global tax calculation logic supporting EU, US, and APAC regions.',
    steps: [],
    stepCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

const INITIAL_EXECUTIONS: Execution[] = [
  {
    id: 'ex1',
    workflowId: 'wf1',
    workflowName: 'Shopify Order Synchronization',
    status: 'success',
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    duration: 1240,
  },
  {
    id: 'ex2',
    workflowId: 'wf2',
    workflowName: 'Daily Inventory Cleanup',
    status: 'success',
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 3000).toISOString(),
    duration: 3000,
  },
  {
    id: 'ex3',
    workflowId: 'wf1',
    workflowName: 'Shopify Order Synchronization',
    status: 'failed',
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 3 + 500).toISOString(),
    duration: 500,
    error: 'Connection timeout to ERP endpoint',
  },
];

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return {
    workflows: INITIAL_WORKFLOWS,
    modules: INITIAL_MODULES,
    executions: INITIAL_EXECUTIONS,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const createWorkflow = useCallback((name: string): Workflow => {
    const wf: Workflow = {
      id: generateId(),
      name,
      description: '',
      status: 'draft',
      triggerType: 'Webhook',
      triggers: [],
      steps: [],
      createdAt: now(),
      updatedAt: now(),
    };
    setState(prev => ({ ...prev, workflows: [wf, ...prev.workflows] }));
    return wf;
  }, []);

  const updateWorkflow = useCallback((id: string, updates: Partial<Workflow>) => {
    setState(prev => ({
      ...prev,
      workflows: prev.workflows.map(w =>
        w.id === id ? { ...w, ...updates, updatedAt: now() } : w
      ),
    }));
  }, []);

  const deleteWorkflow = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      workflows: prev.workflows.filter(w => w.id !== id),
    }));
  }, []);

  const duplicateWorkflow = useCallback((id: string) => {
    setState(prev => {
      const original = prev.workflows.find(w => w.id === id);
      if (!original) return prev;
      const copy: Workflow = {
        ...original,
        id: generateId(),
        name: `${original.name} (Copy)`,
        status: 'draft',
        createdAt: now(),
        updatedAt: now(),
      };
      return { ...prev, workflows: [copy, ...prev.workflows] };
    });
  }, []);

  const runWorkflow = useCallback((id: string) => {
    setState(prev => {
      const wf = prev.workflows.find(w => w.id === id);
      if (!wf) return prev;
      const runningExec: Execution = {
        id: generateId(),
        workflowId: id,
        workflowName: wf.name,
        status: 'running',
        startedAt: now(),
      };
      return { ...prev, executions: [runningExec, ...prev.executions] };
    });

    // Simulate completion after ~2s
    setTimeout(() => {
      setState(prev => {
        const success = Math.random() > 0.15;
        return {
          ...prev,
          executions: prev.executions.map(e => {
            if (e.workflowId === id && e.status === 'running') {
              return {
                ...e,
                status: success ? 'success' : 'failed',
                completedAt: now(),
                duration: Math.floor(Math.random() * 3000) + 400,
                error: success ? undefined : 'Unexpected error during execution',
              };
            }
            return e;
          }),
        };
      });
    }, 2000 + Math.random() * 1000);
  }, []);

  const createModule = useCallback((name: string): Module => {
    const mod: Module = {
      id: generateId(),
      name,
      description: '',
      steps: [],
      stepCount: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    setState(prev => ({ ...prev, modules: [mod, ...prev.modules] }));
    return mod;
  }, []);

  const updateModule = useCallback((id: string, updates: Partial<Module>) => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === id ? { ...m, ...updates, updatedAt: now() } : m
      ),
    }));
  }, []);

  const deleteModule = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== id),
    }));
  }, []);

  const duplicateModule = useCallback((id: string) => {
    setState(prev => {
      const original = prev.modules.find(m => m.id === id);
      if (!original) return prev;
      const copy: Module = {
        ...original,
        id: generateId(),
        name: `${original.name} (Copy)`,
        createdAt: now(),
        updatedAt: now(),
      };
      return { ...prev, modules: [copy, ...prev.modules] };
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        duplicateWorkflow,
        runWorkflow,
        createModule,
        updateModule,
        deleteModule,
        duplicateModule,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
