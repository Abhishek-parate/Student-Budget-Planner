import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    Platform,
    SafeAreaView, 
    ScrollView,
    StatusBar,
    KeyboardAvoidingView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import icons from '@/constants/icons';
import { supabase } from "@/utils/supabase";
import * as WebBrowser from 'expo-web-browser';

// Preload browser for authentication
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Sample illustrations - replace with your actual assets
const illustrationCreate = require('@/assets/images/loginscreen.png');
const mailConfirmation = require('@/assets/images/avatar.png');

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
    useWarmUpBrowser();
    
    // Use expo-router for navigation
    const router = useRouter();
    
    // Core state management
    const [currentScreen, setCurrentScreen] = useState('register');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form states
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    // Scroll ref for keyboard handling
    const scrollViewRef = useRef(null);

    // Form validation states
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [nameError, setNameError] = useState('');

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (password) => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const validateName = (name) => {
        if (!name) {
            setNameError('Name is required');
            return false;
        }
        setNameError('');
        return true;
    };

    // Form submission handlers with validation
    const handleRegister = async () => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isNameValid = validateName(name);
    
        if (isEmailValid && isPasswordValid && isNameValid) {
            setLoading(true);
            try {
                console.log('Starting signup with:', { email, name }); // Debug log
                
                const { data, error } = await supabase.auth.signUp({
                    email: email.trim().toLowerCase(),
                    password: password,
                    options: {
                        data: {
                            full_name: name.trim(),
                        }
                    }
                });
                
                console.log('Signup response:', data, error);
                
                if (error) {
                    console.error('Detailed error:', error);
                    throw error;
                }
    
                if (!data?.session) {
                    setCurrentScreen('confirmation');
                } else {
                    router.replace('/home');
                }
                
            } catch (error) {
                console.error('Signup error:', error);
                Alert.alert(
                    'Registration Error',
                    `Error: ${error.message}\nPlease try again or contact support.`
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResendEmail = async () => {
        setLoading(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        setLoading(false);
        
        if (error) {
            Alert.alert('Resend Error', error.message);
        } else {
            Alert.alert('Email Sent', 'Verification email has been resent.');
        }
    };

    // Input styles based on validation state
    const getInputStyle = (error) => {
        return error ? "border-danger" : "border-gray-200";
    };

    const renderRegisterScreen = () => (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" backgroundColor="#0061FF" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView 
                    ref={scrollViewRef}
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {/* Purple background with illustration */}
                    <View className="h-64 bg-primary-400 px-6 pt-6 pb-4 relative">
                        <View className="items-center justify-center flex-1">
                            <Image 
                                source={illustrationCreate} 
                                className="w-48 h-48" 
                                resizeMode="contain"
                                accessibilityLabel="Registration illustration" 
                            />
                        </View>
                        {/* Decorative elements */}
                        <View className="absolute -bottom-4 -left-10 w-24 h-24 rounded-full bg-primary-400 opacity-30" />
                        <View className="absolute top-10 right-0 w-16 h-16 rounded-full bg-primary-400 opacity-30" />
                    </View>
                    
                    {/* Form container with shadow */}
                    <View className="bg-white rounded-t-3xl -mt-6 flex-1 px-6 pb-10 shadow-lg">
                        {/* App logo */}
                        <View className="flex-row justify-center ">
                            <Image 
                                source={icons.logo} 
                                className="w-40 h-40" 
                                resizeMode="contain"
                                accessibilityLabel="App logo" 
                            />
                        </View>
                        
                        <Text className="text-black-300 text-2xl font-rubik-semibold mb-4 text-center">
                            Create New Account
                        </Text>
                        
                        {/* Email input with validation */}
                        <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">Email</Text>
                        <View className={`mb-1 border ${getInputStyle(emailError)} rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}>
                            <Ionicons name="mail-outline" size={18} color="#8C8E98" />
                            <TextInput
                                placeholder="name@example.com"
                                className="flex-1 h-12 ml-2 font-rubik"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (emailError) validateEmail(text);
                                }}
                                onBlur={() => validateEmail(email)}
                                autoCapitalize="none"
                                accessibilityLabel="Email input field"
                                testID="email-input"
                            />
                        </View>
                        {emailError ? <Text className="text-danger text-xs mb-3 ml-1 font-rubik">{emailError}</Text> : <View className="mb-3" />}
                        
                        {/* Name input with validation */}
                        <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">Name</Text>
                        <View className={`mb-1 border ${getInputStyle(nameError)} rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}>
                            <Ionicons name="person-outline" size={18} color="#8C8E98" />
                            <TextInput
                                placeholder="Your full name"
                                className="flex-1 h-12 ml-2 font-rubik"
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (nameError) validateName(text);
                                }}
                                onBlur={() => validateName(name)}
                                accessibilityLabel="Name input field"
                                testID="name-input"
                            />
                        </View>
                        {nameError ? <Text className="text-danger text-xs mb-3 ml-1 font-rubik">{nameError}</Text> : <View className="mb-3" />}
                        
                        {/* Password input with validation */}
                        <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">Password</Text>
                        <View className={`mb-1 border ${getInputStyle(passwordError)} rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}>
                            <Ionicons name="lock-closed-outline" size={18} color="#8C8E98" />
                            <TextInput
                                placeholder="••••••••"
                                className="flex-1 h-12 ml-2 font-rubik"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (passwordError) validatePassword(text);
                                }}
                                onBlur={() => validatePassword(password)}
                                accessibilityLabel="Password input field"
                                testID="password-input"
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                className="p-2" 
                                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                accessibilityRole="button"
                            >
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color="#8C8E98" 
                                />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? <Text className="text-danger text-xs mb-3 ml-1 font-rubik">{passwordError}</Text> : <View className="mb-6" />}
                        
                        {/* Register button with elevation */}
                        <TouchableOpacity 
                            className="bg-primary-400 py-3.5 rounded-xl items-center mb-5 shadow-md"
                            onPress={handleRegister}
                            activeOpacity={0.8}
                            accessibilityLabel="Register button"
                            testID="register-button"
                            disabled={loading}
                        >
                            <Text className="text-white text-lg font-rubik-bold tracking-wide">
                                {loading ? "REGISTERING..." : "REGISTER"}
                            </Text>
                        </TouchableOpacity>
                        
                        {/* Login link */}
                        <View className="flex-row justify-center mb-10">
                            <Text className="text-black-100 font-rubik">Already have an account? </Text>
                            <Link href="/login" replace>
                                <Text className="text-primary-400 font-rubik-medium">Login here</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

    const renderConfirmationScreen = () => (
        <SafeAreaView className="flex-1 bg-black-300">
            <StatusBar barStyle="light-content" backgroundColor="#191D31" />
            <View className="flex-1 px-6 pt-6">
                <TouchableOpacity 
                    className="w-10 h-10 justify-center items-start mb-4"
                    onPress={() => setCurrentScreen('register')}
                    accessibilityLabel="Go back to registration"
                >
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </TouchableOpacity>
                
                {/* Main confirmation card with shadow and better styling */}
                <View className="bg-primary-400 rounded-3xl p-8 mt-8 items-center shadow-xl">
                    <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                        <Image 
                            source={mailConfirmation} 
                            className="w-14 h-14" 
                            resizeMode="contain"
                            accessibilityLabel="Email confirmation icon" 
                        />
                    </View>
                    
                    <Text className="text-white text-2xl font-rubik-bold text-center mb-3">
                        Thank you for your registration!
                    </Text>
                    
                    <Text className="text-white/90 text-center mb-8 leading-5 font-rubik">
                        We're glad you're here!{'\n\n'}
                        Before you start exploring, we just sent you the email confirmation.
                    </Text>
                    
                    <TouchableOpacity 
                        className="bg-black-300 py-3.5 px-6 rounded-xl flex-row items-center"
                        onPress={handleResendEmail}
                        activeOpacity={0.8}
                        disabled={loading}
                        accessibilityLabel="Resend email confirmation button"
                    >
                        <Ionicons name="mail-outline" size={18} color="white" />
                        <Text className="text-white font-rubik-medium ml-2">
                            {loading ? "Sending..." : "Resend email confirmation"}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {/* Login link at bottom */}
                <View className="absolute bottom-10 left-6 right-6">
                    <Link 
                        href="/login" 
                        replace
                        asChild
                    >
                        <TouchableOpacity 
                            className="bg-black-200 py-3.5 rounded-xl items-center mb-5 shadow-md"
                            activeOpacity={0.8}
                            accessibilityLabel="Go to login screen"
                        >
                            <Text className="text-white text-lg font-rubik-bold tracking-wide">GO TO LOGIN</Text>
                        </TouchableOpacity>
                    </Link>
                    
                    <View className="flex-row justify-center">
                        <Text className="text-black-100 font-rubik">Need help? </Text>
                        <Link href="/support">
                            <Text className="text-primary-400 font-rubik-medium">Contact support</Text>
                        </Link>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );

    // Render the appropriate screen based on state
    return currentScreen === 'register' ? renderRegisterScreen() : renderConfirmationScreen();
}