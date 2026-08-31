import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/ScreenState';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

/**
 * Switches between the unauthenticated (AuthStack) and authenticated
 * (MainTabs) flows based on AuthContext state. This is the single
 * navigation entry point mounted by App.tsx.
 */
export default function RootNavigator() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState label="Iniciando Smart HAS..." />;
  }

  return (
    <NavigationContainer>{user ? <MainTabs /> : <AuthStack />}</NavigationContainer>
  );
}
