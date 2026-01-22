import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TOCModalProps {
    visible: boolean;
    onClose: () => void;
    pageMap: number[];
    onSelectPage: (pageIndex: number, wordIndex: number) => void;
    currentPage: number;
}

export default function TOCModal({ visible, onClose, pageMap, onSelectPage, currentPage }: TOCModalProps) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Table of Contents</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={pageMap}
                    keyExtractor={(_, index) => `page-${index}`}
                    renderItem={({ item: wordIndex, index }) => {
                        const pageNum = index + 1;
                        const isCurrent = pageNum === currentPage;
                        return (
                            <TouchableOpacity
                                style={[styles.item, isCurrent && styles.activeItem]}
                                onPress={() => {
                                    onSelectPage(index, wordIndex);
                                    onClose();
                                }}
                            >
                                <Text style={[styles.itemText, isCurrent && styles.activeText]}>
                                    Page {pageNum}
                                </Text>
                                <Text style={styles.subText}>Starts at word {wordIndex}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        color: '#007AFF',
        fontSize: 16,
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activeItem: {
        backgroundColor: '#e6f2ff',
    },
    itemText: {
        fontSize: 16,
        color: '#333',
    },
    activeText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    subText: {
        color: '#999',
        fontSize: 12,
    },
});
