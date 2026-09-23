import React,{useEffect} from 'react'
import { StyleSheet} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack'
import {GOOGLE_WEB_CLIENT_ID} from './src/config/googleConfig'
import { GoogleSignin } from '@react-native-google-signin/google-signin';
const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });
}, []);
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})