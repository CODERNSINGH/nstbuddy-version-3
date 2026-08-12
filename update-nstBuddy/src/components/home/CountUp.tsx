import React, { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

interface CountUpProps {
    value: number;
    duration?: number;
    className?: string;
}

const CountUp: React.FC<CountUpProps> = ({ value, duration = 1.2, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        const controls = animate(0, value, {
            duration,
            ease: 'easeOut',
            onUpdate: (v) => setDisplay(Math.round(v)),
        });
        return () => controls.stop();
    }, [isInView, value, duration]);

    return (
        <span ref={ref} className={className}>
            {display.toLocaleString('en-IN')}
        </span>
    );
};

export default CountUp;
