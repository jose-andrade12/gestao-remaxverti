import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, provider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // O SEU E-MAIL MASTER
  const EMAIL_MASTER = "rss.andrade@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'usuarios', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
             // O utilizador já existe na base de dados
             setRole(userSnap.data().perfil);
             setUser({ ...currentUser, status: userSnap.data().status });
          } else {
            // Primeiro acesso: FORÇA A GRAVAÇÃO NA BASE DE DADOS
            const isMaster = currentUser.email === EMAIL_MASTER;
            const novoUsuario = {
              nome: currentUser.displayName,
              email: currentUser.email,
              perfil: isMaster ? 'gestor' : 'corretor',
              status: isMaster ? 'ativo' : 'pendente'
            };
            
            await setDoc(userRef, novoUsuario);
            
            setRole(novoUsuario.perfil);
            setUser({ ...currentUser, status: novoUsuario.status });
          }
        } catch (error) {
          console.error("Erro ao sincronizar com o Firestore:", error);
          // Se falhar a leitura/escrita, assume as permissões básicas pelo e-mail
          const isMaster = currentUser.email === EMAIL_MASTER;
          setUser({ ...currentUser, status: isMaster ? 'ativo' : 'pendente' });
          setRole(isMaster ? 'gestor' : 'corretor');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginGoogle = () => {
      provider.setCustomParameters({ prompt: 'select_account' });
      return signInWithPopup(auth, provider);
  };
  
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      window.location.href = '/login';
    } catch (error) {
      console.error("Erro ao fazer logout", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);