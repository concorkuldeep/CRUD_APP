import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAxios } from '../../customHooks/useAxios';
import { clearTokens } from '../../services/authService';
import { ApiPath } from '../../constant/ApiUrl';
import { formatDate } from '../../constant/constants';

const HomeScreen = ({ navigation }) => {

  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'low',
  });
  const [taskErrors, setTaskErrors] = useState({});

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
        {/* User Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile Information</Text>

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
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{userData?.role || 'N/A'}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.cardItem}>
            <Text style={styles.label}>Joined</Text>
            <Text style={styles.value}>{formatDate(userData?.createdAt) || 'N/A'}</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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