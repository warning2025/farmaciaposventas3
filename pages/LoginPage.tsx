
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS, ROUTES } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LogIn, Mail, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check and set user role if it's one of the admin users
      const user = userCredential.user;
      if (user.uid === "CbaGzOUXC6bWRny43duYHRfutqL2" || user.uid === "MlvF9HRsqZX1xEdBog1IqlWC1zW2") {
        const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
        await setDoc(userDocRef, { role: UserRole.ADMIN, email: user.email, displayName: user.displayName || user.email?.split('@')[0] }, { merge: true });
      } else {
        // For other users, check if a role exists, if not, assign default (e.g., Cashier)
        // This part can be expanded based on registration flow if roles are assigned then
        const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
        const userDoc = await getDoc(userDocRef);
        if(!userDoc.exists() || !userDoc.data()?.role) {
           await setDoc(userDocRef, { role: UserRole.CASHIER, email: user.email, displayName: user.displayName || user.email?.split('@')[0] }, { merge: true });
        }
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo electrónico o contraseña incorrectos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // You might want to create a user document in Firestore here as well
      // to store roles or other app-specific information if they don't exist.
      const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: UserRole.CASHIER, // Default role for new Google sign-ins
          createdAt: new Date(),
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google: ' + (err.message || 'Inténtalo de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-8 md:p-12 space-y-8 transform transition-all hover:scale-105 duration-300">
        <div className="text-center">
          <img src="https://picsum.photos/seed/loginlogo/100/100" alt="Farmacia Logo" className="mx-auto h-20 w-auto rounded-full shadow-lg mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido a FarmaciaPro</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Inicia sesión para acceder al sistema.</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-sm" role="alert">
            <div className="flex">
              <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-3" /></div>
              <div>
                <p className="font-semibold">Error de autenticación</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            icon={<Mail size={20} />}
            autoComplete="email"
          />
          <div className="relative">
            <Input
              id="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              icon={<Lock size={20} />}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Recordarme
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth icon={<LogIn size={20} />}>
            Iniciar Sesión
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              O continuar con
            </span>
          </div>
        </div>

        <div>
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={handleGoogleSignIn} 
            isLoading={isLoading} 
            icon={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5"/>}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Iniciar sesión con Google
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} FarmaciaPro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
