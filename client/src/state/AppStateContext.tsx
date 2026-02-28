import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { getUsername, saveUsername } from "../services/indexedDb";
import type { ShareDuration, UploadSession } from "../types/file";
import { getDeviceId, getOrCreateOwnerKey } from "../utils/id";
import { upsertDevice, type OwnerAuth } from "../services/api";

const LAST_UPLOAD_KEY = "filezap:lastUpload";

type AppStateContextType = {
  username: string;
  isUserReady: boolean;
  shareDuration: ShareDuration;
  lastUpload: UploadSession | null;
  ownerAuth: OwnerAuth | null;
  setShareDuration: (value: ShareDuration) => void;
  setUsernameAndPersist: (value: string) => Promise<void>;
  setLastUpload: (value: UploadSession) => void;
  clearLastUpload: () => void;
};


const AppStateContext = createContext<AppStateContextType | null>(null);

function generateRandomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 2,
  });
}

function readLastUpload(): UploadSession | null {
  try {
    const rawValue = sessionStorage.getItem(LAST_UPLOAD_KEY);
    if (!rawValue) {
      return null;
    }
    return JSON.parse(rawValue) as UploadSession;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState("");
  const [isUserReady, setIsUserReady] = useState(false);
  const [shareDuration, setShareDuration] =
    useState<ShareDuration>("12hr");
  const [lastUpload, setLastUploadState] = useState<UploadSession | null>(null);
  const [ownerAuth, setOwnerAuth] = useState<OwnerAuth | null>(null);

  useEffect(() => {
    const initUser = async () => {
      try {
        const storedName = await getUsername();
        if (storedName) {
          setUsername(storedName);
        } else {
          const newName = generateRandomName();
          setUsername(newName);
          await saveUsername(newName);
        }

        // Initialize device ownership
        const deviceId = await getDeviceId();
        const ownerKey = getOrCreateOwnerKey();
        
        await upsertDevice({ uniqueId: deviceId, ownerKey });
        setOwnerAuth({ deviceId, ownerKey });

      } catch (err) {
        console.error("Failed to init auth", err);
      } finally {
        setIsUserReady(true);
      }
    };

    initUser();
    setLastUploadState(readLastUpload());
  }, []);

  const setUsernameAndPersist = useCallback(async (value: string) => {
    setUsername(value);
    await saveUsername(value);
  }, []);

  const setLastUpload = useCallback((value: UploadSession) => {
    setLastUploadState(value);
    sessionStorage.setItem(LAST_UPLOAD_KEY, JSON.stringify(value));
  }, []);

  const clearLastUpload = useCallback(() => {
    setLastUploadState(null);
    sessionStorage.removeItem(LAST_UPLOAD_KEY);
  }, []);

  const contextValue = useMemo(
    () => ({
      username,
      isUserReady,
      shareDuration,
      lastUpload,
      ownerAuth,
      setShareDuration,
      setUsernameAndPersist,
      setLastUpload,
      clearLastUpload,
    }),
    [
      username,
      isUserReady,
      shareDuration,
      lastUpload,
      ownerAuth,
      setUsernameAndPersist,
      setLastUpload,
      clearLastUpload,
    ],
  );

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}
