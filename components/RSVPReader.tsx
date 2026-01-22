import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRSVP } from '../hooks/useRSVP';
import ReaderPDFViewer from './ReaderPDFViewer';
import TOCModal from './TOCModal';

interface RSVPReaderProps {
    text: string;
    uri: string;
    onClose?: () => void;
    initialIndex?: number;
    onProgress?: (index: number, total: number) => void;
    pageMap?: number[];
}

export default function RSVPReader({ text, uri, onClose, initialIndex = 0, onProgress, pageMap = [] }: RSVPReaderProps) {
    const {
        currentWord,
        index,
        totalWords,
        isPlaying,
        wpm,
        setWpm,
        togglePlay,
        seek,
    } = useRSVP(text, 350, initialIndex);

    const [showTOC, setShowTOC] = useState(false);
    const [showPDF, setShowPDF] = useState(false);

    React.useEffect(() => {
        if (onProgress) {
            onProgress(index, totalWords);
        }
    }, [index, totalWords, onProgress]);

    // Calculate current page based on index and pageMap
    const currentPage = useMemo(() => {
        if (!pageMap || pageMap.length === 0) return 1;
        // Find the index in pageMap where value is <= index
        for (let i = pageMap.length - 1; i >= 0; i--) {
            if (index >= pageMap[i]) {
                return i + 1;
            }
        }
        return 1;
    }, [index, pageMap]);

    // Logic to find pivot character
    // Spritz algorithmish: usually around 35% into the word, but center is safer for simple UI
    const pivotIndex = Math.floor((currentWord.length - 1) / 2);
    const leftPart = currentWord.slice(0, pivotIndex);
    const pivotChar = currentWord[pivotIndex];
    const rightPart = currentWord.slice(pivotIndex + 1);

    const progress = totalWords > 0 ? index / totalWords : 0;

    const handlePageSelect = (pageIndex: number, wordIndex: number) => {
        seek(wordIndex);
        // Note: seek updates state, but if paused, it just moves position.
    };

    return (
        <View style={styles.container}>
            {/* Header / Close */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕ Close</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <TouchableOpacity onPress={() => setShowTOC(true)} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Contents</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowPDF(true)} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>View Page {currentPage}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.stats}>{index + 1} / {totalWords}</Text>
            </View>

            {/* Reader Area */}
            <View style={styles.readerContainer}>
                <View style={styles.wordRow}>
                    <Text style={[styles.wordText, styles.leftText]}>{leftPart}</Text>
                    <Text style={[styles.wordText, styles.pivotText]}>{pivotChar}</Text>
                    <Text style={[styles.wordText, styles.rightText]}>{rightPart}</Text>
                </View>
                {/* Fixed Guide Lines (optional) */}
                <View style={styles.guideContainer}>
                    <View style={styles.guideTop} />
                    <View style={styles.guideBottom} />
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>

                {/* WPM Control */}
                <View style={styles.wpmContainer}>
                    <TouchableOpacity onPress={() => setWpm(Math.max(100, wpm - 25))} style={styles.btnSmall}>
                        <Text style={styles.btnTextSmall}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.wpmText}>{wpm} WPM</Text>
                    <TouchableOpacity onPress={() => setWpm(wpm + 25)} style={styles.btnSmall}>
                        <Text style={styles.btnTextSmall}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Play Button */}
                <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                    <Text style={styles.playButtonText}>{isPlaying ? 'PAUSE' : 'READ'}</Text>
                </TouchableOpacity>

                {/* Seek buttons */}
                <View style={styles.seekRow}>
                    <TouchableOpacity onPress={() => seek(index - 10)}><Text style={styles.seekText}>-10</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => seek(index + 10)}><Text style={styles.seekText}>+10</Text></TouchableOpacity>
                </View>
            </View>

            {/* Modals */}
            <TOCModal
                visible={showTOC}
                onClose={() => setShowTOC(false)}
                pageMap={pageMap}
                currentPage={currentPage}
                onSelectPage={handlePageSelect}
            />

            <ReaderPDFViewer
                visible={showPDF}
                uri={uri}
                onClose={() => setShowPDF(false)}
                initialPage={currentPage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111', // Dark mode deeply
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerCenter: {
        flexDirection: 'row',
        gap: 15,
    },
    headerBtn: {
        backgroundColor: '#333',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    headerBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        padding: 10,
    },
    closeText: {
        color: '#888',
        fontSize: 16,
    },
    stats: {
        color: '#666',
        fontVariant: ['tabular-nums'],
    },

    readerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        minHeight: 120,
    },
    wordRow: {
        flexDirection: 'row',
        alignItems: 'baseline', // or center
        justifyContent: 'center',
        width: '100%',
    },
    wordText: {
        fontSize: 52,
        fontWeight: '600',
        color: '#eee',
        fontFamily: 'Menlo', // Monospace helps alignment, or try standard and rely on flex
        // On iOS standard Menlo/Courier. Android monospace.
    },
    leftText: {
        textAlign: 'right',
        width: '48%', // Leaves 4% for pivot?
        paddingRight: 2,
    },
    pivotText: {
        color: '#e74c3c', // Red Pivot
        textAlign: 'center',
        width: 40, // Fixed width for stability? Or auto.
        // If we use flex, we need to be careful.
        // Let's try explicit flex:
        // flex: 0 but we want it centered exactly in the CONTAINER.
        // Using widths is safer:
    },
    rightText: {
        textAlign: 'left',
        width: '48%',
        paddingLeft: 2,
    },

    guideContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 2,
        // transform: [{translateX: -1}],
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.1,
    },
    guideTop: {
        width: 2,
        height: 10,
        backgroundColor: '#fff',
    },
    guideBottom: {
        width: 2,
        height: 10,
        backgroundColor: '#fff',
        marginTop: 80,
    },

    controls: {
        gap: 20,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#e74c3c',
    },

    wpmContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    btnSmall: {
        padding: 10,
        backgroundColor: '#222',
        borderRadius: 8,
        width: 44,
        alignItems: 'center',
    },
    btnTextSmall: {
        color: '#fff',
        fontSize: 18,
    },
    wpmText: {
        color: '#bbb',
        fontSize: 18,
        fontWeight: 'bold',
        width: 100,
        textAlign: 'center',
    },

    playButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    playButtonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    seekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    seekText: {
        color: '#555',
    }

});
