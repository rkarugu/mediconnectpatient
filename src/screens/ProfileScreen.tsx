import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

const { width: SW } = Dimensions.get('window');
const TILE_W = (SW - 40 - 36) / 4;
const MC_LOGO = require('../../assets/mediconnect logo.png');
const IC = {
  consult: require('../../assets/DoctorConsultation.jpg'),
  labTests: require('../../assets/Healthcare.jpg'),
  ambulance: require('../../assets/Ambulance.jpg'),
  emergency: require('../../assets/Emergency.jpg'),
  appointment: require('../../assets/Appointment.jpg'),
  records: require('../../assets/MedicalRecords.jpg'),
  pharmacy: require('../../assets/Pharmacy.jpg'),
  nurse: require('../../assets/NurseServices.jpg'),
  hospital: require('../../assets/Hospital.jpg'),
  locum: require('../../assets/LocumStaffing.jpg'),
  search: require('../../assets/search.jpg'),
};
type IS = 'mci' | 'ion' | 'fa5';

const I = ({ n, s, sz, c }: { n: string; s: IS; sz: number; c: string }) => {
  if (s === 'fa5') return <FontAwesome5 name={n as any} size={sz} color={c} />;
  if (s === 'mci') return <MaterialCommunityIcons name={n as any} size={sz} color={c} />;
  return <Ionicons name={n as any} size={sz} color={c} />;
};

