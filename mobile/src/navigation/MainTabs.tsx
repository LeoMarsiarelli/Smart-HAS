import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ReadingsListScreen from '../screens/ReadingsListScreen';
import AddReadingScreen from '../screens/AddReadingScreen';
import DeliveriesListScreen from '../screens/DeliveriesListScreen';
import AddDeliveryScreen from '../screens/AddDeliveryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import {
  DeliveriesStackParamList,
  MainTabParamList,
  ReadingsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ReadingsStackNav = createNativeStackNavigator<ReadingsStackParamList>();
const DeliveriesStackNav = createNativeStackNavigator<DeliveriesStackParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Readings: '❤️',
  Deliveries: '🚚',
  Profile: '👤',
};

function ReadingsStack() {
  return (
    <ReadingsStackNav.Navigator>
      <ReadingsStackNav.Screen
        name="ReadingsList"
        component={ReadingsListScreen}
        options={{ title: 'Leituras' }}
      />
      <ReadingsStackNav.Screen
        name="AddReading"
        component={AddReadingScreen}
        options={{ title: 'Nova leitura', presentation: 'modal' }}
      />
    </ReadingsStackNav.Navigator>
  );
}

function DeliveriesStack() {
  return (
    <DeliveriesStackNav.Navigator>
      <DeliveriesStackNav.Screen
        name="DeliveriesList"
        component={DeliveriesListScreen}
        options={{ title: 'AI Logistics' }}
      />
      <DeliveriesStackNav.Screen
        name="AddDelivery"
        component={AddDeliveryScreen}
        options={{ title: 'Solicitar entrega', presentation: 'modal' }}
      />
    </DeliveriesStackNav.Navigator>
  );
}

/** Authenticated flow: bottom tab navigator with 4 sections. */
export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === 'Home' || route.name === 'Profile',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => (
          <Text style={{ fontSize: 18 }}>
            {TAB_ICONS[route.name as keyof MainTabParamList]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen
        name="Readings"
        component={ReadingsStack}
        options={{ title: 'Leituras' }}
      />
      <Tab.Screen
        name="Deliveries"
        component={DeliveriesStack}
        options={{ title: 'AI Logistics' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
