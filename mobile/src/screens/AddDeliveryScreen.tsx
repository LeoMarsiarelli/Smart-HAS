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

import { createDelivery } from '../api/deliveries';
import { getApiErrorMessage } from '../api/client';
import { colors } from '../theme/colors';
import { DeliveriesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<DeliveriesStackParamList, 'AddDelivery'>;

export default function AddDeliveryScreen({ navigation }: Props) {
  const [medicationName, setMedicationName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const quantityNum = Number(quantity);

    if (!medicationName.trim() || !quantity || !deliveryAddress.trim()) {
      setError('Preencha medicamento, quantidade e endereço.');
      return;
    }
    if (Number.isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantidade deve ser um número positivo.');
      return;
    }

    setSubmitting(true);
    try {
      await createDelivery({
        medicationName: medicationName.trim(),
        quantity: quantityNum,
        deliveryAddress: deliveryAddress.trim(),
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
          A prioridade, o risco e a janela de entrega são sugeridos automaticamente pela IA
          do servidor (LogisticsAiService) com base na sua última leitura de pressão — você
          não precisa informar nada disso.
        </Text>

        <Text style={styles.label}>Medicamento</Text>
        <TextInput
          style={styles.input}
          placeholder="ex.: Losartana 50mg"
          value={medicationName}
          onChangeText={setMedicationName}
        />

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          placeholder="ex.: 2"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Endereço de entrega</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="ex.: Rua das Flores, 123 - São Paulo/SP"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          multiline
          numberOfLines={3}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonRow}>
          {submitting ? (
            <Text style={styles.loadingText}>Enviando solicitação...</Text>
          ) : (
            <>
              <Button title="Solicitar entrega" onPress={handleSubmit} color={colors.primary} />
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
