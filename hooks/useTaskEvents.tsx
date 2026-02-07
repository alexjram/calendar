import { useCallback, useContext, useEffect, useRef, ReactElement } from "react";
import { createContext, ReactNode } from "react";

type TaskEvent =
  | "taskCompleted"
  | "taskUncompleted"
  | "taskAdded"
  | "taskDeleted"
  | "taskUpdated"
  | "taskFullyCompleted"
  | "rewardAdded"
  | "rewardRemoved"
  | "rewardUpdated";

type Listener = () => void;

interface TaskEventsContextType {
  subscribe: (event: TaskEvent, listener: Listener) => () => void;
  emit: (event: TaskEvent) => void;
}

const TaskEventsContext = createContext<TaskEventsContextType | null>(null);

export function TaskEventsProvider({ children }: { children: ReactNode }): ReactElement {
  const listeners = useRef<Map<TaskEvent, Set<Listener>>>(new Map());

  const subscribe = useCallback((event: TaskEvent, listener: Listener) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, new Set());
    }
    listeners.current.get(event)!.add(listener);

    return () => {
      listeners.current.get(event)?.delete(listener);
    };
  }, []);

  const emit = useCallback((event: TaskEvent) => {
    listeners.current.get(event)?.forEach((listener) => listener());
  }, []);

  return (
    <TaskEventsContext.Provider value={{ subscribe, emit }}>
      {children}
    </TaskEventsContext.Provider>
  );
}

export function useTaskEvents() {
  const context = useContext(TaskEventsContext);
  if (!context) {
    throw new Error("useTaskEvents must be used within TaskEventsProvider");
  }
  return context;
}

export function useTaskEvent(event: TaskEvent, callback: () => void) {
  const { subscribe } = useTaskEvents();

  useEffect(() => {
    return subscribe(event, callback);
  }, [event, callback, subscribe]);
}
