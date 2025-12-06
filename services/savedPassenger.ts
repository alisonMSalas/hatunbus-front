import { API_BASE_URL } from '../constants/api';

export interface SavedPassenger {
  id?: string;
  userId?: string;
  isSelf?: boolean;
  fullName: string;
  identificationNumber: string;
  email: string;
  phone: string;
  passengerType: 'ADULT' | 'CHILD';
}

export const savedPassengerService = {
  async listByUser(userId: string, token: string): Promise<SavedPassenger[]> {
    const response = await fetch(`${API_BASE_URL}/saved-passengers/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener pasajeros guardados');
    }

    return response.json();
  },

  async create(userId: string, passenger: SavedPassenger, token: string): Promise<SavedPassenger> {
    const response = await fetch(`${API_BASE_URL}/saved-passengers/user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passenger),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al crear pasajero guardado');
    }

    return response.json();
  },

  async createOrUpdateSelf(userId: string, token: string): Promise<SavedPassenger> {
    const response = await fetch(`${API_BASE_URL}/saved-passengers/user/${userId}/self`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al crear/actualizar datos personales');
    }

    return response.json();
  },

  async update(passengerId: string, passenger: SavedPassenger, token: string): Promise<SavedPassenger> {
    const response = await fetch(`${API_BASE_URL}/saved-passengers/${passengerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passenger),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar pasajero guardado');
    }

    return response.json();
  },

  async delete(passengerId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/saved-passengers/${passengerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al eliminar pasajero guardado');
    }
  },
};
