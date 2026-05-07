/**
 * UserProfileModal — now redirects to the full standalone profile page.
 * Kept as a thin wrapper so all existing call sites work without changes.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onChat?: (userId: string) => void;
}

export function UserProfileModal({ isOpen, onClose, userId }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      onClose(); // close the "modal" state immediately
      navigate(`/dashboard/profile/${userId}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  return null;
}
