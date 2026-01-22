import { useEffect, useMemo, useRef, useState } from 'react';

export function useRSVP(text: string, initialWpm: number = 300, initialIndex: number = 0) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [index, setIndex] = useState(initialIndex);
    const [wpm, setWpm] = useState(initialWpm);
    const [chunkSize, setChunkSize] = useState(1);

    // Split text into words, filter empty strings
    const words = useMemo(() => {
        if (!text) return [];
        return text.replace(/\s+/g, ' ').trim().split(' ');
    }, [text]);

    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (isPlaying && words.length > 0) {
            const interval = (60000 / wpm) * chunkSize;
            timerRef.current = setInterval(() => {
                setIndex((prev) => {
                    const nextIndex = prev + chunkSize;
                    if (nextIndex >= words.length) {
                        setIsPlaying(false);
                        return Math.min(nextIndex, words.length); // Cap at end
                    }
                    return nextIndex;
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
    }, [isPlaying, wpm, words.length, chunkSize]);

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

    // Get the current chunk of words
    const currentChunk = words.slice(index, index + chunkSize).join(' ');

    return {
        currentWord: currentChunk, // Renaming for compatibility or we can change consumer
        index,
        totalWords: words.length,
        isPlaying,
        wpm,
        setWpm,
        chunkSize,
        setChunkSize,
        play,
        pause,
        togglePlay,
        seek,
        restart
    };
}
