import React from 'react'
import { StyleSheet, Text, View } from 'react-native';
import LoginScreen from './src/screens/auth/LoginScreen'

const App = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'red' }}>
      <LoginScreen navigation={null} />
    </View>
  )
}

export default App

const styles = StyleSheet.create({})