import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import Colors from '../constants/Colors';

interface LoaderProps {
  message?: string;
}

export default function Loader({ message = 'Loading...' }: LoaderProps) {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  logo: {
    width: 96,
    height: 96,
  },
  text: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
