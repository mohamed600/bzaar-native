import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, StatusBar, Alert, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/* ─── theme ─── */
const C = {
  navy: '#1B2B4C',
  navyD: '#16243F',
  orange: '#FF6B35',
  orangeD: '#E2552A',
  cream: '#F4F0E8',
  paper: '#FBFAF8',
  line: '#E7E2D8',
  text: '#23262F',
  gray: '#7A7E89',
  green: '#1E8E3E',
  gold: '#C9A24B',
  white: '#FFFFFF',
};

/* ─── storage ─── */
const KEYS = {
  users: 'bzaar:users',
  session: 'bzaar:session',
  annonces: 'bzaar:annonces',
  services: 'bzaar:services',
  purchases: 'bzaar:purchases',
  conversations: 'bzaar:conversations',
  favorites: 'bzaar:favorites',
};
const getJSON = async (key, fallback) => {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};
const setJSON = async (key, val) => {
  try { await AsyncStorage.setItem(key, JSON.stringify(val)); } catch {}
};

/* ─── helpers ─── */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dh = (n) => `${Number(n).toLocaleString('fr-FR')} DH`;
const COMMISSION = 0.10;

const ANNONCE_CATS = [
  { id: 'vehicules', label: 'Véhicules', icon: '🚗' },
  { id: 'phones', label: 'Téléphones', icon: '📱' },
  { id: 'immobilier', label: 'Immobilier', icon: '🏠' },
  { id: 'electronique', label: 'Électronique', icon: '💻' },
  { id: 'vetements', label: 'Mode', icon: '👗' },
  { id: 'meubles', label: 'Meubles', icon: '🛋️' },
  { id: 'autres', label: 'Autres', icon: '📦' },
];
const SERVICE_PRES_CATS = [
  { id: 'menage', label: 'Ménage', icon: '🧹' },
  { id: 'reparation', label: 'Réparation', icon: '🔧' },
  { id: 'demenagement', label: 'Déménagement', icon: '📦' },
  { id: 'cours', label: 'Cours', icon: '📚' },
  { id: 'autres_s', label: 'Autres', icon: '🛠️' },
];
const SERVICE_DIGI_CATS = [
  { id: 'design_graphique', label: 'Design graphique', icon: '🎨' },
  { id: 'programmation', label: 'Programmation', icon: '💻' },
  { id: 'redaction', label: 'Rédaction / Traduction', icon: '✍️' },
  { id: 'montage_video', label: 'Montage vidéo', icon: '🎬' },
  { id: 'marketing', label: 'Marketing digital', icon: '📣' },
  { id: 'formation', label: 'Formation en ligne', icon: '🎓' },
  { id: 'ebooks', label: 'E-books / Templates', icon: '📄' },
];
const ALL_CATS = [...ANNONCE_CATS, ...SERVICE_PRES_CATS, ...SERVICE_DIGI_CATS];
const catLabel = (id) => ALL_CATS.find(c => c.id === id)?.label || id;
const catIcon  = (id) => ALL_CATS.find(c => c.id === id)?.icon  || '📦';

const THUMB_GRADS = [
  ['#3B4B6B','#21304D'], ['#8A9AA8','#5E6E7C'], ['#C9A24B','#A57F2F'],
  ['#FF8B5E','#E2552A'], ['#5FA8A0','#357A72'], ['#7E6BA8','#56437F'],
];
const thumbGrad = (seed) => {
  let h = 0; for (const c of String(seed)) h += c.charCodeAt(0);
  return THUMB_GRADS[h % THUMB_GRADS.length];
};

/* ═══════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════ */
function Avatar({ name = '?', size = 40, colors }) {
  const initials = name.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const grad = colors || ['#7E6BA8','#56437F'];
  return (
    <LinearGradient colors={grad} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </LinearGradient>
  );
}

function Btn({ label, onPress, variant = 'primary', icon, style }) {
  const bg = {
    primary:  [C.orange, C.orangeD],
    dark:     [C.navy, C.navy],
    outline:  ['transparent', 'transparent'],
    ghost:    [C.cream, C.cream],
    danger:   ['#FDEEEC','#FDEEEC'],
  }[variant];
  const textColor = {
    primary: '#fff', dark: '#fff', outline: C.navy, ghost: C.navy, danger: '#C0392B',
  }[variant];
  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: C.navy } : {};
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <LinearGradient colors={bg} style={[styles.btn, border]}>
        {icon && <Ionicons name={icon} size={15} color={textColor} style={{ marginRight: 5 }} />}
        <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function Badge({ label, tone = 'default' }) {
  const styles2 = {
    default: { bg: '#fff', color: C.navy,  border: C.line },
    live:    { bg: '#F1FAF3', color: C.green, border: '#C9E6D0' },
    new:     { bg: C.orange, color: '#fff', border: C.orange },
    lock:    { bg: '#FFF3E3', color: '#B5762B', border: '#F4DEB0' },
  }[tone];
  return (
    <View style={{ backgroundColor: styles2.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: styles2.border, marginRight: 6, marginBottom: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: styles2.color }}>{label}</Text>
    </View>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <View style={styles.toastWrap} pointerEvents="none">
      <View style={styles.toast}><Text style={styles.toastText}>{msg}</Text></View>
    </View>
  );
}

