/** Route param lists for each navigator, used for typed navigation calls. */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Readings: undefined;
  Deliveries: undefined;
  Profile: undefined;
};

export type ReadingsStackParamList = {
  ReadingsList: undefined;
  AddReading: undefined;
};

export type DeliveriesStackParamList = {
  DeliveriesList: undefined;
  AddDelivery: undefined;
};
