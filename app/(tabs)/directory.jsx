import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../src/components/AppScreen";
import { subscribeUsers } from "../../src/services/userService";
import { COLORS } from "../../src/theme/colors";

function AlumniCard({ item, onPress }) {
  const avatarLetter = (item.fullName || "F")[0].toUpperCase();
  const expertiseList = Array.isArray(item.expertise)
    ? item.expertise.slice(0, 2)
    : [];

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.fullName || "FRIIAN Member"}
            </Text>
            <View style={styles.batchBadge}>
              <Text style={styles.batchText}>
                SSC-{item.sscYear?.toString() || "—"}
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={12} color="#94A3B8" />
              <Text style={styles.detailText}>{item.email || "Private"}</Text>
            </View>
            <View style={styles.dotSeparator} />
            <View style={styles.detailItem}>
              <Ionicons name="male-female-sharp" size={12} color="#94A3B8" />
              <Text style={styles.detailText}>{item.gender || "Member"}</Text>
            </View>
          </View>

          <View style={styles.expertiseContainer}>
            {expertiseList.map((exp, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{exp}</Text>
              </View>
            ))}
            {item.expertise?.length > 2 && (
              <Text style={styles.moreText}>
                +{item.expertise.length - 2} more
              </Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
}

export default function DirectoryScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeUsers(setUsers);
    return unsub;
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const exp = (u.expertise || []).join(" ").toLowerCase();
      return (
        name.includes(keyword) ||
        exp.includes(keyword) ||
        String(u.sscYear).includes(keyword)
      );
    });
  }, [users, search]);

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.welcomeText}>Community</Text>
          <Text style={styles.titleText}>FRIIANS Directory</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#94A3B8"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, year, or skill..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlumniCard
            item={item}
            onPress={() => router.push(`/user/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.countText}>
            {filteredUsers.length} Professionals Found
          </Text>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  filterBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  listPadding: {
    paddingBottom: 30,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  mainInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  batchBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  batchText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 4,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  expertiseContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  moreText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