/* simple modal picker for categories */
function PickerModal({ visible, options, onSelect, onClose, title }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <ScrollView>
            {options.map(o => (
              <TouchableOpacity key={o.id} style={styles.pickerItem} onPress={() => { onSelect(o); onClose(); }}>
                <Text style={styles.pickerItemText}>{o.icon} {o.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, secureTextEntry, multiline, keyboardType, style }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.gray}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [screen, setScreen]     = useState('home');
  const [prevScreen, setPrev]   = useState('home');

  const [users, setUsers]               = useState([]);
  const [session, setSession]           = useState(null);
  const [annonces, setAnnonces]         = useState([]);
  const [services, setServices]         = useState([]);
  const [purchases, setPurchases]       = useState([]);
  const [conversations, setConvs]       = useState([]);
  const [favorites, setFavorites]       = useState([]);

  const [selectedId, setSelectedId]     = useState(null);
  const [selectedConvId, setSelConvId]  = useState(null);
  const [profileTab, setProfileTab]     = useState('listings');

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2300); };
  const goTo  = (s, from) => { if (from) setPrev(from); setScreen(s); };

  useEffect(() => {
    (async () => {
      const [u, s, a, sv, pu, co, fa] = await Promise.all([
        getJSON(KEYS.users, []),
        getJSON(KEYS.session, null),
        getJSON(KEYS.annonces, []),
        getJSON(KEYS.services, []),
        getJSON(KEYS.purchases, []),
        getJSON(KEYS.conversations, []),
        getJSON(KEYS.favorites, []),
      ]);
      setUsers(u); setSession(s); setAnnonces(a);
      setServices(sv); setPurchases(pu); setConvs(co); setFavorites(fa);
      setLoading(false);
    })();
  }, []);

  const me = useMemo(() => users.find(u => u.id === session?.userId) || null, [users, session]);

  /* ── auth ── */
  const register = async ({ fullName, email, password, city }) => {
    if (!fullName || !email || !password) return flash('Remplis tous les champs ⚠️');
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return flash('Cet email existe déjà ⚠️');
    const user = { id: uid(), fullName, email, password, city: city || 'Casablanca', walletBalance: 0, createdAt: Date.now() };
    const next = [...users, user];
    setUsers(next); await setJSON(KEYS.users, next);
    const sess = { userId: user.id };
    setSession(sess); await setJSON(KEYS.session, sess);
    flash(`Bienvenue sur BZAAR, ${fullName} 🎉`);
    setScreen('home');
  };

  const login = async ({ email, password }) => {
    const u = users.find(x => x.email.toLowerCase() === (email||'').toLowerCase() && x.password === password);
    if (!u) return flash('Email ou mot de passe incorrect ❌');
    const sess = { userId: u.id };
    setSession(sess); await setJSON(KEYS.session, sess);
    flash(`Content de te revoir, ${u.fullName.split(' ')[0]} 👋`);
    setScreen('home');
  };

  const logout = async () => {
    setSession(null); await setJSON(KEYS.session, null);
    setScreen('home'); flash('Déconnecté ✓');
  };

  const resetAll = () => {
    Alert.alert('Réinitialiser', 'Effacer toutes les données BZAAR ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: async () => {
        for (const k of Object.values(KEYS)) await AsyncStorage.removeItem(k);
        setUsers([]); setSession(null); setAnnonces([]);
        setServices([]); setPurchases([]); setConvs([]); setFavorites([]);
        setScreen('home'); flash('Données effacées ✓');
      }},
    ]);
  };

  /* ── listings ── */
  const addListing = async (payload) => {
    const base = { id: uid(), ownerId: me.id, ownerName: me.fullName, createdAt: Date.now() };
    if (payload.kind === 'annonce') {
      const next = [{ ...base, ...payload, status: 'disponible' }, ...annonces];
      setAnnonces(next); await setJSON(KEYS.annonces, next);
    } else {
      const next = [{ ...base, ...payload, status: 'actif', salesCount: 0 }, ...services];
      setServices(next); await setJSON(KEYS.services, next);
    }
    flash('Annonce publiée sur BZAAR ✓'); setScreen('home');
  };

  const deleteListing = (kind, id) => {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        if (kind === 'annonce') {
          const next = annonces.filter(a => a.id !== id);
          setAnnonces(next); await setJSON(KEYS.annonces, next);
        } else {
          const next = services.filter(s => s.id !== id);
          setServices(next); await setJSON(KEYS.services, next);
        }
        flash('Supprimé ✓');
      }},
    ]);
  };

  /* ── purchase ── */
  const buyService = async (service) => {
    if (!me) return flash('Connecte-toi d\'abord ⚠️');
    if (service.ownerId === me.id) return flash('Tu ne peux pas acheter ta propre offre 😅');
    const amount = Number(service.price);
    const commission = Math.round(amount * COMMISSION * 100) / 100;
    const sellerPayout = amount - commission;
    const purchase = {
      id: uid(), buyerId: me.id, buyerName: me.fullName,
      serviceId: service.id, serviceTitle: service.title,
      sellerId: service.ownerId, sellerName: service.ownerName,
      amount, commission, sellerPayout, status: 'livre', createdAt: Date.now(),
      digitalContent: service.digitalContent || 'Aucun contenu spécifié.',
    };
    const nextP = [purchase, ...purchases];
    setPurchases(nextP); await setJSON(KEYS.purchases, nextP);

    const nextU = users.map(u => u.id === service.ownerId
      ? { ...u, walletBalance: Math.round(((u.walletBalance || 0) + sellerPayout) * 100) / 100 }
      : u
    );
    setUsers(nextU); await setJSON(KEYS.users, nextU);

    const nextSv = services.map(s => s.id === service.id
      ? { ...s, salesCount: (s.salesCount || 0) + 1 } : s
    );
    setServices(nextSv); await setJSON(KEYS.services, nextSv);
    flash('Paiement simulé — contenu débloqué ✓');
  };

  /* ── favorites ── */
  const toggleFav = async (itemId) => {
    if (!me) return flash('Connecte-toi pour ajouter aux favoris ⚠️');
    const exists = favorites.some(f => f.userId === me.id && f.itemId === itemId);
    const next = exists
      ? favorites.filter(f => !(f.userId === me.id && f.itemId === itemId))
      : [...favorites, { userId: me.id, itemId }];
    setFavorites(next); await setJSON(KEYS.favorites, next);
  };
  const isFav = (id) => me && favorites.some(f => f.userId === me.id && f.itemId === id);

  /* ── messages ── */
  const openConv = async (item) => {
    if (!me) return flash('Connecte-toi pour contacter ⚠️');
    if (item.ownerId === me.id) return flash('C\'est ta propre annonce 😅');
    let conv = conversations.find(c =>
      c.itemId === item.id && c.participants.includes(me.id) && c.participants.includes(item.ownerId)
    );
    if (!conv) {
      conv = { id: uid(), itemId: item.id, itemTitle: item.title,
        participants: [me.id, item.ownerId], messages: [], updatedAt: Date.now() };
      const next = [conv, ...conversations];
      setConvs(next); await setJSON(KEYS.conversations, next);
    }
    setSelConvId(conv.id); goTo('conversation', screen);
  };

  const sendMsg = async (convId, text) => {
    if (!text.trim()) return;
    const next = conversations.map(c => c.id === convId
      ? { ...c, updatedAt: Date.now(), messages: [...c.messages, { senderId: me.id, text: text.trim(), at: Date.now() }] }
      : c
    );
    setConvs(next); await setJSON(KEYS.conversations, next);
  };

  /* ── derived ── */
  const feed = useMemo(() => {
    const all = [
      ...services.map(x => ({ ...x, kind: 'service' })),
      ...annonces.map(x => ({ ...x, kind: 'annonce' })),
    ].sort((a, b) => b.createdAt - a.createdAt);
    return all;
  }, [annonces, services]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return [
      ...annonces.map(x => ({ ...x, kind: 'annonce' })),
      ...services.map(x => ({ ...x, kind: 'service' })),
    ].find(i => i.id === selectedId) || null;
  }, [selectedId, annonces, services]);

  const selectedConv   = useMemo(() => conversations.find(c => c.id === selectedConvId) || null, [conversations, selectedConvId]);
  const myListings     = useMemo(() => me ? [
    ...annonces.filter(a => a.ownerId === me.id).map(x => ({ ...x, kind: 'annonce' })),
    ...services.filter(s => s.ownerId === me.id).map(x => ({ ...x, kind: 'service' })),
  ].sort((a, b) => b.createdAt - a.createdAt) : [], [me, annonces, services]);

  const myPurchases    = useMemo(() => me ? purchases.filter(p => p.buyerId === me.id).sort((a,b)=>b.createdAt-a.createdAt) : [], [me, purchases]);
  const mySales        = useMemo(() => me ? purchases.filter(p => p.sellerId === me.id).sort((a,b)=>b.createdAt-a.createdAt) : [], [me, purchases]);
  const myConvs        = useMemo(() => me ? conversations.filter(c => c.participants.includes(me.id)).sort((a,b)=>b.updatedAt-a.updatedAt) : [], [me, conversations]);
  const alreadyBought  = (svcId) => me && purchases.some(p => p.serviceId === svcId && p.buyerId === me.id);
  const myPurchaseRec  = (svcId) => purchases.find(p => p.serviceId === svcId && p.buyerId === me.id);

  /* ═══ RENDER ═══ */
  if (loading) {
    return (
      <View style={[styles.flex1, styles.center, { backgroundColor: C.navyD }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.orange} />
        <Text style={{ color: '#fff', marginTop: 14, fontWeight: '700', fontSize: 15 }}>Chargement de BZAAR…</Text>
      </View>
    );
  }

  if (!me) {
    return (
      <SafeAreaView style={[styles.flex1, { backgroundColor: C.navyD }]}>
        <StatusBar barStyle="light-content" />
        <AuthScreen onLogin={login} onRegister={register} />
        <Toast msg={toast} />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen feed={feed} isFav={isFav} toggleFav={toggleFav}
          onOpen={(id) => { setSelectedId(id); goTo('detail', 'home'); }} />;
      case 'detail':
        return selectedItem ? <DetailScreen item={selectedItem} me={me}
          onBack={() => goTo(prevScreen)}
          onBuy={() => buyService(selectedItem)}
          onContact={() => openConv(selectedItem)}
          alreadyBought={alreadyBought(selectedItem.id)}
          purchaseRec={myPurchaseRec(selectedItem.id)}
          isFav={isFav(selectedItem.id)}
          toggleFav={() => toggleFav(selectedItem.id)}
        /> : null;
      case 'add':
        return <AddScreen onPublish={addListing} onCancel={() => setScreen('home')} />;
      case 'profile':
        return <ProfileScreen me={me} profileTab={profileTab} setProfileTab={setProfileTab}
          myListings={myListings} myPurchases={myPurchases} mySales={mySales}
          onOpen={(id) => { setSelectedId(id); goTo('detail', 'profile'); }}
          onDelete={deleteListing} onLogout={logout} onReset={resetAll} />;
      case 'messages':
        return <MessagesScreen convs={myConvs} me={me} users={users}
          onOpen={(id) => { setSelConvId(id); goTo('conversation', 'messages'); }} />;
      case 'conversation':
        return selectedConv ? <ConvScreen conv={selectedConv} me={me} users={users}
          onBack={() => goTo(prevScreen)} onSend={(t) => sendMsg(selectedConv.id, t)} /> : null;
      default:
        return null;
    }
  };

  const tabScreens = ['home','messages','add','profile'];
  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: C.navyD }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      {/* Top bar */}
      {!['detail','add','conversation'].includes(screen) && (
        <LinearGradient colors={[C.navy, C.navyD]} style={styles.topbar}>
          <View style={styles.row}>
            <Ionicons name="bag-handle" size={22} color={C.orange} />
            <Text style={styles.brand}>BZAAR</Text>
          </View>
          <TouchableOpacity onPress={() => setScreen('profile')}>
            <Avatar name={me.fullName} size={32} colors={['#FF8B5E','#E2552A']} />
          </TouchableOpacity>
        </LinearGradient>
      )}

      <View style={styles.flex1}>{renderScreen()}</View>

      {/* Bottom nav */}
      {!['detail','add','conversation'].includes(screen) && (
        <View style={styles.bottomNav}>
          <NavItem icon="home" label="Accueil"  active={screen==='home'}     onPress={() => setScreen('home')} />
          <NavItem icon="chatbubbles" label="Messages" active={screen==='messages'} onPress={() => setScreen('messages')} badge={myConvs.length} />
          <TouchableOpacity onPress={() => setScreen('add')} style={styles.fab} activeOpacity={0.85}>
            <LinearGradient colors={[C.orange, C.orangeD]} style={styles.fabInner}>
              <Ionicons name="add" size={26} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <NavItem icon="person" label="Profil"   active={screen==='profile'}  onPress={() => setScreen('profile')} />
          <NavItem icon="star"  label="Favoris"  active={false} onPress={() => flash('Bientôt disponible ✨')} />
        </View>
      )}

      <Toast msg={toast} />
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress, badge }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.navItem} activeOpacity={0.7}>
      <View>
        <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? C.orange : C.gray} />
        {badge > 0 && <View style={styles.badge2}><Text style={{ color:'#fff', fontSize:8, fontWeight:'800' }}>{badge}</Text></View>}
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: active ? C.orange : C.gray, marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════
   AUTH
