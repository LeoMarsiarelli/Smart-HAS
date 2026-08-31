import React from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

/** Full-screen loading spinner used while a screen's initial data fetches. */
export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

/** Full-screen error message with an optional retry action. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Não foi possível carregar os dados</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry ? (
        <View style={styles.retryButton}>
          <Button title="Tentar novamente" onPress={onRetry} color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  label: {
    marginTop: 12,
    color: colors.textMuted,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 6,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 4,
  },
});
