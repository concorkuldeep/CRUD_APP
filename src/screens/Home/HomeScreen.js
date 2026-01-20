import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAxios } from '../../customHooks/useAxios';
import { clearTokens } from '../../services/authService';
import { ApiPath } from '../../constant/ApiUrl';
import { formatDate } from '../../constant/constants';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'low',
  });
  const [taskErrors, setTaskErrors] = useState({});
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Animation values
  const flipAnimation = useRef(new Animated.Value(0))?.current;
  const scaleAnimation = useRef(new Animated.Value(1))?.current;

  const { get, post } = useAxios();

  useEffect(() => {
    fetchUserProfile();
    fetchTasks();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await get(ApiPath.GetProfileDetail);
      setUserData(response.data?.user);
    } catch (error) {
      console.error('Profile error:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await get(ApiPath.GetTasks);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Tasks error:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
    fetchUserProfile();
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

  // =============== CARD FLIP ANIMATION ===============
  const flipCard = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnimation, {
        toValue: isCardFlipped ? 0 : 180,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scaleAnimation.setValue(1);
      setIsCardFlipped(!isCardFlipped);
    });
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [
      { rotateY: frontInterpolate },
      { scale: scaleAnimation },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      { rotateY: backInterpolate },
      { scale: scaleAnimation },
    ],
  };

  // =============== TASK FUNCTIONS ===============
  const validateTask = () => {
    let valid = true;
    let errors = {};

    if (!taskForm.title.trim()) {
      errors.title = 'Title is required';
      valid = false;
    } else if (taskForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
      valid = false;
    }

    if (!taskForm.description.trim()) {
      errors.description = 'Description is required';
      valid = false;
    }

    setTaskErrors(errors);
    return valid;
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'pending',
      priority: 'low',
    });
    setTaskErrors({});
    setSelectedTask(null);
  };

  const openAddTaskModal = () => {
    resetTaskForm();
    setTaskModalVisible(true);
  };

  const openEditTaskModal = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority || 'low',
    });
    setTaskModalVisible(true);
  };

  const handleCreateTask = async () => {
    if (!validateTask()) return;

    try {
      setLoading(true);
      const response = await post(ApiPath.CreateTask, taskForm);
      if (response.success) {
        fetchTasks()
        Alert.alert('Success', 'Task created successfully');
        setTaskModalVisible(false);
        resetTaskForm();
      }
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!validateTask() || !selectedTask) return;

    try {
      setLoading(true);
      let bodyJson = {
        ...taskForm,
        updatedAt: new Date(),
        taskId: selectedTask?._id,
      }
      const response = await post(ApiPath.updateTask, bodyJson);

      if (response.success) {
        fetchTasks()
        Alert.alert('Success', 'Task updated successfully');
        setTaskModalVisible(false);
        resetTaskForm();
      }
    } catch (error) {
      console.error('Update task error:', error);
      Alert.alert('Error', error?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const bodyJson = {
              taskId: taskId
            }
            try {
              setLoading(true);
              await post(ApiPath.DeleteTask, bodyJson)
              fetchTasks()
              Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              console.error('Delete task error:', error);
              Alert.alert('Error', 'Failed to delete task');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      let bodyJson = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: newStatus,
        updatedAt: new Date(),
        taskId: task?._id,
      }
      const response = await post(ApiPath.updateTask, bodyJson);

      if (response.success) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      Alert.alert('Error', error.message || 'Failed to update task status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? '#4caf50' : '#ff9800';
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          onPress={() => toggleTaskStatus(item)}
          style={styles.statusButton}
        >
          <Icon
            name={item?.status === 'completed' ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={getStatusColor(item?.status)}
          />
        </TouchableOpacity>

        <View style={styles.taskInfo}>
          <Text style={[
            styles.taskTitle,
            item?.status === 'completed' && styles.completedText
          ]}>
            {item?.title}
          </Text>
          <Text style={styles.taskDate}>
            {formatDate(item?.createdAt)}
          </Text>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => openEditTaskModal(item)}
            style={styles.actionButton}
          >
            <Icon name="pencil" size={20} color="#2196F3" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteTask(item?._id)}
            style={styles.actionButton}
          >
            <Icon name="delete" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[
        styles.taskDescription,
        item?.status === 'completed' && styles.completedText
      ]}>
        {item?.description}
      </Text>

      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item?.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item?.priority) }]}>
            {item?.priority?.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item?.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item?.status) }]}>
            {item?.status?.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading && !userData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userData?.name || 'User'}</Text>
          <Text style={styles.subtitle}>{tasks.length} tasks</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={openAddTaskModal}
            style={styles.addButton}
          >
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
      >
        {/* 3D Flip Profile Card */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={flipCard}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[styles.card, styles.cardFront, frontAnimatedStyle]}
            >
              {/* Front of Card - Profile Info */}
              <View style={styles.cardGradient} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Icon name="account-circle" size={40} color="#fff" />
                  <View style={styles.userInfo}>
                    <Text style={styles.cardName}>{userData?.name || 'User'}</Text>
                    <Text style={styles.cardRole}>{userData?.role || 'Member'}</Text>
                  </View>
                  <View style={styles.flipHint}>
                    <Icon name="rotate-3d" size={20} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.flipHintText}>Tap to flip</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Icon name="email" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {userData?.email || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="phone" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.detailText}>
                      {userData?.phone || userData?.mobile || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="calendar" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.detailText}>
                      Joined {formatDate(userData?.createdAt) || 'N/A'}
                    </Text>
                  </View>
                </View>


              </View>

              {/* Decorative elements */}
              <View style={styles.cardPattern}>
                <View style={styles.patternCircle1} />
                <View style={styles.patternCircle2} />
                <View style={styles.patternCircle3} />
              </View>
            </Animated.View>

            <Animated.View
              style={[styles.card, styles.cardBack, backAnimatedStyle]}
            >
              {/* Back of Card - Additional Info */}
              <View style={styles.cardGradientBack} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderBack}>
                  <Text style={styles.backTitle}>User Statistics</Text>
                  <Icon name="chart-line" size={40} color="#fff" />
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{tasks.length}</Text>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {tasks.filter(t => t.status === 'completed').length}
                    </Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {tasks.filter(t => t.status === 'pending').length}
                    </Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                </View>

                <View style={styles.cardDividerBack} />

                <View style={styles.additionalInfo}>
                  <View style={styles.infoRow}>
                    <Icon name="clock-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.infoText}>
                      Last Login: Today
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="shield-check" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.infoText}>
                      Account: Verified
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="star" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.infoText}>
                      Member Since: {new Date(userData?.createdAt).getFullYear() || '2024'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooterBack}>
                  <Text style={styles.backHint}>Flip to front</Text>
                  <Text style={styles.cardIdBack}>ID: {userData?._id?.substring(0, 8) || 'USER'}</Text>
                </View>
              </View>

              {/* Decorative elements for back */}
              <View style={styles.cardPatternBack}>
                <View style={styles.patternLine1} />
                <View style={styles.patternLine2} />
                <View style={styles.patternLine3} />
              </View>

              {/* Magnetic strip */}
              <View style={styles.magneticStrip} />


            </Animated.View>
          </TouchableOpacity>

          {/* Flip instruction */}
          <View style={styles.flipInstruction}>
            <Icon name="gesture-tap" size={16} color="#666" />
            <Text style={styles.flipInstructionText}>
              Tap card to {isCardFlipped ? 'see profile' : 'view statistics'}
            </Text>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Tasks</Text>
            <TouchableOpacity onPress={fetchTasks}>
              <Icon name="refresh" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingTasks} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Icon name="clipboard-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first task</Text>
            </View>
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(_, index) => index}
              renderItem={renderTaskItem}
              scrollEnabled={false}
              contentContainerStyle={styles.taskList}
            />
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={taskModalVisible}
        onRequestClose={() => {
          setTaskModalVisible(false);
          resetTaskForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedTask ? 'Edit Task' : 'Add New Task'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTaskModalVisible(false);
                  resetTaskForm();
                }}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={[styles.input, taskErrors.title && styles.inputError]}
                  placeholder="Enter task title"
                  value={taskForm.title}
                  onChangeText={(text) => {
                    setTaskForm(prev => ({ ...prev, title: text }));
                    if (taskErrors.title) setTaskErrors(prev => ({ ...prev, title: '' }));
                  }}
                />
                {taskErrors.title && <Text style={styles.errorText}>{taskErrors.title}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    taskErrors.description && styles.inputError
                  ]}
                  placeholder="Enter task description"
                  value={taskForm.description}
                  onChangeText={(text) => {
                    setTaskForm(prev => ({ ...prev, description: text }));
                    if (taskErrors.description) setTaskErrors(prev => ({ ...prev, description: '' }));
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {taskErrors.description && <Text style={styles.errorText}>{taskErrors.description}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.radioGroup}>
                  {['pending', 'completed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={styles.radioOption}
                      onPress={() => setTaskForm(prev => ({ ...prev, status }))}
                    >
                      <Icon
                        name={taskForm.status === status ? 'radiobox-marked' : 'radiobox-blank'}
                        size={20}
                        color={getStatusColor(status)}
                      />
                      <Text style={styles.radioLabel}>{status.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.radioGroup}>
                  {['low', 'medium', 'high'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={styles.radioOption}
                      onPress={() => setTaskForm(prev => ({ ...prev, priority }))}
                    >
                      <Icon
                        name={taskForm.priority === priority ? 'radiobox-marked' : 'radiobox-blank'}
                        size={20}
                        color={getPriorityColor(priority)}
                      />
                      <Text style={styles.radioLabel}>{priority.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setTaskModalVisible(false);
                  resetTaskForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={selectedTask ? handleUpdateTask : handleCreateTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {selectedTask ? 'Update Task' : 'Add Task'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  // 3D Card Styles
  cardContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  flipButton: {
    width: width - 40,
    height: 220,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  cardFront: {
    backgroundColor: 'transparent',
  },
  cardBack: {
    backgroundColor: 'transparent',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
    backgroundImage: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
  },
  cardGradientBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f093fb',
    backgroundImage: 'linear-gradient(to right, #f093fb 0%, #f5576c 100%)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  flipHint: {
    alignItems: 'center',
  },
  flipHintText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  cardDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  // Card Back Styles
  cardHeaderBack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  cardDividerBack: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  additionalInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  cardFooterBack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  backHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  cardIdBack: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
  },
  // Decorative Elements
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  patternCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -30,
    right: -30,
  },
  patternCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -20,
  },
  patternCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: '50%',
    left: '30%',
  },
  cardPatternBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  patternLine1: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: '25%',
    left: '10%',
    transform: [{ rotate: '15deg' }],
  },
  patternLine2: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: '50%',
    left: '10%',
    transform: [{ rotate: '-15deg' }],
  },
  patternLine3: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: '75%',
    left: '10%',
    transform: [{ rotate: '15deg' }],
  },
  magneticStrip: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  signatureStrip: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  signatureText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  signatureLine: {
    width: 80,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  flipInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  flipInstructionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  // Tasks Section
  tasksSection: {
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingTasks: {
    marginVertical: 40,
  },
  emptyTasks: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusButton: {
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  completedText: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#F44336',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 4,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;