═══════════════════════════════════════════ */
function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode]         = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity]         = useState('Casablanca');
  const [showPw, setShowPw]     = useState(false);

  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:22 }}>
        <View style={{ alignItems:'center', marginBottom:28 }}>
          <View style={styles.row}>
            <Ionicons name="bag-handle" size={30} color={C.orange} />
            <Text style={styles.brandLg}>BZAAR</Text>
          </View>
          <Text style={{ color:'#C7CCDA', fontSize:13, fontWeight:'600', marginTop:8 }}>
            Bay3, chri, w khdem — kolchi f Bzaar
          </Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.segmented}>
            <TouchableOpacity style={[styles.segBtn, mode==='login' && styles.segBtnSel]} onPress={() => setMode('login')}>
              <Text style={[styles.segBtnText, { color: mode==='login' ? C.navy : C.gray }]}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segBtn, mode==='register' && styles.segBtnSel]} onPress={() => setMode('register')}>
              <Text style={[styles.segBtnText, { color: mode==='register' ? C.navy : C.gray }]}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {mode==='register' && <FieldInput label="NOM COMPLET" value={fullName} onChangeText={setFullName} placeholder="Karim El Fassi" />}
          <FieldInput label="EMAIL" value={email} onChangeText={setEmail} placeholder="toi@email.com" keyboardType="email-address" />
          <View style={{ marginBottom:14 }}>
            <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
            <View style={{ position:'relative' }}>
              <TextInput style={styles.input} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor={C.gray}
                secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={C.gray} />
              </TouchableOpacity>
            </View>
          </View>
          {mode==='register' && <FieldInput label="VILLE" value={city} onChangeText={setCity} placeholder="Casablanca" />}

          <Btn
            label={mode==='login' ? 'Se connecter' : 'Créer mon compte'}
            onPress={() => mode==='login' ? onLogin({ email, password }) : onRegister({ fullName, email, password, city })}
            style={{ marginTop:4 }}
          />
          <Text style={{ fontSize:11, color:C.gray, marginTop:12, textAlign:'center', lineHeight:17 }}>
            Démo fonctionnelle — tes données (compte, annonces, achats) sont sauvegardées sur ton téléphone.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════
   HOME
