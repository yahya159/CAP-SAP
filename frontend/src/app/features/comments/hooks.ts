// TanStack Query hooks for ticket comments

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketCommentsAPI } from '@/app/services/odata/ticketCommentsApi';
import type { CommentType } from '@/app/types/entities';

const commentKeys = {
  all: ['ticketComments'] as const,
  byTicket: (ticketId: string) => ['ticketComments', ticketId] as const,
};

export const useTicketComments = (ticketId: string | undefined) =>
  useQuery({
    queryKey: commentKeys.byTicket(ticketId ?? ''),
    queryFn: () => TicketCommentsAPI.getByTicket(ticketId!),
    enabled: Boolean(ticketId),
  });

export const useCreateComment = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      message: string;
      isInternal?: boolean;
      commentType?: CommentType;
      parentCommentId?: string;
      authorId: string;
    }) =>
      TicketCommentsAPI.create({
        ticketId,
        authorId: params.authorId,
        message: params.message,
        isInternal: params.isInternal ?? false,
        commentType: params.commentType ?? 'GENERAL',
        parentCommentId: params.parentCommentId ?? null,
        resolved: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTicket(ticketId) });
    },
  });
};

export const useResolveComment = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { commentId: string; resolved: boolean }) =>
      TicketCommentsAPI.resolve(params.commentId, params.resolved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTicket(ticketId) });
    },
  });
};
