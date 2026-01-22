import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface Book {
    id: string; // Unique ID (could be original filename + timestamp)
    uri: string; // Local persistent URI
    name: string;
    lastIndex: number;
    totalWords: number;
    timestamp: number;
    pageMap: number[]; // Store page map so we don't re-parse
}

const LIBRARY_KEY = 'rsvp_library_v1';
const BOOKS_DIR = FileSystem.documentDirectory + 'books/';

// Ensure directory exists
const ensureDir = async () => {
    try {
        await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
    } catch (e) {
        // Ignore specific error if it already exists, though intermediates: true typically handles this.
        console.log('Ensure dir error (ignorable):', e);
    }
};

export const saveBookToLibrary = async (
    tempUri: string,
    fileName: string,
    totalWords: number,
    pageMap: number[]
): Promise<Book> => {
    try {
        await ensureDir();

        // Create unique filename
        const safeName = fileName.replace(/[^a-z0-9.]/gi, '_');
        const newUri = BOOKS_DIR + Date.now() + '_' + safeName;

        // Copy file
        await FileSystem.copyAsync({
            from: tempUri,
            to: newUri
        });

        const newBook: Book = {
            id: Date.now().toString(),
            uri: newUri,
            name: fileName,
            lastIndex: 0,
            totalWords,
            timestamp: Date.now(),
            pageMap
        };

        const books = await getLibrary();
        const updatedBooks = [newBook, ...books];
        await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedBooks));

        return newBook;
    } catch (e) {
        console.error('Failed to save book', e);
        throw e;
    }
};

export const updateBookProgress = async (bookId: string, index: number) => {
    try {
        const books = await getLibrary();
        const updatedBooks = books.map(b => {
            if (b.id === bookId) {
                return { ...b, lastIndex: index, timestamp: Date.now() };
            }
            return b;
        });
        // Sort by recent
        updatedBooks.sort((a, b) => b.timestamp - a.timestamp);

        await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedBooks));
    } catch (e) {
        console.error('Failed to update progress', e);
    }
};

export const getLibrary = async (): Promise<Book[]> => {
    try {
        const json = await AsyncStorage.getItem(LIBRARY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load library', e);
        return [];
    }
};

export const deleteBook = async (bookId: string) => {
    try {
        const books = await getLibrary();
        const bookToDelete = books.find(b => b.id === bookId);

        if (bookToDelete) {
            // Try to delete file
            await FileSystem.deleteAsync(bookToDelete.uri, { idempotent: true });
        }

        const updatedBooks = books.filter(b => b.id !== bookId);
        await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedBooks));
    } catch (e) {
        console.error('Failed to delete book', e);
    }
};

export const clearLibrary = async () => {
    try {
        const books = await getLibrary();
        for (const book of books) {
            await FileSystem.deleteAsync(book.uri, { idempotent: true });
        }
        await AsyncStorage.removeItem(LIBRARY_KEY);
    } catch (e) {
        console.error('Failed to clear library');
    }
}
