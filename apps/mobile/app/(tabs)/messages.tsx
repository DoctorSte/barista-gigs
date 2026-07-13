import { StyleSheet, Text, View } from "react-native";

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.body}>
        Messaging is available on web for now. Mobile parity is scaffolded and ready to wire up with Supabase Realtime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f4ef", padding: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  body: { marginTop: 12, color: "#57534e", lineHeight: 22 },
});
