// Navigation param contracts. Typing the param list once gives every screen
// typed route params and typed navigation calls (the pattern to copy for new
// screens). The server-owned resend cooldown is carried from Phone → Code as a
// param — it is NOT recomputed on the code screen (TZ §6.1).

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Phone: undefined;
  Code: { phone: string; retryAfterSec: number };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
