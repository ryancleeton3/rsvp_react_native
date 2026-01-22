import RSVPReader from '@/components/RSVPReader';
import { Book, clearLibrary, deleteBook, getLibrary, saveBookToLibrary, updateBookProgress } from '@/utils/storage';
import * as DocumentPicker from 'expo-document-picker';
import { extractTextFromPage, getPageCount, isAvailable } from 'expo-pdf-text-extract';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Library State
  const [library, setLibrary] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);

  // Maps needed for valid rendering
  const [activePageMap, setActivePageMap] = useState<number[]>([]);

  useEffect(() => {
    loadLibrary();
  }, [text]);

  const loadLibrary = async () => {
    const books = await getLibrary();
    setLibrary(books);
  };

  const handleClearLibrary = async () => {
    Alert.alert("Clear Library", "Are you sure? This will delete all imported books.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All", style: "destructive", onPress: async () => {
          await clearLibrary();
          setLibrary([]);
        }
      }
    ]);
  }

  const handleDeleteBook = async (id: string) => {
    await deleteBook(id);
    loadLibrary();
  }

  const pickAndImportDocument = async () => {
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

      // Import Process
      console.log('Importing PDF:', uri);

      // 1. Parse Metadata (Page Map & Text Check)
      let fullText = '';
      const newPageMap: number[] = [];
      let totalWords = 0;

      try {
        const pageCount = await getPageCount(uri);
        let currentWordCount = 0;

        for (let i = 1; i <= pageCount; i++) {
          newPageMap.push(currentWordCount);
          const pageText = await extractTextFromPage(uri, i);
          const pageWords = pageText.replace(/\s+/g, ' ').trim().split(' ').length;
          fullText += pageText + ' ';
          currentWordCount += pageWords;
        }
        totalWords = currentWordCount;
      } catch (e) {
        console.error(e);
        Alert.alert("Import Failed", "Could not process this PDF.");
        setLoading(false);
        return;
      }

      if (!fullText || fullText.trim().length === 0) {
        Alert.alert("No Text Found", "Could not extract text. It might be a scanned image.");
        setLoading(false);
        return;
      }

      // 2. Save to Library (Copy File)
      const newBook = await saveBookToLibrary(uri, fileName, totalWords, newPageMap);

      // 3. Open it immediately
      openBook(newBook, fullText);

    } catch (err) {
      console.error('Import error:', err);
      Alert.alert("Error", "Failed to import document.");
    } finally {
      setLoading(false);
    }
  };

  const openBook = async (book: Book, preLoadedText?: string) => {
    try {
      setLoading(true);

      let bookText = preLoadedText;

      // If we don't have text (opening from library), we need to extract it again from the SAVED uri
      if (!bookText) {
        let reconstructed = '';
        const pageCount = book.pageMap.length;
        for (let i = 1; i <= pageCount; i++) {
          const pageText = await extractTextFromPage(book.uri, i);
          reconstructed += pageText + ' ';
        }
        bookText = reconstructed;
      }

      setText(bookText);
      setCurrentBook(book);
      setActivePageMap(book.pageMap);

    } catch (e) {
      console.error("Failed to open book", e);
      Alert.alert("Error", "Could not open book. File might be missing.");
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = (index: number) => {
    if (currentBook) {
      if (Math.abs(index - currentBook.lastIndex) > 5) {
        updateBookProgress(currentBook.id, index);
        currentBook.lastIndex = index;
      }
    }
  };

  const closeReader = () => {
    setText(null);
    setCurrentBook(null);
    loadLibrary();
  };

  if (text && currentBook) {
    return (
      <RSVPReader
        text={text}
        uri={currentBook.uri}
        onClose={closeReader}
        initialIndex={currentBook.lastIndex}
        onProgress={handleProgress}
        pageMap={activePageMap}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RSVP Reader</Text>
        <Text style={styles.subtitle}>Library</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={pickAndImportDocument}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>+ Import PDF</Text>}
          </TouchableOpacity>

          {!isAvailable() && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Native module missing. Run dev build.
              </Text>
            </View>
          )}
        </View>

        {/* Library Section */}
        <View style={styles.libraryContainer}>
          <View style={styles.libraryHeader}>
            <Text style={styles.libraryTitle}>My Books</Text>
            {library.length > 0 && (
              <TouchableOpacity onPress={handleClearLibrary}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {library.length === 0 ? (
            <Text style={styles.emptyText}>No books imported</Text>
          ) : (
            <FlatList
              data={library}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.bookItem}>
                  <TouchableOpacity
                    style={styles.bookInfo}
                    onPress={() => openBook(item)}
                  >
                    <Text style={styles.bookName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.bookProgress}>
                      {Math.round(item.lastIndex / item.totalWords * 100)}% • {item.totalWords} words
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteBook(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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

  libraryContainer: {
    flex: 1,
    width: '100%',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  libraryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  bookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookProgress: {
    fontSize: 12,
    color: '#666',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 18,
  },
});
