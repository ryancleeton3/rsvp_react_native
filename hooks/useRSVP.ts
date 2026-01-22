import { useEffect, useMemo, useRef, useState } from 'react';

export function useRSVP(text: string, initialWpm: number = 300) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [index, setIndex] = useState(0);
    const [wpm, setWpm] = useState(initialWpm);

    // Split text into words, filter empty strings
    const words = useMemo(() => {
        if (!text) return [];
        return text.replace(/\s+/g, ' ').trim().split(' ');
    }, [text]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isPlaying && words.length > 0) {
            const interval = 60000 / wpm;
            timerRef.current = setInterval(() => {
                setIndex((prev) => {
                    if (prev >= words.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, interval);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, wpm, words.length]);

    const play = () => setIsPlaying(true);
    const pause = () => setIsPlaying(false);
    const togglePlay = () => setIsPlaying(!isPlaying);

    const seek = (newIndex: number) => {
        const safeIndex = Math.max(0, Math.min(newIndex, words.length - 1));
        setIndex(safeIndex);
    };

    const restart = () => {
        setIndex(0);
        setIsPlaying(true);
    }

    const currentWord = words[index] || '';

    return {
        currentWord,
        index,
        totalWords: words.length,
        isPlaying,
        wpm,
        setWpm,
        play,
        pause,
        togglePlay,
        seek,
        restart
    };
}
