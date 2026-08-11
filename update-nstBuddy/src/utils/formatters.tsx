import { formatDistanceToNow } from 'date-fns';

export const formatTimeAgo = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date || new Date()), { addSuffix: true });
};