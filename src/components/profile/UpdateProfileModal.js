

import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UpdateProfileModal = ({
    visible,
    user,
    onClose,
    onSuccess,
}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Password states
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Password visibility
    const [secureOldPassword, setSecureOldPassword] = useState(true);
    const [securePassword, setSecurePassword] = useState(true);
    const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

    // Password criteria visibility
    const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const hasPassword = Boolean(user?.hasPassword);

    useEffect(() => {
        if (visible && user) {
            setName(user?.name || '');
            setEmail(user?.email || '');
            setPhone(user?.phone || '');

            // Reset password fields whenever modal opens
            setOldPassword('');
            setPassword('');
            setConfirmPassword('');

            setErrors({});
            setShowPasswordCriteria(false);
        }
    }, [visible, user]);

    /**
     * Same password rules as SignupScreen
     *
     * Minimum 8 characters
     * One uppercase
     * One lowercase
     * One number
     */
    const passwordCriteria = [
        {
            label: 'At least 8 characters',
            met: password.length >= 8,
        },
        {
            label: 'One uppercase letter',
            met: /[A-Z]/.test(password),
        },
        {
            label: 'One lowercase letter',
            met: /[a-z]/.test(password),
        },
        {
            label: 'One number',
            met: /[0-9]/.test(password),
        },
    ];

    const validatePassword = () => {
        const newErrors = {};

        // Password fields are optional when updating profile.
        // But if user starts entering password, validate everything.

        if (password || confirmPassword || oldPassword) {

            // Existing password account
            if (hasPassword && !oldPassword) {
                newErrors.oldPassword =
                    'Please enter your current password';
            }

            // New password
            if (!password) {
                newErrors.password =
                    'Please enter a new password';
            } else if (password.length < 8) {
                newErrors.password =
                    'Password must be at least 8 characters';
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                newErrors.password =
                    'Password does not meet requirements';
            }

            // Confirm password
            if (!confirmPassword) {
                newErrors.confirmPassword =
                    'Please confirm your password';
            } else if (password !== confirmPassword) {
                newErrors.confirmPassword =
                    'Passwords do not match';
            }
        }

        return newErrors;
    };

    const handleUpdate = async () => {
        const passwordErrors = validatePassword();

        if (Object.keys(passwordErrors).length > 0) {
            setErrors(passwordErrors);
            return;
        }

        try {
            setLoading(true);

            /**
             * IMPORTANT:
             *
             * Email is intentionally NOT included here.
             *
             * Your backend should receive only fields
             * that are actually editable.
             */
            const updateData = {
                name: name.trim(),
                phone: phone.trim(),
            };

            /**
             * Only send password data when the user
             * actually wants to change/set the password.
             */
            if (password) {

                if (hasPassword) {
                    updateData.oldPassword = oldPassword;
                }

                updateData.password = password;
                updateData.confirmPassword = confirmPassword;
            }

            console.log('UPDATE PROFILE DATA:', updateData);

            // ----------------------------------------
            // API CALL WILL GO HERE
            // ----------------------------------------
            //
            // Example:
            //
            // const response = await put(
            //     ApiPath.UpdateProfile,
            //     JSON.stringify(updateData)
            // );
            //
            // if (!response?.success) {
            //     throw new Error(response?.message);
            // }

            const updatedUser = {
                ...user,
                name: name.trim(),
                phone: phone.trim(),
            };

            onSuccess?.(updatedUser);

        } catch (error) {
            console.log(
                'UPDATE PROFILE ERROR:',
                error
            );

            Alert.alert(
                'Update Failed',
                error?.message ||
                'Unable to update profile'
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = text => {
        setPassword(text);

        if (errors.password) {
            setErrors(prev => ({
                ...prev,
                password: '',
            }));
        }
    };

    const handleConfirmPasswordChange = text => {
        setConfirmPassword(text);

        if (errors.confirmPassword) {
            setErrors(prev => ({
                ...prev,
                confirmPassword: '',
            }));
        }
    };

    const handleOldPasswordChange = text => {
        setOldPassword(text);

        if (errors.oldPassword) {
            setErrors(prev => ({
                ...prev,
                oldPassword: '',
            }));
        }
    };

    const renderPasswordInput = ({
        label,
        value,
        onChangeText,
        placeholder,
        secureTextEntry,
        onToggleSecure,
        error,
    }) => {
        return (
            <View style={styles.inputContainer}>

                <Text style={styles.label}>
                    {label}
                </Text>

                <View
                    style={[
                        styles.inputWrapper,
                        error && styles.inputError,
                    ]}
                >
                    <Icon
                        name="lock-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                    />

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor="#999"
                        secureTextEntry={secureTextEntry}
                        style={styles.input}
                        editable={!loading}
                        autoCapitalize="none"
                    />

                    <TouchableOpacity
                        onPress={onToggleSecure}
                        style={styles.eyeIcon}
                    >
                        <Icon
                            name={
                                secureTextEntry
                                    ? 'eye-outline'
                                    : 'eye-off-outline'
                            }
                            size={21}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>

                {error ? (
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                ) : null}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >
                <View style={styles.container}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>
                                Update Profile
                            </Text>

                            <Text style={styles.subtitle}>
                                Update your personal information
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            style={styles.closeButton}
                        >
                            <Icon
                                name="close"
                                size={24}
                                color="#555"
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* Name */}
                        <View style={styles.inputContainer}>

                            <Text style={styles.label}>
                                Name
                            </Text>

                            <View style={styles.inputWrapper}>

                                <Icon
                                    name="account-outline"
                                    size={20}
                                    color="#666"
                                    style={styles.inputIcon}
                                />

                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#999"
                                    style={styles.input}
                                    editable={!loading}
                                />

                            </View>
                        </View>

                        {/* Email - READ ONLY */}
                        <View style={styles.inputContainer}>

                            <Text style={styles.label}>
                                Email
                            </Text>

                            <View
                                style={[
                                    styles.inputWrapper,
                                    styles.disabledInput,
                                ]}
                            >

                                <Icon
                                    name="email-outline"
                                    size={20}
                                    color="#999"
                                    style={styles.inputIcon}
                                />

                                <TextInput
                                    value={email}
                                    placeholder="Email"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={false}
                                    selectTextOnFocus={false}
                                    style={[
                                        styles.input,
                                        styles.disabledText,
                                    ]}
                                />

                                <Icon
                                    name="lock"
                                    size={18}
                                    color="#aaa"
                                />

                            </View>

                            <Text style={styles.infoText}>
                                Email address cannot be changed.
                            </Text>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputContainer}>

                            <Text style={styles.label}>
                                Phone
                            </Text>

                            <View style={styles.inputWrapper}>

                                <Icon
                                    name="phone-outline"
                                    size={20}
                                    color="#666"
                                    style={styles.inputIcon}
                                />

                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    style={styles.input}
                                    editable={!loading}
                                />

                            </View>
                        </View>

                        {/* Password Section */}
                        <View style={styles.passwordSection}>

                            <View style={styles.passwordHeader}>
                                <View>
                                    <Text style={styles.passwordTitle}>
                                        Password
                                    </Text>

                                    <Text style={styles.passwordSubtitle}>
                                        {hasPassword
                                            ? 'Change your existing password'
                                            : 'Set a password for your account'}
                                    </Text>
                                </View>

                                <Icon
                                    name="shield-lock-outline"
                                    size={26}
                                    color="#007AFF"
                                />
                            </View>

                            {/* Existing password */}
                            {hasPassword &&
                                renderPasswordInput({
                                    label: 'Current Password',
                                    value: oldPassword,
                                    onChangeText:
                                        handleOldPasswordChange,
                                    placeholder:
                                        'Enter current password',
                                    secureTextEntry:
                                        secureOldPassword,
                                    onToggleSecure: () =>
                                        setSecureOldPassword(
                                            prev => !prev
                                        ),
                                    error:
                                        errors.oldPassword,
                                })}

                            {/* New password */}
                            {renderPasswordInput({
                                label: hasPassword
                                    ? 'New Password'
                                    : 'Set Password',
                                value: password,
                                onChangeText:
                                    handlePasswordChange,
                                placeholder:
                                    'Create a strong password',
                                secureTextEntry:
                                    securePassword,
                                onToggleSecure: () =>
                                    setSecurePassword(
                                        prev => !prev
                                    ),
                                error: errors.password,
                            })}

                            {/* Password Criteria */}
                            {(password || showPasswordCriteria) && (
                                <View
                                    style={
                                        styles.criteriaContainer
                                    }
                                >
                                    {passwordCriteria.map(
                                        (criteria, index) => (
                                            <View
                                                key={index}
                                                style={
                                                    styles.criteriaItem
                                                }
                                            >
                                                <Icon
                                                    name={
                                                        criteria.met
                                                            ? 'check-circle'
                                                            : 'checkbox-blank-circle-outline'
                                                    }
                                                    size={15}
                                                    color={
                                                        criteria.met
                                                            ? '#4CAF50'
                                                            : '#999'
                                                    }
                                                />

                                                <Text
                                                    style={[
                                                        styles.criteriaText,
                                                        criteria.met &&
                                                        styles.criteriaMet,
                                                    ]}
                                                >
                                                    {criteria.label}
                                                </Text>
                                            </View>
                                        )
                                    )}
                                </View>
                            )}

                            {/* Confirm password */}
                            {renderPasswordInput({
                                label: 'Confirm Password',
                                value: confirmPassword,
                                onChangeText:
                                    handleConfirmPasswordChange,
                                placeholder:
                                    'Re-enter your password',
                                secureTextEntry:
                                    secureConfirmPassword,
                                onToggleSecure: () =>
                                    setSecureConfirmPassword(
                                        prev => !prev
                                    ),
                                error:
                                    errors.confirmPassword,
                            })}

                        </View>

                        {/* Save */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                loading &&
                                styles.disabledButton,
                            ]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text
                                    style={styles.buttonText}
                                >
                                    Updating...
                                </Text>
                            ) : (
                                <Text
                                    style={styles.buttonText}
                                >
                                    Save Changes
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Cancel */}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelText}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default UpdateProfileModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        maxHeight: '92%',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },

    subtitle: {
        fontSize: 13,
        color: '#777',
        marginTop: 4,
    },

    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    inputContainer: {
        marginBottom: 18,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },

    inputWrapper: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
    },

    inputError: {
        borderColor: '#ff3b30',
    },

    inputIcon: {
        marginRight: 10,
    },

    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#111',
    },

    disabledInput: {
        backgroundColor: '#f3f3f3',
        borderColor: '#e0e0e0',
    },

    disabledText: {
        color: '#777',
    },

    eyeIcon: {
        padding: 8,
    },

    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },

    infoText: {
        color: '#888',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },

    passwordSection: {
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#f8f9fc',
        borderWidth: 1,
        borderColor: '#e8ebf0',
    },

    passwordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    passwordTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#222',
    },

    passwordSubtitle: {
        fontSize: 12,
        color: '#777',
        marginTop: 3,
    },

    criteriaContainer: {
        marginTop: -6,
        marginBottom: 14,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },

    criteriaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7,
    },

    criteriaText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 8,
    },

    criteriaMet: {
        color: '#4CAF50',
        fontWeight: '500',
    },

    button: {
        height: 52,
        borderRadius: 14,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },

    disabledButton: {
        opacity: 0.6,
    },

    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    cancelButton: {
        alignItems: 'center',
        marginTop: 16,
        paddingBottom: 10,
    },

    cancelText: {
        color: '#555',
        fontSize: 15,
        fontWeight: '600',
    },
})
