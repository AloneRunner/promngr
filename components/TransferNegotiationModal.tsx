
import React, { useState, useEffect } from 'react';
import { Player, Team, Translation } from '../types';
import { DollarSign, MessageCircle, AlertTriangle, Briefcase, X } from 'lucide-react';

interface TransferNegotiationModalProps {
    player: Player;
    userTeam: Team;
    onClose: () => void;
    onComplete: (player: Player, finalPrice: number) => void;
    t: Translation;
}

type NegotiationState = 'INITIAL' | 'NEGOTIATING' | 'AGREED' | 'REJECTED' | 'WALKOUT';

export const TransferNegotiationModal: React.FC<TransferNegotiationModalProps> = ({ player, userTeam, onClose, onComplete, t }) => {
    const [offer, setOffer] = useState<number>(player.value);
    const [status, setStatus] = useState<NegotiationState>('INITIAL');
    const [clubMessage, setClubMessage] = useState<string>('');
    const [patience, setPatience] = useState<number>(3); // 3 attempts before walkout
    const [requiredPrice, setRequiredPrice] = useState<number>(0);

    // Initial calculation of AI asking price
    useEffect(() => {
        let multiplier = 1.0;

        if (!player.isTransferListed) {
            // Unlisted players are MUCH harder to get
            multiplier += 0.8; // +80% base premium
            if (player.overall > 82) multiplier += 0.5; // Star player premium
            if (player.age < 24) multiplier += 0.3; // Young talent premium
            if (player.contractYears > 2) multiplier += 0.2; // Long contract premium
        } else {
            if (player.age < 23) multiplier += 0.2; // Young tax
            if (player.overall > 80) multiplier += 0.2; // Star tax
        }

        // Random variance +/- 10%
        const variance = 0.95 + Math.random() * 0.15;
        const calculatedPrice = Math.floor(player.value * multiplier * variance);
        setRequiredPrice(calculatedPrice);

        if (player.isTransferListed) {
            setClubMessage(t.negotiationOpen
                .replace('{name}', player.lastName)
                .replace('{value}', `€${(player.value / 1000000).toFixed(1)}M`));
        } else {
            const messages = t.negotiationUnlisted as string[];
            setClubMessage(messages[Math.floor(Math.random() * messages.length)].replace('{name}', player.lastName));
            // Reduce patience for unlisted players
            setPatience(2);
        }
    }, [player, t]);

    const handleOffer = (amount: number) => {
        if (patience <= 0) {
            setStatus('WALKOUT');
            setClubMessage(t.negotiationWalkout);
            return;
        }

        // For unlisted players, they are stricter
        const strictness = !player.isTransferListed ? 1.1 : 1.0;

        if (amount >= requiredPrice) {
            setStatus('AGREED');
            setClubMessage(!player.isTransferListed ? t.negotiationAcceptUnlisted : t.negotiationAccept);
        } else if (amount >= requiredPrice * 0.85) {
            // Close, counter offer
            const counter = Math.floor((amount + requiredPrice) / 2);
            setStatus('NEGOTIATING');
            setClubMessage(t.negotiationCounter.replace('{amount}', `€${(counter / 1000000).toFixed(2)}M`));
            setRequiredPrice(counter); // AI compromises
            setPatience(p => p - 1);
        } else {
            // Reject
            const rejectMsgs = !player.isTransferListed
                ? (t.negotiationRejectUnlisted as string[])
                : (t.negotiationReject as string[]);

            setStatus('NEGOTIATING');
            setClubMessage(rejectMsgs[Math.floor(Math.random() * rejectMsgs.length)]);
            setPatience(p => p - 1);
        }
    };

    const handleInsist = () => {
        // "Insist" mechanic:
        // Pressure the club. High risk, high reward.
        // If difference is < 15%, may force accept.
        // If difference is large, immediate walkout.

        const gap = (requiredPrice - offer) / requiredPrice;
        const riskThreshold = !player.isTransferListed ? 0.08 : 0.15; // Harder to insist on unlisted

        if (gap < riskThreshold) {
            // Success!
            setStatus('AGREED');
            setClubMessage(t.negotiationInsistSuccess);
        } else {
            // Failure
            setStatus('WALKOUT');
            setClubMessage(t.negotiationInsistFail);
        }
    };

    const handleConfirmBuy = () => {
        onComplete(player, offer);
    };

    const formatMoney = (val: number) => `€${(val / 1000000).toFixed(1)}M`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`bg-slate-900 border-2 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative transition-colors duration-500 overflow-hidden ${status === 'WALKOUT' ? 'border-red-600' :
                status === 'AGREED' ? 'border-emerald-500' : 'border-slate-700'
                }`}>

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-lg">
                            <div className="text-2xl font-bold text-white mb-1" style={{ color: '#fff' }}>{player.firstName.charAt(0)}{player.lastName.charAt(0)}</div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{player.firstName} {player.lastName}</h2>
                            <div className="text-xs text-slate-400 font-mono">{t.currentValue}: {formatMoney(player.value)}</div>
                            <div className={`text-xs font-bold mt-1 ${player.isTransferListed ? 'text-emerald-400' : 'text-red-400'}`}>
                                {player.isTransferListed ? t.transferList : t.unlisted || 'UNLISTED'}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
                </div>

                {/* Chat Bubble Interface */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6 relative border border-slate-700 min-h-[100px] flex items-center">
                    <MessageCircle className="absolute top-4 left-4 text-slate-600 opacity-20" size={40} />
                    <p className={`text-sm md:text-base font-medium relative z-10 pl-2 ${status === 'WALKOUT' ? 'text-red-400' :
                        status === 'AGREED' ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                        "{clubMessage}"
                    </p>
                </div>

                {/* Negotiation Controls */}
                {status !== 'AGREED' && status !== 'WALKOUT' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-slate-500 font-bold mb-2 flex justify-between">
                                <span>{t.value || 'Your Offer'}</span>
                                <span className={userTeam.budget < offer ? 'text-red-500' : 'text-emerald-500'}>{t.clubBudget}: {formatMoney(userTeam.budget)}</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setOffer(Math.max(0, offer - 500000))} className="p-3 bg-slate-800 rounded-lg text-white hover:bg-slate-700 font-bold">-</button>
                                <div className="flex-1 relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                                    <div
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-8 pr-4 text-white font-mono font-bold text-center"
                                    >
                                        €{Math.round(offer).toLocaleString('tr-TR')}
                                    </div>
                                </div>
                                <button onClick={() => setOffer(offer + 500000)} className="p-3 bg-slate-800 rounded-lg text-white hover:bg-slate-700 font-bold">+</button>
                            </div>
                            {userTeam.budget < offer && <div className="text-[10px] text-red-500 mt-1 font-bold">⚠️ {t.insufficientFunds}</div>}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleOffer(offer)}
                                disabled={userTeam.budget < offer}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Briefcase size={18} /> {t.makeOffer}
                            </button>

                            {/* Insist Button - Shows only after first attempt */}
                            {status === 'NEGOTIATING' && (
                                <button
                                    onClick={handleInsist}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-col items-center justify-center gap-1"
                                    title={t.insistHelp}
                                >
                                    <AlertTriangle size={18} />
                                    <span className="text-xs uppercase">{t.insist}</span>
                                </button>
                            )}
                        </div>

                        <div className="flex justify-center gap-1 mt-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < patience ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                            ))}
                            <span className="text-[10px] text-slate-500 ml-2">{t.patience}</span>
                        </div>
                    </div>
                )}

                {/* Agreed State */}
                {status === 'AGREED' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl text-center">
                            <h3 className="text-emerald-400 font-bold text-lg mb-1">{t.dealAgreed}</h3>
                            <p className="text-slate-300 text-sm">Transfer fee: {formatMoney(offer)}</p>
                        </div>
                        <button
                            onClick={handleConfirmBuy}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/50 transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg"
                        >
                            <DollarSign size={24} /> {t.confirmTransfer}
                        </button>
                    </div>
                )}

                {/* Walkout State */}
                {status === 'WALKOUT' && (
                    <div className="animate-fade-in">
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-center mb-4">
                            <h3 className="text-red-400 font-bold text-lg mb-1">{t.negotiationFailed}</h3>
                            <p className="text-slate-300 text-sm">{t.negotiationFailedDesc}</p>
                        </div>
                        <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg">{t.close}</button>
                    </div>
                )}
            </div>
        </div>
    );
};
