import * as Haptics from "expo-haptics";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeOutRight,
  Layout,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { db } from "../../src/firebase/config";
import { AdminService } from "../../src/services/AdminService";

// Sub-component to fetch and display the Offender's email
const OffenderEmail = ({ userId }) => {
  const [email, setEmail] = useState("Loading...");
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) {
          setEmail(userSnap.data().email);
        } else {
          setEmail("User Not Found");
        }
      } catch (err) {
        setEmail("Error fetching");
      }
    };
    fetchEmail();
  }, [userId]);

  return <Text style={styles.offenderEmail}>{email}</Text>;
};

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Matches your DB 'status: open'
    const q = query(collection(db, "reports"), where("status", "==", "open"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const executeAction = async (type, item) => {
    setIsProcessing(true);
    try {
      if (type === "Dismiss") {
        await AdminService.dismissReport(item.id);
      } else if (type === "Delete") {
        await AdminService.deleteReportedContent(item);
      } else if (type === "Block") {
        await AdminService.toggleUserBlock(item.targetOwnerId, true);
        await AdminService.dismissReport(item.id);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // SUCCESS TOAST
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: `Action "${type}" completed successfully.`,
        visibilityTime: 3000,
        autoHide: true,
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Action Failed",
        text2: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Moderation</Text>
          <Text style={styles.subHeader}>{reports.length} pending issues</Text>
        </View>
      </View>

      <Animated.FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        itemLayoutAnimation={Layout.springify()}
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeInLeft}
            exiting={FadeOutRight}
            style={styles.reportCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.reasonBadge}>
                <Text style={styles.reasonText}>
                  {item.reason?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.typeText}>
                {item.targetType?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsText}>"{item.details}"</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>OFFENDER:</Text>
                <OffenderEmail userId={item.targetOwnerId} />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>REPORTER:</Text>
                <Text style={styles.reporterText}>{item.reporterEmail}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDismiss]}
                onPress={() => executeAction("Dismiss", item)}
                disabled={isProcessing}
              >
                <Text style={styles.btnTextDark}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDelete]}
                onPress={() => executeAction("Delete", item)}
                disabled={isProcessing}
              >
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnBlock]}
                onPress={() => executeAction("Block", item)}
                disabled={isProcessing}
              >
                <Text style={styles.btnText}>Block</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />
      {/* REQUIRED FOR TOASTS TO SHOW */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { marginBottom: 20 },
  header: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  subHeader: { fontSize: 16, color: "#64748B", marginTop: -4 },
  reportCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reasonBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasonText: { color: "#EF4444", fontSize: 10, fontWeight: "900" },
  typeText: { fontSize: 10, fontWeight: "700", color: "#94A3B8" },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
  },
  detailsText: {
    fontSize: 15,
    color: "#334155",
    fontStyle: "italic",
    marginBottom: 12,
    lineHeight: 22,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  metaLabel: { fontSize: 10, fontWeight: "800", color: "#94A3B8", width: 70 },
  offenderEmail: { fontSize: 12, color: "#EF4444", fontWeight: "700" },
  reporterText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 0.31,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnDismiss: { backgroundColor: "#E2E8F0" },
  btnDelete: { backgroundColor: "#EF4444" },
  btnBlock: { backgroundColor: "#0F172A" },
  btnText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  btnTextDark: { color: "#475569", fontWeight: "800", fontSize: 13 },
});
