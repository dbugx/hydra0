import React from 'react';
import { Project } from '../types';
import { Folder, GitBranch, Clock, MoreVertical, HardDrive } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
  onClone: (id: string) => void;
  onRename: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onClone, onRename }) => {
  return (
    <div 
      onClick={() => onClick(project.id)}
      className="group relative bg-dark-surface border border-dark-border rounded-xl p-4 cursor-pointer hover:border-hydra-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-dark-bg rounded-lg border border-dark-border group-hover:border-hydra-500/30 transition-colors">
          {project.source === 'drive' ? (
            <HardDrive className="w-5 h-5 text-blue-400" />
          ) : (
            <Folder className="w-5 h-5 text-hydra-400" />
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRename(project.id); }}
          className="text-gray-500 hover:text-white p-1"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      <h3 className="text-base font-semibold text-white mb-1 truncate pr-2">{project.name}</h3>
      <p className="text-gray-400 text-xs h-8 overflow-hidden line-clamp-2 mb-3">
        {project.description || "No description provided."}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-dark-border pt-2">
        <div className="flex items-center gap-1.5">
          <Clock size={10} />
          <span>{new Date(project.lastModified).toLocaleDateString()}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClone(project.id); }}
          className="flex items-center gap-1 hover:text-hydra-300 transition-colors"
        >
          <GitBranch size={10} />
          <span>Clone</span>
        </button>
      </div>
    </div>
  );
};