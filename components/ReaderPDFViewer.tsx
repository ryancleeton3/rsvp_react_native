import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';

interface ReaderPDFViewerProps {
    visible: boolean;
    uri: string;
    onClose: () => void;
    initialPage: number;
}

export default function ReaderPDFViewer({ visible, uri, onClose, initialPage }: ReaderPDFViewerProps) {
    // initialPage is 1-indexed for the PDF viewer usually, but let's check. 
    // react-native-pdf uses page starting at 1.
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>PDF View</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {uri ? (
                    <Pdf
                        source={{ uri, cache: true }}
                        page={initialPage}
                        horizontal={false}
                        enablePaging={true}
                        style={styles.pdf}
                        onLoadComplete={(numberOfPages) => {
                            console.log(`Number of pages: ${numberOfPages}`);
                        }}
                        onError={(error) => {
                            console.log(error);
                        }}
                    />
                ) : (
                    <View style={styles.errorContainer}>
                        <Text>No PDF URI provided</Text>
                    </View>
                )}
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
        backgroundColor: '#f8f8f8',
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
        fontWeight: '600',
    },
    pdf: {
        flex: 1,
        width: '100%',
        backgroundColor: '#f5f5f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
