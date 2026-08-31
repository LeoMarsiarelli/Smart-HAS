import React, { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Badge from '../components/Badge';
import Card from '../components/Card';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../context/AuthContext';
import { listDeliveries } from '../api/deliveries';
import { listReadings } from '../api/readings';
import { getApiErrorMessage } from '../api/client';
import { classificationColors, colors, priorityColors } from '../theme/colors';
import { BloodPressureReading, MedicationDeliveryRequest } from '../types';
import { avatarUrlFor, formatDateTime } from '../utils/format';

export default function HomeScreen() {
  const { user } = useAuth();
  const [latestReading, setLatestReading] = useState<BloodPressureReading | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [nextDelivery, setNextDelivery] = useState<MedicationDeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [readings, deliveries] = await Promise.all([listReadings(), listDeliveries()]);

      const sortedReadings = [...readings].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
      );
      setLatestReading(sortedReadings[0] ?? null);

      const pending = deliveries.filter((d) => d.status === 'PENDENTE');
      setPendingCount(pending.length);

      const sortedPending = [...pending].sort(
        (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
      );
      setNextDelivery(sortedPending[0] ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <LoadingState label="Carregando painel..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  const classification = latestReading
    ? classificationColors[latestReading.classification]
    : null;
  const priority = nextDelivery ? priorityColors[nextDelivery.priority] : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] ?? 'paciente'}</Text>
          <Text style={styles.subGreeting}>Este é o resumo da sua saúde hoje</Text>
        </View>
        <Image source={{ uri: avatarUrlFor(user?.name ?? 'Smart HAS') }} style={styles.avatar} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Última leitura de pressão</Text>
        {latestReading ? (
          <>
            <View style={styles.readingRow}>
              <Text style={styles.readingValue}>
                {latestReading.systolic}/{latestReading.diastolic}{' '}
                <Text style={styles.readingUnit}>mmHg</Text>
              </Text>
              {classification && (
                <Badge
                  label={classification.label}
                  backgroundColor={classification.bg}
                  textColor={classification.fg}
                />
              )}
            </View>
            <Text style={styles.meta}>Pulso: {latestReading.pulse} bpm</Text>
            <Text style={styles.meta}>Medido em {formatDateTime(latestReading.measuredAt)}</Text>
          </>
        ) : (
          <Text style={styles.empty}>Nenhuma leitura registrada ainda.</Text>
        )}
      </Card>

      <View style={styles.row}>
        <Card style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Entregas pendentes</Text>
          <Text style={styles.pendingCount}>{pendingCount}</Text>
          <Text style={styles.meta}>solicitações aguardando</Text>
        </Card>

        <Card style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Próxima prioridade</Text>
          {nextDelivery && priority ? (
            <>
              <Badge
                label={priority.label}
                backgroundColor={priority.bg}
                textColor={priority.fg}
              />
              <Text style={styles.meta} numberOfLines={1}>
                {nextDelivery.medicationName}
              </Text>
            </>
          ) : (
            <Text style={styles.empty}>Sem entregas pendentes</Text>
          )}
        </Card>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Sobre a AI Logistics Extension</Text>
        <Text style={styles.infoText}>
          A prioridade e a janela de entrega de cada solicitação de medicamento são
          calculadas automaticamente pelo motor de regras do servidor, com base na
          classificação da sua leitura de pressão mais recente.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    flexShrink: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subGreeting: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  readingUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  pendingCount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
});
