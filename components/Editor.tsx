import React, { useState, useEffect, useRef } from 'react';
import { Project, FileNode, ChatMessage } from '../types';
import { analyzeProject, streamChatResponse } from '../services/geminiService';
import { ChevronLeft, FileCode, Play, Save, ExternalLink, Send, Cpu, Menu, X, PanelRight } from 'lucide-react';
import { Button } from './Button';

interface EditorProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (project: Project) => void;
}

export const Editor: React.FC<EditorProps> = ({ project, onBack, onUpdateProject }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    project.files.length > 0 ? project.files[0].id : null
  );
  const [fileContent, setFileContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  
  // Mobile UI State
  const [showFiles, setShowFiles] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedFile = project.files.find(f => f.id === selectedFileId);

  useEffect(() => {
    if (selectedFile) {
      setFileContent(selectedFile.content);
    }
  }, [selectedFileId, selectedFile]);

  const handleSaveFile = () => {
    if (!selectedFile) return;
    const updatedFiles = project.files.map(f => 
      f.id === selectedFile.id ? { ...f, content: fileContent } : f
    );
    onUpdateProject({ ...project, files: updatedFiles, lastModified: Date.now() });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeProject(project.files);
    setAnalysis(result);
    setIsAnalyzing(false);
    
    setChatHistory(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: `## Project Analysis\n${result}`,
      timestamp: Date.now()
    }]);
    
    // On mobile, switch to chat view to see result
    if (window.innerWidth < 768) {
      setShowChat(true);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsStreaming(true);

    const stream = streamChatResponse(
      chatHistory.map(m => ({ role: m.role, text: m.text })),
      userMsg.text,
      project.files
    );

    let fullResponse = '';
    const responseId = (Date.now() + 1).toString();
    
    setChatHistory(prev => [...prev, {
      id: responseId,
      role: 'model',
      text: '',
      timestamp: Date.now()
    }]);

    for await (const chunk of stream) {
      fullResponse += chunk;
      setChatHistory(prev => prev.map(msg => 
        msg.id === responseId ? { ...msg, text: fullResponse } : msg
      ));
    }

    setIsStreaming(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, showChat]);

  const handleExportToAIStudio = () => {
    const context = project.files.map(f => `File: ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
    navigator.clipboard.writeText(context).then(() => {
      alert("Project context copied to clipboard! Opening Google AI Studio...");
      window.open('https://aistudio.google.com/', '_blank');
    });
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-gray-300 overflow-hidden relative">
      {/* Mobile Backdrop */}
      {(showFiles || showChat) && (
        <div 
          className="absolute inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => { setShowFiles(false); setShowChat(false); }}
        />
      )}

      {/* Top Bar */}
      <header className="h-14 border-b border-dark-border flex items-center justify-between px-3 md:px-4 bg-dark-surface shrink-0 z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="hover:text-white transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-semibold text-white truncate">{project.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-hydra-900/30 text-hydra-400 rounded border border-hydra-900 shrink-0">
              v0.1
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<Play size={14} />} onClick={handleAnalyze}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
            <Button variant="secondary" size="sm" icon={<ExternalLink size={14} />} onClick={handleExportToAIStudio}>
              Export
            </Button>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-1">
             <button 
               onClick={handleAnalyze}
               className="p-2 text-hydra-400 hover:bg-dark-bg rounded-md"
             >
               <Play size={18} />
             </button>
          </div>

          <div className="w-px h-4 bg-dark-border mx-1 md:hidden"></div>

          {/* Toggles */}
          <button 
            onClick={() => { setShowFiles(!showFiles); setShowChat(false); }}
            className={`p-2 rounded-md md:hidden ${showFiles ? 'text-white bg-hydra-900/20' : 'text-gray-400'}`}
          >
            <Menu size={20} />
          </button>
          <button 
            onClick={() => { setShowChat(!showChat); setShowFiles(false); }}
            className={`p-2 rounded-md md:hidden ${showChat ? 'text-white bg-hydra-900/20' : 'text-gray-400'}`}
          >
            <Cpu size={20} />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* File Explorer - Responsive Sidebar */}
        <aside className={`
          w-64 border-r border-dark-border bg-dark-bg flex flex-col shrink-0
          md:relative absolute inset-y-0 left-0 z-30 transition-transform duration-300
          ${showFiles ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-3 flex items-center justify-between border-b border-dark-border/50 md:border-none">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Files</span>
             <button onClick={() => setShowFiles(false)} className="md:hidden text-gray-500">
               <X size={16} />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {project.files.map(file => (
              <div 
                key={file.id}
                onClick={() => { setSelectedFileId(file.id); setShowFiles(false); }}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors border-l-2
                  ${selectedFileId === file.id ? 'bg-hydra-900/10 text-hydra-300 border-hydra-500' : 'border-transparent hover:bg-dark-surface text-gray-400 hover:text-gray-200'}
                `}
              >
                <FileCode size={16} />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Code Editor */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative z-0">
           {selectedFile ? (
             <>
                <div className="flex items-center justify-between px-4 py-2 bg-dark-bg border-b border-dark-border shrink-0">
                  <span className="text-sm font-mono text-gray-400 truncate">{selectedFile.name}</span>
                  <button 
                    onClick={handleSaveFile}
                    className="text-gray-500 hover:text-hydra-400 transition-colors p-1"
                    title="Save"
                  >
                    <Save size={16} />
                  </button>
                </div>
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="flex-1 w-full h-full bg-transparent p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none leading-6"
                  spellCheck={false}
                />
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-4 text-center">
               <FileCode size={48} className="mb-4 opacity-20" />
               <p>Select a file to edit</p>
             </div>
           )}
        </main>

        {/* Hydra Chat - Responsive Sidebar */}
        <aside className={`
          w-80 lg:w-96 bg-dark-surface flex flex-col shrink-0
          md:relative absolute inset-y-0 right-0 z-30 border-l border-dark-border transition-transform duration-300
          ${showChat ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="h-10 border-b border-dark-border flex items-center justify-between px-4 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Cpu className="text-hydra-500" size={16} />
              <span className="font-medium text-white text-sm">Hydra Agent</span>
            </div>
            <button onClick={() => setShowChat(false)} className="md:hidden text-gray-500">
               <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {chatHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm px-4">
                <p>Hydra is ready.</p>
                <p className="mt-2 text-xs">Ask me to refactor code, fix bugs, or explain the logic.</p>
              </div>
            )}
            
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[90%] rounded-lg p-3 text-sm whitespace-pre-wrap break-words
                    ${msg.role === 'user' ? 'bg-hydra-600 text-white' : 'bg-dark-bg border border-dark-border text-gray-300'}
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-dark-border bg-dark-bg shrink-0">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Hydra..."
                className="w-full bg-dark-surface border border-dark-border rounded-lg py-2 pl-3 pr-10 text-sm text-white focus:outline-none focus:border-hydra-500 transition-colors"
                disabled={isStreaming}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isStreaming || !chatInput.trim()}
                className="absolute right-2 top-2 text-gray-400 hover:text-hydra-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};