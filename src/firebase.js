import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFR7yP9Y2uqdZJpem-6UtZ1S_FovqCby4",
  authDomain: "gestao-remaxverti.firebaseapp.com",
  projectId: "gestao-remaxverti",
  storageBucket: "gestao-remaxverti.firebasestorage.app",
  messagingSenderId: "783135362290",
  appId: "1:783135362290:web:658569a52f781f3af0546b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// ADICIONE ESTE BLOCO AQUI:
// Isto força o Google a mostrar sempre a janela de escolha de conta
provider.setCustomParameters({
  prompt: 'select_account'
});