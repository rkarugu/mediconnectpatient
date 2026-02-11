import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, type Dependant } from '../store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { profileService } from '../services/profileService';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'nextOfKin' | 'dependants'>('personal');
  const isLockedValue = (value?: string | null) => !!value && String(value).trim().length > 0;
  
  const [personalInfo, setPersonalInfo] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    blood_type: user?.blood_type || '',
    allergies: user?.allergies || '',
    medical_conditions: user?.medical_conditions || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
  });

  const [nextOfKin, setNextOfKin] = useState({
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
    emergency_contact_relationship: user?.emergency_contact_relationship || '',
  });

  useEffect(() => {
    if (!user) return;
    setPersonalInfo((prev) => ({
      ...prev,
      first_name: user.first_name || prev.first_name,
      last_name: user.last_name || prev.last_name,
      email: user.email || prev.email,
      phone: user.phone || prev.phone,
      date_of_birth: user.date_of_birth || prev.date_of_birth,
      gender: user.gender || prev.gender,
      blood_type: user.blood_type || prev.blood_type,
      allergies: user.allergies || prev.allergies,
      medical_conditions: user.medical_conditions || prev.medical_conditions,
      address: user.address || prev.address,
      city: user.city || prev.city,
      state: user.state || prev.state,
    }));
    setNextOfKin((prev) => ({
      ...prev,
      emergency_contact_name: user.emergency_contact_name || prev.emergency_contact_name,
      emergency_contact_phone: user.emergency_contact_phone || prev.emergency_contact_phone,
      emergency_contact_relationship: user.emergency_contact_relationship || prev.emergency_contact_relationship,
    }));
  }, [user?.id, user?.updated_at, user?.email]);

  const personalLocks = {
    first_name: isLockedValue(user?.first_name),
    last_name: isLockedValue(user?.last_name),
    email: isLockedValue(user?.email),
    phone: isLockedValue(user?.phone),
    date_of_birth: isLockedValue(user?.date_of_birth),
    gender: isLockedValue(user?.gender),
    blood_type: isLockedValue(user?.blood_type),
    allergies: isLockedValue(user?.allergies),
    medical_conditions: isLockedValue(user?.medical_conditions),
    address: isLockedValue(user?.address),
    city: isLockedValue(user?.city),
    state: isLockedValue(user?.state),
  };
  const hasPersonalEditable = Object.values(personalLocks).some((locked) => !locked);
  const hasPersonalLocked = Object.values(personalLocks).some(Boolean);

  const nextOfKinLocks = {
    emergency_contact_name: isLockedValue(user?.emergency_contact_name),
    emergency_contact_phone: isLockedValue(user?.emergency_contact_phone),
    emergency_contact_relationship: isLockedValue(user?.emergency_contact_relationship),
  };
  const hasNextOfKinEditable = Object.values(nextOfKinLocks).some((locked) => !locked);
  const hasNextOfKinLocked = Object.values(nextOfKinLocks).some(Boolean);

  const handleRequestUpdate = (section: string) => {
    Alert.alert(
      'Request Update',
      `Your ${section} details are locked after saving. Please contact support to request an update.`
    );
  };

  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [dependantsDirty, setDependantsDirty] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerFor, setDatePickerFor] = useState<'personal' | 'dependant'>('personal');
  const [selectedDependantIndex, setSelectedDependantIndex] = useState<number | null>(null);

  const loadDependants = useCallback(async (silent = true) => {
    try {
      const response = await profileService.getDependants();
      if (response.success && response.dependants) {
        setDependants(response.dependants);
        setDependantsDirty(false);
      }
    } catch (error) {
      if (!silent) {
        console.error('Failed to load dependants:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dependants' && !dependantsDirty) {
      loadDependants(true);
    }
  }, [activeTab, dependantsDirty, loadDependants]);

  useRealtimeRefresh(() => {
    if (activeTab === 'dependants' && !dependantsDirty) {
      return loadDependants(true);
    }
  }, {
    intervalMs: 30000,
    enabled: activeTab === 'dependants' && !dependantsDirty,
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (datePickerFor === 'personal') {
        setPersonalInfo({ ...personalInfo, date_of_birth: dateStr });
      } else if (selectedDependantIndex !== null) {
        const updated = [...dependants];
        updated[selectedDependantIndex].date_of_birth = dateStr;
        setDependants(updated);
        setDependantsDirty(true);
      }
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!hasPersonalEditable) {
      handleRequestUpdate('profile');
      return;
    }
    if (!personalLocks.first_name && !personalInfo.first_name) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    if (!personalLocks.last_name && !personalInfo.last_name) {
      Alert.alert('Error', 'Last name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(!personalLocks.first_name ? { first_name: personalInfo.first_name } : {}),
        ...(!personalLocks.last_name ? { last_name: personalInfo.last_name } : {}),
        ...(!personalLocks.email ? { email: personalInfo.email } : {}),
        ...(!personalLocks.phone ? { phone: personalInfo.phone } : {}),
        ...(!personalLocks.date_of_birth ? { date_of_birth: personalInfo.date_of_birth } : {}),
        ...(!personalLocks.gender ? { gender: personalInfo.gender } : {}),
        ...(!personalLocks.blood_type ? { blood_type: personalInfo.blood_type } : {}),
        ...(!personalLocks.allergies ? { allergies: personalInfo.allergies } : {}),
        ...(!personalLocks.medical_conditions ? { medical_conditions: personalInfo.medical_conditions } : {}),
        ...(!personalLocks.address ? { address: personalInfo.address } : {}),
        ...(!personalLocks.city ? { city: personalInfo.city } : {}),
        ...(!personalLocks.state ? { state: personalInfo.state } : {}),
      };
      const response = await profileService.updateProfile(payload);
      if (response.success && response.user) {
        await updateUser(response.user);
        Alert.alert('Success', 'Personal information updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('❌ Save personal info error:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNextOfKin = async () => {
    if (!hasNextOfKinEditable) {
      handleRequestUpdate('next of kin');
      return;
    }
    if (!nextOfKinLocks.emergency_contact_name && !nextOfKin.emergency_contact_name) {
      Alert.alert('Error', 'Next of kin name is required');
      return;
    }
    if (!nextOfKinLocks.emergency_contact_phone && !nextOfKin.emergency_contact_phone) {
      Alert.alert('Error', 'Next of kin phone is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(!nextOfKinLocks.emergency_contact_name ? { emergency_contact_name: nextOfKin.emergency_contact_name } : {}),
        ...(!nextOfKinLocks.emergency_contact_phone ? { emergency_contact_phone: nextOfKin.emergency_contact_phone } : {}),
        ...(!nextOfKinLocks.emergency_contact_relationship ? { emergency_contact_relationship: nextOfKin.emergency_contact_relationship } : {}),
      };
      const response = await profileService.updateNextOfKin(payload);
      if (response.success && response.user) {
        await updateUser(response.user);
        Alert.alert('Success', 'Next of kin information updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update next of kin');
      }
    } catch (error: any) {
      console.error('❌ Save next of kin error:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to update next of kin';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDependant = () => {
    setDependantsDirty(true);
    setDependants([
      ...dependants,
      {
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        relationship: '',
        blood_type: '',
        allergies: '',
        medical_conditions: '',
      },
    ]);
  };

  const handleRemoveDependant = (index: number) => {
    Alert.alert('Remove Dependant', 'Are you sure you want to remove this dependant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = dependants.filter((_, i) => i !== index);
          setDependants(updated);
          setDependantsDirty(true);
        },
      },
    ]);
  };

  const handleSaveDependants = async () => {
    const invalidDependants = dependants.filter(
      (d) => !d.first_name || !d.last_name || !d.date_of_birth || !d.gender || !d.relationship
    );

    if (invalidDependants.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields for each dependant');
      return;
    }

    setLoading(true);
    try {
      const response = await profileService.saveDependants(dependants);
      if (response.success) {
        Alert.alert('Success', 'Dependants saved successfully');
        if (response.dependants) {
          setDependants(response.dependants);
        }
        setDependantsDirty(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to save dependants');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to save dependants';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = 'default',
    multiline = false,
    editable = true
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
        selectTextOnFocus={editable}
      />
    </View>
  );

  const renderPicker = (
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void,
    editable = true
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.pickerOption,
              value === option && styles.pickerOptionActive,
              !editable && styles.pickerOptionDisabled,
            ]}
            onPress={() => editable && onSelect(option)}
            disabled={!editable}
          >
            <Text style={[styles.pickerText, value === option && styles.pickerTextActive, !editable && styles.pickerTextDisabled]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPersonalInfoTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        {hasPersonalLocked && (
          <View style={styles.lockedNotice}>
            <Ionicons name="lock-closed" size={16} color={COLORS.warning} />
            <Text style={styles.lockedNoticeText}>
              Saved fields are read-only. Request an update to change them.
            </Text>
          </View>
        )}
        {renderInput('First Name *', personalInfo.first_name, (text) => setPersonalInfo({ ...personalInfo, first_name: text }), 'Enter first name', 'default', false, !personalLocks.first_name)}
        {renderInput('Last Name *', personalInfo.last_name, (text) => setPersonalInfo({ ...personalInfo, last_name: text }), 'Enter last name', 'default', false, !personalLocks.last_name)}
        {renderInput('Email', personalInfo.email, (text) => setPersonalInfo({ ...personalInfo, email: text }), 'Enter email', 'email-address', false, !personalLocks.email)}
        {renderInput('Phone', personalInfo.phone, (text) => setPersonalInfo({ ...personalInfo, phone: text }), 'Enter phone number', 'phone-pad', false, !personalLocks.phone)}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={[styles.dateInput, personalLocks.date_of_birth && styles.inputDisabled]}
            onPress={() => {
              if (personalLocks.date_of_birth) return;
              setDatePickerFor('personal');
              setShowDatePicker(true);
            }}
            disabled={personalLocks.date_of_birth}
          >
            <Text style={personalInfo.date_of_birth ? styles.dateText : styles.datePlaceholder}>
              {personalInfo.date_of_birth || 'Select date of birth'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {renderPicker('Gender', personalInfo.gender, ['Male', 'Female', 'Other'], (value) => setPersonalInfo({ ...personalInfo, gender: value }), !personalLocks.gender)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        {renderPicker('Blood Type', personalInfo.blood_type, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], (value) => setPersonalInfo({ ...personalInfo, blood_type: value }), !personalLocks.blood_type)}
        {renderInput('Allergies', personalInfo.allergies, (text) => setPersonalInfo({ ...personalInfo, allergies: text }), 'List any allergies', 'default', true, !personalLocks.allergies)}
        {renderInput('Medical Conditions', personalInfo.medical_conditions, (text) => setPersonalInfo({ ...personalInfo, medical_conditions: text }), 'List any medical conditions', 'default', true, !personalLocks.medical_conditions)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Information</Text>
        {renderInput('Address', personalInfo.address, (text) => setPersonalInfo({ ...personalInfo, address: text }), 'Enter street address', 'default', false, !personalLocks.address)}
        {renderInput('City', personalInfo.city, (text) => setPersonalInfo({ ...personalInfo, city: text }), 'Enter city', 'default', false, !personalLocks.city)}
        {renderInput('State/County', personalInfo.state, (text) => setPersonalInfo({ ...personalInfo, state: text }), 'Enter state or county', 'default', false, !personalLocks.state)}
      </View>

      {hasPersonalEditable ? (
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSavePersonalInfo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Personal Information</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.requestButton} onPress={() => handleRequestUpdate('profile')}>
          <Text style={styles.requestButtonText}>Request Update</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderNextOfKinTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <Text style={styles.sectionDescription}>
          This person will be contacted in case of an emergency
        </Text>
        {hasNextOfKinLocked && (
          <View style={styles.lockedNotice}>
            <Ionicons name="lock-closed" size={16} color={COLORS.warning} />
            <Text style={styles.lockedNoticeText}>
              Saved fields are read-only. Request an update to change them.
            </Text>
          </View>
        )}
        
        {renderInput('Full Name *', nextOfKin.emergency_contact_name, (text) => setNextOfKin({ ...nextOfKin, emergency_contact_name: text }), 'Enter full name', 'default', false, !nextOfKinLocks.emergency_contact_name)}
        {renderInput('Phone Number *', nextOfKin.emergency_contact_phone, (text) => setNextOfKin({ ...nextOfKin, emergency_contact_phone: text }), 'Enter phone number', 'phone-pad', false, !nextOfKinLocks.emergency_contact_phone)}
        {renderInput('Relationship', nextOfKin.emergency_contact_relationship, (text) => setNextOfKin({ ...nextOfKin, emergency_contact_relationship: text }), 'e.g., Spouse, Parent, Sibling', 'default', false, !nextOfKinLocks.emergency_contact_relationship)}
      </View>

      {hasNextOfKinEditable ? (
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveNextOfKin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Next of Kin</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.requestButton} onPress={() => handleRequestUpdate('next of kin')}>
          <Text style={styles.requestButtonText}>Request Update</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderDependantsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dependants</Text>
        <Text style={styles.sectionDescription}>
          Add family members (children, elderly parents) who can be treated using your account
        </Text>
        {dependants.some((d) => !!d.id) && (
          <View style={styles.lockedNotice}>
            <Ionicons name="lock-closed" size={16} color={COLORS.warning} />
            <Text style={styles.lockedNoticeText}>
              Saved dependants are read-only. Request an update to change them.
            </Text>
          </View>
        )}

        {dependants.map((dependant, index) => {
          const isDependantLocked = !!dependant.id;
          return (
            <View key={index} style={styles.dependantCard}>
            <View style={styles.dependantHeader}>
              <Text style={styles.dependantTitle}>Dependant {index + 1}</Text>
              <TouchableOpacity onPress={() => !isDependantLocked && handleRemoveDependant(index)} disabled={isDependantLocked} style={isDependantLocked && styles.iconDisabled}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            {renderInput(
              'First Name *',
              dependant.first_name,
              (text) => {
                const updated = [...dependants];
                updated[index].first_name = text;
                setDependants(updated);
                setDependantsDirty(true);
              },
              'Enter first name',
              'default',
              false,
              !isDependantLocked
            )}

            {renderInput(
              'Last Name *',
              dependant.last_name,
              (text) => {
                const updated = [...dependants];
                updated[index].last_name = text;
                setDependants(updated);
                setDependantsDirty(true);
              },
              'Enter last name',
              'default',
              false,
              !isDependantLocked
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={[styles.dateInput, isDependantLocked && styles.inputDisabled]}
                onPress={() => {
                  if (isDependantLocked) return;
                  setDatePickerFor('dependant');
                  setSelectedDependantIndex(index);
                  setShowDatePicker(true);
                }}
                disabled={isDependantLocked}
              >
                <Text style={dependant.date_of_birth ? styles.dateText : styles.datePlaceholder}>
                  {dependant.date_of_birth || 'Select date of birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {renderPicker(
              'Gender *',
              dependant.gender,
              ['Male', 'Female', 'Other'],
              (value) => {
                const updated = [...dependants];
                updated[index].gender = value;
                setDependants(updated);
                setDependantsDirty(true);
              },
              !isDependantLocked
            )}

            {renderInput(
              'Relationship *',
              dependant.relationship,
              (text) => {
                const updated = [...dependants];
                updated[index].relationship = text;
                setDependants(updated);
                setDependantsDirty(true);
              },
              'e.g., Son, Daughter, Parent',
              'default',
              false,
              !isDependantLocked
            )}

            {renderPicker(
              'Blood Type',
              dependant.blood_type || '',
              ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
              (value) => {
                const updated = [...dependants];
                updated[index].blood_type = value;
                setDependants(updated);
                setDependantsDirty(true);
              },
              !isDependantLocked
            )}

            {renderInput(
              'Allergies',
              dependant.allergies || '',
              (text) => {
                const updated = [...dependants];
                updated[index].allergies = text;
                setDependants(updated);
                setDependantsDirty(true);
              },
              'List any allergies',
              'default',
              true,
              !isDependantLocked
            )}

            {renderInput(
              'Medical Conditions',
              dependant.medical_conditions || '',
              (text) => {
                const updated = [...dependants];
                updated[index].medical_conditions = text;
                setDependants(updated);
                setDependantsDirty(true);
              },
              'List any medical conditions',
              'default',
              true,
              !isDependantLocked
            )}
          </View>
          );
        })}

        <TouchableOpacity style={styles.addButton} onPress={handleAddDependant}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add Dependant</Text>
        </TouchableOpacity>
      </View>

      {dependants.length > 0 && (
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveDependants}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save All Dependants</Text>
          )}
        </TouchableOpacity>
      )}
      {dependants.some((d) => !!d.id) && (
        <TouchableOpacity style={styles.requestButton} onPress={() => handleRequestUpdate('dependant')}>
          <Text style={styles.requestButtonText}>Request Update</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
          onPress={() => setActiveTab('personal')}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={activeTab === 'personal' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
            Personal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'nextOfKin' && styles.tabActive]}
          onPress={() => setActiveTab('nextOfKin')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'nextOfKin' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'nextOfKin' && styles.tabTextActive]}>
            Next of Kin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'dependants' && styles.tabActive]}
          onPress={() => setActiveTab('dependants')}
        >
          <Ionicons
            name="people-circle-outline"
            size={20}
            color={activeTab === 'dependants' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'dependants' && styles.tabTextActive]}>
            Dependants
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'personal' && renderPersonalInfoTab()}
        {activeTab === 'nextOfKin' && renderNextOfKinTab()}
        {activeTab === 'dependants' && renderDependantsTab()}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: COLORS.backgroundDark,
    color: COLORS.textSecondary,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pickerOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerOptionDisabled: {
    backgroundColor: COLORS.backgroundDark,
  },
  pickerText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  pickerTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  pickerTextDisabled: {
    color: COLORS.textSecondary,
  },
  iconDisabled: {
    opacity: 0.4,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  lockedNoticeText: {
    fontSize: 13,
    color: '#B45309',
    flex: 1,
  },
  dependantCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dependantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dependantTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  requestButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  requestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.warning,
  },
});
