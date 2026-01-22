import RSVPReader from '@/components/RSVPReader';
import { clearHistory, getHistory, HistoryItem, saveHistoryItem } from '@/utils/storage';
import * as DocumentPicker from 'expo-document-picker';
import { extractText, isAvailable } from 'expo-pdf-text-extract';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [currentHistoryItem, setCurrentHistoryItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, [text]); // Reload history when closing reader (text becomes null)

  const loadHistory = async () => {
    const items = await getHistory();
    setHistory(items);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  }

  const pickDocument = async () => {
    if (!isAvailable()) {
      Alert.alert(
        "Development Build Required",
        "PDF extraction requires a native module. Please run `npx expo run:ios` or `npx expo run:android`."
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setLoading(true);
      const uri = result.assets[0].uri;
      const fileName = result.assets[0].name;

      await loadAndOpenPdf(uri, fileName, 0); // Start fresh
    } catch (err) {
      console.error('Picker error:', err);
      Alert.alert("Error", "Failed to pick document.");
    } finally {
      setLoading(false);
    }
  };

  const loadAndOpenPdf = async (uri: string, name: string, startAt: number) => {
    try {
      setLoading(true);
      console.log('Extracting text from:', uri);

      let extractedText = '';
      try {
        extractedText = await extractText(uri);
      } catch (e) {
        // If file is missing (common with cached files on restart), we might fail
        console.error(e);
        Alert.alert("File Not Found", "Could not find the file. It may have been moved or deleted.");
        setLoading(false);
        return;
      }

      if (!extractedText || extractedText.trim().length === 0) {
        Alert.alert("No Text Found", "Could not extract text from this PDF. It might be a scanned image.");
        setLoading(false);
        return;
      }

      setText(extractedText);
      setResumeIndex(startAt);

      // Setup current item for progress saving
      // We know the total length roughly, but we'll get exact total words from the hook later? 
      // Actually hook calculates words. We can just save basic info now.
      const totalEstimate = extractedText.split(/\s+/).length;

      const item: HistoryItem = {
        uri,
        name,
        lastIndex: startAt,
        totalWords: totalEstimate,
        timestamp: Date.now()
      };
      setCurrentHistoryItem(item);

      // Initial save
      await saveHistoryItem(item);

    } catch (err) {
      console.error('Extraction error:', err);
      Alert.alert("Error", "Failed to extract text.");
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = (index: number, total: number) => {
    if (currentHistoryItem) {
      // Throttle saves? For now doing it on every update might be okay or slightly heavy.
      // Better: just update a ref, and save on unmount?
      // Since this is a simple app, let's just save every 50 words or so?
      // For safety, let's just save. Async storage is fast enough for 300ms intervals usually.
      // But to be cleaner, let's debounce inside the component or just trust the user will pause/close.
      // Actually, let's update the local state, and save on close.

      // But if app crashes we lose progress.
      // Let's safe-guard: save every 5 seconds?
      // For this MVP, let's simply save whenever "index" updates in a way that matters (e.g. periodically)
      // But here we are in the callback.

      // Let's only save if index changed significantly?
      if (Math.abs(index - currentHistoryItem.lastIndex) > 5 || index === total - 1) {
        const newItem = { ...currentHistoryItem, lastIndex: index, totalWords: total, timestamp: Date.now() };
        setCurrentHistoryItem(newItem);
        saveHistoryItem(newItem).catch(console.error);
      }
    }
  };

  const closeReader = () => {
    setText(null);
    setCurrentHistoryItem(null);
  };

  if (text) {
    return (
      <RSVPReader
        text={text}
        onClose={closeReader}
        initialIndex={resumeIndex}
        onProgress={handleProgress}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RSVP Reader</Text>
        <Text style={styles.subtitle}>Rapid Serial Visual Presentation</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={pickDocument}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Select New PDF</Text>}
          </TouchableOpacity>

          {!isAvailable() && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Native PDF module not found. Run dev build.
              </Text>
            </View>
          )}
        </View>

        {/* History Section */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Files</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {history.length === 0 ? (
            <Text style={styles.emptyText}>No recent files</Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.uri}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => loadAndOpenPdf(item.uri, item.name, item.lastIndex)}
                >
                  <View>
                    <Text style={styles.historyName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.historyProgress}>
                      Word {item.lastIndex} / {item.totalWords} ({Math.round(item.lastIndex / item.totalWords * 100)}%)
                    </Text>
                  </View>
                  <Text style={styles.historyArrow}>→</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  warningBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },

  historyContainer: {
    flex: 1,
    width: '100%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyProgress: {
    fontSize: 12,
    color: '#666',
  },
  historyArrow: {
    fontSize: 20,
    color: '#ccc',
  },
});
