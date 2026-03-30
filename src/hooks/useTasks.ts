import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TaskStatus } from "@/components/TaskCard";

export interface DbTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  created_by: string;
  created_at: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTasks(data as unknown as DbTask[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createTask = async (title: string, description: string, assignee: string, createdBy: string) => {
    await supabase.from("tasks").insert({
      title,
      description,
      assignee,
      created_by: createdBy,
      status: "todo",
    });
  };

  const updateStatus = async (taskId: string, newStatus: TaskStatus) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  const handoverTask = async (taskId: string, newAssignee: string) => {
    await supabase.from("tasks").update({ assignee: newAssignee, status: "todo" }).eq("id", taskId);
  };

  return { tasks, loading, createTask, updateStatus, deleteTask, handoverTask };
}
