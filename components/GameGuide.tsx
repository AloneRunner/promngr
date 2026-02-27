import React, { useState } from 'react';
import { Translation } from '../types';
import { BookOpen, Users, Trophy, DollarSign, Dumbbell, Star, AlertTriangle, ChevronDown, ChevronUp, Zap, Shield, Heart, Brain, Crosshair, Target, Key } from 'lucide-react';

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
            id: 'basics',
            title: t.guideBasicsTitle || `🎮 Oyuna Giriş & Temel Bilgiler`,
            icon: BookOpen,
            color: 'emerald',
            content: (
                <div className="space-y-3 text-sm text-slate-300">
                    <p dangerouslySetInnerHTML={{ __html: t.guideBasicsP1 }}></p>
                    <p>{t.guideBasicsP2}</p>
                    <p dangerouslySetInnerHTML={{ __html: t.guideBasicsP3 }}></p>
                </div>
            )
        },
        {
            id: 'attributes',
            title: t.guideAttrTitle || `👤 Oyuncu Özellikleri (Motor İçindeki Gerçek Etkileri)`,
            icon: Brain,
            color: 'cyan',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">{t.guideAttrDesc}</p>

                    {/* Teknik */}
                    <div className="bg-slate-900/50 p-3 rounded border border-blue-500/20">
                        <p className="text-blue-400 font-bold mb-2 flex items-center gap-2"><Crosshair size={16} /> {t.guideTechTitle}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">Finishing:</strong> {t.guideAttrFinishing}</li>
                            <li><strong className="text-white">Passing:</strong> {t.guideAttrPassing}</li>
                            <li><strong className="text-white">Dribbling:</strong> {t.guideAttrDribbling}</li>
                            <li><strong className="text-white">Tackling:</strong> {t.guideAttrTackling}</li>
                            <li><strong className="text-white">Goalkeeping:</strong> {t.guideAttrGk}</li>
                        </ul>
                    </div>

                    {/* Fiziksel */}
                    <div className="bg-slate-900/50 p-3 rounded border border-red-500/20">
                        <p className="text-red-400 font-bold mb-2 flex items-center gap-2"><Zap size={16} /> {t.guidePhysTitle}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">Speed:</strong> {t.guideAttrSpeed}</li>
                            <li><strong className="text-white">Stamina:</strong> {t.guideAttrStamina}</li>
                            <li><strong className="text-white">Strength:</strong> {t.guideAttrStrength}</li>
                            <li><strong className="text-white">Condition:</strong> {t.guideAttrCondition}</li>
                        </ul>
                    </div>

                    {/* Zihinsel */}
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20">
                        <p className="text-purple-400 font-bold mb-2 flex items-center gap-2"><Brain size={16} /> {t.guideMentalTitle}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">Decisions:</strong> {t.guideAttrDecisions}</li>
                            <li><strong className="text-white">Positioning:</strong> {t.guideAttrPositioning}</li>
                            <li><strong className="text-white">Vision:</strong> {t.guideAttrVision}</li>
                            <li><strong className="text-white">Composure:</strong> {t.guideAttrComposure}</li>
                            <li><strong className="text-white">Aggression:</strong> {t.guideAttrAggression}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'playstyles',
            title: t.guideStylesTitle || `✨ Oyuncu Tarzları (Kritik 20 X-Faktör)`,
            icon: Star,
            color: 'rose',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">{t.guideStylesDesc}</p>

                    <div className="bg-slate-900/50 p-3 rounded border border-rose-500/20">
                        <p className="text-rose-400 font-bold mb-2">{t.guideS_Gk}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">{t.styleCatReflexes || 'Cat Reflexes'}:</strong> {t.guideS_Gk1}</li>
                            <li><strong className="text-white">{t.styleSweeper || 'Sweeper'}:</strong> {t.guideS_Gk2}</li>
                            <li><strong className="text-white">{t.stylePenaltySaver || 'Penalty Saver'}:</strong> {t.guideS_Gk3}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-blue-500/20">
                        <p className="text-blue-400 font-bold mb-2">{t.guideS_Def}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">{t.styleInterceptor || 'Interceptor'}:</strong> {t.guideS_Def1}</li>
                            <li><strong className="text-white">{t.styleRock || 'Rock'}:</strong> {t.guideS_Def2}</li>
                            <li><strong className="text-white">{t.styleRelentless || 'Relentless'}:</strong> {t.guideS_Def3}</li>
                            <li><strong className="text-white">{t.stylePressResistant || 'Press Resistant'}:</strong> {t.guideS_Def4}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-yellow-500/20">
                        <p className="text-yellow-400 font-bold mb-2">{t.guideS_Move}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">{t.styleRapid || 'Rapid'}:</strong> {t.guideS_Move1}</li>
                            <li><strong className="text-white">{t.styleTrickster || 'Trickster'}:</strong> {t.guideS_Move2}</li>
                            <li><strong className="text-white">{t.styleFirstTouch || 'First Touch'}:</strong> {t.guideS_Move3}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-emerald-500/20">
                        <p className="text-emerald-400 font-bold mb-2">{t.guideS_Pass}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">{t.styleIncisivePass || 'Incisive Pass'}:</strong> {t.guideS_Pass1}</li>
                            <li><strong className="text-white">{t.styleMaestro || 'Maestro'}:</strong> {t.guideS_Pass2}</li>
                            <li><strong className="text-white">{t.styleDeadBall || 'Dead Ball'}:</strong> {t.guideS_Pass3}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-orange-500/20">
                        <p className="text-orange-400 font-bold mb-2">{t.guideS_Shoot}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">{t.styleFinesse || 'Finesse'}:</strong> {t.guideS_Shoot1}</li>
                            <li><strong className="text-white">{t.styleRocket || 'Rocket'}:</strong> {t.guideS_Shoot2}</li>
                            <li><strong className="text-white">{t.styleLob || 'Lob'}:</strong> {t.guideS_Shoot3}</li>
                            <li><strong className="text-white">{t.styleAerialThreat || 'Aerial Threat'}:</strong> {t.guideS_Shoot4}</li>
                            <li><strong className="text-white">{t.styleLongRanger || 'Long Ranger'}:</strong> {t.guideS_Shoot5}</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20">
                        <p className="text-purple-400 font-bold mb-2">{t.guideS_Men}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li><strong className="text-white">{t.styleShadowStriker || 'Shadow Striker'}:</strong> {t.guideS_Men1}</li>
                            <li><strong className="text-white">{t.stylePoacher || 'Poacher'}:</strong> {t.guideS_Men2}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tactics',
            title: t.guideTacticsTitle || `🎯 Taktik Tahtası (Oyun Planı İşleyişi)`,
            icon: Target,
            color: 'purple',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">{t.guideTacticsDesc}</p>

                    <div className="bg-slate-900/50 p-3 rounded border border-orange-500/20">
                        <p className="text-orange-400 font-bold mb-2 flex items-center gap-2">{t.guideT_Defense}</p>
                        <div className="text-xs space-y-4 text-slate-300">
                            <div className="whitespace-pre-line">{t.guideMgmt_safe}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2">{t.guideMgmt_normal}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2">{t.guideMgmt_aggressive}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2 text-red-300">{t.guideMgmt_reckless}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-emerald-500/20">
                        <p className="text-emerald-400 font-bold mb-2 flex items-center gap-2">{t.guideT_Attack}</p>
                        <div className="text-xs space-y-4 text-slate-300">
                            <div className="whitespace-pre-line">{t.guideAtt_att}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2">{t.guideAtt_bal}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2">{t.guideAtt_count}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2">{t.guideAtt_def}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-2">{t.guideAtt_poss}</div>

                            <p className="text-emerald-500 font-bold mt-4 pt-2 border-t border-emerald-500/30">{t.guideT_Mentality}</p>
                            <div className="whitespace-pre-line">{t.guideAtt_risk_high}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideAtt_risk_bal}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideAtt_risk_safe}</div>

                            <p className="text-emerald-500 font-bold mt-4 pt-2 border-t border-emerald-500/30">{t.guideT_Width}</p>
                            <div className="whitespace-pre-line">{t.guideWidth_nar}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideWidth_bal}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideWidth_wide}</div>

                            <p className="text-emerald-500 font-bold mt-4 pt-2 border-t border-emerald-500/30">{t.guideT_PassTempo}</p>
                            <ul className="space-y-1 list-disc pl-4">
                                <li className="whitespace-pre-line">{t.guidePass_short}</li>
                                <li className="whitespace-pre-line">{t.guidePass_mix}</li>
                                <li className="whitespace-pre-line">{t.guidePass_dir}</li>
                                <li className="whitespace-pre-line">{t.guidePass_long}</li>
                            </ul>
                            <ul className="space-y-1 list-disc pl-4 mt-2 border-t border-slate-700/50 pt-2">
                                <li className="whitespace-pre-line">{t.guideTempo_slow}</li>
                                <li className="whitespace-pre-line">{t.guideTempo_norm}</li>
                                <li className="whitespace-pre-line">{t.guideTempo_fast}</li>
                            </ul>

                            <p className="text-emerald-500 font-bold mt-4 pt-2 border-t border-emerald-500/30">{t.guideT_Instructions}</p>
                            <div className="whitespace-pre-line">{t.guideInst_work}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideInst_shoot}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideInst_roam}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-blue-500/20">
                        <p className="text-blue-400 font-bold mb-2 flex items-center gap-2">{t.guideT_DefLinePress}</p>
                        <div className="text-xs space-y-4 text-slate-300">
                            <p className="text-blue-500 font-bold">{t.guideT_PressIntensity}</p>
                            <div className="whitespace-pre-line">{t.guideDef_pressStand}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideDef_pressBal}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideDef_pressGegen}</div>

                            <p className="text-blue-500 font-bold mt-4 pt-2 border-t border-blue-500/30">{t.guideT_DefLine}</p>
                            <div className="whitespace-pre-line">{t.guideDef_lineDeep}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideDef_lineNorm}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guideDef_lineHigh}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20">
                        <p className="text-purple-400 font-bold mb-2 flex items-center gap-2">{t.guideT_Presets}</p>
                        <div className="text-xs space-y-2 text-slate-300">
                            <div className="whitespace-pre-line">{t.guidePreset_1}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_2}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_3}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_4}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_5}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_6}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_7}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_8}</div>
                            <div className="whitespace-pre-line border-t border-slate-700/50 pt-1">{t.guidePreset_9}</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'finance',
            title: t.guideFinanceTitle || `💵 Finans Sistemi, İtibar ve Lig`,
            icon: DollarSign,
            color: 'yellow',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-slate-300">{t.guideFinanceDesc}</p>

                    <div className="bg-slate-900/50 p-3 rounded border border-yellow-500/20">
                        <p className="text-yellow-400 font-bold mb-2">{t.guideF_Eco}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li dangerouslySetInnerHTML={{ __html: t.guideF_Eco1 }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t.guideF_Eco2 }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t.guideF_Eco3 }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t.guideF_Eco4 }}></li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded border border-emerald-500/20">
                        <p className="text-emerald-400 font-bold mb-2">{t.guideF_Rep}</p>
                        <ul className="text-xs space-y-2 text-slate-300">
                            <li>{t.guideF_Rep1}</li>
                            <li>{t.guideF_Rep2}</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tips',
            title: t.guideTipsTitle || `💡 Kritik Menajer Tavsiyeleri`,
            icon: Star,
            color: 'amber',
            content: (
                <div className="space-y-3">
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">{t.guideTipsDo}</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                            <li>{t.guideTipsDo1}</li>
                            <li dangerouslySetInnerHTML={{ __html: t.guideTipsDo2 }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t.guideTipsDo3 }}></li>
                        </ul>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">{t.guideTipsDont}</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                            <li>{t.guideTipsDont1}</li>
                            <li>{t.guideTipsDont2}</li>
                            <li>{t.guideTipsDont3}</li>
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
                        <h2 className="text-2xl font-bold text-white">{t.gameGuide || 'Oyun Rehberi'}</h2>
                        <p className="text-slate-400 text-sm">{t.guideGameGuideDesc}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2 pb-10">
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
                                <span className="font-bold text-white text-sm sm:text-base">{section.title}</span>
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
