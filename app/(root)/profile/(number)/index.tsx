import React, { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/utils/supabase";

// Types
interface UserData {
  aadharNumber: string;
  name: string;
  email: string;
  dob: string;
  address: string;
  gender: string;
  phone: string;
  pincode: string;
  verified: boolean;
}

interface ApiResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

interface AadharResponse {
  success: boolean;
  message: string;
  user_details: {
    id: string;
    aadhar_no: string;
    name: string;
    email: string;
    dob: string;
    address: string;
    gender: string;
    phone: string;
    pincode: string;
  };
}

const getInputStyle = (error: string) => {
  return error ? "border-red-500" : "border-gray-200";
};

export default function AadharVerificationScreen() {
  const { session, user } = useAuth();
  const router = useRouter();

  const FAST2SMS_API_KEY =
  "AJW9wJfYbi6Vjjvctdr83ESKGiWa3XHa81j6TVJGZ1dd9yJOTUzNPrCTimYo"; // Replace with your actual API key

  
  // State management
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharError, setAadharError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // OTP verification states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [verificationError, setVerificationError] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState<string>("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Refs for OTP inputs
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const generateOTP = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const sendOTPAPI = async (phone: string, otp: string): Promise<boolean> => {
    try {
      // Using Fast2SMS API
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          Authorization: FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: `Your OTP for verification is: ${otp}`,
          numbers: phone,
        }),
      });

      const data: ApiResponse = await response.json();
      return data.return === true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return false;
    }
  };

  const validateAadhar = (aadhar: string): boolean => {
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadhar) {
      setAadharError("Aadhaar number is required");
      return false;
    } else if (!aadharRegex.test(aadhar)) {
      setAadharError("Please enter a valid 12-digit Aadhaar number");
      return false;
    }
    setAadharError("");
    return true;
  };

  const formatAadharForDisplay = (aadhar: string): string => {
    // Format as XXXX XXXX XXXX
    if (!aadhar) return "";
    const cleaned = aadhar.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    
    return parts.join(" ");
  };

  const handleAadharChange = (text: string) => {
    // Allow only digits and limit input to 12 digits
    const cleaned = text.replace(/\D/g, "").slice(0, 12);
    setAadharNumber(cleaned);
    
    if (aadharError) validateAadhar(cleaned);
    setFetchError("");
    
    // Reset user data when changing the Aadhaar number
    if (userData) {
      setUserData(null);
    }
  };

  const fetchAadharData = async () => {
    if (!validateAadhar(aadharNumber)) return;
    
    setIsVerifying(true);
    setFetchError("");
    
    try {
      const apiUrl = `http://test.bitlearners.com/`;
      console.log("Fetching from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          "aadhar_no": aadharNumber
        })
      });
  
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }
  
      const data: AadharResponse = await response.json();
      console.log("API response:", data);
      
      if (data.success) {
        const { user_details } = data;
        setUserData({
          aadharNumber: user_details.aadhar_no,
          name: user_details.name,
          email: user_details.email,
          dob: user_details.dob,
          address: user_details.address,
          gender: user_details.gender,
          phone: user_details.phone,
          pincode: user_details.pincode,
          verified: true
        });
      } else {
        setUserData(null);
        setFetchError(data.message || "Failed to fetch Aadhaar details");
      }
    } catch (error) {
      console.error("Error fetching Aadhaar data:", error);
      setFetchError("Failed to connect to the server. Please check your network connection and try again.");
      setUserData(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.charAt(0);
    }

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = text;
    setOtpDigits(newOtpDigits);

    if (text.length === 1 && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (
      e.nativeEvent.key === "Backspace" &&
      otpDigits[index] === "" &&
      index > 0
    ) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleSendOTP = async () => {
    if (!userData) return;
    
    setIsVerifying(true);
    const phone = userData.phone.replace(/\D/g, ""); // Clean any non-digit characters
    const otp = generateOTP();
    setGeneratedOTP(otp);

    const success = await sendOTPAPI(phone, otp);

    if (success) {
      setVerificationSent(true);
      setCountdown(60);
      setShowOtpScreen(true);
      Alert.alert("Success", `OTP has been sent to ${phone}`);
    } else {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }

    setIsVerifying(false);
  };

  const handleResendCode = async () => {
    if (countdown === 0 && userData) {
      setIsVerifying(true);
      const phone = userData.phone.replace(/\D/g, "");
      const otp = generateOTP();
      setGeneratedOTP(otp);

      const success = await sendOTPAPI(phone, otp);

      if (success) {
        setCountdown(60);
        Alert.alert("Success", "OTP has been resent");
      } else {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
      }

      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    const enteredOTP = otpDigits.join("");
    if (enteredOTP.length !== 4) {
      setVerificationError("Please enter all 4 digits");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    if (enteredOTP === generatedOTP) {
      try {
        await saveUserData();
        setIsVerified(true);
        setIsVerifying(false);
        
        setTimeout(() => {
          router.replace("/profile/viewprofile");
        }, 1500);
      } catch (error) {
        setIsVerifying(false);
        Alert.alert(
          "Error",
          "There was an error saving your data. Please try again."
        );
      }
    } else {
      setIsVerifying(false);
      setVerificationError("Invalid verification code. Please try again.");
    }
  };

  const saveUserData = async () => {
    try {
      if (!session?.user) throw new Error("No user on the session!");
      if (!userData) throw new Error("No Aadhaar data available!");

      // Extract first and last name from full name
      const nameParts = userData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // First save to AsyncStorage
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Then save to Supabase with user ID from session and matching your DB fields
      const updates = {
        id: session.user.id,
        first_name: firstName,
        last_name: lastName,
        number: userData.phone,
        phone_verified: true,
        date_of_birth: userData.dob,
        aadhaar_number: userData.aadharNumber,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updates);

      if (error) {
        console.error('Error saving to Supabase:', error);
        Alert.alert(
          "Warning",
          "Your Aadhaar was verified but there was an error saving to the database. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  };

  const handleConfirmAndProceed = async () => {
    if (!userData) return;
    setIsVerifying(true);
    
    try {
      await handleSendOTP();
    } catch (error) {
      Alert.alert(
        "Error",
        "There was an error sending the verification code. Please try again."
      );
      setIsVerifying(false);
    }
  };
  
  // OTP Verification Screen
  const renderOtpScreen = () => {
    return (
      <View className="flex-1">
        <View className="items-center mb-6">
          <Ionicons name="shield-checkmark" size={60} color="#5e17eb" />
          <Text className="text-black-300 text-2xl font-rubik-semibold mt-4 text-center">
            OTP Verification
          </Text>
          <Text className="text-black-100 text-center mt-2 font-rubik">
            Enter the 4-digit code sent to{"\n"}
            {userData?.phone}
          </Text>
        </View>

        {/* OTP Input */}
        <View className="flex-row justify-center space-x-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              className={`w-14 h-14 border ${
                verificationError && !otpDigits[index]
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-lg bg-accent-100 justify-center items-center`}
            >
              <TextInput
                ref={otpRefs[index]}
                value={otpDigits[index]}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                className="text-2xl text-center font-rubik-semibold w-full h-full"
                accessibilityLabel={`OTP digit ${index + 1}`}
                testID={`otp-input-${index}`}
              />
            </View>
          ))}
        </View>

        {verificationError ? (
          <Text className="text-danger text-sm mb-3 text-center font-rubik">
            {verificationError}
          </Text>
        ) : null}

        {/* Verify Button */}
        <TouchableOpacity
          className="bg-primary-400 py-3.5 rounded-xl items-center mb-5 shadow-md"
          onPress={handleVerifyCode}
          activeOpacity={0.8}
          disabled={isVerifying}
          accessibilityLabel="Verify OTP button"
          testID="verify-otp-button"
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-lg font-rubik-bold tracking-wide">
              VERIFY
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View className="flex-row justify-center items-center mb-5">
          <Text className="text-black-200 font-rubik">Didn't receive code? </Text>
          {countdown > 0 ? (
            <Text className="text-primary-400 font-rubik-medium">
              Resend in {countdown}s
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isVerifying}
              accessibilityLabel="Resend OTP button"
            >
              <Text className="text-primary-400 font-rubik-medium">
                Resend Code
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#5e17eb" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Purple background with illustration */}
          <View className="h-64 bg-primary-400 px-6 pt-6 pb-4 relative">
            <TouchableOpacity
              className="w-8 h-8 justify-center items-center"
              onPress={() => {
                if (showOtpScreen) {
                  setShowOtpScreen(false);
                } else {
                  router.back();
                }
              }}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="items-center justify-center flex-1">
              <Image
                source={showOtpScreen ? icons.otp : icons.addhar}
                className="w-48 h-48"
                resizeMode="contain"
                accessibilityLabel={showOtpScreen ? "OTP verification illustration" : "Aadhaar verification illustration"}
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

            {showOtpScreen ? (
              renderOtpScreen()
            ) : (
              <>
                <Text className="text-black-300 text-2xl font-rubik-semibold mb-2 text-center">
                  Aadhaar Verification
                </Text>

                <Text className="text-black-100 text-center mb-6 font-rubik">
                  Enter your Aadhaar number to verify your identity
                </Text>

                <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                  Aadhaar Number
                </Text>

                <View
                  className={`border ${getInputStyle(
                    aadharError
                  )} rounded-xl px-4 py-2 flex-row items-center bg-accent-100 mb-1`}
                >
                  <Ionicons name="card-outline" size={18} color="#8C8E98" />
                  <TextInput
                    placeholder="123456789012"
                    className="flex-1 h-12 ml-2 font-rubik"
                    keyboardType="number-pad"
                    value={aadharNumber}
                    onChangeText={handleAadharChange}
                    onBlur={() => validateAadhar(aadharNumber)}
                    maxLength={12}
                    accessibilityLabel="Aadhaar number input field"
                    testID="aadhar-input"
                  />
                </View>

                {aadharError ? (
                  <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                    {aadharError}
                  </Text>
                ) : (
                  <View className="mb-1" />
                )}

                {/* Verify button */}
                <TouchableOpacity
                  className="bg-primary-400 py-3 rounded-xl items-center mb-3 shadow-md"
                  onPress={fetchAadharData}
                  activeOpacity={0.8}
                  disabled={isVerifying || aadharNumber.length !== 12}
                  accessibilityLabel="Verify Aadhaar button"
                  testID="fetch-button"
                >
                  <Text className="text-white text-base font-rubik-bold tracking-wide">
                    VERIFY AADHAAR
                  </Text>
                </TouchableOpacity>

                {fetchError ? (
                  <Text className="text-danger text-sm mb-3 text-center font-rubik">
                    {fetchError}
                  </Text>
                ) : null}

                {isVerifying && (
                  <View className="items-center justify-center py-4">
                    <ActivityIndicator size="large" color="#5e17eb" />
                    <Text className="text-primary-400 mt-2 font-rubik">
                      Verifying Aadhaar...
                    </Text>
                  </View>
                )}

                {userData && !isVerifying && (
                  <View className="bg-accent-100 p-4 rounded-xl mb-5">
                    <Text className="text-black-300 text-lg font-rubik-semibold mb-2">
                      Aadhaar Details
                    </Text>
                    
                    <View className="flex-row mb-2">
                      <Text className="text-black-200 font-rubik-medium w-24">Name:</Text>
                      <Text className="text-black-300 font-rubik flex-1">{userData.name}</Text>
                    </View>
                    
                    <View className="flex-row mb-2">
                      <Text className="text-black-200 font-rubik-medium w-24">Gender:</Text>
                      <Text className="text-black-300 font-rubik flex-1">{userData.gender}</Text>
                    </View>
                    
                    <View className="flex-row mb-2">
                      <Text className="text-black-200 font-rubik-medium w-24">DOB:</Text>
                      <Text className="text-black-300 font-rubik flex-1">{userData.dob}</Text>
                    </View>
                    
                    <View className="flex-row mb-2">
                      <Text className="text-black-200 font-rubik-medium w-24">Phone:</Text>
                      <Text className="text-black-300 font-rubik flex-1">{userData.phone}</Text>
                    </View>
                    
                    <View className="flex-row">
                      <Text className="text-black-200 font-rubik-medium w-24">Address:</Text>
                      <Text className="text-black-300 font-rubik flex-1">
                        {userData.address}, {userData.pincode}
                      </Text>
                    </View>
                  </View>
                )}

                {userData && !isVerifying && !isVerified && (
                  <TouchableOpacity
                    className="bg-primary-400 py-3.5 rounded-xl items-center mb-5 shadow-md"
                    onPress={handleConfirmAndProceed}
                    activeOpacity={0.8}
                    accessibilityLabel="Confirm and proceed button"
                    testID="confirm-button"
                  >
                    <Text className="text-white text-lg font-rubik-bold tracking-wide">
                      CONFIRM & PROCEED
                    </Text>
                  </TouchableOpacity>
                )}

                {isVerified && (
                  <View className="items-center justify-center py-4">
                    <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                    <Text className="text-green-600 mt-2 font-rubik-medium text-lg">
                      Aadhaar Verified Successfully
                    </Text>
                    <Text className="text-black-100 text-center mt-1 font-rubik">
                      Redirecting to dashboard...
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}