import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("tasks router", () => {
  it("creates a task successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Test Task",
      description: "This is a test task",
      priority: "high",
    });

    expect(result).toEqual({ success: true });
  });

  it("lists tasks for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.tasks.create({
      title: "Task 1",
      priority: "medium",
    });

    await caller.tasks.create({
      title: "Task 2",
      priority: "high",
    });

    const tasks = await caller.tasks.list();

    expect(tasks.length).toBeGreaterThanOrEqual(2);
    expect(tasks.some(t => t.title === "Task 1")).toBe(true);
    expect(tasks.some(t => t.title === "Task 2")).toBe(true);
  });

  it("filters tasks by priority", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    await caller.tasks.create({
      title: "High Priority Task",
      priority: "high",
    });

    await caller.tasks.create({
      title: "Low Priority Task",
      priority: "low",
    });

    const highPriorityTasks = await caller.tasks.list({ priority: "high" });
    const lowPriorityTasks = await caller.tasks.list({ priority: "low" });

    expect(highPriorityTasks.every(t => t.priority === "high")).toBe(true);
    expect(lowPriorityTasks.every(t => t.priority === "low")).toBe(true);
  });

  it("updates a task successfully", async () => {
    const { ctx } = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    await caller.tasks.create({
      title: "Original Title",
      priority: "medium",
    });

    const tasks = await caller.tasks.list();
    const taskToUpdate = tasks[0];

    if (taskToUpdate) {
      const updateResult = await caller.tasks.update({
        id: taskToUpdate.id,
        title: "Updated Title",
        priority: "high",
      });

      expect(updateResult).toEqual({ success: true });

      const updatedTasks = await caller.tasks.list();
      const updatedTask = updatedTasks.find(t => t.id === taskToUpdate.id);

      expect(updatedTask?.title).toBe("Updated Title");
      expect(updatedTask?.priority).toBe("high");
    }
  });

  it("toggles task status", async () => {
    const { ctx } = createAuthContext(4);
    const caller = appRouter.createCaller(ctx);

    await caller.tasks.create({
      title: "Task to Toggle",
      priority: "medium",
    });

    const tasks = await caller.tasks.list();
    const taskToToggle = tasks[0];

    if (taskToToggle) {
      expect(taskToToggle.status).toBe("pending");

      const toggleResult = await caller.tasks.toggleStatus({
        id: taskToToggle.id,
      });

      expect(toggleResult.success).toBe(true);
      expect(toggleResult.status).toBe("completed");

      const toggleBackResult = await caller.tasks.toggleStatus({
        id: taskToToggle.id,
      });

      expect(toggleBackResult.status).toBe("pending");
    }
  });

  it("deletes a task successfully", async () => {
    const { ctx } = createAuthContext(5);
    const caller = appRouter.createCaller(ctx);

    await caller.tasks.create({
      title: "Task to Delete",
      priority: "low",
    });

    const tasksBeforeDelete = await caller.tasks.list();
    const taskToDelete = tasksBeforeDelete[0];

    if (taskToDelete) {
      const deleteResult = await caller.tasks.delete({
        id: taskToDelete.id,
      });

      expect(deleteResult).toEqual({ success: true });

      const tasksAfterDelete = await caller.tasks.list();
      expect(tasksAfterDelete.find(t => t.id === taskToDelete.id)).toBeUndefined();
    }
  });

  it("validates required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.tasks.create({
        title: "",
        priority: "medium",
      })
    ).rejects.toThrow();
  });
});