═══════════════════════════════════════════ */
function HomeScreen({ feed, isFav, toggleFav, onOpen }) {
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState(null);
  const cats = [
    { id: null, label:'Tout', icon:'🛍️' },
    ...SERVICE_DIGI_CATS.slice(0,3),
    ...ANNONCE_CATS.slice(0,3),
  ];
  const filtered = useMemo(() => feed.filter(item => {
    const matchCat = !catFilter || item.category === catFilter;
    const matchQ   = !search.trim() || item.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  }), [feed, catFilter, search]);

  return (
    <View style={styles.flex1}>
      <LinearGradient colors={[C.navy, C.navyD]} style={styles.archHeader}>
        <View style={[styles.searchBox]}>
          <Ionicons name="search" size={16} color={C.gray} style={{ marginRight:8 }} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Chercher un article, un service…"
            placeholderTextColor={C.gray}
            style={{ flex:1, fontSize:13, fontWeight:'600', color:C.text }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.gray} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRail} contentContainerStyle={{ paddingHorizontal:14, paddingVertical:10 }}>
        {cats.map(c => (
          <TouchableOpacity key={String(c.id)} onPress={() => setCatFilter(c.id)}
            style={[styles.catChip, catFilter===c.id && styles.catChipActive]}>
            <Text style={{ fontSize:12 }}>{c.icon}</Text>
            <Text style={[styles.catChipText, catFilter===c.id && { color:'#fff' }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ fontSize:12, fontWeight:'700', color:C.gray, paddingHorizontal:18, marginBottom:6 }}>
        {filtered.length} résultat{filtered.length!==1?'s':''}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal:14, paddingBottom:100 }}
        ListEmptyComponent={() => (
          <View style={[styles.center, { paddingVertical:50 }]}>
            <Text style={{ fontSize:32 }}>🛍️</Text>
            <Text style={{ color:C.gray, fontWeight:'600', fontSize:13, marginTop:12, textAlign:'center' }}>
              Rien ici pour l'instant.{'\n'}Sois le premier à publier !
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ListingCard item={item} isFav={isFav(item.id)} onFav={() => toggleFav(item.id)} onOpen={() => onOpen(item.id)} />
        )}
      />
    </View>
  );
}

