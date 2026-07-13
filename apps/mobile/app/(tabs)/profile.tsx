import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.body}>
        Build your extra or shop profile on web first. This tab will mirror those settings on mobile.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f4ef", padding: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  body: { marginTop: 12, color: "#57534e", lineHeight: 22 },
});
