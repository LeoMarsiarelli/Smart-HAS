import React, { useState } from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createReading } from '../api/readings';
import { getApiErrorMessage } from '../api/client';
import { colors } from '../theme/colors';
import { ReadingsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ReadingsStackParamList, 'AddReading'>;

export default function AddReadingScreen({ navigation }: Props) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const systolicNum = Number(systolic);
    const diastolicNum = Number(diastolic);
    const pulseNum = Number(pulse);

    if (!systolic || !diastolic || !pulse) {
      setError('Preencha sistólica, diastólica e pulso.');
      return;
    }
    if ([systolicNum, diastolicNum, pulseNum].some((n) => Number.isNaN(n) || n <= 0)) {
      setError('Os valores devem ser números positivos.');
      return;
    }

    setSubmitting(true);
    try {
      await createReading({
        systolic: systolicNum,
        diastolic: diastolicNum,
        pulse: pulseNum,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.helper}>
          A classificação (Normal, Elevada, HAS Estágio 1/2, Crise Hipertensiva) é calculada
          automaticamente pelo servidor a partir dos valores informados.
        </Text>

        <Text style={styles.label}>Sistólica (mmHg)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex.: 120"
          keyboardType="numeric"
          value={systolic}
          onChangeText={setSystolic}
        />

        <Text style={styles.label}>Diastólica (mmHg)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex.: 80"
          keyboardType="numeric"
          value={diastolic}
          onChangeText={setDiastolic}
        />

        <Text style={styles.label}>Pulso (bpm)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex.: 72"
          keyboardType="numeric"
          value={pulse}
          onChangeText={setPulse}
        />

        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="ex.: Após caminhada"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonRow}>
          {submitting ? (
            <Text style={styles.loadingText}>Salvando...</Text>
          ) : (
            <>
              <Button title="Salvar leitura" onPress={handleSubmit} color={colors.primary} />
              <View style={styles.spacer} />
              <Button title="Cancelar" onPress={() => navigation.goBack()} color={colors.textMuted} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 17,
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
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    marginTop: 14,
    fontSize: 13,
  },
  buttonRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 16,
  },
  loadingText: {
    color: colors.textMuted,
  },
});
