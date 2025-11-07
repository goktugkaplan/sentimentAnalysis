import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RegisterPage from './src/components/register/RegisterPage';
// import HomeScreen from './src/screens/HomeScreen'; // varsa bunu da ekleyebilirsin
import Chatbot from './src/components/Chatbot/Chatbot';

const Stack = createStackNavigator();

function App() {

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} /> */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Register" component={RegisterPage} />
          <Stack.Screen name="Chatbot" component={Chatbot} />
          {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
