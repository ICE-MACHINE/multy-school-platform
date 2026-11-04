import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext/NotificationContext';

export const useNotifications = () => useContext(NotificationContext);