function ListingCard({ item, isFav, onFav, onOpen }) {
  const isDigital = item.kind==='service' && item.type==='digital';
  const [c1, c2] = thumbGrad(item.id);
  return (
    <TouchableOpacity onPress={onOpen} activeOpacity={0.9} style={styles.listingCard}>
      <LinearGradient colors={[c1,c2]} style={styles.listingThumb}>
        <Text style={{ fontSize:24 }}>{catIcon(item.category)}</Text>
        {isDigital && (
          <View style={styles.digiTag}><Text style={{ color:'#fff', fontSize:9, fontWeight:'800' }}>✦ Digital</Text></View>
        )}
      </LinearGradient>
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.listingMeta}>
          {item.kind==='annonce' ? `${item.city} · ${catLabel(item.category)}` : `${item.ownerName} · ${catLabel(item.category)}`}
        </Text>
        <Text style={styles.listingPrice}>{dh(item.price)}</Text>
      </View>
      <TouchableOpacity onPress={onFav} style={[styles.favBtn, isFav && { backgroundColor: C.orange }]} activeOpacity={0.8}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={14} color={isFav ? '#fff' : C.navy} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════
   DETAIL
═══════════════════════════════════════════ */
function DetailScreen({ item, me, onBack, onBuy, onContact, alreadyBought, purchaseRec, isFav, toggleFav }) {
  const isDigital = item.kind==='service' && item.type==='digital';
  const isMine    = item.ownerId === me?.id;
  const [c1, c2]  = thumbGrad(item.id);

  return (
    <View style={styles.flex1}>
      <ScrollView contentContainerStyle={{ paddingBottom:120 }}>
        <LinearGradient colors={[c1,c2]} style={styles.detailGallery}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={C.navy} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFav} style={[styles.backBtn, { right:16, left:'auto' }]}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? C.orange : C.navy} />
          </TouchableOpacity>
          <Text style={{ fontSize:60 }}>{catIcon(item.category)}</Text>
        </LinearGradient>

        <View style={{ padding:18 }}>
          <Text style={{ fontSize:19, fontWeight:'800', color:C.text, lineHeight:26 }}>{item.title}</Text>

          <View style={styles.sellerCard}>
            <Avatar name={item.ownerName} size={42} />
            <View style={{ flex:1, marginLeft:10 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.text }}>{item.ownerName}</Text>
              <Text style={{ fontSize:11, color:C.gold, fontWeight:'700', marginTop:2 }}>
                ★ {item.kind==='service' ? 'Prestataire' : 'Vendeur'}
              </Text>
            </View>
            {!isMine && (
              <Btn label="Message" icon="chatbubble-outline" variant="outline" onPress={onContact}
                style={{ paddingVertical:0 }} />
            )}
          </View>

          <View style={[styles.row, { flexWrap:'wrap', marginTop:14 }]}>
            {isDigital && <Badge label={`⚡ ${item.deliveryTime || 'Instantané'}`} tone="live" />}
            {isDigital && <Badge label="🔒 Fichier protégé" tone="lock" />}
            {!isDigital && item.city && <Badge label={`📍 ${item.city}`} />}
            <Badge label={`${catIcon(item.category)} ${catLabel(item.category)}`} />
          </View>

          <Text style={{ marginTop:16, fontSize:13, lineHeight:21, color:'#454A56', fontWeight:'500' }}>
            {item.description || 'Aucune description fournie.'}
          </Text>

          {isDigital && (
            <View style={{ marginTop:16 }}>
              {alreadyBought ? (
                <View style={styles.unlockBox}>
                  <View style={[styles.row, { marginBottom:8 }]}>
                    <Ionicons name="checkmark-circle" size={16} color={C.green} />
                    <Text style={{ marginLeft:6, fontWeight:'800', color:C.green, fontSize:13 }}>
                      Contenu débloqué — tu as acheté cette offre
                    </Text>
                  </View>
                  <View style={styles.unlockContent}>
                    <Text style={{ fontSize:13, fontWeight:'600', color:C.text }}>{purchaseRec?.digitalContent}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.lockBox}>
                  <Ionicons name="lock-closed" size={15} color="#B5762B" />
                  <Text style={{ flex:1, marginLeft:8, fontSize:12, fontWeight:'700', color:'#B5762B' }}>
                    Le contenu sera débloqué automatiquement après l'achat.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.buyBar}>
        <View>
          <Text style={{ fontSize:10, fontWeight:'700', color:C.gray }}>PRIX</Text>
          <Text style={{ fontSize:20, fontWeight:'900', color:C.navy }}>{dh(item.price)}</Text>
        </View>
        {isMine ? (
          <Badge label="C'est ton annonce" />
        ) : isDigital ? (
          alreadyBought
            ? <Btn label="Déjà acheté" icon="download-outline" variant="dark" />
            : <Btn label="Acheter maintenant" icon="sparkles-outline" onPress={onBuy} />
        ) : (
          <Btn label="Contacter" icon="chatbubble-outline" onPress={onContact} />
        )}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════
   ADD
═══════════════════════════════════════════ */
function AddScreen({ onPublish, onCancel }) {
  const [kind, setKind]                 = useState('annonce');
  const [type, setType]                 = useState('presentiel');
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [price, setPrice]               = useState('');
  const [category, setCategory]         = useState(null);
  const [city, setCity]                 = useState('Casablanca');
  const [deliveryTime, setDeliveryTime] = useState('Instantané');
  const [digitalContent, setDigiContent] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showDelPicker, setShowDelPicker] = useState(false);

  const cats = kind==='annonce' ? ANNONCE_CATS : type==='digital' ? SERVICE_DIGI_CATS : SERVICE_PRES_CATS;

  const submit = () => {
    if (!title.trim() || !price || !category) return Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires.');
    if (kind==='annonce') {
      onPublish({ kind:'annonce', title, description, price:Number(price), category: category.id, city });
    } else {
      onPublish({ kind:'service', title, description, price:Number(price), category: category.id, type,
        city: type==='presentiel' ? city : undefined,
        deliveryTime: type==='digital' ? deliveryTime : undefined,
        digitalContent: type==='digital' ? digitalContent : undefined,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={[styles.row, { padding:16, backgroundColor:C.cream, borderBottomWidth:1, borderBottomColor:C.line }]}>
        <TouchableOpacity onPress={onCancel} style={{ marginRight:10 }}>
          <Ionicons name="arrow-back" size={22} color={C.navy} />
        </TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'800', color:C.navy }}>Publier sur BZAAR</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:18, paddingBottom:80 }}>
        {/* kind toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setKind('annonce')} style={[styles.toggleBtn, kind==='annonce' && styles.toggleBtnSel]}>
            <Text style={[styles.toggleBtnText, kind==='annonce' && { color:'#fff' }]}>📦 Annonce</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setKind('service')} style={[styles.toggleBtn, kind==='service' && styles.toggleBtnSel]}>
            <Text style={[styles.toggleBtnText, kind==='service' && { color:'#fff' }]}>🧰 Service</Text>
          </TouchableOpacity>
        </View>

        {kind==='service' && (
          <View style={styles.toggleRow}>
            <TouchableOpacity onPress={() => setType('presentiel')} style={[styles.toggleBtn, type==='presentiel' && styles.toggleBtnSel]}>
              <Text style={[styles.toggleBtnText, type==='presentiel' && { color:'#fff' }]}>Présentiel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setType('digital')} style={[styles.toggleBtn, type==='digital' && styles.toggleBtnSel]}>
              <Text style={[styles.toggleBtnText, type==='digital' && { color:'#fff' }]}>✨ Digital</Text>
            </TouchableOpacity>
          </View>
        )}

        <FieldInput label="TITRE" value={title} onChangeText={setTitle} placeholder="Ex : Logo professionnel" />
        <FieldInput label="DESCRIPTION" value={description} onChangeText={setDescription}
          placeholder="Décris ton article ou service…" multiline />

        {/* category picker */}
        <View style={{ marginBottom:14 }}>
          <Text style={styles.fieldLabel}>CATÉGORIE</Text>
          <TouchableOpacity style={[styles.input, styles.row, { justifyContent:'space-between' }]} onPress={() => setShowCatPicker(true)}>
            <Text style={{ fontSize:13, fontWeight:'600', color: category ? C.text : C.gray }}>
              {category ? `${category.icon} ${category.label}` : 'Choisir une catégorie…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={C.gray} />
          </TouchableOpacity>
        </View>

        <FieldInput label="PRIX (DH)" value={price} onChangeText={setPrice} placeholder="250" keyboardType="numeric" />

        {(kind==='annonce' || type==='presentiel') && (
          <FieldInput label="VILLE" value={city} onChangeText={setCity} placeholder="Casablanca" />
        )}

        {kind==='service' && type==='digital' && (
          <>
            <View style={{ marginBottom:14 }}>
              <Text style={styles.fieldLabel}>DÉLAI DE LIVRAISON</Text>
              <TouchableOpacity style={[styles.input, styles.row, { justifyContent:'space-between' }]} onPress={() => setShowDelPicker(true)}>
                <Text style={{ fontSize:13, fontWeight:'600', color:C.text }}>{deliveryTime}</Text>
                <Ionicons name="chevron-down" size={16} color={C.gray} />
              </TouchableOpacity>
            </View>
            <FieldInput label="CONTENU À LIVRER (débloqué après achat)"
              value={digitalContent} onChangeText={setDigiContent}
              placeholder="Lien Drive, code d'accès, texte du produit…" multiline />
            <View style={styles.lockBox}>
              <Ionicons name="lock-closed" size={13} color="#B5762B" />
              <Text style={{ flex:1, marginLeft:8, fontSize:11, fontWeight:'700', color:'#B5762B' }}>
                Ce contenu est caché tant que l'achat n'est pas confirmé.
              </Text>
            </View>
          </>
        )}

        <Btn label="Publier l'annonce" onPress={submit} style={{ marginTop:22 }} />
      </ScrollView>

      <PickerModal visible={showCatPicker} options={cats} title="Catégorie"
        onSelect={(o) => setCategory(o)} onClose={() => setShowCatPicker(false)} />
      <PickerModal visible={showDelPicker}
        options={[{id:'Instantané',label:'Instantané',icon:'⚡'},{id:'24h',label:'24h',icon:'⏱️'},{id:'48h',label:'48h',icon:'⏱️'},{id:'3 jours',label:'3 jours',icon:'📅'}]}
        title="Délai de livraison"
        onSelect={(o) => setDeliveryTime(o.id)} onClose={() => setShowDelPicker(false)} />
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════
   PROFILE
═══════════════════════════════════════════ */
function ProfileScreen({ me, profileTab, setProfileTab, myListings, myPurchases, mySales, onOpen, onDelete, onLogout, onReset }) {
  const TABS = [['listings','Annonces'],['purchases','Achats'],['sales','Ventes']];
  const data = profileTab==='listings' ? myListings : profileTab==='purchases' ? myPurchases : mySales;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom:100 }}>
      <LinearGradient colors={[C.navy, C.navyD]} style={styles.profileHead}>
        <Avatar name={me.fullName} size={54} colors={['#FF8B5E','#E2552A']} />
        <View style={{ marginLeft:12 }}>
          <Text style={{ fontSize:16, fontWeight:'800', color:'#fff' }}>{me.fullName}</Text>
          <Text style={{ fontSize:11.5, color:'#C7CCDA', fontWeight:'600', marginTop:3 }}>
            {me.email} · {me.city}
          </Text>
        </View>
      </LinearGradient>

      {/* wallet */}
      <View style={styles.walletCard}>
        <Text style={{ fontSize:10.5, color:C.gray, fontWeight:'700' }}>SOLDE DISPONIBLE</Text>
        <View style={[styles.row, { marginTop:4 }]}>
          <Text style={{ fontSize:24, fontWeight:'900', color:C.navy }}>{dh(me.walletBalance || 0)}</Text>
          <Btn label="Retirer" icon="wallet-outline" onPress={() => Alert.alert('Bientôt', 'Retrait disponible après intégration CMI.')} style={{ marginLeft:'auto' }} />
        </View>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        {TABS.map(([k,l]) => (
          <TouchableOpacity key={k} onPress={() => setProfileTab(k)}
            style={[styles.tabBtn, profileTab===k && styles.tabBtnSel]}>
            <Text style={[styles.tabBtnText, profileTab===k && { color:'#fff' }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {data.length === 0 ? (
        <View style={[styles.center, { paddingVertical:30 }]}>
          <Text style={{ color:C.gray, fontSize:13, fontWeight:'600' }}>
            {profileTab==='listings' ? 'Aucune annonce publiée encore.' :
             profileTab==='purchases' ? 'Aucun achat pour l\'instant.' :
             'Aucune vente encore. Publie un service digital !'}
          </Text>
        </View>
      ) : (
        data.map(item => {
          const isP = profileTab==='purchases';
          const isS = profileTab==='sales';
          const [c1,c2] = thumbGrad(item.id || item.serviceId);
          return (
            <TouchableOpacity key={item.id} onPress={() => !isP && !isS && onOpen(item.id)}
              activeOpacity={0.85} style={styles.rowCard}>
              <LinearGradient colors={[c1,c2]} style={styles.smallThumb}>
                <Text style={{ fontSize:16 }}>{isP ? '🎁' : isS ? '💰' : catIcon(item.category)}</Text>
              </LinearGradient>
              <View style={{ flex:1, marginLeft:10 }}>
                <Text style={{ fontSize:12.5, fontWeight:'700', color:C.text }} numberOfLines={1}>
                  {item.title || item.serviceTitle}
                </Text>
                <Text style={{ fontSize:11, color:C.gray, fontWeight:'600', marginTop:2 }}>
                  {isP ? `${item.sellerName} · ${dh(item.amount)}` :
                   isS ? `Acheté par ${item.buyerName}` :
                   dh(item.price)}
                </Text>
              </View>
              {isS && <Text style={{ fontSize:12.5, fontWeight:'800', color:C.green }}>+{dh(item.sellerPayout)}</Text>}
              {isP && <View style={[styles.statusPill, { backgroundColor:'#E9F7EC' }]}><Text style={{ color:C.green, fontSize:9.5, fontWeight:'800' }}>Livré</Text></View>}
              {!isP && !isS && (
                <TouchableOpacity onPress={() => onDelete(item.kind, item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={14} color="#C0392B" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })
      )}

      <View style={[styles.row, { margin:18, gap:10 }]}>
        <Btn label="Déconnexion" icon="log-out-outline" variant="outline" onPress={onLogout} style={{ flex:1 }} />
        <Btn label="Réinitialiser" icon="refresh-outline" variant="danger" onPress={onReset} style={{ flex:1 }} />
      </View>
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════ */
function MessagesScreen({ convs, me, users, onOpen }) {
  return (
    <View style={styles.flex1}>
      <LinearGradient colors={[C.navy, C.navyD]} style={{ padding:18, paddingBottom:20 }}>
        <Text style={{ color:'#fff', fontSize:20, fontWeight:'800' }}>Messages</Text>
      </LinearGradient>
      <FlatList
        data={convs}
        keyExtractor={c => c.id}
        contentContainerStyle={{ paddingBottom:100 }}
        ListEmptyComponent={() => (
          <View style={[styles.center, { paddingVertical:50 }]}>
            <Text style={{ fontSize:32 }}>💬</Text>
            <Text style={{ color:C.gray, fontWeight:'600', fontSize:13, marginTop:12 }}>Aucune conversation pour l'instant.</Text>
          </View>
        )}
        renderItem={({ item: conv }) => {
          const otherId = conv.participants.find(p => p !== me.id);
          const other   = users.find(u => u.id === otherId);
          const last    = conv.messages[conv.messages.length - 1];
          return (
            <TouchableOpacity onPress={() => onOpen(conv.id)} style={styles.msgRow} activeOpacity={0.85}>
              <Avatar name={other?.fullName || '?'} size={44} />
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={{ fontSize:13, fontWeight:'800', color:C.text }}>{other?.fullName || 'Utilisateur'}</Text>
                <Text style={{ fontSize:11, color:C.gray, fontWeight:'600', marginTop:2 }} numberOfLines={1}>{conv.itemTitle}</Text>
                <Text style={{ fontSize:11.5, color:C.gray, fontWeight:'600', marginTop:2 }} numberOfLines={1}>
                  {last ? last.text : 'Démarrer la conversation…'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function ConvScreen({ conv, me, users, onBack, onSend }) {
  const [text, setText]  = useState('');
  const scrollRef        = useRef(null);
  const otherId          = conv.participants.find(p => p !== me.id);
  const other            = users.find(u => u.id === otherId);

  const send = () => { if (!text.trim()) return; onSend(text); setText(''); };

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated:true }); }, [conv.messages]);

  return (
    <View style={styles.flex1}>
      <LinearGradient colors={[C.navy, C.navyD]} style={styles.convHeader}>
        <TouchableOpacity onPress={onBack} style={{ marginRight:10 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Avatar name={other?.fullName || '?'} size={36} />
        <View style={{ marginLeft:10 }}>
          <Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>{other?.fullName || 'Utilisateur'}</Text>
          <Text style={{ color:'#C7CCDA', fontSize:11, fontWeight:'600' }}>{conv.itemTitle}</Text>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding:14, paddingBottom:90 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated:true })}>
        {conv.messages.length===0 && (
          <View style={[styles.center, { paddingVertical:30 }]}>
            <Text style={{ color:C.gray, fontWeight:'600', fontSize:13 }}>Dis bonjour pour démarrer 👋</Text>
          </View>
        )}
        {conv.messages.map((m, i) => {
          const isMe = m.senderId === me.id;
          return (
            <View key={i} style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom:8 }}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={{ fontSize:13, fontWeight:'600', color: isMe ? '#fff' : C.text }}>{m.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'}>
        <View style={styles.chatInput}>
          <TextInput value={text} onChangeText={setText} placeholder="Écrire un message…"
            placeholderTextColor={C.gray} onSubmitEditing={send}
            style={[styles.input, { flex:1, marginRight:10, marginBottom:0 }]} />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  flex1:    { flex:1 },
  center:   { alignItems:'center', justifyContent:'center' },
  row:      { flexDirection:'row', alignItems:'center' },

  topbar:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingVertical:12 },
  brand:    { fontSize:20, fontWeight:'900', color:'#fff', marginLeft:7 },
  brandLg:  { fontSize:28, fontWeight:'900', color:'#fff', marginLeft:8 },

  avatar:   { alignItems:'center', justifyContent:'center' },

  btn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', borderRadius:12, paddingHorizontal:18, paddingVertical:12 },
  btnText:  { fontSize:13.5, fontWeight:'800' },

  toastWrap:  { position:'absolute', bottom:110, left:0, right:0, alignItems:'center', zIndex:999 },
  toast:      { backgroundColor:'#1B2230', borderRadius:999, paddingHorizontal:20, paddingVertical:11 },
  toastText:  { color:'#fff', fontSize:12.5, fontWeight:'700' },

  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,.5)', justifyContent:'flex-end' },
  pickerSheet:  { backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:18, maxHeight:'60%' },
  pickerTitle:  { fontSize:15, fontWeight:'800', color:C.navy, marginBottom:14 },
  pickerItem:   { paddingVertical:13, borderBottomWidth:1, borderBottomColor:C.line },
  pickerItemText: { fontSize:14, fontWeight:'600', color:C.text },

  fieldLabel:   { fontSize:10.5, fontWeight:'800', color:C.navy, marginBottom:6, letterSpacing:0.3 },
  input:        { backgroundColor:'#fff', borderWidth:1, borderColor:C.line, borderRadius:12,
                  paddingHorizontal:13, paddingVertical:12, fontSize:13, fontWeight:'600', color:C.text },
  eyeBtn:       { position:'absolute', right:12, top:0, bottom:0, justifyContent:'center' },

  authCard:   { backgroundColor:'#fff', borderRadius:20, padding:20, elevation:8, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.15, shadowRadius:12 },
  segmented:  { flexDirection:'row', backgroundColor:C.cream, borderRadius:12, padding:4, marginBottom:18 },
  segBtn:     { flex:1, borderRadius:9, paddingVertical:9, alignItems:'center' },
  segBtnSel:  { backgroundColor:'#fff', elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.1, shadowRadius:4 },
  segBtnText: { fontSize:12, fontWeight:'700' },

  archHeader:   { paddingHorizontal:18, paddingBottom:18, paddingTop:10 },
  searchBox:    { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:14, padding:11, elevation:4, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.12, shadowRadius:8 },
  catRail:      { backgroundColor:C.cream },
  catChip:      { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#fff', borderRadius:999, paddingHorizontal:14, paddingVertical:8, marginRight:8, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.08, shadowRadius:4 },
  catChipActive:{ backgroundColor:C.navy, elevation:4, shadowColor:C.navy, shadowOpacity:.4 },
  catChipText:  { fontSize:12, fontWeight:'700', color:C.navy },

  listingCard:  { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:16, padding:12, marginBottom:10, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.08, shadowRadius:8 },
  listingThumb: { width:68, height:68, borderRadius:14, alignItems:'center', justifyContent:'center', position:'relative' },
  digiTag:      { position:'absolute', top:4, left:4, backgroundColor:C.orange, borderRadius:999, paddingHorizontal:6, paddingVertical:2 },
  listingTitle: { fontSize:13, fontWeight:'700', color:C.text, lineHeight:18 },
  listingMeta:  { fontSize:11, color:C.gray, fontWeight:'600', marginTop:4 },
  listingPrice: { fontSize:14, fontWeight:'800', color:C.navy, marginTop:6 },
  favBtn:       { width:30, height:30, borderRadius:15, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', alignSelf:'flex-start', elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.1, shadowRadius:4 },

  detailGallery:{ height:220, alignItems:'center', justifyContent:'center' },
  backBtn:      { position:'absolute', top:16, left:16, width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,.92)', alignItems:'center', justifyContent:'center', elevation:4 },
  sellerCard:   { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:14, padding:12, marginTop:14, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.08, shadowRadius:8 },
  lockBox:      { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF8EC', borderWidth:1, borderColor:'#F4DEB0', borderRadius:12, padding:12, marginTop:4 },
  unlockBox:    { backgroundColor:'#F1FAF3', borderWidth:1, borderColor:'#C9E6D0', borderRadius:12, padding:14 },
  unlockContent:{ backgroundColor:'#fff', borderRadius:10, padding:12, marginTop:8 },
  buyBar:       { position:'absolute', bottom:0, left:0, right:0, backgroundColor:C.paper, borderTopWidth:1, borderTopColor:C.line, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },

  toggleRow:    { flexDirection:'row', backgroundColor:'#fff', marginBottom:14, borderRadius:14, padding:4, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.08, shadowRadius:6 },
  toggleBtn:    { flex:1, borderRadius:10, paddingVertical:10, alignItems:'center' },
  toggleBtnSel: { backgroundColor:C.navy },
  toggleBtnText:{ fontSize:12.5, fontWeight:'700', color:C.gray },

  profileHead:  { flexDirection:'row', alignItems:'center', padding:22, paddingTop:18 },
  walletCard:   { margin:16, marginTop:-16, backgroundColor:'#fff', borderRadius:16, padding:16, elevation:6, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:.12, shadowRadius:10 },
  tabRow:       { flexDirection:'row', marginHorizontal:16, marginBottom:6, gap:8 },
  tabBtn:       { flex:1, borderWidth:1, borderColor:C.line, backgroundColor:'#fff', paddingVertical:9, borderRadius:10, alignItems:'center' },
  tabBtnSel:    { backgroundColor:C.navy, borderColor:C.navy },
  tabBtnText:   { fontSize:11, fontWeight:'700', color:C.gray },
  rowCard:      { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:14, padding:10, marginHorizontal:16, marginBottom:8, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.06, shadowRadius:6 },
  smallThumb:   { width:42, height:42, borderRadius:11, alignItems:'center', justifyContent:'center' },
  statusPill:   { borderRadius:999, paddingHorizontal:8, paddingVertical:4 },
  deleteBtn:    { width:32, height:32, borderRadius:10, backgroundColor:'#FDEEEC', alignItems:'center', justifyContent:'center' },

  msgRow:     { flexDirection:'row', alignItems:'center', padding:14, borderBottomWidth:1, borderBottomColor:C.line },
  convHeader: { flexDirection:'row', alignItems:'center', padding:16 },
  bubble:     { maxWidth:'78%', borderRadius:14, paddingHorizontal:13, paddingVertical:9, elevation:1 },
  bubbleMe:   { backgroundColor:C.orange },
  bubbleThem: { backgroundColor:'#fff' },
  chatInput:  { flexDirection:'row', alignItems:'center', padding:12, backgroundColor:C.cream, borderTopWidth:1, borderTopColor:C.line },
  sendBtn:    { width:40, height:40, borderRadius:12, backgroundColor:C.navy, alignItems:'center', justifyContent:'center' },

  bottomNav:  { flexDirection:'row', alignItems:'center', justifyContent:'space-around', height:70, backgroundColor:'#fff', borderTopWidth:1, borderTopColor:C.line, paddingBottom:8 },
  navItem:    { alignItems:'center', flex:1 },
  fab:        { marginTop:-20 },
  fabInner:   { width:52, height:52, borderRadius:16, alignItems:'center', justifyContent:'center', elevation:8, shadowColor:C.orange, shadowOffset:{width:0,height:4}, shadowOpacity:.5, shadowRadius:10 },
  badge2:     { position:'absolute', top:-4, right:-6, backgroundColor:C.orange, borderRadius:999, width:16, height:16, alignItems:'center', justifyContent:'center' },
});
