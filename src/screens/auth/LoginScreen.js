// LoginScreen.js
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAxios } from '../../customHooks/useAxios';
import { ApiPath } from '../../constant/ApiUrl';
import { saveTokens } from '../../services/authService';

const LoginScreen = ({ navigation }) => {
    const { post, loading } = useAxios()

    const [inputs, setInputs] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const validate = () => {
        let valid = true;
        let errors = {};

        if (!inputs.email) {
            errors.email = 'Email is required';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(inputs.email)) {
            errors.email = 'Please enter a valid email';
            valid = false;
        }

        if (!inputs.password) {
            errors.password = 'Password is required';
            valid = false;
        } else if (inputs.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        setErrors(errors);
        return valid;
    };

    const handleLogin = async () => {
        if (validate()) {
            try {

                const bodyJson = {
                    email: inputs.email,
                    password: inputs.password
                }
                const response = await post(ApiPath.Login, bodyJson)
                await saveTokens(
                    response.data.token,
                    response?.data?.refreshToken,
                    JSON.stringify(response.data?.user)
                )

                Alert.alert('Success', 'Logged in successfully!');
                navigation.navigate('Home')
            } catch (error) {
                console.log("Error loging -->>", error)
                Alert.alert('Error !', error?.response?.data?.message || 'Login failed');
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
                        <Image
                            source={require('../../assets/images/login.png')} // Add your logo
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
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

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Password"
                                    placeholderTextColor="#999"
                                    value={inputs.password}
                                    onChangeText={(text) => handleInputChange('password', text)}
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
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Forgot Password */}
                        {/* <TouchableOpacity
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity> */}

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Login */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Icon name="google" size={24} color="#DB4437" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Icon name="facebook" size={24} color="#4267B2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f9f9f9',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 8,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#007AFF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#666',
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingVertical: 14,
        marginHorizontal: 8,
    },
    socialButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        color: '#666',
        fontSize: 16,
    },
    signupLink: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen;