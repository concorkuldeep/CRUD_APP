// SignupScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CheckBox from 'react-native-check-box';
import { useAxios } from '../../customHooks/useAxios';
import { ApiPath } from '../../constant/ApiUrl';

const SignupScreen = ({ navigation }) => {
    const { post, loading, error } = useAxios();

    const [inputs, setInputs] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
    const [isChecked, setIsChecked] = useState(false);
    const [termsModalVisible, setTermsModalVisible] = useState(false);
    const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

    const passwordCriteria = [
        { label: 'At least 8 characters', met: inputs.password.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(inputs.password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(inputs.password) },
        { label: 'One number', met: /[0-9]/.test(inputs.password) },
    ];

    const validate = () => {
        let valid = true;
        let errors = {};

        // Full Name validation
        if (!inputs.fullName.trim()) {
            errors.fullName = 'Full name is required';
            valid = false;
        } else if (inputs.fullName.trim().length < 2) {
            errors.fullName = 'Name must be at least 2 characters';
            valid = false;
        }

        // Email validation
        if (!inputs.email) {
            errors.email = 'Email is required';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(inputs.email)) {
            errors.email = 'Please enter a valid email';
            valid = false;
        }

        // Phone validation
        if (inputs.phone && !/^\d{10,}$/.test(inputs.phone.replace(/\D/g, ''))) {
            errors.phone = 'Please enter a valid phone number';
            valid = false;
        }

        // Password validation
        if (!inputs.password) {
            errors.password = 'Password is required';
            valid = false;
        } else if (inputs.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
            valid = false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(inputs.password)) {
            errors.password = 'Password does not meet requirements';
            valid = false;
        }

        // Confirm password validation
        if (!inputs.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
            valid = false;
        } else if (inputs.password !== inputs.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
            valid = false;
        }

        // Terms validation
        if (!isChecked) {
            Alert.alert('Terms Required', 'Please accept the terms and conditions');
            valid = false;
        }

        setErrors(errors);
        return valid;
    };

    const handleSignup = async () => {
        if (validate()) {
            try {
                const bodyJson = {
                    "name": inputs.fullName,
                    "email": inputs.email,
                    "password": inputs.password,
                    "phone": inputs.phone
                }
                const response = await post(ApiPath.Register, JSON.stringify(bodyJson))
                console.log("Response from Signup Screen -->>>", response)

                if (response?.success) {
                    Alert.alert('Success', `${response?.message}`)
                    navigation.navigate('Login')
                }
            } catch (error) {
                console.error("Error while signup : ", error)
            }
        }
    };

    const handleInputChange = (field, value) => {
        setInputs(prev => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: '',
            }));
        }
    };


    const TermsModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={termsModalVisible}
            onRequestClose={() => setTermsModalVisible(false)}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Terms & Conditions</Text>
                        <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                            <Icon name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.termsText}>
                            {`We have some Terms & Conditions listed below.

1. **Account Terms**
   - You must be at least 13 years old to use this service
   - You are responsible for maintaining the security of your account

2. **Privacy**
   - We respect your privacy and protect your personal information
   - Your data is encrypted and securely stored

3. **Content Guidelines**
   - You agree not to post illegal or harmful content
   - We reserve the right to remove inappropriate content

By creating an account, you agree to these terms and conditions.`}
                        </Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => setTermsModalVisible(false)}>
                        <Text style={styles.modalButtonText}>I Understand</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}>
                            <Icon name="arrow-left" size={24} color="#333" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join our community today</Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#999"
                                    value={inputs.fullName}
                                    onChangeText={(text) => handleInputChange('fullName', text)}
                                    autoCapitalize="words"
                                    editable={!loading}
                                />
                            </View>
                            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email Address *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="hello@example.com"
                                    placeholderTextColor="#999"
                                    value={inputs.email}
                                    onChangeText={(text) => handleInputChange('email', text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Phone (Optional) */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="phone-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="(123) 456-7890"
                                    placeholderTextColor="#999"
                                    value={inputs.phone}
                                    onChangeText={(text) => handleInputChange('phone', text)}
                                    keyboardType="phone-pad"
                                    editable={!loading}
                                />
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Create a strong password"
                                    placeholderTextColor="#999"
                                    value={inputs.password}
                                    onChangeText={(text) => handleInputChange('password', text)}
                                    onFocus={() => setShowPasswordCriteria(true)}
                                    onBlur={() => setShowPasswordCriteria(false)}
                                    secureTextEntry={secureTextEntry}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                                    style={styles.eyeIcon}>
                                    <Icon
                                        name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Password Criteria */}
                            {showPasswordCriteria && (
                                <View style={styles.criteriaContainer}>
                                    {passwordCriteria.map((criteria, index) => (
                                        <View key={index} style={styles.criteriaItem}>
                                            <Icon
                                                name={criteria.met ? 'check-circle' : 'checkbox-blank-circle-outline'}
                                                size={14}
                                                color={criteria.met ? '#4CAF50' : '#999'}
                                            />
                                            <Text style={[
                                                styles.criteriaText,
                                                criteria.met && styles.criteriaMet
                                            ]}>
                                                {criteria.label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirm Password *</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock-check-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor="#999"
                                    value={inputs.confirmPassword}
                                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                                    secureTextEntry={confirmSecureTextEntry}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                                    style={styles.eyeIcon}>
                                    <Icon
                                        name={confirmSecureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            )}
                        </View>

                        {/* Terms & Conditions */}
                        <View style={styles.termsContainer}>
                            <CheckBox
                                style={styles.checkbox}
                                isChecked={isChecked}
                                onClick={() => setIsChecked(!isChecked)}
                                checkBoxColor={isChecked ? '#007AFF' : '#ccc'}
                                checkedCheckBoxColor="#007AFF"
                            />
                            <View style={styles.termsTextContainer}>
                                <Text style={styles.termsLabel}>
                                    I agree to the{' '}
                                    <Text
                                        style={styles.termsLink}
                                        onPress={() => setTermsModalVisible(true)}>
                                        Terms & Conditions
                                    </Text>{' '}
                                    and{' '}
                                    <Text
                                        style={styles.termsLink}
                                        onPress={() => Alert.alert('Privacy Policy', 'Coming soon!')}>
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </View>
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.signupButtonText}>Create Account</Text>
                                    <Icon name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Signup */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Icon name="google" size={20} color="#DB4437" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Icon name="facebook" size={20} color="#4267B2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Icon name="apple" size={20} color="#000" />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Terms Modal */}
            <TermsModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    backButton: {
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        marginTop: 10,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e1e1e1',
        borderRadius: 14,
        paddingHorizontal: 18,
        backgroundColor: '#fafafa',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 58,
        fontSize: 16,
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    eyeIcon: {
        padding: 10,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 6,
    },
    criteriaContainer: {
        marginTop: 12,
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    criteriaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    checkbox: {
        flex: 0,
        padding: 0,
        marginRight: 12,
    },
    termsTextContainer: {
        flex: 1,
    },
    termsLabel: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    termsLink: {
        color: '#007AFF',
        fontWeight: '600',
    },
    signupButton: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    signupButtonDisabled: {
        opacity: 0.7,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 8,
    },
    buttonIcon: {
        marginTop: 2,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        borderRadius: 12,
        paddingVertical: 16,
        marginHorizontal: 6,
        backgroundColor: '#fff',
    },
    socialButtonText: {
        marginLeft: 8,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    loginText: {
        color: '#666',
        fontSize: 16,
    },
    loginLink: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    modalBody: {
        padding: 24,
    },
    termsText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#666',
    },
    modalButton: {
        backgroundColor: '#007AFF',
        margin: 24,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SignupScreen;