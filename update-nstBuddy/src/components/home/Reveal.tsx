import React from 'react';
import { motion } from 'framer-motion';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

// Fade + slide up once when scrolled into view - used to give homepage sections
// a bit of life without re-triggering every time the user scrolls past them.
const Reveal: React.FC<RevealProps> = ({ children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

export default Reveal;
