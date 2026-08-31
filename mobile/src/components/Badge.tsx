import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  backgroundColor: string;
  textColor: string;
}

/** Small pill used for classification / priority / status labels. */
export default function Badge({ label, backgroundColor, textColor }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
