
import React from 'react';
import { Message, MessageType, Translation, TransferOffer } from '../types';
import { Mail, AlertTriangle, TrendingUp, Briefcase, DollarSign, Check, X, Trash2, AlertCircle } from 'lucide-react';

interface NewsCenterProps {
   messages: Message[];
   pendingOffers?: TransferOffer[];
   onMarkAsRead: (id: string) => void;
   onDeleteMessage?: (id: string) => void;
   onDeleteAllRead?: () => void;
   onDeleteAll?: () => void;
   onAcceptOffer?: (offerId: string) => void;
   onRejectOffer?: (offerId: string) => void;
   t: Translation;
}

export const NewsCenter: React.FC<NewsCenterProps> = ({ messages, pendingOffers, onMarkAsRead, onDeleteMessage, onDeleteAllRead, onDeleteAll, onAcceptOffer, onRejectOffer, t }) => {
   const sortedMessages = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

   // Count critical unread messages
   const criticalUnread = messages.filter(m => !m.isRead && (
      m.type === MessageType.INJURY ||
      m.type === MessageType.TRANSFER_OFFER ||
      m.subject?.includes('Kırmızı') ||
      m.subject?.includes('Sakatl')
   )).length;

   const readMessages = messages.filter(m => m.isRead).length;

   const getIcon = (type: MessageType) => {
      switch (type) {
         case MessageType.INJURY: return <AlertTriangle className="text-red-500" />;
         case MessageType.TRAINING: return <TrendingUp className="text-emerald-500" />;
         case MessageType.BOARD: return <Briefcase className="text-blue-500" />;
         case MessageType.TRANSFER_OFFER: return <DollarSign className="text-yellow-500" />;
         default: return <Mail className="text-slate-400" />;
      }
   };

   // Get border color for message type
   const getBorderClass = (msg: Message) => {
      if (msg.isRead) return 'border-slate-700';
      if (msg.type === MessageType.INJURY) return 'border-l-red-500 animate-pulse';
      if (msg.type === MessageType.TRANSFER_OFFER) return 'border-l-yellow-500';
      if (msg.type === MessageType.BOARD) return 'border-l-blue-500';
      return 'border-l-emerald-500';
   };

   // Find pending offer for a message
   const getOfferForMessage = (msg: Message): TransferOffer | undefined => {
      if (msg.type !== MessageType.TRANSFER_OFFER || !msg.data?.offerId) return undefined;
      return pendingOffers?.find(o => o.id === msg.data.offerId && o.status === 'PENDING');
   };

   return (
      <div className="space-y-4 animate-fade-in">
         <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl mb-6">
            <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <Mail className="text-emerald-500" /> {t.inbox}
                     {criticalUnread > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                           <AlertCircle size={12} /> {criticalUnread} Acil
                        </span>
                     )}
                  </h2>
                  <p className="text-slate-400 text-sm">Kulübünüzle ilgili son haberler.</p>
               </div>

               {/* Delete All Read Button */}
               {readMessages > 0 && onDeleteAllRead && (
                  <button
                     onClick={onDeleteAllRead}
                     className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm font-bold rounded-lg border border-slate-500/30 transition-all"
                  >
                     <Trash2 size={16} /> Okunanları Sil ({readMessages})
                  </button>
               )}
               {messages.length > 0 && onDeleteAll && (
                  <button
                     onClick={onDeleteAll}
                     className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 text-sm font-bold rounded-lg border border-red-500/30 transition-all"
                  >
                     <Trash2 size={16} /> Hepsini Sil
                  </button>
               )}
            </div>
         </div>

         <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {sortedMessages.length === 0 && (
               <div className="text-center text-slate-500 py-10">{t.noMessages}</div>
            )}
            {sortedMessages.map(msg => {
               const pendingOffer = getOfferForMessage(msg);

               return (
                  <div
                     key={msg.id}
                     className={`p-4 rounded-lg border-l-4 transition-all group ${msg.isRead ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800 border-y-slate-700 border-r-slate-700 shadow-md'} ${getBorderClass(msg)}`}
                  >
                     <div className="flex items-start gap-4">
                        <div className="mt-1">{getIcon(msg.type)}</div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                              <h3
                                 className={`text-sm font-bold ${msg.isRead ? 'text-slate-300' : 'text-white'} cursor-pointer hover:underline`}
                                 onClick={() => onMarkAsRead(msg.id)}
                              >
                                 {msg.subject}
                              </h3>
                              <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-500">{msg.week}. {t.week}</span>
                                 {onDeleteMessage && (
                                    <button
                                       onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id); }}
                                       className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                       title="Mesajı Sil"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                 )}
                              </div>
                           </div>
                           <p className="text-sm text-slate-400 leading-relaxed">{msg.body}</p>

                           {/* Transfer Offer Actions */}
                           {pendingOffer && (
                              <div className="mt-3 flex gap-2">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); onAcceptOffer && onAcceptOffer(pendingOffer.id); }}
                                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all"
                                 >
                                    <Check size={16} /> Kabul
                                 </button>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); onRejectOffer && onRejectOffer(pendingOffer.id); }}
                                    className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all"
                                 >
                                    <X size={16} /> Reddet
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
