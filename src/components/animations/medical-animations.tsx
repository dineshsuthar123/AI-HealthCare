"use client"

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface MedicalAnimationProps {
    className?: string;
    size?: number;
    color?: string;
}

export const HeartbeatAnimation: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 50,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const lineElement = svgRef.current.querySelector('#heartbeat-line');

        // Create animation
        const timeline = gsap.timeline({
            repeat: -1,
            repeatDelay: 0.7,
        });

        timeline.fromTo(
            lineElement,
            { strokeDashoffset: 500 },
            {
                strokeDashoffset: 0,
                duration: 1.5,
                ease: "power2.out"
            }
        );

        return () => {
            timeline.kill();
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size / 2}
            viewBox="0 0 200 100"
            className={`overflow-visible ${className}`}
        >
            <path
                id="heartbeat-line"
                d="M0,50 L30,50 L45,20 L60,80 L75,35 L90,65 L105,50 L120,50 L140,10 L160,90 L180,50 L200,50"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeDasharray="500"
                strokeDashoffset="500"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export const DNAAnimation: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 100,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const dots1 = svgRef.current.querySelectorAll('.dna-dot-1');
        const dots2 = svgRef.current.querySelectorAll('.dna-dot-2');
        const lines = svgRef.current.querySelectorAll('.dna-line');

        // Create animations
        gsap.to(dots1, {
            y: (i) => (i % 2 === 0 ? "+=10" : "-=10"),
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.1
        });

        gsap.to(dots2, {
            y: (i) => (i % 2 === 0 ? "-=10" : "+=10"),
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.1
        });

        gsap.to(lines, {
            attr: { x2: (i) => (i % 2 === 0 ? "+=5" : "-=5") },
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.1
        });

    }, []);

    // Generate DNA structure
    const numRung = 8;
    const elements = [];

    for (let i = 0; i < numRung; i++) {
        const y = 10 + i * (size - 20) / (numRung - 1);
        const offsetX = Math.sin((i / (numRung - 1)) * Math.PI) * 10;

        // Left dot
        elements.push(
            <circle
                key={`dot1-${i}`}
                className="dna-dot-1"
                cx={size / 4 - offsetX}
                cy={y}
                r="4"
                fill={color}
                opacity="0.8"
            />
        );

        // Right dot
        elements.push(
            <circle
                key={`dot2-${i}`}
                className="dna-dot-2"
                cx={3 * size / 4 + offsetX}
                cy={y}
                r="4"
                fill={color}
                opacity="0.8"
            />
        );

        // Connecting line
        elements.push(
            <line
                key={`line-${i}`}
                className="dna-line"
                x1={size / 4 - offsetX + 4}
                y1={y}
                x2={3 * size / 4 + offsetX - 4}
                y2={y}
                stroke={color}
                opacity="0.6"
                strokeWidth="2"
            />
        );
    }

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
        >
            {elements}
        </svg>
    );
};

export const PulseRingsAnimation: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 100,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const rings = svgRef.current.querySelectorAll('.pulse-ring');

        rings.forEach((ring, i) => {
            gsap.set(ring, {
                attr: { r: 0 },
                opacity: 0.8
            });

            gsap.to(ring, {
                attr: { r: size / 2 },
                opacity: 0,
                duration: 2,
                repeat: -1,
                delay: i * 0.6,
                ease: "power2.out"
            });
        });

    }, [size]);

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 10}
                fill={color}
                opacity="0.8"
            />
            <circle
                className="pulse-ring"
                cx={size / 2}
                cy={size / 2}
                r="0"
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
            <circle
                className="pulse-ring"
                cx={size / 2}
                cy={size / 2}
                r="0"
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
            <circle
                className="pulse-ring"
                cx={size / 2}
                cy={size / 2}
                r="0"
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
        </svg>
    );
};

export const LoadingSpinner: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 40,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const dots = svgRef.current.querySelectorAll('.spinner-dot');

        gsap.to(dots, {
            scale: 0.5,
            opacity: 0.3,
            stagger: {
                each: 0.1,
                repeat: -1,
                yoyo: true
            },
            duration: 0.3
        });

    }, []);

    // Generate dots
    const numDots = 8;
    const radius = size / 2 - 5;
    const dots = [];

    for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2;
        const x = size / 2 + radius * Math.cos(angle);
        const y = size / 2 + radius * Math.sin(angle);

        dots.push(
            <circle
                key={`dot-${i}`}
                className="spinner-dot"
                cx={x}
                cy={y}
                r="4"
                fill={color}
            />
        );
    }

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
        >
            {dots}
        </svg>
    );
};

interface MedicalIconProps {
    className?: string;
    size?: number;
    color?: string;
    animate?: boolean;
}

export const StethoscopeIcon: React.FC<MedicalIconProps> = ({
    className = '',
    size = 40,
    color = '#3b82f6',
    animate = true
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!animate || !svgRef.current) return;

        const headpiece = svgRef.current.querySelector('#stethoscope-head');
        const tube = svgRef.current.querySelector('#stethoscope-tube');

        gsap.to(headpiece, {
            rotate: 5,
            transformOrigin: 'center',
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        gsap.to(tube, {
            attr: { d: 'M25,45 C35,55 45,35 65,40' },
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, [animate]);

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox="0 0 80 80"
            className={className}
        >
            <circle
                id="stethoscope-head"
                cx="65"
                cy="50"
                r="10"
                fill={color}
                opacity="0.9"
            />
            <path
                id="stethoscope-tube"
                d="M25,45 C35,45 45,35 65,40"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M15,25 L35,25 C40,25 45,30 45,35 L45,45"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M15,5 L15,25"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M35,5 L35,25"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
};
