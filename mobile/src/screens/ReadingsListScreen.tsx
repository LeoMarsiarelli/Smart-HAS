import React, { useCallback, useState } from 'react';
import { Button, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Badge from '../components/Badge';
import Card from '../components/Card';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { listReadings } from '../api/readings';
import { getApiErrorMessage } from '../api/client';
import { classificationColors, colors } from '../theme/colors';
import { BloodPressureReading } from '../types';
import { formatDateTime } from '../utils/format';
import { ReadingsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ReadingsStackParamList, 'ReadingsList'>;

export default function ReadingsListScreen({ navigation }: Props) {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await listReadings();
      const sorted = [...data].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
      );
      setReadings(sorted);
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

  if (loading) return <LoadingState label="Carregando leituras..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>Minhas leituras</Text>
        <Button
          title="+ Nova leitura"
          color={colors.primary}
          onPress={() => navigation.navigate('AddReading')}
        />
      </View>

      <FlatList
        data={readings}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma leitura registrada ainda. Toque em "Nova leitura" para começar.
          </Text>
        }
        renderItem={({ item }) => {
          const c = classificationColors[item.classification];
          return (
            <Card style={styles.readingCard}>
              <View style={styles.readingRow}>
                <Text style={styles.readingValue}>
                  {item.systolic}/{item.diastolic} <Text style={styles.unit}>mmHg</Text>
                </Text>
                <Badge label={c.label} backgroundColor={c.bg} textColor={c.fg} />
              </View>
              <Text style={styles.meta}>Pulso: {item.pulse} bpm</Text>
              {!!item.notes && <Text style={styles.notes}>"{item.notes}"</Text>}
              <Text style={styles.date}>{formatDateTime(item.measuredAt)}</Text>
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    flexGrow: 1,
  },
  readingCard: {
    marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  notes: {
    fontSize: 12,
    color: colors.text,
    marginTop: 6,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 48,
    paddingHorizontal: 24,
  },
});
