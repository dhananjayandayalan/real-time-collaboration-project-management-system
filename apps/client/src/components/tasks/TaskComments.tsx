import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addComment, updateComment, deleteComment } from '@/store/slices/tasksSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { useSocket } from '@/hooks';
import { Button } from '@/components/common';
import './TaskComments.css';

interface TaskCommentsProps {
  taskId: string;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const dispatch = useAppDispatch();
  const { comments, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const { typingUsers } = useAppSelector((state) => state.ui);
  const { emitTypingStart, emitTypingStop } = useSocket();

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const taskTypingUsers = typingUsers.filter((t) => t.taskId === taskId && t.userId !== user?.id);

  const handleInputChange = (value: string) => {
    setNewComment(value);

    // Emit typing start
    emitTypingStart(taskId);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to emit typing stop
    const timeout = setTimeout(() => {
      emitTypingStop(taskId);
    }, 2000);
    setTypingTimeout(timeout);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    emitTypingStop(taskId);

    try {
      await dispatch(addComment({ taskId, content: newComment.trim() })).unwrap();
      setNewComment('');
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to add comment',
      }));
    }
  };

  const handleEdit = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editContent.trim()) return;

    try {
      await dispatch(updateComment({
        taskId,
        commentId: editingCommentId,
        content: editContent.trim(),
      })).unwrap();
      setEditingCommentId(null);
      setEditContent('');
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update comment',
      }));
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await dispatch(deleteComment({ taskId, commentId })).unwrap();
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete comment',
      }));
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="task-comments">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="task-comments__form">
        <div className="task-comments__input-wrapper">
          <div className="task-comments__avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <textarea
            className="task-comments__input"
            value={newComment}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
          />
        </div>
        {newComment.trim() && (
          <div className="task-comments__form-actions">
            <Button type="button" variant="ghost" size="sm" onClick={() => setNewComment('')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Comment
            </Button>
          </div>
        )}
      </form>

      {/* Typing indicator */}
      {taskTypingUsers.length > 0 && (
        <div className="task-comments__typing">
          <span className="task-comments__typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span>
            {taskTypingUsers.map((t) => t.userName).join(', ')} {taskTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Comments list */}
      <div className="task-comments__list">
        {comments.length === 0 ? (
          <div className="task-comments__empty">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="task-comments__item">
              <div className="task-comments__avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="task-comments__content">
                <div className="task-comments__meta">
                  <span className="task-comments__author">User {comment.userId.slice(0, 8)}</span>
                  <span className="task-comments__date">{formatDate(comment.createdAt)}</span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="task-comments__edited">(edited)</span>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="task-comments__edit">
                    <textarea
                      className="task-comments__input"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <div className="task-comments__edit-actions">
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="task-comments__text">{comment.content}</p>
                    {comment.userId === user?.id && (
                      <div className="task-comments__actions">
                        <button
                          className="task-comments__action"
                          onClick={() => handleEdit(comment.id, comment.content)}
                        >
                          Edit
                        </button>
                        <button
                          className="task-comments__action task-comments__action--delete"
                          onClick={() => handleDelete(comment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskComments;
