// app/Login.js
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import api, { setAuthToken } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("token/", { username, password });
      setAuthToken(res.data.access); // stocke le token globalement
      onLogin(); // callback pour dire à l'app qu'on est connecté
    } catch (e) {
      Alert.alert("Erreur", "Impossible de se connecter au backend");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 30 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>Connexion</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ marginBottom: 15, borderBottomWidth: 1, fontSize: 18 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 25, borderBottomWidth: 1, fontSize: 18 }}
      />

      <Button title="Se connecter" onPress={handleLogin} />
    </View>
  );
}
