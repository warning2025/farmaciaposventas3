
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User, Lock, Mail, Image as ImageIcon, Save, AlertTriangle } from 'lucide-react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Spinner from '../components/ui/Spinner';

const SettingsPage: React.FC = () => {
  const { currentUser, loading: authLoading, logout } = useAuth();
  
  const [systemName, setSystemName] = useState('');
  const [systemLogoURL, setSystemLogoURL] = useState('');
  const [systemLogoPreview, setSystemLogoPreview] = useState<string | null>(null);
  const [isSubmittingSystem, setIsSubmittingSystem] = useState(false);
  const [systemMessage, setSystemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar configuración global al montar
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await (await import('firebase/firestore')).getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSystemName(data.systemName || '');
          setSystemLogoURL(data.systemLogoURL || '');
          setSystemLogoPreview(data.systemLogoURL || null);
        }
      } catch (err) {
        // No mostrar error si no existe aún
      }
    };
    fetchSettings();
  }, []);

  const handleSystemLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSystemLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSystemLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSystemConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setSystemMessage({ type: 'error', text: 'Usuario no autenticado.' });
      return;
    }

    try {
      const userDoc = await (await import('firebase/firestore')).getDoc(doc(db as Firestore, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData || userData.role !== 'Admin') {
        setSystemMessage({ type: 'error', text: 'No tienes permisos para modificar la configuración.' });
        return;
      }
      
      setIsSubmittingSystem(true);
      setSystemMessage(null);
      
      const docRef = doc(db as Firestore, 'settings', 'system');
      await setDoc(docRef, {
        systemName: systemName.trim(),
        systemLogoURL: systemLogoURL.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });

      setSystemMessage({ type: 'success', text: 'Configuración del sistema actualizada exitosamente.' });
    } catch (error: any) {
      console.error('Error al guardar la configuración:', error);
      setSystemMessage({ type: 'error', text: `Error al guardar la configuración: ${error.message}` });
    } finally {
      setIsSubmittingSystem(false);
    }
  };
  const { currentUser, loading: authLoading, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(''); // Email display only, not editable directly here for security.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setPhotoPreview(currentUser.photoURL || null);
    }
  }, [currentUser]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmittingProfile(true);
    setProfileMessage(null);

    try {
      let photoURL = currentUser.photoURL;
      if (photoFile) {
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateProfile(currentUser, { displayName, photoURL });
      
      // Update Firestore user document as well
      const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, currentUser.uid);
      await setDoc(userDocRef, { displayName, photoURL }, { merge: true });

      setProfileMessage({ type: 'success', text: 'Perfil actualizado con éxito. Es posible que deba actualizar la página para ver todos los cambios.' });
      // Forcing a reload or updating AuthContext is complex here without a full re-auth.
      // The AuthProvider will pick up some changes on next auth state change, but not all immediately.
      // Consider using a global state management for immediate UI updates if critical.
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setProfileMessage({ type: 'error', text: `Error al actualizar perfil: ${error.message}` });
    } finally {
      setIsSubmittingProfile(false);
    }
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
        setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
    }

    setIsSubmittingPassword(true);
    setPasswordMessage(null);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada con éxito.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordMessage({ type: 'error', text: 'La contraseña actual es incorrecta.' });
      } else {
        setPasswordMessage({ type: 'error', text: `Error al actualizar contraseña: ${error.message}` });
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };


  if (authLoading || !currentUser) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Configuración global del sistema (solo admin) */}
      {currentUser?.role === 'Admin' && (
        <Card title="Configuración del Sistema" className="shadow-xl dark:bg-gray-800">
          <form onSubmit={handleSystemConfigUpdate} className="space-y-6 p-2 md:p-0">
            {systemMessage && (
              <div className={`p-3 rounded-md text-sm ${systemMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {systemMessage.text}
              </div>
            )}              <Input
                label="Nombre del Sistema"
                id="systemName"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                icon={<User size={18} />}
                required
              />
              <Input
                label="URL del Logo"
                id="systemLogoURL"
                value={systemLogoURL}
                onChange={(e) => {
                  setSystemLogoURL(e.target.value);
                  setSystemLogoPreview(e.target.value);
                }}
                icon={<ImageIcon size={18} />}
                placeholder="https://ejemplo.com/logo.png"
              />
              {systemLogoPreview && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img 
                      src={systemLogoPreview}
                      alt="Logo del sistema" 
                      className="w-32 h-32 object-contain shadow-md border-4 border-white dark:border-gray-700"
                      onError={() => setSystemLogoPreview(null)}
                    />
                  </div>
                </div>
              )}
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmittingSystem} icon={<Save size={18} />}>
                Guardar Configuración
              </Button>
            </div>
          </form>
        </Card>
      )}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Configuración de Cuenta</h1>
      
      {/* Profile Information Card */}
      <Card title="Información del Perfil" className="shadow-xl dark:bg-gray-800">
        <form onSubmit={handleProfileUpdate} className="space-y-6 p-2 md:p-0">
          {profileMessage && (
            <div className={`p-3 rounded-md text-sm ${profileMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {profileMessage.text}
            </div>
          )}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img 
                src={photoPreview || `https://ui-avatars.com/api/?name=${displayName.charAt(0) || email.charAt(0)}&background=random&color=fff&size=128`} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-white dark:border-gray-700"
              />
              <label htmlFor="photoUpload" className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-colors">
                <ImageIcon size={20} />
                <input id="photoUpload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          <Input
            label="Nombre Completo"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            icon={<User size={18} />}
          />
          <Input
            label="Correo Electrónico"
            id="email"
            type="email"
            value={email}
            readOnly // Email change is a more complex flow, often requires verification
            disabled 
            icon={<Mail size={18} />}
            containerClassName="opacity-70"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSubmittingProfile} icon={<Save size={18} />}>
              Guardar Cambios de Perfil
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card title="Cambiar Contraseña" className="shadow-xl dark:bg-gray-800">
        <form onSubmit={handlePasswordUpdate} className="space-y-6 p-2 md:p-0">
          {passwordMessage && (
             <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {passwordMessage.text}
            </div>
          )}
          <Input
            label="Contraseña Actual"
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            icon={<Lock size={18} />}
          />
          <Input
            label="Nueva Contraseña"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            icon={<Lock size={18} />}
          />
          <Input
            label="Confirmar Nueva Contraseña"
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            icon={<Lock size={18} />}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSubmittingPassword} variant="secondary" icon={<Save size={18} />}>
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      </Card>
      
      <Card title="Zona de Peligro" className="border-red-500 dark:border-red-600 border-2 shadow-xl dark:bg-gray-800">
         <div className="p-4">
             <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Cerrar Sesión</h3>
             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">Esto cerrará tu sesión en este dispositivo.</p>
             <Button variant="danger" onClick={logout} className="w-full sm:w-auto">Cerrar Sesión</Button>
         </div>
         {/* Add account deletion option here if needed, with proper warnings and confirmation */}
      </Card>
    </div>
  );
};

export default SettingsPage;
