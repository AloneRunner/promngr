
import React from 'react';
import { Message, MessageType, Translation, TransferOffer } from '../types';
import { Mail, AlertTriangle, TrendingUp, Briefcase, DollarSign, Check, X } from 'lucide-react';

interface NewsCenterProps {
   messages: Message[];
   pendingOffers?: TransferOffer[];
   onMarkAsRead: (id: string) => void;
   onAcceptOffer?: (offerId: string) => void;
   onRejectOffer?: (offerId: string) => void;
   t: Translation;
}

export const NewsCenter: React.FC<NewsCenterProps> = ({ messages, pendingOffers, onMarkAsRead, onAcceptOffer, onRejectOffer, t }) => {
   const sortedMessages = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

   const getIcon = (type: MessageType) => {
      switch (type) {
         case MessageType.INJURY: return <AlertTriangle className="text-red-500" />;
         case MessageType.TRAINING: return <TrendingUp className="text-emerald-500" />;
         case MessageType.BOARD: return <Briefcase className="text-blue-500" />;
         case MessageType.TRANSFER_OFFER: return <DollarSign className="text-yellow-500" />;
         default: return <Mail className="text-slate-400" />;
      }
   };

   // Find pending offer for a message
   const getOfferForMessage = (msg: Message): TransferOffer | undefined => {
      if (msg.type !== MessageType.TRANSFER_OFFER || !msg.data?.offerId) return undefined;
      return pendingOffers?.find(o => o.id === msg.data.offerId && o.status === 'PENDING');
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
            {sortedMessages.map(msg => {
               const pendingOffer = getOfferForMessage(msg);

               return (
                  <div
                     key={msg.id}
                     className={`p-4 rounded-lg border transition-all ${msg.isRead ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-800 border-l-4 border-l-emerald-500 border-y-slate-700 border-r-slate-700 shadow-md'} ${pendingOffer ? 'border-l-yellow-500' : ''}`}
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

                           {/* Transfer Offer Actions */}
                           {pendingOffer && (
                              <div className="mt-3 flex gap-2">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); onAcceptOffer && onAcceptOffer(pendingOffer.id); }}
                                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all"
                                 >
                                    <Check size={16} /> Accept
                                 </button>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); onRejectOffer && onRejectOffer(pendingOffer.id); }}
                                    className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all"
                                 >
                                    <X size={16} /> Reject
                                 </button>
                                 <span className="ml-auto text-yellow-400 font-mono text-sm self-center">
                                    €{(pendingOffer.offerAmount / 1000000).toFixed(1)}M
                                 </span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};
