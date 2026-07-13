import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
  title: string;
  description: string;
  pay_rate_cents: number;
  pay_type: string;
};

export default function GigsScreen() {
  const [gigs, setGigs] = useState<Gig[]>([]);

  useEffect(() => {
    async function loadGigs() {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, description, pay_rate_cents, pay_type")
        .eq("status", "open")
        .order("starts_at", { ascending: true });
      setGigs(data ?? []);
    }

    loadGigs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open gigs</Text>
      <FlatList
        data={gigs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No gigs yet. Sign in on web to get started.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.description}</Text>
            <Text style={styles.cardMeta}>
              {item.pay_rate_cents / 100} {item.pay_type}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f4ef", paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "700", paddingHorizontal: 16, marginBottom: 12 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardBody: { marginTop: 8, color: "#57534e" },
  cardMeta: { marginTop: 8, fontWeight: "500" },
  empty: { color: "#78716c", paddingHorizontal: 16 },
});
