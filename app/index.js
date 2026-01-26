import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import MapView, { Callout, Marker } from "react-native-maps";
import QRCode from "react-native-qrcode-svg";
import api from "../services/api";

// IA — choisir le meilleur router
function pickBestRouter(routers) {
  // Priorité aux routers en ligne
  return routers
    .filter((r) => r.health === "ok")
    .map((r) => ({ ...r, score: r.capacity || 50 }))
    .sort((a, b) => b.score - a.score)[0];
}

export default function Index() {
  const router = useRouter();

  const [routersByCommune, setRoutersByCommune] = useState({});
  const [communes, setCommunes] = useState([]);

  const [selectedCommune, setSelectedCommune] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendedRouter, setRecommendedRouter] = useState(null);

  const [search, setSearch] = useState("");
  const [preferredRouter, setPreferredRouter] = useState(null);

  // Charger routers depuis backend réel
  const loadRouters = async () => {
    try {
      const res = await api.get("api/router/");
      const data = res.data;

      const normalized = data.map((r, idx) => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude ?? 5.345 + idx * 0.001,
        longitude: r.longitude ?? -4.012 + idx * 0.001,
        health: r.health,
        capacity: r.capacity ?? 50,
        mac: r.ip,
        location: r.location ?? "Unknown",
      }));

      const grouped = {};
      normalized.forEach((r) => {
        if (!grouped[r.location]) grouped[r.location] = [];
        grouped[r.location].push(r);
      });

      setRoutersByCommune(grouped);

      const communeKeys = Object.keys(grouped).sort();
      setCommunes(communeKeys);

      if (!selectedCommune && communeKeys.length > 0) {
        setSelectedCommune(communeKeys[0]); // éviter filteredRouters vide
      }
    } catch (e) {
      console.log("Erreur chargement routers:", e);
    }
  };

  // Charger router préféré
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("PREFERRED_ROUTER");
      if (saved) setPreferredRouter(JSON.parse(saved));
    })();

    loadRouters();
  }, []);

  const openCommune = (commune) => {
    setSelectedCommune(commune);
    setSearch("");

    const routers = routersByCommune[commune] || [];

    let best = null;
    if (preferredRouter) {
      best = routers.find((r) => r.name === preferredRouter.name);
    }
    if (!best) {
      best = pickBestRouter(routers);
    }

    setRecommendedRouter(best || null);
    setModalVisible(true);
  };

  const selectRouter = async (routerData) => {
    await AsyncStorage.setItem("PREFERRED_ROUTER", JSON.stringify(routerData));

    router.push({
      pathname: "/payment",
      params: {
        commune: selectedCommune,
        router_name: routerData.name,
      },
    });

    setModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRouters();
    setRefreshing(false);
  };

  const filteredRouters = selectedCommune
    ? (routersByCommune[selectedCommune] || []).filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  const initialRegion = filteredRouters[0]
    ? {
        latitude: filteredRouters[0].latitude,
        longitude: filteredRouters[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 5.345,
        longitude: -4.012,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animatable.View
        animation="fadeInDown"
        duration={800}
        style={{ alignItems: "center", marginTop: 60 }}
      >
        <Text style={{ fontSize: 85 }}>📡</Text>
      </Animatable.View>

      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Welcome to the wifi home
      </Animatable.Text>

      <Animatable.Text animation="fadeInDown" style={styles.subtitle}>
        Choose your commune
      </Animatable.Text>

      <View style={styles.grid}>
        {communes.map((commune, idx) => (
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

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="fadeInDown"
            duration={400}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Routers in {selectedCommune}</Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="🔍 Search router by name..."
              placeholderTextColor="#ccc"
              style={styles.searchInput}
            />

            {recommendedRouter && (
              <Animatable.View animation="fadeIn" style={styles.aiBox}>
                <Text style={styles.aiTitle}>🤖 Recommended for you</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="router" size={26} color="#25D366" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.aiRouterName}>
                      {recommendedRouter.name}
                    </Text>
                    <Text style={styles.aiMeta}>
                      Capacité: {recommendedRouter.capacity}% •{" "}
                      {recommendedRouter.health === "ok"
                        ? "🟢 Online"
                        : "🔴 Offline"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={() => selectRouter(recommendedRouter)}
                >
                  <Text style={{ color: "#0b141a", fontWeight: "bold" }}>
                    Log in automatically
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            )}

            <MapView style={styles.map} initialRegion={initialRegion}>
              {filteredRouters.map((r) => (
                <Marker
                  key={r.name}
                  coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                >
                  <Animatable.View
                    animation={r.health === "ok" ? "flash" : undefined}
                    iterationCount="infinite"
                    style={[
                      styles.marker,
                      {
                        backgroundColor:
                          r.health === "ok" ? "#00ff00" : "#ff4d4d",
                      },
                    ]}
                  />
                  <Callout>
                    <View style={styles.callout}>
                      <Text style={styles.routerName}>{r.name}</Text>
                      <Text>
                        Status: {r.health === "ok" ? "🟢 Online" : "🔴 Offline"}
                      </Text>
                      {r.health === "ok" && <QRCode value={r.mac} size={80} />}
                      <Text>Capacité: {r.capacity}%</Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>

            {filteredRouters.map((r) => (
              <TouchableOpacity
                key={r.name}
                style={styles.routerBtn}
                onPress={() => selectRouter(r)}
              >
                <MaterialIcons
                  name="router"
                  size={24}
                  color={r.health === "ok" ? "#00ff00" : "#ff4d4d"}
                />
                <Text style={styles.routerText}>{r.name}</Text>
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
    backgroundColor: "#e1f5fe",
    alignItems: "center",
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0277bd",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#0288d1",
    marginBottom: 20,
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  communeBtn: {
    backgroundColor: "#b3e5fc",
    width: 135,
    height: 85,
    margin: 15,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  communeText: { color: "#01579b", fontWeight: "bold", textAlign: "center" },

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
    backgroundColor: "#345c6fff",
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

  searchInput: {
    width: "100%",
    backgroundColor: "#173448ff",
    borderRadius: 12,
    padding: 10,
    color: "#fff",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#25D366",
  },

  map: { width: "100%", height: 250, borderRadius: 15, marginVertical: 10 },
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
    backgroundColor: "#173448ff",
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

  aiBox: {
    backgroundColor: "#173448ff",
    borderRadius: 18,
    padding: 15,
    width: "100%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#25D366",
  },
  aiTitle: { color: "#25D366", fontWeight: "bold", marginBottom: 8 },
  aiRouterName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  aiMeta: { color: "#ccc", fontSize: 13 },
  aiButton: {
    marginTop: 10,
    backgroundColor: "#25D366",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
});
