import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createTask, deleteTask, getUserTasks, toggleTaskStatus, updateTask } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tasks: router({
    list: protectedProcedure
      .input(
        z
          .object({
            priority: z.enum(["low", "medium", "high"]).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        return await getUserTasks(ctx.user.id, input?.priority);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          priority: z.enum(["low", "medium", "high"]).default("medium"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority,
          status: "pending",
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          dueDate: z.date().optional().nullable(),
          priority: z.enum(["low", "medium", "high"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateTask(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await deleteTask(input.id, ctx.user.id);
        return { success: true };
      }),

    toggleStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const newStatus = await toggleTaskStatus(input.id, ctx.user.id);
        return { success: true, status: newStatus };
      }),
  }),
});

export type AppRouter = typeof appRouter;
