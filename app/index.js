import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as Animatable from "react-native-animatable";
import QRCode from "react-native-qrcode-svg";

export default function Index() {
  const [phone, setPhone] = useState("");
  const [paymentId, setPaymentId] = useState(null);
  const [mac, setMac] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [waitingAdmin, setWaitingAdmin] = useState(false);

  // 🔹 INIT PAIEMENT
  const pay = async (amount) => {
    if (!phone) {
      Alert.alert("Please user", "Enter your mobile number actived !");
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const res = await fetch(
        "http://192.168.87.41:8002/api/payment/init_wave/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, amount }),
        },
      );

      const data = await res.json();
      if (data.error) {
        Alert.alert("Erreur", data.error);
        setLoading(false);
        return;
      }

      setPaymentId(data.payment_id);
      setMac(data.mac);

      // Redirige vers Wave
      Linking.openURL(data.wave_url);

      setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert("Server error", "Payment could not is go !");
    }
  };

  // 🔹 CONFIRMATION DU PAIEMENT (après validation admin)
  const confirmPayment = async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      setWaitingAdmin(true); // ⏳ on affiche le spinner d’attente

      const res = await fetch(
        "http://192.168.87.41:8002/api/payment/confirm/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: paymentId }),
        },
      );

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setWaitingAdmin(false);
        setSuccess(true);
      } else {
        // admin pas encore confirmé → on reste en attente
        setTimeout(confirmPayment, 4000); // 🔁 recheck auto toutes les 4s
      }
    } catch (e) {
      setLoading(false);
      setWaitingAdmin(false);
      Alert.alert(
        "Error of verification",
        "Payment is not possible verified !",
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animatable.View
        animation={success ? "fadeIn" : undefined}
        iterationCount={success ? "infinite" : 1}
        duration={1000}
      >
        <Text style={styles.title}>
          <MaterialIcons
            name="wifi"
            size={80}
            color={success ? "#00ff00" : "#103d0361"} // 🟢 actif / normal
          />
        </Text>
      </Animatable.View>

      <Animatable.Text
        animation="fadeInDown"
        style={[
          styles.title,
          success && { color: "#00ff00" }, // 🟢 actif
        ]}
      >
        greenhatah Wi-Fi Access
      </Animatable.Text>

      {/* Input numéro de téléphone */}
      <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
        <TextInput
          placeholder="For example : 07 06 05 04 03"
          placeholderTextColor="#cccccc38"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={[
            styles.input,
            success && { color: "#00ff00", fontWeight: "bold" }, // 🟢 actif
          ]}
        />
      </Animatable.View>

      {loading && <ActivityIndicator size="large" color="#25d365dc" />}

      {/* Boutons paiement */}
      <Animatable.View
        animation="fadeInUp"
        delay={200}
        style={styles.buttonContainer}
      >
        {(!paymentId || success) && (
          <>
            <TouchableOpacity style={styles.btn} onPress={() => pay(200)}>
              <Text style={styles.btnText}>🔥 200F – 24h</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => pay(400)}
            >
              <Text style={styles.btnText}>🚀 400F – 48h</Text>
            </TouchableOpacity>
          </>
        )}

        {paymentId && !success && (
          <TouchableOpacity style={styles.confirmBtn} onPress={confirmPayment}>
            <Text style={styles.btnText}>✅ I have paid</Text>
          </TouchableOpacity>
        )}
      </Animatable.View>
      {/* ⏳ Attente confirmation admin */}
      {waitingAdmin && !success && (
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={{ marginTop: 30, alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={{ color: "#fff", marginTop: 15, textAlign: "center" }}>
            You are really sure of payment ? 💳{"\n"}
            Please awaiting , Validation in pending by the IA , …{"\n"}
            Thanks of your await ⏳
          </Text>
        </Animatable.View>
      )}

      {/* QR code seulement si admin a confirmé */}
      {success && mac && (
        <Animatable.View animation="zoomIn" style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Your Wi-Fi QR :</Text>
          <QRCode value={mac} size={200} />
          <Text style={styles.macText}>{mac}</Text>
        </Animatable.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#0b141a",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#103d0366",
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#1b2a30",
    color: "#fff",
    padding: 15,
    borderRadius: 20,
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  btn: {
    backgroundColor: "#25d36592",
    paddingVertical: 18,
    borderRadius: 200,
    width: "50%",
    alignItems: "center",
    marginBottom: 18,
  },
  btnSecondary: {
    backgroundColor: "#128C7E",
  },
  confirmBtn: {
    backgroundColor: "#075e54c8",
    paddingVertical: 18,
    borderRadius: 20,
    width: "60%",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  qrContainer: {
    marginTop: 30,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  macText: {
    marginTop: 10,
  },
});
