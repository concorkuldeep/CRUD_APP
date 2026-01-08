import React from 'react'
import { StyleSheet} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack'
const App = () => {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})