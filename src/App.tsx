import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { StructuredWorkflowEditor } from "./components/StructuredWorkflowEditor";
import { Menu, X } from "lucide-react";
import { Toaster } from "sonner";
import { AppProvider } from "./store/AppContext";

// View Imports
import { DashboardView } from "./components/views/DashboardView";
import { AnalyticsView } from "./components/views/AnalyticsView";
import { ComplianceView } from "./components/views/ComplianceView";
import { IntegrationsView } from "./components/views/IntegrationsView";
import { SchedulerView } from "./components/views/SchedulerView";
import { RepositoryView } from "./components/views/RepositoryView";
import { SettingsView } from "./components/views/SettingsView";
import { HelpView } from "./components/views/HelpView";
import { ModulesView } from "./components/views/ModulesView";
import { WorkflowsView } from "./components/views/WorkflowsView";

const App = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // null = create new, string = edit existing by id
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
    if (["workflow-editor", "module-editor"].includes(view)) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  };

  const handleEditWorkflow = (id: string | null) => {
    setEditingWorkflowId(id);
    handleNavigate("workflow-editor");
  };

  const handleEditModule = (id: string | null) => {
    setEditingModuleId(id);
    handleNavigate("module-editor");
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "analytics":
        return <AnalyticsView />;
      case "compliance":
        return <ComplianceView />;
      case "integrations":
        return <IntegrationsView />;
      case "scheduler":
        return <SchedulerView />;
      case "repository":
        return <RepositoryView />;
      case "settings":
        return <SettingsView />;
      case "help":
        return <HelpView />;
      case "modules":
        return <ModulesView onEditModule={handleEditModule} />;
      case "module-editor":
        return (
          <StructuredWorkflowEditor
            mode="module"
            workflowId={editingModuleId}
            key={editingModuleId ?? "new-module"}
          />
        );
      case "workflows":
        return <WorkflowsView onEditWorkflow={handleEditWorkflow} />;
      case "workflow-editor":
        return (
          <StructuredWorkflowEditor
            mode="workflow"
            workflowId={editingWorkflowId}
            key={editingWorkflowId ?? "new-workflow"}
          />
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppProvider>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen w-screen bg-gray-50 overflow-hidden font-sans text-gray-900 selection:bg-blue-100 relative">
        {/* Sidebar restore button (Floating when sidebar is fully collapsed) */}
        {isSidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex fixed top-4 left-4 z-[60] p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-all hover:scale-110 active:scale-95 group"
            aria-label="Expand sidebar"
          >
            <Menu size={20} className="group-hover:hidden" />
            <div className="hidden group-hover:flex items-center gap-2 pr-1">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px]">F</div>
              <span className="text-xs font-bold">FlowBuild</span>
            </div>
          </button>
        )}

        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4 justify-between md:hidden">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">F</div>
            <span>FlowBuild</span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Sidebar - Desktop and Mobile Overlay */}
        <div className={`
          fixed inset-0 z-40 md:relative md:flex md:inset-auto
          ${isMobileMenuOpen ? "flex" : "hidden md:flex"}
        `}>
          {/* Backdrop for mobile */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-gray-900/50 md:hidden z-20"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className={`relative h-full shrink-0 z-10 ${isMobileMenuOpen ? "w-64" : "w-auto"}`}>
            <Sidebar
              activeView={activeView}
              onNavigate={handleNavigate}
              collapsed={isSidebarCollapsed}
              onToggle={toggleSidebar}
            />
          </div>
        </div>

        <main className="flex-1 h-full relative flex flex-col min-w-0 bg-gray-50 pt-16 md:pt-0 z-0">
          {renderContent()}
        </main>
      </div>
    </AppProvider>
  );
};

export default App;
