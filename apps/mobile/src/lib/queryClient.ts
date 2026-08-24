import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Feeds real connectivity state to React Query so mutations (all our log
// inserts) pause while offline and auto-replay in order once back online —
// the offline write queue from ARCHITECTURE.md §9.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 3,
    },
  },
});

// Persists the query/mutation cache to AsyncStorage so a queued write
// survives the app being killed while still offline.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'k9log-query-cache',
});
