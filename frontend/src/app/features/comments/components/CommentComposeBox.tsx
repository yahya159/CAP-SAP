import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Send, X } from 'lucide-react';
import type { CommentType } from '@/app/types/entities';
import { COMMENT_TYPE_LABELS } from '@/app/types/entities';

const COMMENT_TYPES: CommentType[] = ['GENERAL', 'BLOCKER', 'QUESTION', 'UPDATE', 'FEEDBACK'];
const MANAGER_ROLES = new Set(['ADMIN', 'MANAGER', 'PROJECT_MANAGER']);

interface CommentComposeBoxProps {
  onSubmit: (params: {
    message: string;
    isInternal: boolean;
    commentType: CommentType;
    parentCommentId?: string;
  }) => void;
  isSubmitting: boolean;
  currentRole: string;
  replyToId?: string | null;
  onCancelReply?: () => void;
}

export const CommentComposeBox: React.FC<CommentComposeBoxProps> = ({
  onSubmit,
  isSubmitting,
  currentRole,
  replyToId,
  onCancelReply,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('GENERAL');
  const [isInternal, setIsInternal] = useState(false);
  const canPostInternal = MANAGER_ROLES.has(currentRole);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSubmit({
      message: trimmed,
      isInternal,
      commentType,
      parentCommentId: replyToId ?? undefined,
    });
    setMessage('');
    setCommentType('GENERAL');
    setIsInternal(false);
  }, [message, isInternal, commentType, replyToId, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t pt-3 space-y-2">
      {replyToId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('comments.replyingTo')}</span>
          <Button variant="ghost" size="sm" className="h-5 px-1" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={commentType}
          onChange={(e) => setCommentType(e.target.value as CommentType)}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          {COMMENT_TYPES.map((ct) => (
            <option key={ct} value={ct}>
              {COMMENT_TYPE_LABELS[ct]}
            </option>
          ))}
        </select>

        {canPostInternal && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            {t('comments.internalNote')}
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          className="flex-1 min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('comments.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          size="sm"
          className="self-end"
          disabled={!message.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
