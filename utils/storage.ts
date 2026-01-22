import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
    uri: string;
    name: string;
    lastIndex: number;
    totalWords: number;
    timestamp: number;
}

const HISTORY_KEY = 'rsvp_history';

export const saveHistoryItem = async (item: HistoryItem) => {
    try {
        const history = await getHistory();
        // Remove existing entry for this URI if it exists (to move it to top/update it)
        const filtered = history.filter((i) => i.uri !== item.uri);

        const newHistory = [item, ...filtered].slice(0, 20); // Keep last 20
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.error('Failed to save history', e);
    }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    try {
        const json = await AsyncStorage.getItem(HISTORY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load history', e);
        return [];
    }
};

export const clearHistory = async () => {
    try {
        await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (e) {
        console.error('Failed to clear history');
    }
}
