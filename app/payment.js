import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import QRCode from "react-native-qrcode-svg";

export default function Payment() {
  const { commune, router_name } = useLocalSearchParams();

  const [phone, setPhone] = useState("");
  const [paymentId, setPaymentId] = useState(null);
  const [mac, setMac] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [waitingAdmin, setWaitingAdmin] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);

  // 🔹 INIT PAIEMENT
  const pay = async (amount) => {
    setSuccess(false);
    const cleanPhone = phone.replace(/\s+/g, "");
    setSelectedAmount(amount);

    if (!/^\d{10}$/.test(cleanPhone)) {
      setToastMessage("Phone number must contain 10 digits");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    if (!/^(07|05|01)/.test(cleanPhone)) {
      setToastMessage("Phone number is not correct!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://10.219.53.41:8000/api/payment/init_wave/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanPhone,
            amount: amount,
            router_name: router_name,
            commune: commune,
          }),
        },
      );

      const data = await res.json();

      if (data.error) {
        setToastMessage(data.error);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setLoading(false);
        return;
      }

      setPaymentId(data.payment_id);
      setMac(data.mac);
      Linking.openURL(data.wave_url);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert("Server error", "Payment could not go!");
    }
  };

  // 🔹 CONFIRMATION DU PAIEMENT
  const confirmPayment = async () => {
    if (!paymentId || !selectedAmount) return;

    try {
      setLoading(true);
      setWaitingAdmin(true);

      const res = await fetch(
        "http://10.219.53.41:8000/api/payment/confirm_wave/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id: paymentId,
            commune: commune,
          }),
        },
      );

      const data = await res.json();
      setLoading(false);

      if (data.status === "FAILED") {
        setWaitingAdmin(false);
        setToastMessage(
          "Payment failed ❌ Or call customer service: 0706836722",
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 10000);
        setPaymentId(null);
        setMac(null);
        return;
      }

      if (data.status === "PENDING") {
        setTimeout(confirmPayment, 3000);
        return;
      }

      if (data.success) {
        setWaitingAdmin(false);
        setMac(data.mac);
        setSuccess(true);
        return;
      }
    } catch (e) {
      setLoading(false);
      setWaitingAdmin(false);
      Alert.alert("Verification error", "Payment could not be verified!");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {showToast && (
        <Animatable.View
          animation="fadeInUp"
          duration={300}
          style={styles.toastContainer}
        >
          <MaterialIcons name="info" size={22} color="#fe7474ff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animatable.View>
      )}

      <Animatable.View
        animation={success ? "fadeIn" : undefined}
        iterationCount={success ? "infinite" : 1}
        duration={1000}
      >
        <Text style={styles.title}>
          <MaterialIcons
            name="wifi"
            size={80}
            color={success ? "#00ff0080" : "#103d0361"}
          />
        </Text>
      </Animatable.View>

      <Animatable.Text
        animation="fadeInDown"
        style={[styles.title, success && { color: "#00ff0080" }]}
      >
        greenhatah Wi-Fi Access
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
        <TextInput
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, "").slice(0, 10))}
          maxLength={10}
          placeholder="For example : 0706050403"
          placeholderTextColor="#0511144b"
          keyboardType="phone-pad"
          style={[styles.input, success && { color: "#23663495" }]}
        />
      </Animatable.View>

      {loading && <ActivityIndicator size="large" color="#25d365dc" />}

      <Animatable.View
        animation="fadeInUp"
        delay={200}
        style={styles.buttonContainer}
      >
        {!paymentId && (
          <View style={styles.buttonGrid}>
            {[200, 400, 500, 1000, 3000, 5000].map((amount, idx) => (
              <TouchableOpacity
                key={amount}
                style={[styles.btn, idx % 2 === 1 && styles.btnSecondary]}
                onPress={() => pay(amount)}
              >
                <Text style={styles.btnText}>
                  {amount === 200
                    ? "🔥 200F – 24h"
                    : amount === 400
                      ? "🚀 400F – 48h"
                      : amount === 500
                        ? "💎 500F – 72h"
                        : amount === 1000
                          ? "⚡ 1000F – 168h"
                          : amount === 3000
                            ? "🏆 3000F – 720h"
                            : "🌟 5000F – 1140h"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {paymentId && !success && (
          <TouchableOpacity style={styles.confirmBtn} onPress={confirmPayment}>
            <Text style={styles.btnText}>✅ I have paid</Text>
          </TouchableOpacity>
        )}
      </Animatable.View>

      {waitingAdmin && !success && (
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={{ marginTop: 30, alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#25D366" />
          <Text
            style={{ color: "#0e4f6dff", marginTop: 15, textAlign: "center" }}
          >
            Please wait for payment confirmation… ⏳
          </Text>
        </Animatable.View>
      )}

      {success && mac && (
        <>
          <View style={styles.buttonGrid}>
            {[200, 400, 500, 1000, 3000, 5000].map((amount, idx) => (
              <TouchableOpacity
                key={amount}
                style={[styles.btn, idx % 2 === 1 && styles.btnSecondary]}
                onPress={() => pay(amount)}
              >
                <Text style={styles.btnText}>
                  {amount === 200
                    ? "🔥 200F – 24h"
                    : amount === 400
                      ? "🚀 400F – 48h"
                      : amount === 500
                        ? "💎 500F – 72h"
                        : amount === 1000
                          ? "⚡ 1000F – 168h"
                          : amount === 3000
                            ? "🏆 3000F – 720h"
                            : "🌟 5000F – 1140h"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Animatable.View animation="zoomIn" style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Your Wi-Fi QR :</Text>
            <QRCode value={mac} size={200} />
            <Text style={styles.macText}>{mac}</Text>
          </Animatable.View>
        </>
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
    backgroundColor: "#e1f5fe",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0277bd",
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#81d4fa85",
    color: "#000",
    padding: 15,
    borderRadius: 20,
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  btn: {
    width: "48%",
    backgroundColor: "#81d4fa",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  btnSecondary: {
    backgroundColor: "#81d4fa",
  },
  confirmBtn: {
    backgroundColor: "#29b6f6",
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
  toastContainer: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#054260ff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});
