import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import MapView, { Callout, Marker } from "react-native-maps";
import QRCode from "react-native-qrcode-svg";

// 🌍 Données simulées complètes
const ROUTERS = {
  Cocody: [
    {
      name: "Router A1",
      latitude: 5.345,
      longitude: -4.012,
      online: true,
      capacity: 65,
      mac: "MAC-A1-1234",
    },
    {
      name: "Router A2",
      latitude: 5.348,
      longitude: -4.015,
      online: false,
      capacity: 30,
      mac: "MAC-A2-5678",
    },
    {
      name: "Router A3",
      latitude: 5.35,
      longitude: -4.018,
      online: true,
      capacity: 50,
      mac: "MAC-A3-9012",
    },
  ],
  Yopougon: [
    {
      name: "Router Y1",
      latitude: 5.383,
      longitude: -4.05,
      online: true,
      capacity: 90,
      mac: "MAC-Y1-9012",
    },
    {
      name: "Router Y2",
      latitude: 5.386,
      longitude: -4.053,
      online: false,
      capacity: 20,
      mac: "MAC-Y2-3456",
    },
  ],
  Plateau: [
    {
      name: "Router P1",
      latitude: 5.345,
      longitude: -4.012,
      online: true,
      capacity: 75,
      mac: "MAC-P1-3456",
    },
  ],
  Abobo: [
    {
      name: "Router B1",
      latitude: 5.35,
      longitude: -4.06,
      online: true,
      capacity: 60,
      mac: "MAC-B1-1234",
    },
    {
      name: "Router B2",
      latitude: 5.352,
      longitude: -4.062,
      online: false,
      capacity: 25,
      mac: "MAC-B2-5678",
    },
  ],
  Adjamé: [
    {
      name: "Router J1",
      latitude: 5.34,
      longitude: -4.04,
      online: false,
      capacity: 10,
      mac: "MAC-J1-5678",
    },
  ],
  Treichville: [
    {
      name: "Router T1",
      latitude: 5.32,
      longitude: -4.05,
      online: true,
      capacity: 80,
      mac: "MAC-T1-9012",
    },
  ],
  Marcory: [
    {
      name: "Router M1",
      latitude: 5.31,
      longitude: -4.06,
      online: true,
      capacity: 70,
      mac: "MAC-M1-3456",
    },
  ],
  Koumassi: [
    {
      name: "Router K1",
      latitude: 5.3,
      longitude: -4.07,
      online: false,
      capacity: 40,
      mac: "MAC-K1-7890",
    },
  ],
  "Port-Bouët": [
    {
      name: "Router PB1",
      latitude: 5.29,
      longitude: -4.08,
      online: true,
      capacity: 55,
      mac: "MAC-PB1-2345",
    },
  ],
  Anyama: [
    {
      name: "Router AN1",
      latitude: 5.28,
      longitude: -4.09,
      online: false,
      capacity: 35,
      mac: "MAC-AN1-6789",
    },
  ],
};

const COMMUNES = Object.keys(ROUTERS).sort();

export default function Index() {
  const router = useRouter();
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Ouvrir modal
  const openCommune = (commune) => {
    setSelectedCommune(commune);
    setModalVisible(true);
  };

  // Cliquer sur routeur → payment
  const selectRouter = (routerData) => {
    router.push({
      pathname: "/payment",
      params: { commune: selectedCommune, router_name: routerData.name },
    });
    setModalVisible(false);
  };

  // Rafraîchir
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredRouters = selectedCommune
    ? [...ROUTERS[selectedCommune]].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* TITRE */}
      <Animatable.View
        animation="fadeInDown"
        duration={800}
        style={{ alignItems: "center", marginTop: 60 }}
      >
        {/* Exemple pour réseau absent */}
        <Text style={{ fontSize: 85 }}>📡</Text>

        {/* Exemple pour signal faible */}
        {/* <Text style={{ fontSize: 60 }}>📶</Text> */}
      </Animatable.View>

      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Welcome to the wifi home
      </Animatable.Text>

      <Animatable.Text animation="fadeInDown" style={styles.subtitle}>
        Choose your commune
      </Animatable.Text>

      {/* GRILLE COMMUNES */}
      <View style={styles.grid}>
        {COMMUNES.map((commune, idx) => (
          <Animatable.View key={commune} animation="zoomIn" delay={idx * 50}>
            <TouchableOpacity
              style={styles.communeBtn}
              onPress={() => openCommune(commune)}
            >
              <MaterialIcons name="location-on" size={22} color="#36b65f5e" />
              <Text style={styles.communeText}>{commune}</Text>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>

      {/* MODAL SUPERPOSÉ EN DOUCEUR */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="fadeInDown"
            duration={400}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Routers in {selectedCommune}</Text>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: filteredRouters[0]?.latitude || 5.345,
                longitude: filteredRouters[0]?.longitude || -4.012,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {filteredRouters.map((router) => (
                <Marker
                  key={router.name}
                  coordinate={{
                    latitude: router.latitude,
                    longitude: router.longitude,
                  }}
                >
                  <Animatable.View
                    animation={router.online ? "flash" : undefined}
                    iterationCount="infinite"
                    style={[
                      styles.marker,
                      {
                        backgroundColor: router.online ? "#00ff00" : "#ff4d4d",
                      },
                    ]}
                  />
                  <Callout>
                    <View style={styles.callout}>
                      <Text style={styles.routerName}>{router.name}</Text>
                      <Text>
                        Status: {router.online ? "🟢 Online" : "🔴 Offline"}
                      </Text>
                      {router.online && <QRCode value={router.mac} size={80} />}
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>

            {filteredRouters.map((router) => (
              <TouchableOpacity
                key={router.name}
                style={styles.routerBtn}
                onPress={() => selectRouter(router)}
              >
                <MaterialIcons
                  name="router"
                  size={24}
                  color={router.online ? "#00ff00" : "#ff4d4d"}
                />
                <Text style={styles.routerText}>{router.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#090620ff",
    alignItems: "center",
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#9a599bff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#7deaadff",
    marginBottom: 20,
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  communeBtn: {
    backgroundColor: "#0f020d7c",
    width: 135,
    height: 85,
    margin: 15,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  communeText: { color: "#907989ff", fontWeight: "bold", textAlign: "center" },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1c2b33",
    width: "90%",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#25D366",
    marginBottom: 10,
    textAlign: "center",
  },

  map: { width: "100%", height: 200, borderRadius: 15, marginVertical: 10 },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#fff",
  },
  callout: { width: 180, alignItems: "center" },
  routerName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#25D366",
    marginBottom: 5,
  },
  routerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b141a",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
    width: "100%",
  },
  routerText: { color: "#fff", marginLeft: 10, fontWeight: "bold" },
  closeBtn: {
    marginTop: 10,
    backgroundColor: "#ff4d4d",
    padding: 10,
    borderRadius: 12,
    width: "50%",
    alignItems: "center",
  },
});
