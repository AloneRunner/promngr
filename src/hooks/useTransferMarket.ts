
import React, { useState, useCallback } from 'react';
import { GameState, Player, Team, LineupStatus, MessageType } from '../../types';
import { assignJerseyNumber, uuid } from '../utils/playerUtils';

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

        // Validation Check (Outside setGameState)
        if (userTeam.budget < finalPrice) {
            alert(t.notEnoughFunds);
            return;
        }

        setGameState(prev => {
            if (!prev) return null;

            // Re-find team in prev state to ensure atomic consistency, but we already validated on latest ref.
            // There's a tiny race condition possibility if budget changed in ms, but negligible for single user turn-based flow.
            const uTeam = prev.teams.find(t => t.id === prev.userTeamId);
            if (!uTeam) return prev;

            // ... Logic ...
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
                    // Update season transfer totals
                    const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                    const seasonTotals = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                    return { ...t, budget: t.budget - finalPrice, financials: { ...fin, seasonTotals: { ...seasonTotals, transferExpensesThisSeason: seasonTotals.transferExpensesThisSeason + finalPrice } } };
                }
                if (t.id === sellerTeamId && sellerTeamId !== 'FREE_AGENT') {
                    // Update seller's income
                    const fin = t.financials || { lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }, lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 } };
                    const seasonTotals = fin.seasonTotals || { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 };
                    return { ...t, budget: t.budget + finalPrice, financials: { ...fin, seasonTotals: { ...seasonTotals, transferIncomeThisSeason: seasonTotals.transferIncomeThisSeason + finalPrice } } };
                }
                return t;
            });

            return { ...prev, players: updatedPlayers, transferMarket: updatedMarket, teams: updatedTeams };
        });

        setNegotiatingPlayer(null);
        alert(`${t.successfullySigned} ${player.lastName} for €${(finalPrice / 1000000).toFixed(2)}M!`);
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
                pendingOffers: updatedOffers,
                messages: [...prev.messages, newMessage]
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
                pendingOffers: updatedOffers
            };
        });
    }, [setGameState]);

    return {
        negotiatingPlayer,
        setNegotiatingPlayer,
        handleBuyPlayer: handleBuyPlayerFunc,
        handleTransferComplete,
        handlePromoteYouth,
        handleAcceptOffer,
        handleRejectOffer
    };
};