export default function ProfileScreen({ navigation }: any) {
  const ins = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: logout },
  ]);
  const fullName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.name || 'Patient';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const svc = [
    { ic: 'stethoscope', is: 'fa5' as IS, lb: 'Consult', g: ['#60A5FA','#2563EB'] as [string,string], onPress: () => navigation.navigate('Home') },
    { ic: 'flask', is: 'ion' as IS, lb: 'Lab Tests', g: ['#C084FC','#7C3AED'] as [string,string], onPress: () => navigation.navigate('LabRequests') },
    { ic: 'ambulance', is: 'fa5' as IS, lb: 'Ambulance', g: ['#FB7185','#E11D48'] as [string,string], onPress: () => {} },
    { ic: 'hospital-box', is: 'mci' as IS, lb: 'Emergency', g: ['#FBBF24','#D97706'] as [string,string], onPress: () => {} },
  ];

  const acct = [
    { ic: 'person-outline', is: 'ion' as IS, lb: 'Edit Profile', sub: 'Personal information', g: ['#60A5FA','#2563EB'] as [string,string], onPress: () => {} },
    { ic: 'wallet-outline', is: 'ion' as IS, lb: 'My Wallet', sub: 'Balance & transactions', g: ['#34D399','#059669'] as [string,string], onPress: () => navigation.navigate('Wallet') },
    { ic: 'credit-card-outline', is: 'mci' as IS, lb: 'Payment Methods', sub: 'M-Pesa, cards & more', g: ['#C084FC','#7C3AED'] as [string,string], onPress: () => {} },
    { ic: 'clipboard-text-clock-outline', is: 'mci' as IS, lb: 'Request History', sub: 'Past consultations & labs', g: ['#FBBF24','#D97706'] as [string,string], onPress: () => navigation.navigate('Tracking') },
  ];

  const hlth = [
    { ic: 'flask-outline', is: 'ion' as IS, lb: 'Lab Results', sub: 'View test results & reports', g: ['#C084FC','#7C3AED'] as [string,string], onPress: () => navigation.navigate('LabResults') },
    { ic: 'pill', is: 'mci' as IS, lb: 'Prescriptions', sub: 'Medication & prescriptions', g: ['#34D399','#059669'] as [string,string], onPress: () => {} },
    { ic: 'file-document-outline', is: 'mci' as IS, lb: 'Medical Records', sub: 'Health history & documents', g: ['#60A5FA','#2563EB'] as [string,string], onPress: () => {} },
  ];

  const supp = [
    { ic: 'notifications-outline', is: 'ion' as IS, lb: 'Notifications', sub: 'Alerts & reminders', g: ['#FB7185','#E11D48'] as [string,string], onPress: () => {} },
    { ic: 'headset', is: 'mci' as IS, lb: 'Help & Support', sub: '24/7 customer care', g: ['#22D3EE','#0891B2'] as [string,string], onPress: () => {} },
    { ic: 'shield-check-outline', is: 'mci' as IS, lb: 'Privacy & Security', sub: 'Data & account safety', g: ['#34D399','#059669'] as [string,string], onPress: () => {} },
    { ic: 'information-circle-outline', is: 'ion' as IS, lb: 'About MediConnect', sub: 'Version & legal info', g: ['#818CF8','#4F46E5'] as [string,string], onPress: () => {} },
  ];

  type MI = typeof acct[0];
  const Sec = ({ title, items }: { title: string; items: MI[] }) => (
    <View style={s.secW}>
      <Text style={s.secT}>{title}</Text>
      <View style={s.secC}>
        {items.map((it, i) => (
          <TouchableOpacity key={i} style={[s.row, i < items.length - 1 && s.rowB]} onPress={it.onPress} activeOpacity={0.6}>
            <View style={s.rowIW}>
              <LinearGradient colors={it.g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.rowIG}>
                <I n={it.ic} s={it.is} sz={18} c="#fff" />
              </LinearGradient>
            </View>
            <View style={s.rowTx}>
              <Text style={s.rowLb}>{it.lb}</Text>
              <Text style={s.rowSb}>{it.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#1A6FAE','#2B7BB9','#3A9BD5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hdr, { paddingTop: ins.top + 16 }]}>
          <View style={s.topB}>
            <Image source={MC_LOGO} style={s.logo} resizeMode="contain" />
            <TouchableOpacity style={s.setB} onPress={() => {}} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
          <View style={s.pRow}>
            <View style={s.avW}>
              <LinearGradient colors={['#FFFFFF','#E8F4FD']} style={s.avC}>
                <Text style={s.avI}>{initials}</Text>
              </LinearGradient>
              <View style={s.dot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nm}>{fullName}</Text>
              <View style={s.iR}><Ionicons name="mail-outline" size={13} color="rgba(255,255,255,0.75)" /><Text style={s.iT}>{user?.email || 'No email'}</Text></View>
              <View style={s.iR}><Ionicons name="call-outline" size={13} color="rgba(255,255,255,0.75)" /><Text style={s.iT}>{user?.phone || 'No phone'}</Text></View>
            </View>
          </View>
        </LinearGradient>

        <View style={s.stB}>
          <TouchableOpacity style={s.stI} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.7}>
            <Image source={IC.pharmacy} style={s.stImg} resizeMode="contain" />
            <Text style={s.stT}>Wallet</Text>
          </TouchableOpacity>
          <View style={s.stD} />
          <TouchableOpacity style={s.stI} onPress={() => navigation.navigate('Tracking')} activeOpacity={0.7}>
            <Image source={IC.appointment} style={s.stImg} resizeMode="contain" />
            <Text style={s.stT}>History</Text>
          </TouchableOpacity>
          <View style={s.stD} />
          <TouchableOpacity style={s.stI} onPress={() => navigation.navigate('LabResults')} activeOpacity={0.7}>
            <Image source={IC.labTests} style={s.stImg} resizeMode="contain" />
            <Text style={s.stT}>Lab Results</Text>
          </TouchableOpacity>
        </View>

        <View style={s.svcW}>
          <Text style={s.secT}>Quick Services</Text>
          <View style={s.svcG}>
            {svc.map((v, i) => (
              <TouchableOpacity key={i} style={s.svcTl} onPress={v.onPress} activeOpacity={0.7}>
                <View style={s.svcSh}>
                  <LinearGradient colors={v.g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.svcIc}>
                    <I n={v.ic} s={v.is} sz={26} c="#fff" />
                  </LinearGradient>
                </View>
                <Text style={s.svcLb} numberOfLines={1}>{v.lb}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Sec title="Account & Payments" items={acct} />
        <Sec title="Health & Records" items={hlth} />
        <Sec title="Support & Settings" items={supp} />

        <TouchableOpacity style={s.so} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={s.soT}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={s.ver}>MediConnect v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const SH1 = Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 3 } }) as any;
const SH2 = Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14 }, android: { elevation: 8 } }) as any;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F6F9' },
  hdr: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 24 },
  topB: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  setB: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  pRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  avW: { position: 'relative', marginRight: 16 },
  avC: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avI: { fontSize: 26, fontWeight: '700', color: '#1A6FAE', letterSpacing: 1 },
  dot: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#2ECC71', borderWidth: 2.5, borderColor: '#2B7BB9' },
  nm: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  iR: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  iT: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginLeft: 6 },

  stB: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -20, borderRadius: 16, paddingVertical: 14, zIndex: 10, ...SH2 },
  stI: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stImg: { width: 28, height: 28 },
  stT: { fontSize: 12, fontWeight: '600', color: '#374151' },
  stD: { width: 1, height: 20, backgroundColor: '#E5E7EB' },

  svcW: { paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  svcG: { flexDirection: 'row', justifyContent: 'space-between' },
  svcTl: { width: TILE_W, alignItems: 'center' },
  svcSh: { marginBottom: 10, borderRadius: 22, ...SH2 },
  svcIc: { width: TILE_W - 6, height: TILE_W - 6, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  svcLb: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },

  secW: { paddingHorizontal: 20, marginTop: 20 },
  secT: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12, letterSpacing: 0.3 },
  secC: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', ...SH1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowB: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F2F5' },
  rowIW: { marginRight: 14, borderRadius: 12, ...SH1 },
  rowIG: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowTx: { flex: 1 },
  rowLb: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  rowSb: { fontSize: 12, color: '#9CA3AF' },

  so: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28, marginHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 16, gap: 8, borderWidth: 1, borderColor: '#FEE2E2', ...SH1 },
  soT: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  ver: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 },
});
