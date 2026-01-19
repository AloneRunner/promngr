
import React, { useState } from 'react';
import { Translation } from '../types';
import { BookOpen, Users, Trophy, DollarSign, Dumbbell, Building2, Target, ArrowRight, Star, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Zap, Shield, Heart, Brain, Crosshair } from 'lucide-react';

interface GameGuideProps {
    t: Translation;
}

interface GuideSection {
    id: string;
    title: string;
    icon: any;
    color: string;
    content: React.ReactNode;
}

export const GameGuide: React.FC<GameGuideProps> = ({ t }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>('basics');

    const sections: GuideSection[] = [
        {
            id: 'about',
            title: `🚀 ${t.guideAbout || 'About Game'}`,
            icon: Star,
            color: 'amber',
            content: (
                <div className="space-y-4">
                    <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded">
                        <p className="text-amber-400 font-bold mb-2">🔧 {t.guideUnderDev || 'Under Development!'}</p>
                        <p className="text-sm text-slate-300">
                            {t.guideUnderDevDesc || 'This game is actively being developed. User feedback is directly reflected in the game.'}
                        </p>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">💡 {t.guideDifferent || 'What Makes Us Different?'}</p>
                        <p className="text-sm text-slate-300 mb-2">
                            {t.guideDifferentDesc || 'Unlike other manager games, we don\'t overwhelm users with stats. Easy to learn, hard to master.'}
                        </p>
                        <ul className="text-xs space-y-1 text-slate-400">
                            <li>• {t.guideSimple || 'Simple and clear interface'}</li>
                            <li>• {t.guideFast || 'Fast match simulation'}</li>
                            <li>• {t.guideMobile || 'Mobile-first design'}</li>
                        </ul>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">⚽ {t.guideLiveEngine || 'Live Match Engine'}</p>
                        <p className="text-sm text-slate-300 mb-3">
                            {t.guideLiveEngineDesc || 'Most manager games pre-calculate matches. Our engine is different!'}
                        </p>
                        <p className="text-sm text-slate-300 mb-2">
                            <strong className="text-emerald-400">{t.guideOurEngine || 'Our engine is different!'}</strong> {t.guideEvery50ms || 'Every 50ms (20 times per second):'}
                        </p>
                        <ul className="text-xs space-y-1 text-slate-400">
                            <li>• {t.guide22Players || '22 player positions are calculated'}</li>
                            <li>• {t.guideAIDecides || 'AI decides (shoot, pass, or dribble?)'}</li>
                            <li>• {t.guideBallPhysics || 'Ball physics are simulated'}</li>
                            <li>• {t.guideUnpredictable || 'Real-time, unpredictable matches!'}</li>
                        </ul>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded">
                        <p className="text-purple-400 font-bold mb-2">📺 {t.guide2D25D || '2D vs 2.5D View'}</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-green-400">2D:</strong> {t.guide2DDesc || 'Classic top-down view. Ideal for tactical analysis.'}</li>
                            <li><strong className="text-blue-400">2.5D:</strong> {t.guide25DDesc || 'Perspective view. More cinematic, like TV broadcast.'}</li>
                        </ul>
                        <p className="text-xs text-slate-400 mt-2">💡 {t.guideChangeView || 'Change view during match from top right!'}</p>
                    </div>

                    {/* Solo Developer Note */}
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">👨‍💻 {t.guideSoloDev || 'Solo Developer Project'}</p>
                        <p className="text-sm text-slate-300 mb-2">
                            {t.guideSoloDevDesc || 'This game is developed by a single person. Thank you for your patience with bugs and missing features!'}
                        </p>
                        <p className="text-xs text-slate-400">
                            💬 {t.guideFeedback || 'I read all reviews and try to add requested features. Examples: Indonesian & French language support was added based on user feedback!'}
                        </p>
                    </div>

                    {/* Design Philosophy */}
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-cyan-400 font-bold mb-2">🎯 {t.guidePhilosophy || 'Design Philosophy'}</p>
                        <p className="text-sm text-slate-300 mb-2">
                            {t.guidePhilosophyDesc || 'Unlike ultra-detailed games like FM, this game is designed to be accessible to everyone - even casual football fans.'}
                        </p>
                        <ul className="text-xs space-y-1 text-slate-400">
                            <li>• {t.guidePhilosophy1 || 'Play 10-15 minutes a day, enjoy your time!'}</li>
                            <li>• {t.guidePhilosophy2 || 'Main feature: Real-time 2D/2.5D match simulation'}</li>
                            <li>• {t.guidePhilosophy3 || 'No complex systems to overwhelm you'}</li>
                        </ul>
                    </div>

                    {/* Why Some Features Are Missing */}
                    <div className="bg-orange-900/20 border border-orange-500/30 p-3 rounded">
                        <p className="text-orange-400 font-bold mb-2">❓ {t.guideWhyMissing || 'Why Some Features Are Missing?'}</p>
                        <ul className="text-xs space-y-1 text-slate-400">
                            <li>• {t.guideMissing1 || 'Player loans → Removed for simplicity'}</li>
                            <li>• {t.guideMissing2 || 'World Cup → Maybe in the future'}</li>
                            <li>• {t.guideMissing3 || 'Complex tactics → Kept simple intentionally'}</li>
                        </ul>
                    </div>

                    {/* Future Plans */}
                    <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded">
                        <p className="text-purple-400 font-bold mb-2">🔮 {t.guideFuturePlans || 'Future Plans'}</p>
                        <ul className="text-xs space-y-1 text-slate-400">
                            <li>✅ {t.guideFuture1 || 'More language support'}</li>
                            <li>🔜 {t.guideFuture2 || 'Create your own team'}</li>
                            <li>🔜 {t.guideFuture3 || 'Customize team/player names'}</li>
                            <li>❓ {t.guideFuture4 || 'World Cup (maybe)'}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'basics',
            title: `🎮 ${t.guideBasicsTitle || t.guideBasics || 'Game Basics'}`,
            icon: BookOpen,
            color: 'emerald',
            content: (
                <div className="space-y-3">
                    <p>⚽ {t.guideBasics1 || 'You are the manager of a football team in this game.'}</p>
                    <p>📅 {t.guideBasics2 || 'A league match is played every week. Champion is determined at the end of the season.'}</p>
                    <p>🏆 <strong>{t.guideBasics3 || 'Goal: Championship, European cups and growing the club.'}</strong></p>
                    <p>💾 {t.guideBasics4 || 'The game saves automatically. Use \'Save and Exit\' for a safe exit.'}</p>
                    <p>📊 <strong>{t.guideBasics5 || 'If Board Confidence drops, you might be fired!'}</strong></p>
                    <div className="bg-slate-900/50 p-3 rounded mt-3">
                        <p className="text-yellow-400 font-bold mb-2">⚠️ {t.guideBoardEffectTitle || 'Board Confidence Effects:'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideWinEffect || 'Win: +3 confidence'}</li>
                            <li>• {t.guideDrawEffect || 'Draw: +0 confidence'}</li>
                            <li>• {t.guideLossEffect || 'Loss: -5 confidence'}</li>
                            <li>• {t.guideFireWarning || 'Below 30%: You get fired!'}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'squad',
            title: `👥 ${t.guideSquadTitle || t.guideSquad || 'Squad Management'}`,
            icon: Users,
            color: 'blue',
            content: (
                <div className="space-y-3">
                    <p>⭐ {t.guideSquad1 || 'Set players as Starting XI, Bench, or Reserves.'}</p>
                    <p>🔄 {t.guideSquad2 || 'Click a player to swap with another.'}</p>
                    <p>📍 {t.guideSquad3 || 'Try different formations by selecting a layout.'}</p>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">📊 {t.guideOvrCalcTitle || 'How is OVR (Overall Rating) Calculated?'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• <strong>{t.guidePosMatch || 'Position Match: Players in correct positions show higher OVR.'}</strong></li>
                            <li>• <strong>{t.guideMoraleEffect || 'Morale Effect: 50+ morale = bonus, 50- morale = penalty.'}</strong></li>
                            <li>• <strong>{t.guideConEffect || 'Condition: Below 30% condition = serious performance drop.'}</strong></li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">❌ {t.guideReleaseTitle || 'Contract Termination'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideRelease1 || 'You can release unwanted players.'}</li>
                            <li>• <strong>{t.guideRelease2 || 'Compensation: Remaining Years × Annual Wage × 50%'}</strong></li>
                            <li>• {t.guideRelease3 || 'The player becomes a free agent.'}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tactics',
            title: `🎯 ${t.guideTacticsTitle || t.guideTactics || 'Tactics System (Detailed)'}`,
            icon: Target,
            color: 'purple',
            content: (
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-purple-400 font-bold mb-2">📐 {t.formation || 'Formations'}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>{t.guideForm433 || '4-3-3: Balanced, wing-heavy.'}</div>
                            <div>{t.guideForm442 || '4-4-2: Classic, safe.'}</div>
                            <div>{t.guideForm4231 || '4-2-3-1: Midfield control.'}</div>
                            <div>{t.guideForm352 || '3-5-2: Midfield dominant.'}</div>
                            <div>{t.guideForm532 || '5-3-2: Defensive.'}</div>
                            <div>{t.guideForm4141 || '4-1-4-1: Solid defense.'}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-orange-400 font-bold mb-2">⚡ {t.style || 'Play Style'}</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-blue-400">Possession:</strong> {t.guideStylePoss || 'Ball retention, short passing, patient attack. Needs strong midfield.'}</li>
                            <li><strong className="text-green-400">Counter:</strong> {t.guideStyleCounter || 'Defend and fast break. Needs fast forwards and midfielders.'}</li>
                            <li><strong className="text-red-400">HighPress:</strong> {t.guideStylePress || 'High pressure, suffocate opponent. Requires high stamina!'}</li>
                            <li><strong className="text-gray-400">ParkTheBus:</strong> {t.guideStyleBus || '11-man defense, wait for counter. Effective against big teams.'}</li>
                            <li><strong className="text-yellow-400">Balanced:</strong> {t.guideStyleBal || 'A bit of everything. A safe choice.'}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-cyan-400 font-bold mb-2">📏 {t.width || 'Width'} & {t.passingStyle || 'Passing Style'}</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong>{t.guideWidthNarrow || 'Narrow: Play through middle. Ideal for central players.'}</strong></li>
                            <li><strong>{t.guideWidthWide || 'Wide: Use the wings. Requires fast wingers.'}</strong></li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'training',
            title: `🏋️ ${t.guideTrainingTitle || t.guideTraining || 'Training System'}`,
            icon: Dumbbell,
            color: 'orange',
            content: (
                <div className="space-y-3">
                    <p>📈 <strong>{t.guideTrainAge || 'Only players under 28 can develop!'}</strong></p>
                    <p>⚠️ {t.guideTrainLuck || 'Development is luck-based - not guaranteed every week.'}</p>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-orange-400 font-bold mb-2">🎯 {t.guideTrainFocus || 'Training Focuses'}</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-yellow-400">{t.guideTrainFocusBal || 'Balanced: Equal chance for all attributes.'}</strong></li>
                            <li><strong className="text-red-400">{t.guideTrainFocusAtt || 'Attack: Finishing, Shooting, Dribbling improves.'}</strong></li>
                            <li><strong className="text-blue-400">{t.guideTrainFocusDef || 'Defense: Tackling, Positioning, Strength improves.'}</strong></li>
                            <li><strong className="text-green-400">{t.guideTrainFocusPhy || 'Physical: Pace, Stamina, Strength improves.'}</strong></li>
                            <li><strong className="text-purple-400">{t.guideTrainFocusTec || 'Technical: Passing, Dribbling, Vision improves.'}</strong></li>
                            <li><strong className="text-emerald-400">{t.guideTrainPosBased || 'By Position (NEW!): Automatically based on role.'}</strong></li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'facilities',
            title: `🏟️ ${t.guideFacilitiesTitle || t.guideFacilities || 'Facilities & Staff'}`,
            icon: Building2,
            color: 'cyan',
            content: (
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">🏟️ {t.stadium || 'Stadium'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideStadiumEffect || 'Each level = +6,000 capacity. More fans = more ticket revenue.'}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-green-400 font-bold mb-2">🏋️ {t.trainingCenter || 'Training Center'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideTrainingEffect || 'Training Center: Increases player growth speed and potential reach chance.'}</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">⚽ {t.guideScoutVsAcad || 'Scout vs Academy: Scouts are more effective for finding potential, upgrade them first!'}</p>
                    </div>
                </div>
            )
        },
        {
            id: 'morale',
            title: `😊 ${t.guideMoraleTitle || t.guideMorale || 'Morale System'}`,
            icon: Heart,
            color: 'pink',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-pink-400 font-bold mb-2">📊 {t.guideMoraleTitle || 'Weekly Morale Changes'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong className="text-emerald-400">{t.guideMoraleXI || 'Starting XI: +2 morale'}</strong></li>
                            <li><strong className="text-yellow-400">{t.guideMoraleBench || 'Bench: No change'}</strong></li>
                            <li><strong className="text-red-400">{t.guideMoraleRes75 || 'Reserve (75+ OVR): -3 morale!'}</strong></li>
                            <li><strong className="text-orange-400">{t.guideMoraleRes65 || 'Reserve (65-75 OVR): -1 morale'}</strong></li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">⚡ {t.guideMoralePerform || '100 Morale: +5% OVR bonus. 0 Morale: -10% OVR penalty!'}</p>
                    </div>
                </div>
            )
        },
        {
            id: 'transfers',
            title: `💰 ${t.guideTransferTitle || t.guideTransfers || 'Transfer System'}`,
            icon: DollarSign,
            color: 'yellow',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">💵 {t.guideTransferTitle || 'Negotiation System'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideTransList || 'Players on transfer list are cheaper.'}</li>
                            <li>• {t.guideTransUnlisted || 'Expect to pay 20-50% more for unlisted players.'}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">🌟 {t.guideYouthTitle || 'Youth Academy (Cheap!)'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideYouth1 || 'Young players come at €50K value.'}</li>
                            <li>• {t.guideYouth2 || 'Wage: Only €25K/year.'}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'finances',
            title: `💵 ${t.guideFinanceTitle || t.guideFinance || 'Finance Management'}`,
            icon: Building2,
            color: 'green',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">🤝 {t.sponsorTitle || 'Sponsor Types'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong className="text-green-400">{t.guideSponsorG || 'Guaranteed: High fixed, low bonus. Safe.'}</strong></li>
                            <li><strong className="text-yellow-400">{t.guideSponsorD || 'Balanced: Mid fixed, mid bonus.'}</strong></li>
                            <li><strong className="text-red-400">{t.guideSponsorR || 'Risky: Low fixed, high bonus. Profitable if you win!'}</strong></li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'european',
            title: `🏆 ${t.guideEuroTitle || t.guideEuropean || 'European Cups'}`,
            icon: Trophy,
            color: 'amber',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-amber-400 font-bold mb-2">🎫 {t.guideEuroReq || 'Participation Requirements'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong>{t.guideEuroCL || 'Champions League: 1st and 2nd in League'}</strong></li>
                            <li><strong>{t.guideEuroEL || 'UEFA Europa League: 3rd and 4th in League'}</strong></li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">📊 {t.guideEuroFormat || 'Tournament Format'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideEuroGroups || 'Group Stage: groups of 4 teams'}</li>
                            <li>• {t.guideEuroAdv || 'Top 2 advance to knockout stage'}</li>
                            <li>• {t.guideEuroKO || 'Quarter-final, semi-final, final'}</li>
                            <li>• {t.guideEuroSingle || 'Single-leg knockout system'}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tips',
            title: `💡 ${t.guideProTipsTitle || t.guideTips || 'Pro Tips'}`,
            icon: Brain,
            color: 'violet',
            content: (
                <div className="space-y-3">
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">✅ {t.guideTipsDos || 'Dos'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideTipsDo1 || 'Have at least 2 players in every position.'}</li>
                            <li>• {t.guideTipsDo2 || 'Give young players a chance - they develop!'}</li>
                            <li>• {t.guideTipsDo3 || 'Upgrade the Scout first (it\'s more effective).'}</li>
                            <li>• {t.guideTipsDo4 || 'Sell youth academy prospects - very profitable!'}</li>
                            <li>• {t.guideTipsDo5 || 'Change tactics according to the opponent.'}</li>
                            <li>• {t.guideTipsDo6 || 'Rest your tired players.'}</li>
                        </ul>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">❌ {t.guideTipsDonts || 'Don\'ts'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• {t.guideTipsDont1 || 'Don\'t keep high OVR players in reserves constantly.'}</li>
                            <li>• {t.guideTipsDont2 || 'Don\'t make transfers exceeding your budget.'}</li>
                            <li>• {t.guideTipsDont3 || 'Don\'t stick to only one formation.'}</li>
                            <li>• {t.guideTipsDont4 || 'Don\'t ignore injuries.'}</li>
                            <li>• {t.guideTipsDont5 || 'Don\'t let contracts expire.'}</li>
                        </ul>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">🎯 {t.guideTipsTactical || 'Tactical Tips'}</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• <strong>{t.guideTipStrong || 'Strong Opponent: ParkTheBus + Counter'}</strong></li>
                            <li>• <strong>{t.guideTipWeak || 'Weak Opponent: HighPress + Possession'}</strong></li>
                            <li>• <strong>{t.guideTipWinning || 'When Winning: Safe aggression'}</strong></li>
                            <li>• <strong>{t.guideTipLosing || 'When Losing: Aggressive + Fast tempo'}</strong></li>
                        </ul>
                    </div>
                </div>
            )
        }
    ];

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="text-emerald-500" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t.gameGuide || 'Game Guide'}</h2>
                        <p className="text-slate-400 text-sm">{t.guideUnderDevDesc || 'Learn all the game mechanics in detail!'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {sections.map(section => (
                    <div
                        key={section.id}
                        className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
                    >
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <section.icon className={`text-${section.color}-400`} size={20} />
                                <span className="font-bold text-white">{section.title}</span>
                            </div>
                            {expandedSection === section.id ? (
                                <ChevronUp className="text-slate-400" size={20} />
                            ) : (
                                <ChevronDown className="text-slate-400" size={20} />
                            )}
                        </button>

                        {expandedSection === section.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-700 animate-fade-in text-slate-300 text-sm">
                                {section.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
