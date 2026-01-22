import RSVPReader from '@/components/RSVPReader';
import * as DocumentPicker from 'expo-document-picker';
import { extractText, isAvailable } from 'expo-pdf-text-extract';
import { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        copyToCacheDirectory: true, // Important for Android/iOS access
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);
      const uri = result.assets[0].uri;
      setFileName(result.assets[0].name);

      console.log('Extracting text from:', uri);
      const extractedText = await extractText(uri);

      // Clean up text a bit (optional)
      // Removing excessive newlines or weird artifacts could happen in the hook, but let's send raw text.
      if (!extractedText || extractedText.trim().length === 0) {
        Alert.alert("No Text Found", "Could not extract text from this PDF. It might be a scanned image.");
        setLoading(false);
        return;
      }

      setText(extractedText);
    } catch (err) {
      console.error('Extraction error:', err);
      Alert.alert("Error", "Failed to extract text from PDF.");
    } finally {
      setLoading(false);
    }
  };

  if (text) {
    return <RSVPReader text={text} onClose={() => setText(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RSVP Reader</Text>
        <Text style={styles.subtitle}>Rapid Serial Visual Presentation</Text>

        <View style={styles.card}>
          <Text style={styles.instruction}>
            Select a PDF file to verify and read it word-by-word.
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={pickDocument}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Select PDF File</Text>}
          </TouchableOpacity>

          {!isAvailable() && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Native PDF module not found.
                {'\n'}This app must be run as a Development Build.
                {'\n'}Run: npx expo run:ios
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Supported: Digital PDFs (not scanned images)
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  card: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  instruction: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
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
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: 40,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});
