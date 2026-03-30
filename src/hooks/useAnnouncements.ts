import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Announcement } from "@/components/BulletinBoard";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setAnnouncements(
        data.map((a: any) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          author: a.author,
          createdAt: new Date(a.created_at).toLocaleDateString("pt-BR"),
          priority: a.priority as "normal" | "urgent",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addAnnouncement = async (title: string, message: string, priority: "normal" | "urgent", author: string, createdBy: string) => {
    await supabase.from("announcements").insert({
      title,
      message,
      priority,
      author,
      created_by: createdBy,
    });
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
  };

  return { announcements, loading, addAnnouncement, deleteAnnouncement };
}
