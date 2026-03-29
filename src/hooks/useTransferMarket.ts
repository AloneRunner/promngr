
import React, { useState, useCallback } from 'react';
import { GameState, Player, Team, LineupStatus, MessageType } from '../../types';
import { assignJerseyNumber, uuid } from '../utils/playerUtils';
import { appendMessages, prunePendingOffers } from '../utils/stateLimits';
import { getLeagueMultiplier } from '../../services/engine';

interface UseTransferMarketProps {
    gameState: GameState | null;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    t: any;
}

export const useTransferMarket = ({ gameState, setGameState, t }: UseTransferMarketProps) => {
    const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);

    // Use ref to access latest state without adding it to dependencies (performance optimization)
    const gameStateRef = React.useRef(gameState);
    React.useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const handleBuyPlayer = useCallback((player: Player) => {
        // FREE AGENTS: Skip negotiation, complete transfer directly at listed price
        if (player.teamId === 'FREE_AGENT') {
            // Initiate transfer (using ref to check funds inside the handler if needed, but here we pass directly)
            // Actually, handleTransferComplete will do the check.
            handleTransferComplete(player, player.value);
            return;
        }

        // Other players: Open negotiation modal
        setNegotiatingPlayer(player);
    }, []); // Check deps - handleTransferComplete needs to be stable or in dep array.
    // Since handleTransferComplete is below, we depend on it? useCallback hoisting?
    // Const functions can't be hoisted. I need to re-order or use a ref for the handler?
    // Circular dependency issue if I'm not careful.
    // handleBuyPlayer calls handleTransferComplete. handleTransferComplete must be defined BEFORE or be in dependency.
    // Defined below... React functional component won't see it if using const. 
    // I should move handleBuyPlayer BELOW handleTransferComplete or use separate function.
    // Wait, in current code handleBuyPlayer IS defined BEFORE.
    // Does it work? Yes, if handleTransferComplete is stable. But it's const.
    // JS variables are not hoisted if const.
    // I will reorder them.

    // ... redefining to ensure correct order ...

    const handleTransferComplete = useCallback((player: Player, finalPrice: number) => {
        const currentGameState = gameStateRef.current;
        if (!currentGameState) return;

        const userTeam = currentGameState.teams.find(t => t.id === currentGameState.userTeamId);
        if (!userTeam) return;

        // ========== PLAYER AMBITION / WILLINGNESS SYSTEM ==========
        // Factors: reputation gap, LEAGUE TIER DROP (dynamic), player age, OVR, overpay
        if (player.teamId !== 'FREE_AGENT') {
            const sellerTeam = currentGameState.teams.find(t => t.id === player.teamId);
            const sellerRep = sellerTeam?.reputation || 5000;
            const buyerRep = userTeam.reputation || 5000;
            const repGap = sellerRep - buyerRep;

            if (repGap > 800) {
                let willingness = 1.0;

                // 1. Reputation gap penalty
                if (repGap > 4000) willingness -= 0.65;
                else if (repGap > 3000) willingness -= 0.45;
                else if (repGap > 2000) willingness -= 0.30;
                else if (repGap > 1000) willingness -= 0.15;
                else willingness -= 0.05;

                // 2. LEAGUE TIER DROP — dynamic via getLeagueMultiplier
                const srcMult = getLeagueMultiplier(sellerTeam?.leagueId || '');
                const dstMult = getLeagueMultiplier(userTeam.leagueId);
                const tierDrop = srcMult - dstMult; // Positive = moving to weaker league

                if (tierDrop > 0.7) {
                    if (player.age < 27) willingness -= 0.65;
                    else if (player.age < 30) willingness -= 0.40;
                    else willingness -= 0.10;
                } else if (tierDrop > 0.35) {
                    if (player.age < 27) willingness -= 0.35;
                    else if (player.age < 30) willingness -= 0.15;
                }

                // 3. Age: veterans more open to adventure/money
                if (player.age >= 32) willingness += 0.35;
                else if (player.age >= 29) willingness += 0.20;
                else if (player.age >= 27) willingness += 0.05;

                // 4. Overpay — money helps but can't fully replace prestige gap
                const overpayRatio = finalPrice / Math.max(1, player.value);
                if (overpayRatio >= 2.5) willingness += 0.20;
                else if (overpayRatio >= 2.0) willingness += 0.14;
                else if (overpayRatio >= 1.5) willingness += 0.07;
                else if (overpayRatio >= 1.2) willingness += 0.03;

                // 5. Unhappy players more willing to leave
                if ((player.morale || 75) < 40) willingness += 0.25;

                // 6. REJECTION COOLDOWN — each rejection makes the player slightly more willing
                // This prevents infinite spam but still requires effort (max 3 rejections = +0.30)
                const rejKey = `pfm_reject_${player.id}`;
                const prevRejects = parseInt(sessionStorage.getItem(rejKey) || '0');
                willingness += prevRejects * 0.10; // Each past rejection adds 10% willingness

                willingness = Math.max(0.02, Math.min(0.97, willingness));

                if (Math.random() > willingness) {
                    // Track rejection count for cooldown
                    sessionStorage.setItem(rejKey, String(Math.min(prevRejects + 1, 5)));

                    // ★ VISUAL TOAST — user sees rejection immediately ★
                    const reason = tierDrop > 0.7 && player.age < 30
                        ? (t.playerPrefersPrestigiousLeague || `⛔ ${player.firstName} ${player.lastName} daha prestijli bir ligde oynamayı tercih ediyor!`)
                        : (t.playerRejectedCareerGoals || `⛔ ${player.firstName} ${player.lastName} kariyer hedefleri nedeniyle transferi reddetti!`);

                    // Use alert for IMMEDIATE visual feedback (shows before inbox message)
                    alert(reason);

                    // Also add to inbox for record
                    setGameState(prev => {
                        if (!prev) return null;
                        const msg = { id: uuid(), week: prev.currentWeek, type: MessageType.INFO, subject: t.transferRejectedSubject || 'Transfer Reddedildi', body: reason, isRead: false, date: new Date().toISOString() };
                        return { ...prev, messages: [msg, ...prev.messages].slice(0, 200) };
                    });
                    return;
                } else {
                    // Player accepted! Clear rejection counter
                    sessionStorage.removeItem(rejKey);
                }
            }
        }

        // ========== SELLING TEAM REJECTION SYSTEM ==========
        // Same rules as AI-to-AI: the selling club is NOT obligated to sell just because user wants to buy.
        // Exception: transfer-listed (club wants to sell), free agents, expiring contracts
        if (player.teamId !== 'FREE_AGENT' && !player.isTransferListed) {
            const sellerTeam = currentGameState.teams.find(t => t.id === player.teamId);
            if (sellerTeam) {
                const sellerPlayers = currentGameState.players.filter(p => p.teamId === sellerTeam.id);
                const isStarter = player.lineup === 'STARTING';
                const posCount = sellerPlayers.filter(p => p.position === player.position).length;
                const wouldLeaveShort = posCount <= 3;
                const sellerAvg = sellerPlayers.reduce((s, p) => s + p.overall, 0) / Math.max(1, sellerPlayers.length);
                const sortedByOvr = [...sellerPlayers].sort((a, b) => b.overall - a.overall);
                const isTop3 = sortedByOvr.slice(0, 3).some(p => p.id === player.id);
                const isTop5 = sortedByOvr.slice(0, 5).some(p => p.id === player.id);
                const offerRatio = finalPrice / Math.max(1, player.value);
                const hasExpiringContract = (player.contractYears ?? 99) <= 1;

                // Expiring contract = selling team is more willing (player leaving anyway)
                if (!hasExpiringContract) {
                    // "Can I replace him?" — same check as AI-to-AI
                    const sellerBudgetAfterSale = sellerTeam.budget + finalPrice;
                    const replacementExists = currentGameState.players.some(rp =>
                        rp.id !== player.id &&
                        rp.teamId !== sellerTeam.id &&
                        rp.position === player.position &&
                        rp.overall >= player.overall - 3 &&
                        (rp.isTransferListed || rp.teamId === 'FREE_AGENT' || (rp.contractYears ?? 99) <= 1) &&
                        rp.value <= sellerBudgetAfterSale * 0.7
                    );

                    // Calculate rejection chance
                    let clubRejectChance = 0.10;
                    if (isStarter) clubRejectChance += 0.25;
                    if (wouldLeaveShort) clubRejectChance += 0.30;
                    if (isTop3 && player.overall >= 85) clubRejectChance += 0.25;
                    else if (isTop5 && player.overall >= 80) clubRejectChance += 0.15;

                    // No replacement = much higher rejection
                    if (!replacementExists && (isStarter || player.overall >= sellerAvg)) {
                        clubRejectChance += 0.30;
                    }

                    // Overpay reduces rejection
                    if (offerRatio >= 2.5) clubRejectChance -= 0.35;
                    else if (offerRatio >= 2.0) clubRejectChance -= 0.25;
                    else if (offerRatio >= 1.5) clubRejectChance -= 0.15;
                    else if (offerRatio >= 1.2) clubRejectChance -= 0.05;
                    // Underpay increases rejection
                    if (offerRatio < 0.9) clubRejectChance += 0.20;

                    // Buyer prestige helps (big clubs get respect)
                    if (userTeam.reputation > sellerTeam.reputation + 2000) clubRejectChance -= 0.15;

                    clubRejectChance = Math.max(0.05, Math.min(0.90, clubRejectChance));

                    // Rejection cooldown for club too (separate from player willingness)
                    const clubRejKey = `pfm_club_reject_${player.id}`;
                    const prevClubRejects = parseInt(sessionStorage.getItem(clubRejKey) || '0');
                    clubRejectChance -= prevClubRejects * 0.08; // Each retry reduces by 8%
                    clubRejectChance = Math.max(0.05, clubRejectChance);

                    if (Math.random() < clubRejectChance) {
                        sessionStorage.setItem(clubRejKey, String(Math.min(prevClubRejects + 1, 6)));

                        const clubReason = isTop3
                            ? (t.clubRejectsStarSale || `🚫 ${sellerTeam.name} yıldız oyuncusunu satmayı reddetti!`)
                            : !replacementExists
                                ? (t.clubRejectsNoReplacement || `🚫 ${sellerTeam.name} yerine oyuncu bulamayacağı için teklifi reddetti!`)
                                : (t.clubRejectsOffer || `🚫 ${sellerTeam.name} teklifi yeterli bulmadı!`);

                        alert(clubReason);
                        setGameState(prev => {
                            if (!prev) return null;
                            const msg = { id: uuid(), week: prev.currentWeek, type: MessageType.INFO, subject: t.clubRejectedSubject || 'Kulüp Teklifi Reddetti', body: clubReason, isRead: false, date: new Date().toISOString() };
                            return { ...prev, messages: [msg, ...prev.messages].slice(0, 200) };
                        });
                        return;
                    } else {
                        sessionStorage.removeItem(clubRejKey);
                    }
                }
            }
        }
        const transferTax = Math.floor(finalPrice * 0.10);
        const totalCost = finalPrice + transferTax;

        if (userTeam.budget < totalCost) {
            setGameState(prev => {
                if (!prev) return null;
                const msg = { id: uuid(), week: prev.currentWeek, type: MessageType.INFO, subject: 'Yetersiz Bütçe', body: t.notEnoughFunds || 'Transfer için yeterli bütçeniz yok.', isRead: false, date: new Date().toISOString() };
                return { ...prev, messages: [msg, ...prev.messages].slice(0, 200) };
            });
            return;
        }

        setGameState(prev => {
            if (!prev) return null;

            const uTeam = prev.teams.find(t => t.id === prev.userTeamId);
            if (!uTeam) return prev;

            const sellerTeamId = player.teamId;
            const currentTeamPlayers = prev.players.filter(p => p.teamId === uTeam.id);
            const newJerseyNumber = assignJerseyNumber(player, currentTeamPlayers);

            const updatedPlayers = prev.players.map(p => {
                if (p.id === player.id) {
                    return {
                        ...p,
                        teamId: uTeam.id,
                        isTransferListed: false,
                        lineup: 'RESERVE' as LineupStatus,
                        lineupIndex: 99,
                        contractYears: 3,
                        jerseyNumber: newJerseyNumber,
                        lastTransferWeek: prev.currentWeek
                    };
                }
                return p;
            });
            const updatedMarket = prev.transferMarket.filter(p => p.id !== player.id);

            const updatedTeams = prev.teams.map(t => {
                if (t.id === uTeam.id) {
                    // Buyer pays fee + tax
                    const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                    const seasonTotals = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                    return { ...t, budget: t.budget - totalCost, financials: { ...fin, seasonTotals: { ...seasonTotals, transferExpensesThisSeason: seasonTotals.transferExpensesThisSeason + totalCost } } };
                }
                if (t.id === sellerTeamId && sellerTeamId !== 'FREE_AGENT') {
                    // Seller receives only the base fee (tax stays in pot)
                    const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                    const seasonTotals = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                    return { ...t, budget: t.budget + finalPrice, financials: { ...fin, seasonTotals: { ...seasonTotals, transferIncomeThisSeason: seasonTotals.transferIncomeThisSeason + finalPrice } } };
                }
                return t;
            });

            return {
                ...prev,
                players: updatedPlayers,
                transferMarket: updatedMarket,
                teams: updatedTeams,
                transferTaxPot: (prev.transferTaxPot || 0) + transferTax,
            };
        });

        setNegotiatingPlayer(null);
    }, [setGameState, t]);


    // Define handleBuyPlayer AFTER handleTransferComplete to avoid 'used before defined'
    const handleBuyPlayerFunc = useCallback((player: Player) => {
        if (player.teamId === 'FREE_AGENT') {
            handleTransferComplete(player, player.value);
            return;
        }
        setNegotiatingPlayer(player);
    }, [handleTransferComplete]);


    const handlePromoteYouth = useCallback((player: Player) => {
        const currentGameState = gameStateRef.current;
        if (!currentGameState) return;
        const userTeam = currentGameState.teams.find(t => t.id === currentGameState.userTeamId);
        if (!userTeam) return;

        const signingFee = Math.floor(player.value * 0.5);

        // Validation Check
        if (userTeam.budget < signingFee) {
            alert(t.notEnoughFunds);
            return;
        }

        setGameState(prev => {
            if (!prev) return null;
            // logic
            const uTeam = prev.teams.find(t => t.id === prev.userTeamId);
            if (!uTeam) return prev;

            const currentTeamPlayers = prev.players.filter(p => p.teamId === uTeam.id);
            const newJerseyNumber = assignJerseyNumber(player, currentTeamPlayers);

            const updatedPlayers = prev.players.concat([{
                ...player,
                teamId: uTeam.id,
                lineup: 'RESERVE',
                lineupIndex: 99,
                contractYears: 5,
                isTransferListed: false,
                jerseyNumber: newJerseyNumber
            }]);
            const updatedTeams = prev.teams.map(t => t.id === uTeam.id ? { ...t, budget: t.budget - signingFee, youthCandidates: t.youthCandidates.filter(yp => yp.id !== player.id) } : t);

            return { ...prev, players: updatedPlayers, teams: updatedTeams };
        });
        alert(`${t.promotedToSenior} ${player.lastName}`);
    }, [setGameState, t]);

    const handleAcceptOffer = useCallback((offerId: string) => {
        const currentGameState = gameStateRef.current;
        if (!currentGameState) return;

        const offer = currentGameState.pendingOffers?.find(o => o.id === offerId);
        if (!offer || offer.status !== 'PENDING') return;

        // Validation Check
        const MIN_SQUAD_SIZE = 14;
        const currentSquadSize = currentGameState.players.filter(p => p.teamId === currentGameState.userTeamId).length;
        if (currentSquadSize <= MIN_SQUAD_SIZE) {
            alert(t.cannotSellMinSquad || `Kadro minimum ${MIN_SQUAD_SIZE} oyuncuya düştü. Daha fazla satış yapamazsınız!`);
            return; // EXIT EARLY without state update
        }

        setGameState(prev => {
            if (!prev) return null;

            // Logic is safe here, no alerts inside
            const offerInner = prev.pendingOffers?.find(o => o.id === offerId);
            if (!offerInner) return prev;

            const player = prev.players.find(p => p.id === offerInner.playerId);
            const buyingTeam = prev.teams.find(t => t.id === offerInner.toTeamId);

            if (!player || !buyingTeam) return prev;

            // Guard: player must still belong to user — prevents double-sell if multiple offers accepted
            if (player.teamId !== prev.userTeamId) {
                const cancelledOffers = (prev.pendingOffers || []).map(o =>
                    o.id === offerId ? { ...o, status: 'REJECTED' as const } : o
                );
                return { ...prev, pendingOffers: cancelledOffers };
            }

            const updatedPlayers = prev.players.map(p => {
                if (p.id === offerInner.playerId) {
                    return { ...p, teamId: offerInner.toTeamId, isTransferListed: false, lineup: 'RESERVE' as LineupStatus, lineupIndex: 99, lastTransferWeek: prev.currentWeek };
                }
                return p;
            });

            const updatedTeams = prev.teams.map(t => {
                if (t.id === prev.userTeamId) {
                    // Update seller's income
                    const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                    const seasonTotals = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                    return { ...t, budget: t.budget + offerInner.offerAmount, financials: { ...fin, seasonTotals: { ...seasonTotals, transferIncomeThisSeason: seasonTotals.transferIncomeThisSeason + offerInner.offerAmount } } };
                }
                if (t.id === offerInner.toTeamId) {
                    // Update buyer's expenses
                    const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                    const seasonTotals = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                    return { ...t, budget: t.budget - offerInner.offerAmount, financials: { ...fin, seasonTotals: { ...seasonTotals, transferExpensesThisSeason: seasonTotals.transferExpensesThisSeason + offerInner.offerAmount } } };
                }
                return t;
            });

            const updatedOffers = prev.pendingOffers?.map(o => {
                if (o.id === offerId) return { ...o, status: 'ACCEPTED' as const };
                if (o.playerId === offerInner.playerId && o.status === 'PENDING') return { ...o, status: 'REJECTED' as const };
                return o;
            }) || [];

            // Message logic...
            const newMessage = {
                id: uuid(),
                week: prev.currentWeek,
                type: MessageType.INFO,
                subject: '✅ Transfer Completed',
                body: `${player.firstName} ${player.lastName} has been sold to ${buyingTeam.name} for €${(offerInner.offerAmount / 1000000).toFixed(1)}M.`,
                isRead: false,
                date: new Date().toISOString()
            };

            return {
                ...prev,
                players: updatedPlayers,
                teams: updatedTeams,
                pendingOffers: prunePendingOffers(updatedOffers),
                messages: appendMessages(prev.messages, [newMessage])
            };
        });
    }, [setGameState, t]);

    const handleRejectOffer = useCallback((offerId: string) => {
        setGameState(prev => {
            if (!prev) return null;
            const updatedOffers = prev.pendingOffers?.map(o =>
                o.id === offerId ? { ...o, status: 'REJECTED' as const } : o
            ) || [];

            return {
                ...prev,
                pendingOffers: prunePendingOffers(updatedOffers)
            };
        });
    }, [setGameState]);

    // COUNTER-OFFER: User proposes a higher price back to the AI club.
    // AI will accept if counter <= 1.4x original offer, counter-offer back if <= 1.8x, reject if higher.
    const handleCounterOffer = useCallback((offerId: string, counterAmount: number) => {
        setGameState(prev => {
            if (!prev) return null;
            const offer = prev.pendingOffers?.find(o => o.id === offerId && o.status === 'PENDING');
            if (!offer) return prev;

            const player = prev.players.find(p => p.id === offer.playerId);
            const buyingTeam = prev.teams.find(t => t.id === offer.toTeamId);
            if (!player || !buyingTeam) return prev;

            // Guard: player must still belong to user — prevent double-sell exploit
            if (player.teamId !== prev.userTeamId) {
                // Player already sold; cancel this offer silently
                const updatedOffers2 = (prev.pendingOffers || []).map(o =>
                    o.id === offerId ? { ...o, status: 'REJECTED' as const } : o
                );
                return { ...prev, pendingOffers: prunePendingOffers(updatedOffers2) };
            }

            const ratio = counterAmount / offer.offerAmount;
            let newMessages = [...prev.messages];
            let updatedOffers = [...(prev.pendingOffers || [])];

            if (ratio <= 1.4) {
                // AI accepts — mark this offer ACCEPTED, cancel all other pending offers for same player
                updatedOffers = updatedOffers.map(o => {
                    if (o.id === offerId) return { ...o, offerAmount: counterAmount, status: 'ACCEPTED' as const };
                    if (o.playerId === offer.playerId && o.status === 'PENDING') return { ...o, status: 'REJECTED' as const };
                    return o;
                });

                const updatedPlayers = prev.players.map(p => {
                    if (p.id === player.id) return { ...p, teamId: buyingTeam.id, isTransferListed: false, lastTransferWeek: prev.currentWeek };
                    return p;
                });
                const updatedTeams = prev.teams.map(t => {
                    if (t.id === prev.userTeamId) {
                        const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                        const st = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                        return { ...t, budget: t.budget + counterAmount, financials: { ...fin, seasonTotals: { ...st, transferIncomeThisSeason: st.transferIncomeThisSeason + counterAmount } } };
                    }
                    if (t.id === buyingTeam.id) return { ...t, budget: t.budget - counterAmount };
                    return t;
                });
                newMessages.push({ id: uuid(), week: prev.currentWeek, type: MessageType.TRANSFER_OFFER, subject: `✅ ${buyingTeam.name} accepted your counter-offer`, body: `${buyingTeam.name} accepted €${(counterAmount / 1000000).toFixed(1)}M for ${player.firstName} ${player.lastName}.`, isRead: false, date: new Date().toISOString() });
                return { ...prev, players: updatedPlayers, teams: updatedTeams, pendingOffers: prunePendingOffers(updatedOffers), messages: appendMessages(prev.messages, newMessages.slice(prev.messages.length)) };

            } else if (ratio <= 1.8) {
                // AI counters back — split the difference
                const aiCounter = Math.floor((offer.offerAmount + counterAmount) / 2);
                updatedOffers = updatedOffers.map(o => o.id === offerId ? { ...o, offerAmount: aiCounter } : o);
                newMessages.push({ id: uuid(), week: prev.currentWeek, type: MessageType.TRANSFER_OFFER, subject: `💬 ${buyingTeam.name} counters: €${(aiCounter / 1000000).toFixed(1)}M`, body: `${buyingTeam.name} won't go that high, but proposes €${(aiCounter / 1000000).toFixed(1)}M for ${player.lastName}. Accept or negotiate further.`, isRead: false, date: new Date().toISOString(), data: { offerId } });
                return { ...prev, pendingOffers: prunePendingOffers(updatedOffers), messages: appendMessages(prev.messages, newMessages.slice(prev.messages.length)) };

            } else {
                // Too high — AI walks out
                updatedOffers = updatedOffers.map(o => o.id === offerId ? { ...o, status: 'REJECTED' as const } : o);
                newMessages.push({ id: uuid(), week: prev.currentWeek, type: MessageType.INFO, subject: `❌ ${buyingTeam.name} withdrew their offer`, body: `${buyingTeam.name} considered your counter of €${(counterAmount / 1000000).toFixed(1)}M too high and walked away from the deal.`, isRead: false, date: new Date().toISOString() });
                return { ...prev, pendingOffers: prunePendingOffers(updatedOffers), messages: appendMessages(prev.messages, newMessages.slice(prev.messages.length)) };
            }
        });
    }, [setGameState]);

    return {
        negotiatingPlayer,
        setNegotiatingPlayer,
        handleBuyPlayer: handleBuyPlayerFunc,
        handleTransferComplete,
        handlePromoteYouth,
        handleAcceptOffer,
        handleRejectOffer,
        handleCounterOffer
    };
};
