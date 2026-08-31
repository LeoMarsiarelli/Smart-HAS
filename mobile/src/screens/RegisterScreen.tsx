import React, { useState } from 'react';
import {
  Button,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register, isSubmitting, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    clearError();
    if (!name.trim() || !email.trim() || !password) {
      setFormError('Preencha nome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      // On success AuthContext.user is set and RootNavigator switches to the
      // main tabs automatically.
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
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Cadastre-se para começar a monitorar sua pressão</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            value={name}
            onChangeText={setName}
            testID="register-name"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="voce@exemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="register-email"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            testID="register-password"
          />

          {(formError || error) && <Text style={styles.error}>{formError ?? error}</Text>}

          <View style={styles.buttonWrapper}>
            {isSubmitting ? (
              <Text style={styles.loadingText}>Criando conta...</Text>
            ) : (
              <Button title="Cadastrar" onPress={handleSubmit} color={colors.primary} />
            )}
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>
              Já tem conta? <Text style={styles.loginLinkStrong}>Entrar</Text>
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
  title: {
    fontSize: 24,
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
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  loginLinkStrong: {
    color: colors.primary,
    fontWeight: '700',
  },
});
