
import React from 'react';
import { Message, MessageType, Translation } from '../types';
import { Mail, AlertTriangle, TrendingUp, Briefcase } from 'lucide-react';

interface NewsCenterProps {
  messages: Message[];
  onMarkAsRead: (id: string) => void;
  t: Translation;
}

export const NewsCenter: React.FC<NewsCenterProps> = ({ messages, onMarkAsRead, t }) => {
  const sortedMessages = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIcon = (type: MessageType) => {
    switch(type) {
      case MessageType.INJURY: return <AlertTriangle className="text-red-500" />;
      case MessageType.TRAINING: return <TrendingUp className="text-emerald-500" />;
      case MessageType.BOARD: return <Briefcase className="text-blue-500" />;
      default: return <Mail className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="text-emerald-500" /> {t.inbox}
          </h2>
          <p className="text-slate-400 text-sm">Stay updated with the latest club news.</p>
       </div>

       <div className="space-y-3">
          {sortedMessages.length === 0 && (
              <div className="text-center text-slate-500 py-10">{t.noMessages}</div>
          )}
          {sortedMessages.map(msg => (
             <div 
                key={msg.id} 
                className={`p-4 rounded-lg border transition-all ${msg.isRead ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-800 border-l-4 border-l-emerald-500 border-y-slate-700 border-r-slate-700 shadow-md'}`}
                onClick={() => onMarkAsRead(msg.id)}
             >
                <div className="flex items-start gap-4">
                   <div className="mt-1">{getIcon(msg.type)}</div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className={`text-sm font-bold ${msg.isRead ? 'text-slate-300' : 'text-white'}`}>{msg.subject}</h3>
                         <span className="text-xs text-slate-500">{msg.week}. {t.week}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{msg.body}</p>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
