import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAxios } from '../../customHooks/useAxios';
import { clearTokens, getAccessToken } from '../../services/authService';
import { ApiPath } from '../../constant/ApiUrl';
import { formatDate } from '../../constant/constants';


const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { get } = useAxios();

  useEffect(() => {
    fetchUserProfile();

    setInterval(()=>{
      fetchUserProfile()
    },25000)
  }, []);
  const fetchUserProfile = async () => {
    try {
      const response = await get(ApiPath.GetProfileDetail);
      setUserData(response.data?.user);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure?',
      [
        { text: 'Cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await clearTokens();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Icon name="logout" size={24} color="#ff3b30" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.cardItem}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{userData?.name || 'N/A'}</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.cardItem}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userData?.email || 'N/A'}</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.cardItem}>
          <Text style={styles.label}>Mobile</Text>
          <Text style={styles.value}>{userData?.phone || userData?.mobile || 'N/A'}</Text>
        </View>
        <View style={styles.separator} />

        <View style={styles.cardItem}>
          <Text style={styles.label}>Created at</Text>
          <Text style={styles.value}>{formatDate(userData?.createdAt) || 'N/A'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardItem: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
});

export default HomeScreen;