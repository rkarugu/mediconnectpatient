import React from 'react';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

import { Button, Card } from '../components';

import { useAuthStore } from '../store/authStore';



export default function ProfileScreen({ navigation }: any) {

  const insets = useSafeAreaInsets();

  const { user, logout } = useAuthStore();



  const handleLogout = () => {

    Alert.alert(

      'Logout',

      'Are you sure you want to logout?',

      [

        { text: 'Cancel', style: 'cancel' },

        { text: 'Logout', style: 'destructive', onPress: logout },

      ]

    );

  };



  const menuItems = [

    { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },

    { icon: 'card-outline', label: 'Payment Methods', onPress: () => {} },

    { icon: 'time-outline', label: 'Request History', onPress: () => navigation.navigate('Tracking') },

    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },

    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },

    { icon: 'information-circle-outline', label: 'About', onPress: () => {} },

  ];



  return (

    <View style={styles.container}>

      {/* Header */}

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>

        <Image 

          source={require('../../assets/logo.png')} 

          style={styles.logo}

          resizeMode="contain"

        />

        <Text style={styles.headerTitle}>Profile</Text>

      </View>



      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}

        <Card style={styles.profileCard}>

          <View style={styles.avatarContainer}>

            <View style={styles.avatar}>

              <Ionicons name="person" size={40} color={COLORS.white} />

            </View>

          </View>

          <Text style={styles.userName}>

            {user?.name || 'Patient'}

          </Text>

          <Text style={styles.userEmail}>{user?.email}</Text>

          <Text style={styles.userPhone}>{user?.phone || 'No phone number'}</Text>

        </Card>



        {/* Menu Items */}

        <Card style={styles.menuCard}>

          {menuItems.map((item, index) => (

            <TouchableOpacity

              key={index}

              style={[

                styles.menuItem,

                index < menuItems.length - 1 && styles.menuItemBorder,

              ]}

              onPress={item.onPress}

            >

              <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />

              <Text style={styles.menuItemLabel}>{item.label}</Text>

              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />

            </TouchableOpacity>

          ))}

        </Card>



        {/* Logout Button */}

        <Button

          title="Logout"

          onPress={handleLogout}

          variant="outline"

          style={styles.logoutButton}

        />



        <View style={{ height: 40 }} />

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: COLORS.background,

  },

  header: {

    backgroundColor: COLORS.white,

    paddingHorizontal: SPACING.base,

    paddingBottom: SPACING.base,

    ...SHADOWS.md,

  },

  logo: {

    width: 150,

    height: 40,

    marginBottom: SPACING.sm,

  },

  headerTitle: {

    fontSize: TYPOGRAPHY.fontSize['2xl'],

    fontWeight: TYPOGRAPHY.fontWeight.bold,

    color: COLORS.textPrimary,

  },

  content: {

    flex: 1,

    padding: SPACING.base,

  },

  profileCard: {

    alignItems: 'center',

    padding: SPACING.xl,

    marginBottom: SPACING.base,

  },

  avatarContainer: {

    marginBottom: SPACING.base,

  },

  avatar: {

    width: 80,

    height: 80,

    borderRadius: 40,

    backgroundColor: COLORS.primary,

    justifyContent: 'center',

    alignItems: 'center',

  },

  userName: {

    fontSize: TYPOGRAPHY.fontSize.xl,

    fontWeight: TYPOGRAPHY.fontWeight.bold,

    color: COLORS.textPrimary,

    marginBottom: SPACING.xs,

  },

  userEmail: {

    fontSize: TYPOGRAPHY.fontSize.base,

    color: COLORS.textSecondary,

    marginBottom: SPACING.xs / 2,

  },

  userPhone: {

    fontSize: TYPOGRAPHY.fontSize.sm,

    color: COLORS.textTertiary,

  },

  menuCard: {

    padding: 0,

    marginBottom: SPACING.base,

  },

  menuItem: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: SPACING.base,

  },

  menuItemBorder: {

    borderBottomWidth: 1,

    borderBottomColor: COLORS.border,

  },

  menuItemLabel: {

    flex: 1,

    fontSize: TYPOGRAPHY.fontSize.base,

    color: COLORS.textPrimary,

    marginLeft: SPACING.md,

  },

  logoutButton: {

    borderColor: COLORS.error,

  },

});

