import React, { useEffect, useState, useMemo } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { motion, useAnimation } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Scores {
  problemSolving: number;
  systemDesign: number;
  communication: number;
  codeQuality: number;
  technicalDepth: number;
  adaptability: number;
}

interface SkillRadarChartProps {
  scores: Scores;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ 
  scores, 
  animated = true, 
  size = 'md' 
}) => {
  const controls = useAnimation();

  const data = useMemo(() => [
    { subject: 'P.Solving', score: scores.problemSolving, fullMark: 10 },
    { subject: 'S.Design', score: scores.systemDesign, fullMark: 10 },
    { subject: 'Comm.', score: scores.communication, fullMark: 10 },
    { subject: 'C.Quality', score: scores.codeQuality, fullMark: 10 },
    { subject: 'T.Depth', score: scores.technicalDepth, fullMark: 10 },
    { subject: 'Adapt.', score: scores.adaptability, fullMark: 10 },
  ], [scores]);

  const avgScore = useMemo(() => {
    const values = [
      scores.problemSolving,
      scores.systemDesign,
      scores.communication,
      scores.codeQuality,
      scores.technicalDepth,
      scores.adaptability
    ];
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }, [scores]);

  useEffect(() => {
    if (animated) {
      controls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.3, ease: "easeInOut" }
      });
    }
  }, [scores, animated, controls]);

  const sizePx = {
    sm: 200,
    md: 280,
    lg: 360
  }[size];

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#6af7c8'; // mint
    if (score >= 5) return '#f7e16a'; // yellow
    return '#f76a8c'; // red/pink
  };

  const getScoreClass = (score: number) => {
    if (score >= 8) return 'text-[#6af7c8] border-[#6af7c8]/30 bg-[#6af7c8]/10';
    if (score >= 5) return 'text-[#f7e16a] border-[#f7e16a]/30 bg-[#f7e16a]/10';
    return 'text-[#f76a8c] border-[#f76a8c]/30 bg-[#f76a8c]/10';
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Radar Chart Container */}
      <motion.div 
        animate={controls}
        style={{ width: sizePx, height: sizePx }}
        className="relative"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#1e1e30" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#7070a0', fontSize: 11, fontWeight: 600 }} 
            />
            <PolarRadiusAxis 
              domain={[0, 10]} 
              tick={false} 
              axisLine={false} 
              tickCount={5} 
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#6af7c8"
              strokeWidth={2}
              fill="#7c6af7"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Score Chips */}
      <div className="w-full max-w-md space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {data.map((item) => (
            <div 
              key={item.subject}
              className={cn(
                "px-2 py-1.5 border rounded-md text-[9px] font-mono font-bold uppercase tracking-tighter text-center transition-colors duration-300",
                getScoreClass(item.score)
              )}
            >
              {item.subject}: {item.score.toFixed(1)}
            </div>
          ))}
        </div>

        {/* Average Score */}
        <div className="flex flex-col items-center pt-2">
          <div className="px-4 py-1 bg-surface border border-border rounded-full shadow-inner">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] font-bold">
              Avg: <span className="text-text-primary">{avgScore}</span> / 10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillRadarChart;
