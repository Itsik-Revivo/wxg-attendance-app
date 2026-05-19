import { create } from 'zustand';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const TENANT_ID  = Constants.expoConfig?.extra?.azureTenantId as string;
const CLIENT_ID  = Constants.expoConfig?.extra?.azureClientId as string;
const TOKEN_KEY  = 'wxg_access_token';
const REFRESH_KEY = 'wxg_refresh_token';

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint:         `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
};

interface Employee {
  id:             string;
  fullName:       string;
  email:          string | null;
  jobTitle:       string | null;
  company:        string;
  isPayrollAdmin: boolean;
}

interface AuthState {
  token:      string | null;
  employee:   Employee | null;
  isLoading:  boolean;
  error:      string | null;

  login:      () => Promise<void>;
  logout:     () => Promise<void>;
  loadToken:  () => Promise<void>;
  setEmployee:(emp: Employee) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token:     null,
  employee:  null,
  isLoading: false,
  error:     null,

  // ── Load saved token on app start ──────────────────────────
  loadToken: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) set({ token });
  },

  // ── Azure AD login via browser ─────────────────────────────
  login: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'wxg-attendance' });

      const request = new AuthSession.AuthRequest({
        clientId:    CLIENT_ID,
        redirectUri,
        scopes:      ['openid', 'profile', 'email', `api://${CLIENT_ID}/attendance`],
        responseType: AuthSession.ResponseType.Code,
        usePKCE:     true,
      });

      const result = await request.promptAsync(discovery);

      if (result.type !== 'success') {
        throw new Error('התחברות בוטלה');
      }

      // Exchange code for token
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId:     CLIENT_ID,
          code:         result.params.code,
          redirectUri,
          extraParams:  { code_verifier: request.codeVerifier! },
        },
        discovery
      );

      const { accessToken, refreshToken } = tokenResult;

      await SecureStore.setItemAsync(TOKEN_KEY,  accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
      }

      set({ token: accessToken, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Logout ─────────────────────────────────────────────────
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ token: null, employee: null });
  },

  setEmployee: (employee) => set({ employee }),
}));
