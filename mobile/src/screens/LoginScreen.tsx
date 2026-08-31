import React, { useState } from 'react';
import {
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, isSubmitting, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    clearError();
    if (!email.trim() || !password) {
      setFormError('Informe e-mail e senha.');
      return;
    }
    try {
      await login({ email: email.trim(), password });
      // Navigation to the main tabs happens automatically: RootNavigator
      // swaps stacks once AuthContext.user becomes non-null.
    } catch {
      // error message is already surfaced via AuthContext.error
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://api.dicebear.com/7.x/initials/png?seed=Smart+HAS' }}
            style={styles.logo}
          />
          <Text style={styles.title}>Smart HAS</Text>
          <Text style={styles.subtitle}>
            Monitoramento de Hipertensão Arterial Sistêmica{'\n'}+ AI Logistics Extension
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="voce@exemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="login-email"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            testID="login-password"
          />

          {(formError || error) && <Text style={styles.error}>{formError ?? error}</Text>}

          <View style={styles.buttonWrapper}>
            {isSubmitting ? (
              <Text style={styles.loadingText}>Entrando...</Text>
            ) : (
              <Button title="Entrar" onPress={handleSubmit} color={colors.primary} />
            )}
          </View>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              Não tem conta? <Text style={styles.registerLinkStrong}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.white,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    fontSize: 13,
  },
  buttonWrapper: {
    marginTop: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 8,
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerLinkText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  registerLinkStrong: {
    color: colors.primary,
    fontWeight: '700',
  },
});
