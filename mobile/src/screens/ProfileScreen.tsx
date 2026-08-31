import React from 'react';
import { Alert, Button, Image, StyleSheet, Text, View } from 'react-native';

import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { avatarUrlFor, formatDateTime } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Image source={{ uri: avatarUrlFor(user?.name ?? 'Smart HAS') }} style={styles.avatar} />
        <Text style={styles.name}>{user?.name ?? '-'}</Text>
        <Text style={styles.email}>{user?.email ?? '-'}</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Perfil</Text>
          <Text style={styles.infoValue}>{user?.role === 'ADMIN' ? 'Administrador' : 'Paciente'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID</Text>
          <Text style={styles.infoValue}>{user?.id ?? '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Membro desde</Text>
          <Text style={styles.infoValue}>{formatDateTime(user?.createdAt)}</Text>
        </View>
      </Card>

      <View style={styles.logoutButton}>
        <Button title="Sair da conta" color={colors.danger} onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    marginTop: 8,
  },
});
