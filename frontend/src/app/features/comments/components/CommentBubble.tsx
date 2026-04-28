import React from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { CheckCircle2, Circle, Reply } from 'lucide-react';
import type { TicketComment, User } from '@/app/types/entities';
import { COMMENT_TYPE_LABELS } from '@/app/types/entities';
import { useTranslation } from 'react-i18next';
import { commentTypeBadgeClass } from '@/app/features/comments/model';

interface CommentBubbleProps {
  comment: TicketComment;
  author: User | undefined;
  currentUserId: string;
  currentRole: string;
  onReply?: (commentId: string) => void;
  onToggleResolve?: (commentId: string, resolved: boolean) => void;
  isReply?: boolean;
}

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MANAGER_ROLES = new Set(['ADMIN', 'MANAGER', 'PROJECT_MANAGER']);

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  comment,
  author,
  currentUserId,
  currentRole,
  onReply,
  onToggleResolve,
  isReply = false,
}) => {
  const isOwn = comment.authorId === currentUserId;
  const canResolve = isOwn || MANAGER_ROLES.has(currentRole);
  const showResolved = comment.commentType === 'BLOCKER' || comment.commentType === 'QUESTION';
  const { t } = useTranslation();

  const bubbleBase = comment.isInternal
    ? 'border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30'
    : isOwn
      ? 'bg-primary/5 dark:bg-primary/10'
      : 'bg-muted/40';

  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${bubbleBase} ${isReply ? 'ml-6' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {author?.avatarUrl ? (
          <img src={author.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
            {author?.name?.[0] ?? '?'}
          </div>
        )}
        <span className="font-medium text-xs">{author?.name ?? 'Unknown'}</span>
        <Badge variant="outline" className="text-[9px] px-1 py-0">
          {author?.role ? t(`roles.${author.role}`) : '-'}
        </Badge>
        {comment.commentType !== 'GENERAL' && (
          <Badge className={`text-[9px] px-1 py-0 ${commentTypeBadgeClass[comment.commentType]}`}>
            {COMMENT_TYPE_LABELS[comment.commentType]}
          </Badge>
        )}
        {comment.isInternal && (
          <Badge className="text-[9px] px-1 py-0 bg-amber-200 text-amber-900">{t('comments.internal')}</Badge>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {formatTime(comment.createdAt)}
        </span>
      </div>

      <p className="text-sm whitespace-pre-wrap">{comment.message}</p>

      <div className="flex items-center gap-2 mt-1.5">
        {onReply && !isReply && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => onReply(comment.id)}
          >
            <Reply className="h-3 w-3 mr-1" />
            {t('comments.reply')}
          </Button>
        )}
        {showResolved && canResolve && onToggleResolve && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 text-[11px] px-2 ${comment.resolved ? 'text-green-600' : 'text-muted-foreground'}`}
            onClick={() => onToggleResolve(comment.id, !comment.resolved)}
          >
            {comment.resolved ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <Circle className="h-3 w-3 mr-1" />
            )}
            {comment.resolved ? t('comments.resolved') : t('comments.markResolved')}
          </Button>
        )}
      </div>
    </div>
  );
};
