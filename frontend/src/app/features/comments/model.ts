// Pure functions for comment thread logic

import type { CommentType, TicketComment } from '@/app/types/entities';

/** Group comments into threads — top-level + their replies */
export interface CommentThread {
  comment: TicketComment;
  replies: TicketComment[];
}

export const buildCommentThreads = (comments: TicketComment[]): CommentThread[] => {
  const topLevel = comments.filter((c) => !c.parentCommentId);
  const replyMap = new Map<string, TicketComment[]>();

  for (const c of comments) {
    if (c.parentCommentId) {
      const existing = replyMap.get(c.parentCommentId) ?? [];
      existing.push(c);
      replyMap.set(c.parentCommentId, existing);
    }
  }

  return topLevel.map((comment) => ({
    comment,
    replies: replyMap.get(comment.id) ?? [],
  }));
};

/** Count unresolved blockers/questions */
export const countUnresolvedByType = (
  comments: TicketComment[],
  types: CommentType[]
): number =>
  comments.filter(
    (c) => types.includes(c.commentType) && !c.resolved
  ).length;

/** Comment type badge colors */
export const commentTypeBadgeClass: Record<CommentType, string> = {
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  BLOCKER: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  QUESTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  UPDATE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  FEEDBACK: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};
