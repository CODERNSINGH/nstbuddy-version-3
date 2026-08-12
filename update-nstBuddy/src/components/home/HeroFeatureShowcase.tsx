import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users2, PenSquare, ArrowUpRight } from 'lucide-react';
import { NavigateFunction } from 'react-router-dom';

interface FeatureCardConfig {
    icon: React.ElementType;
    title: string;
    description: string;
    to: string;
    gradient: string;
    className: string;
    rotate: number;
}

const cards: FeatureCardConfig[] = [
    {
        icon: MessageSquare,
        title: 'Community',
        description: 'Post, react, and talk with students across every campus.',
        to: '/community',
        gradient: 'from-brand-500 to-brand-700',
        className: 'top-0 right-4 sm:right-10 w-64',
        rotate: -4,
    },
    {
        icon: Users2,
        title: 'Groups',
        description: 'Find teammates for your next hackathon or project.',
        to: '/groups',
        gradient: 'from-[#fd9d0f] to-[#c74e00]',
        className: 'top-36 right-16 sm:right-24 w-64',
        rotate: 3,
    },
    {
        icon: PenSquare,
        title: 'Contribute',
        description: 'Share solutions and climb the leaderboard.',
        to: '/contribute',
        gradient: 'from-[#16191D] to-[#414755]',
        className: 'top-[18rem] right-0 sm:right-2 w-64',
        rotate: -2,
    },
];

interface HeroFeatureShowcaseProps {
    navigate: NavigateFunction;
}

const HeroFeatureShowcase: React.FC<HeroFeatureShowcaseProps> = ({ navigate }) => {
    return (
        <div className="hidden lg:block relative h-[26rem]">
            {cards.map((card, i) => (
                <motion.button
                    key={card.title}
                    onClick={() => navigate(card.to)}
                    initial={{ opacity: 0, x: 40, rotate: 0 }}
                    animate={{ opacity: 1, x: 0, rotate: card.rotate, y: [0, -10, 0] }}
                    transition={{
                        opacity: { duration: 0.5, delay: i * 0.15 },
                        x: { duration: 0.5, delay: i * 0.15 },
                        rotate: { duration: 0.5, delay: i * 0.15 },
                        y: { duration: 3.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
                    }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
                    className={`absolute text-left bg-gradient-to-br ${card.gradient} rounded-2xl p-5 shadow-xl ${card.className}`}
                >
                    <div className="flex items-start justify-between mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-white/60" />
                    </div>
                    <h3 className="text-white font-bold mb-1">{card.title}</h3>
                    <p className="text-white/70 text-xs leading-relaxed">{card.description}</p>
                </motion.button>
            ))}
        </div>
    );
};

export default HeroFeatureShowcase;
