import React, { useState, useRef } from 'react';
import { ViewState, Project, FileNode } from './types';
import { Editor } from './components/Editor';
import { ProjectCard } from './components/ProjectCard';
import { Button } from './components/Button';
import { Command, Plus, HardDrive, Upload } from 'lucide-react';

// Sample Project Data
const SAMPLE_PROJECT: Project = {
  id: 'proj_1',
  name: 'hydra-v0-demo',
  description: 'A mock application to demonstrate Hydra cloning capabilities.',
  lastModified: Date.now(),
  source: 'local',
  files: [
    {
      id: 'f1',
      name: 'index.js',
      type: 'file',
      content: `console.log("Hello Hydra!");\n\nfunction init() {\n  const app = document.getElementById('app');\n  app.innerHTML = '<h1>Hydra Loaded</h1>';\n}\n\ninit();`
    },
    {
      id: 'f2',
      name: 'style.css',
      type: 'file',
      content: `body { background: #000; color: #fff; font-family: sans-serif; }`
    },
    {
      id: 'f3',
      name: 'README.md',
      type: 'file',
      content: `# Hydra Demo\nThis is a cloned project ready for AI refactoring.`
    }
  ]
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [projects, setProjects] = useState<Project[]>([SAMPLE_PROJECT]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProjectClick = (id: string) => {
    setActiveProjectId(id);
    setView(ViewState.EDITOR);
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: 'Untitled Project',
      description: 'New scratchpad project',
      lastModified: Date.now(),
      source: 'local',
      files: [
        { id: 'nf1', name: 'main.js', type: 'file', content: '// Start building...' }
      ]
    };
    setProjects([newProject, ...projects]);
  };

  const handleCloneProject = (id: string) => {
    const original = projects.find(p => p.id === id);
    if (!original) return;
    
    const cloned: Project = {
      ...original,
      id: `proj_${Date.now()}`,
      name: `${original.name}-clone`,
      lastModified: Date.now(),
      files: original.files.map(f => ({ ...f, id: `file_${Date.now()}_${Math.random()}` }))
    };
    setProjects([cloned, ...projects]);
  };

  const handleRenameProject = (id: string) => {
    const name = prompt("Enter new project name:");
    if (name) {
      setProjects(projects.map(p => p.id === id ? { ...p, name } : p));
    }
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
  };

  // Simulate Google Drive Import
  const handleDriveImport = () => {
    const isConfirmed = window.confirm("Hydra wants to access your Google Drive to clone a project. (Simulation)\n\nClick OK to simulate selecting a folder.");
    
    if (isConfirmed) {
      const driveProject: Project = {
        id: `drive_${Date.now()}`,
        name: 'finance-tracker-v2',
        description: 'Imported from Google Drive/Projects/Finance',
        lastModified: Date.now(),
        source: 'drive',
        files: [
          { id: 'd1', name: 'app.py', type: 'file', content: 'import flask\napp = flask.Flask(__name__)\n@app.route("/")\ndef hello():\n    return "Hello World"' },
          { id: 'd2', name: 'requirements.txt', type: 'file', content: 'flask==2.0.1\npandas' }
        ]
      };
      setProjects([driveProject, ...projects]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: FileNode[] = [];
    let projectName = "Imported Folder";

    Array.from(files).forEach((file: File, index) => {
       if (index === 0) {
         const path = (file as any).webkitRelativePath;
         if (path) projectName = path.split('/')[0];
       }

       const reader = new FileReader();
       reader.onload = (ev) => {
         fileList.push({
           id: `up_${Date.now()}_${index}`,
           name: file.name,
           type: 'file',
           content: ev.target?.result as string || ''
         });
         
         if (fileList.length === files.length) {
            const newProj: Project = {
              id: `upload_${Date.now()}`,
              name: projectName,
              description: 'Imported from local directory',
              lastModified: Date.now(),
              source: 'local',
              files: fileList
            };
            setProjects(prev => [newProj, ...prev]);
         }
       };
       reader.readAsText(file);
    });
  };

  if (view === ViewState.EDITOR && activeProjectId) {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (activeProject) {
      return (
        <Editor 
          project={activeProject} 
          onBack={() => setView(ViewState.DASHBOARD)}
          onUpdateProject={handleUpdateProject}
        />
      );
    }
  }

  return (
    <div className="h-screen bg-dark-bg text-white font-sans selection:bg-hydra-500/30 selection:text-hydra-200 flex flex-col overflow-hidden">
      
      {/* Hero Header - Compact */}
      <div className="bg-gradient-to-b from-hydra-950/30 to-dark-bg border-b border-dark-border py-3 px-6 shrink-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-hydra-500/10 rounded-lg border border-hydra-500/20">
                <Command className="w-5 h-5 text-hydra-400" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-white flex items-baseline">
               Hydra 
               <span className="ml-1 text-hydra-500 flex items-baseline relative top-[1px]">
                 <span className="text-xl font-mono font-bold">v</span>
                 <span className="text-xl font-sans font-bold ml-px">0</span>
               </span>
             </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area - Fixed Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-4 flex flex-col h-full">
          
          {/* Actions Bar - Compact */}
          <div className="flex flex-col gap-3 mb-4 shrink-0">
            <Button 
              size="md" 
              icon={<HardDrive size={16} />}
              onClick={handleDriveImport}
              className="w-full justify-center bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 font-medium"
            >
              Clone from Google Drive
            </Button>

            <div className="flex gap-3 w-full">
              <Button 
                size="md" 
                variant="secondary" 
                icon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 justify-center font-medium"
              >
                Upload Local Folder
              </Button>
              <Button 
                size="md" 
                variant="ghost" 
                onClick={handleCreateProject}
                className="flex-1 justify-center border border-dark-border/50 font-medium"
              >
                <Plus size={16} className="mr-1"/> New
              </Button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              // @ts-ignore 
              webkitdirectory="" 
              directory=""
              multiple
            />
          </div>

          {/* Projects Grid - Takes remaining space */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="mb-2 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-white">Recent Projects</h2>
              <span className="text-[10px] text-gray-500">{projects.length} projects</span>
            </div>

            <div className="overflow-y-auto pr-1 -mr-1 pb-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 scrollbar-hide">
              {projects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={handleProjectClick}
                  onClone={handleCloneProject}
                  onRename={handleRenameProject}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 py-3 bg-dark-bg border-t border-dark-border/50 text-center">
        <span className="text-[10px] text-gray-600 font-medium">
          Powered by Google AI Studio
        </span>
      </div>

    </div>
  );
};

export default App;