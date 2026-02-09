import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/usersService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import '../styles/pages/UsersPage.css';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({}); // { userId: { role: 'newRole' } }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
      setPendingChanges({});
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    // Guardar cambio pendiente
    setPendingChanges(prev => ({
      ...prev,
      [userId]: { role: newRole }
    }));
  };

  const handleSaveChanges = async (userId) => {
    const changes = pendingChanges[userId];
    if (!changes) return;

    try {
      await usersService.updateUserRole(userId, changes.role);
      
      // Actualizar usuario en el estado
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: changes.role } : user
      ));
      
      // Limpiar cambios pendientes
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data.detail || 'No puedes cambiar tu propio rol');
      } else if (err.response?.status === 403) {
        alert('No tienes permisos para realizar esta acción');
      } else {
        alert('Error al cambiar el rol');
      }
      console.error('Error:', err);
    }
  };

  const handlePasswordClick = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async (newPassword) => {
    try {
      await usersService.updateUserPassword(selectedUser.id, newPassword);
      setShowPasswordModal(false);
      setSelectedUser(null);
      alert('Contraseña actualizada exitosamente');
    } catch (err) {
      if (err.response?.status === 400) {
        throw new Error(err.response.data.detail || 'Error de validación');
      } else if (err.response?.status === 403) {
        throw new Error('No tienes permisos para realizar esta acción');
      } else {
        throw new Error('Error al cambiar la contraseña');
      }
    }
  };

  const handleDeleteUser = async (user) => {
    // Validar que no se elimine a sí mismo
    if (user.id === currentUser.id) {
      alert('No puedes eliminarte a ti mismo');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar al usuario "${user.username}"? Esta acción desactivará la cuenta.`
    );

    if (!confirmed) return;

    try {
      await usersService.deleteUser(user.id);
      
      // Actualizar lista - marcar como inactivo
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, is_active: false } : u
      ));
      
      alert('Usuario eliminado exitosamente');
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data.detail || 'Error al eliminar usuario');
      } else if (err.response?.status === 403) {
        alert('No tienes permisos para realizar esta acción');
      } else {
        alert('Error al eliminar usuario');
      }
      console.error('Error:', err);
    }
  };

  const hasPendingChanges = (userId) => {
    return !!pendingChanges[userId];
  };

  const getPendingRole = (userId, originalRole) => {
    return pendingChanges[userId]?.role || originalRole;
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="users-container">
          <div className="loading">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="users-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-container">
        <div className="users-header">
          <h1 className="users-title">Gestión de Usuarios</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'user-inactive' : ''}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={getPendingRole(user.id, user.role)}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="role-select"
                      disabled={!user.is_active}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasPendingChanges(user.id) && (
                        <button
                          onClick={() => handleSaveChanges(user.id)}
                          className="btn-save"
                        >
                          Guardar cambios
                        </button>
                      )}
                      <button
                        onClick={() => handlePasswordClick(user)}
                        className="btn-password"
                        disabled={!user.is_active}
                      >
                        Cambiar contraseña
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="btn-delete"
                        disabled={!user.is_active || user.id === currentUser.id}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-results">No se encontraron usuarios</div>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handlePasswordChange}
        />
      )}
    </div>
  );
};

export default UsersPage;
