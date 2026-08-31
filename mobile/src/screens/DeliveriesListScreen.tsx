import React, { useCallback, useState } from 'react';
import { Button, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Badge from '../components/Badge';
import Card from '../components/Card';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { listDeliveries } from '../api/deliveries';
import { getApiErrorMessage } from '../api/client';
import { colors, priorityColors, statusColors } from '../theme/colors';
import { MedicationDeliveryRequest } from '../types';
import { formatDateTime } from '../utils/format';
import { DeliveriesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<DeliveriesStackParamList, 'DeliveriesList'>;

export default function DeliveriesListScreen({ navigation }: Props) {
  const [deliveries, setDeliveries] = useState<MedicationDeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await listDeliveries();
      const sorted = [...data].sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      );
      setDeliveries(sorted);
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

  if (loading) return <LoadingState label="Carregando entregas..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>AI Logistics</Text>
        <Button
          title="+ Solicitar"
          color={colors.primary}
          onPress={() => navigation.navigate('AddDelivery')}
        />
      </View>
      <Text style={styles.caption}>
        Prioridade e janela de entrega são sugeridas automaticamente pela IA do servidor,
        com base no risco calculado a partir da sua última leitura de pressão.
      </Text>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma solicitação de entrega ainda. Toque em "Solicitar" para pedir um
            medicamento.
          </Text>
        }
        renderItem={({ item }) => {
          const priority = priorityColors[item.priority];
          const status = statusColors[item.status];
          return (
            <Card style={styles.deliveryCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.medName} numberOfLines={1}>
                  {item.medicationName}
                </Text>
                <Badge
                  label={priority.label}
                  backgroundColor={priority.bg}
                  textColor={priority.fg}
                />
              </View>
              <Text style={styles.meta}>Quantidade: {item.quantity}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                Endereço: {item.deliveryAddress}
              </Text>
              <Text style={styles.meta}>Risco (IA): {item.riskScore}</Text>
              <Text style={styles.meta}>
                Janela sugerida: {formatDateTime(item.estimatedWindowStart)} —{' '}
                {formatDateTime(item.estimatedWindowEnd)}
              </Text>
              <View style={styles.rowBetween}>
                <Text style={styles.date}>Solicitado em {formatDateTime(item.requestedAt)}</Text>
                <Badge label={status.label} backgroundColor={status.bg} textColor={status.fg} />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    lineHeight: 17,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  deliveryCard: {
    marginBottom: 12,
    gap: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
    marginRight: 8,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 48,
    paddingHorizontal: 24,
  },
});
