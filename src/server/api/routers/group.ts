import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        participants: z.string().array().nonempty(),
        groupName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userName = ctx.session.user.name;
      if (userName === null || userName === undefined) {
        throw new Error("Unexpected Behaviour of ctx.session.user.name");
      }
      input.participants.push(userName);
      const userIds = await ctx.prisma.user.findMany({
        where: {
          name: {
            in: input.participants,
          },
        },
        select: {
          id: true,
        },
      });
      const groupCreationResponse = await ctx.prisma.group.create({
        data: {
          name: input.groupName,
          participants: {
            connect: userIds,
          },
        },
        select: {
          expenses: true,
          name: true,
          participants: true,
          groupContributions: true,
        },
      });
      console.log("groupCreationResponse = ", groupCreationResponse);
    }),

  getAll: protectedProcedure.query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({
      where: {
        name: ctx.session.user.name,
      },
      select: {
        groups: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  getAllExpenses: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      function pause(milliseconds: number): Promise<void> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, milliseconds);
        });
      }
      await pause(2000);
      return ctx.prisma.expense.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          name: true,
          id: true,
          totalExpense: true,
        },
      });
    }),

  getAllGroupContributions: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.groupContribution.findMany({
        where: {
          groupId: input.groupId,
        }
      })
    }),

  //dev only
  deleteAll: protectedProcedure.mutation(async ({ ctx, input }) => {
    return ctx.prisma.group.deleteMany({});
  }),
});
