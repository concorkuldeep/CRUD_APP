import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/Home/HomeScreen';



function RootStack() {

  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator initialRouteName="Login" >
      <Stack.Screen name="Login" component={LoginScreen} options={{
        headerShown: false
      }} />

<Stack.Screen name="Home" component={HomeScreen} options={{
        headerShown: false
      }} />

      <Stack.Screen name="Signup" component={SignUpScreen} options={{
        headerShown: false
      }} />
    </Stack.Navigator>
  );
}

export default RootStack
