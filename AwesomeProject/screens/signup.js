import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigation = useNavigation();

  const sendSignupDetails = async () => {
    try {
      const signupData = {
        username: username,
        email: email,
        password: password,
        mobile_no: phoneNumber,
      };
      const response = await fetch(`http://192.168.148.60:5000`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      if (response.status === 201) {
        console.log("Navigating to login page");
        navigation.navigate("Login");
      } else {
        const errorData = await response.json();
        console.error("Signup failed:", errorData);
        Alert.alert("Signup failed", errorData.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while signing up. Please try again.");
    }
  };

  const handleSignup = () => {
    const phoneNumberRegex = /^[6-9]\d{9}$/;

    if (!phoneNumberRegex.test(phoneNumber)) {
      Alert.alert("Invalid phone number", "Please enter a valid Indian phone number.");
      return;
    }

    sendSignupDetails();
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#b1b4f1" }}>
      <View
        style={{
          width: 350,
          borderRadius: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          backgroundColor: "#fff",
          padding: 50,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#5f64db" }}>Create an Account</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ marginBottom: 20 }}>
          <TextInput
            style={{
              width: "100%",
              padding: 10,
              borderWidth: 2,
              borderColor: "#5f64db",
              borderRadius: 10,
              backgroundColor: "#c4c6ee",
            }}
            placeholder="ENTER USERNAME"
            value={username}
            onChangeText={setUsername}
          />
        </View>
        <View style={{ marginBottom: 20 }}>
          <TextInput
            style={{
              width: "100%",
              padding: 10,
              borderWidth: 2,
              borderColor: "#5f64db",
              borderRadius: 10,
              backgroundColor: "#c4c6ee",
            }}
            placeholder="ENTER EMAIL"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={{ marginBottom: 20 }}>
          <TextInput
            style={{
              width: "100%",
              padding: 10,
              borderWidth: 2,
              borderColor: "#5f64db",
              borderRadius: 10,
              backgroundColor: "#c4c6ee",
            }}
            placeholder="ENTER PASSWORD"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <View style={{ marginBottom: 20 }}>
          <TextInput
            style={{
              width: "100%",
              padding: 10,
              borderWidth: 2,
              borderColor: "#5f64db",
              borderRadius: 10,
              backgroundColor: "#c4c6ee",
            }}
            placeholder="ENTER PHONE NUMBER"
            keyboardType="numeric"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
        <TouchableOpacity
          onPress={handleSignup}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 10,
            backgroundColor: "#5f64db",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: "#5f64db", marginTop: 20, textAlign: "right" }}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
