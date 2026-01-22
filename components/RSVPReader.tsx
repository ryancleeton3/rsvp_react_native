import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        chunkSize,
        setChunkSize
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
        for (let i = pageMap.length - 1; i >= 0; i--) {
            if (index >= pageMap[i]) {
                return i + 1;
            }
        }
        return 1;
    }, [index, pageMap]);

    // Logic to find pivot character (Only used if chunkSize === 1)
    const pivotIndex = Math.floor((currentWord.length - 1) / 2);
    const leftPart = currentWord.slice(0, pivotIndex);
    const pivotChar = currentWord[pivotIndex];
    const rightPart = currentWord.slice(pivotIndex + 1);

    const progress = totalWords > 0 ? index / totalWords : 0;

    const handlePageSelect = (pageIndex: number, wordIndex: number) => {
        seek(wordIndex);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            bounces={false}
        >
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
                        <Text style={styles.headerBtnText}>Page {currentPage}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.stats}>{index + 1} / {totalWords}</Text>
            </View>

            {/* Reader Area */}
            <View style={styles.readerContainer}>
                {chunkSize === 1 ? (
                    <View style={styles.wordRow}>
                        <Text style={[styles.wordText, styles.leftText]}>{leftPart}</Text>
                        <Text style={[styles.wordText, styles.pivotText]}>{pivotChar}</Text>
                        <Text style={[styles.wordText, styles.rightText]}>{rightPart}</Text>
                    </View>
                ) : (
                    <Text style={styles.chunkText}>{currentWord}</Text>
                )}

                {/* Guide Lines */}
                <View style={styles.guideContainer}>
                    <View style={styles.guideTop} />
                    <View style={styles.guideBottom} />
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>

                <View style={styles.settingsRow}>
                    {/* WPM Control */}
                    <View style={styles.settingGroup}>
                        <Text style={styles.settingLabel}>Speed (WPM)</Text>
                        <View style={styles.settingControls}>
                            <TouchableOpacity onPress={() => setWpm(Math.max(100, wpm - 25))} style={styles.btnSmall}>
                                <Text style={styles.btnTextSmall}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.settingValue}>{wpm}</Text>
                            <TouchableOpacity onPress={() => setWpm(wpm + 25)} style={styles.btnSmall}>
                                <Text style={styles.btnTextSmall}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Chunk Size Control */}
                    <View style={styles.settingGroup}>
                        <Text style={styles.settingLabel}>Words</Text>
                        <View style={styles.settingControls}>
                            <TouchableOpacity onPress={() => setChunkSize(Math.max(1, chunkSize - 1))} style={styles.btnSmall}>
                                <Text style={styles.btnTextSmall}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.settingValue}>{chunkSize}</Text>
                            <TouchableOpacity onPress={() => setChunkSize(Math.min(5, chunkSize + 1))} style={styles.btnSmall}>
                                <Text style={styles.btnTextSmall}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Play / Pause */}
                <TouchableOpacity onPress={togglePlay} style={[styles.playButton, isPlaying ? styles.btnPause : styles.btnPlay]}>
                    <Text style={styles.playButtonText}>{isPlaying ? 'PAUSE' : 'READ'}</Text>
                </TouchableOpacity>

                {/* Seek */}
                <View style={styles.seekRow}>
                    <TouchableOpacity onPress={() => seek(index - 10)} style={styles.seekBtn}><Text style={styles.seekText}>-10</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => seek(index + 10)} style={styles.seekBtn}><Text style={styles.seekText}>+10</Text></TouchableOpacity>
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        minHeight: Dimensions.get('window').height, // Ensure it takes full height
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerCenter: {
        flexDirection: 'row',
        gap: 10,
    },
    headerBtn: {
        backgroundColor: '#333',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    headerBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    closeButton: {
        padding: 5,
    },
    closeText: {
        color: '#aaa',
        fontSize: 14,
    },
    stats: {
        color: '#666',
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },

    readerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        minHeight: 150,
    },
    wordRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        width: '100%',
    },
    wordText: {
        fontSize: 52,
        fontWeight: '600',
        color: '#eee',
        // fontFamily: 'Menlo', 
    },
    chunkText: {
        fontSize: 42,
        fontWeight: '600',
        color: '#eee',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 50,
    },
    leftText: {
        textAlign: 'right',
        width: '48%',
        paddingRight: 2,
    },
    pivotText: {
        color: '#e74c3c',
        textAlign: 'center',
        width: 40,
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
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.1,
        zIndex: -1,
    },
    guideTop: {
        width: 2,
        height: 12,
        backgroundColor: '#fff',
    },
    guideBottom: {
        width: 2,
        height: 12,
        backgroundColor: '#fff',
        marginTop: 90,
    },

    controls: {
        gap: 20,
        marginTop: 20,
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

    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    settingGroup: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 12,
    },
    settingLabel: {
        color: '#888',
        fontSize: 10,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    btnSmall: {
        backgroundColor: '#333',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnTextSmall: {
        color: '#fff',
        fontSize: 18,
        marginTop: -3,
    },
    settingValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 40,
        textAlign: 'center',
    },

    playButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    btnPlay: {
        backgroundColor: '#fff',
    },
    btnPause: {
        backgroundColor: '#e74c3c',
    },
    playButtonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
    },

    seekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    seekBtn: {
        padding: 10,
    },
    seekText: {
        color: '#666',
        fontSize: 14,
    }
});
