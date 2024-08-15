import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export default function Login() {
  const navigation = useNavigation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const saveData = async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else { // mobile
        await SecureStore.setItemAsync(key, value.toString());
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const sendLoginDetails = async () => {
    try {
      const loginData = {
        username: username,
        password: password,
      };

      const response = await fetch("http://192.168.148.60:5000/Login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (response.status === 200) {
        const data = await response.json();
        await saveData("userID", data.user_id);
        navigation.navigate("landingpage");
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLogin = () => {
    sendLoginDetails();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#c4c6ee' }}>
      <View style={{ width: 350, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, backgroundColor: '#fff', padding: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#5f64db' }}>Let's get started</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ marginBottom: 20 }}>
          <TextInput style={{ width: '100%', padding: 10, borderWidth: 2, borderColor: '#5f64db', borderRadius: 10, backgroundColor: '#c4c6ee' }} placeholder="ENTER USERNAME" onChangeText={setUsername}/>
        </View>
        <View style={{ marginBottom: 20 }}>
          <TextInput style={{ width: '100%', padding: 10, borderWidth: 2, borderColor: '#5f64db', borderRadius: 10, backgroundColor: '#c4c6ee' }} placeholder="ENTER PASSWORD" secureTextEntry={true} onChangeText={setPassword}/>
        </View>
        
        <TouchableOpacity onPress={handleLogin} style={{ width: '100%', padding: 15, borderRadius: 10, backgroundColor: '#5f64db', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: 'white', fontSize: 18 }}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('signup')}>
          <Text style={{ color: '#5f64db' ,marginTop:20,textAlign: 'right'}}>Not a Member? Signup Now</Text>
        </TouchableOpacity>
      </View>
   </View>
  );
}
