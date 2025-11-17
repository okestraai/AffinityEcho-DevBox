import { useContext } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';

export const useAuth = useAuthContext;