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
const illustrationLogin = require('@/assets/images/loginscreen.png');

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    useWarmUpBrowser();

    // Use expo-router for navigation
    const router = useRouter();

    // States
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // Scroll ref for keyboard handling
    const scrollViewRef = useRef(null);

    // Form validation states
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

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
        }
        setPasswordError('');
        return true;
    };

    // Handle login with validation and Supabase
    const handleLogin = async () => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (isEmailValid && isPasswordValid) {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                setLoading(false);
                Alert.alert('Login Error', error.message);
                return;
            }

            const user = data.user;
            if (!user) {
                setLoading(false);
                Alert.alert('Error', 'User not found');
                return;
            }

            // Fetch user profile with number verification status
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('phone_number, phone_verified')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                setLoading(false);
                Alert.alert('Error', 'Failed to fetch user profile');
                return;
            }

            // Handle different profile scenarios
            if (!profile) {
                // No profile exists - redirect to number verification
                router.replace('/profile/(number)');
            } else if (!profile.phone_number || !profile.phone_verified) {
                // Profile exists but number not verified - redirect to number verification
                router.replace('/profile/(number)');

            } else if (!profile.website || profile.website === '' || !profile.bio || profile.bio === '') {
                // Number is verified but website or bio is empty - redirect to profile view
                router.replace('/profile/viewprofile');

                
            } else {
                // Profile exists and number is verified - proceed to main app
                router.replace('/(tabs)');
            }
        }
    };




    // Input styles based on validation state
    const getInputStyle = (error) => {
        return error ? "border-danger" : "border-gray-200";
    };

    return (
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
                                source={illustrationLogin}
                                className="w-48 h-48"
                                resizeMode="contain"
                                accessibilityLabel="Login illustration"
                            />
                        </View>
                        {/* Decorative elements */}
                        <View className="absolute -bottom-4 -left-10 w-24 h-24 rounded-full bg-primary-400 opacity-30" />
                        <View className="absolute top-10 right-0 w-16 h-16 rounded-full bg-primary-400 opacity-30" />
                    </View>

                    {/* Form container with shadow */}
                    <View className="bg-white rounded-t-3xl -mt-6 flex-1 px-6 pb-10 shadow-lg">
                        {/* App logo */}
                        <View className="flex-row justify-center">
                            <Image
                                source={icons.logo}
                                className="w-40 h-40"
                                resizeMode="contain"
                                accessibilityLabel="App logo"
                            />
                        </View>

                        <Text className="text-black-300 text-2xl font-rubik-semibold mb-4 text-center">
                            Welcome Back
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
                        {passwordError ? <Text className="text-danger text-xs mb-3 ml-1 font-rubik">{passwordError}</Text> : <View className="mb-1" />}

                       
                        {/* Login button with elevation */}
                        <TouchableOpacity
                            className="bg-primary-400 py-3.5 rounded-xl items-center mb-5 shadow-md"
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            accessibilityLabel="Login button"
                            testID="login-button"
                            disabled={loading}
                        >
                            <Text className="text-white text-lg font-rubik-bold tracking-wide">
                                {loading ? "LOGGING IN..." : "LOGIN"}
                            </Text>
                        </TouchableOpacity>

                        {/* Register link */}
                        <View className="flex-row justify-center">
                            <Text className="text-black-100 font-rubik">Don't have an account? </Text>
                            <Link href="/signup" replace>
                                <Text className="text-primary-400 font-rubik-medium">Register here</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}