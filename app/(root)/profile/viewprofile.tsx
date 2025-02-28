import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/utils/supabase";
import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Button,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import icons from "@/constants/icons";
import UserAvatar from "@/components/UserAvatar";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
}

function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || "User";

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);

      if (error) {
        throw error;
      }

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        setAvatarUrl(fr.result as string);
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error downloading image: ", error.message);
      }
    }
  }

  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("User cancelled image picker.");
        return;
      }

      const image = result.assets[0];
      if (!image.uri) {
        throw new Error("No image uri!");
      }

      const arraybuffer = await fetch(image.uri).then((res) =>
        res.arrayBuffer()
      );

      const fileExt = image.uri?.split(".").pop()?.toLowerCase() ?? "jpeg";
      const path = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? "image/jpeg",
        });

      if (uploadError) {
        throw uploadError;
      }

      onUpload(data.path);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="flex flex-row justify-center">
      <View className="flex flex-col items-center relative">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            accessibilityLabel="Avatar"
            className="w-36 h-36 bg-primary-400 rounded-full flex items-center justify-center shadow-4xl border-2 border-primary-100"
          />
        ) : (
          <UserAvatar name={displayName} />
        )}

        <TouchableOpacity
          className="absolute bottom-11 right-2"
          onPress={uploadAvatar}
          disabled={uploading}
        >
          <Image
            source={icons.edit}
            className="h-9 w-9 border-[1px] border-red-200 rounded-xl text-white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Custom hook for profile data
const useProfileData = (session) => {
  const [profileData, setProfileData] = useState({
    website: "",
    avatar_url: "",
    full_name: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    date_of_birth: "",
    bio: "",
    location: "",
    aadhaar_number: "",
    membership_type: "",
    level: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user) {
        throw new Error("No user on the session!");
      }

      const { data, error, status } = await supabase
        .from("profiles")
        .select(
          `
           website, avatar_url, full_name, 
          first_name, last_name, phone_number, date_of_birth,
          bio, location, aadhaar_number, membership_type, level
        `
        )
        .eq("id", session.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfileData({
          website: data.website || "",
          avatar_url: data.avatar_url || "",
          full_name: data.full_name || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone_number: data.phone_number || "",
          date_of_birth: data.date_of_birth || "",
          bio: data.bio || "",
          location: data.location || "",
          aadhaar_number: data.aadhaar_number || "",
          membership_type: data.membership_type || "",
          level: data.level || "",
        });
      }
    } catch (error) {
      setError(error.message);
      console.error("Error fetching profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user) {
        throw new Error("No user on the session!");
      }

      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        ...updates,
        updated_at: new Date(),
      });

      if (error) throw error;

      // Refresh profile data after update
      await fetchProfile();
      router.push("/(tabs)");
      return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
      setError(error.message);
      console.error("Error updating profile:", error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  return {
    profileData,
    setProfileData,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
};

// Custom hook for social links
const useSocialLinks = (session) => {
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [errorLinks, setErrorLinks] = useState(null);

  // Fetch user's social links
  const fetchSocialLinks = async () => {
    try {
      setLoadingLinks(true);
      setErrorLinks(null);

      if (!session?.user) {
        throw new Error("No user on the session!");
      }

      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .eq("id", session.user.id);

      if (error) throw error;

      if (data) {
        setLinks(
          data.map((link) => ({
            platform: link.name,
            url: link.url,
          }))
        );
      }
    } catch (error) {
      setErrorLinks(error.message);
      console.error("Error fetching social links:", error.message);
    } finally {
      setLoadingLinks(false);
    }
  };

  // Save social links - this handles adding, updating and removing links
  const saveSocialLinks = async (newLinks) => {
    try {
      setLoadingLinks(true);
      setErrorLinks(null);

      if (!session?.user) {
        throw new Error("No user on the session!");
      }

      // 1. First, delete all existing links for this user
      const { error: deleteError } = await supabase
        .from("social_links")
        .delete()
        .eq("id", session.user.id);

      if (deleteError) throw deleteError;

      // 2. Then, insert all the new links
      if (newLinks && newLinks.length > 0) {
        const linksToInsert = newLinks.map((link) => ({
          id: session.user.id, // Using id as userid as requested
          name: link.platform,
          url: link.url,
        }));

        const { error: insertError } = await supabase
          .from("social_links")
          .insert(linksToInsert);

        if (insertError) throw insertError;
      }

      // Update local state
      setLinks(newLinks);
      return { success: true, message: "Social links updated successfully!" };
    } catch (error) {
      setErrorLinks(error.message);
      console.error("Error saving social links:", error.message);
      return { success: false, message: error.message };
    } finally {
      setLoadingLinks(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchSocialLinks();
    }
  }, [session]);

  return {
    links,
    setLinks,
    loadingLinks,
    errorLinks,
    fetchSocialLinks,
    saveSocialLinks,
  };
};

WebBrowser.maybeCompleteAuthSession();

const ViewProfile = () => {
  const { session, user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const scrollViewRef = useRef(null);

  // Use the custom hook for profile data
  const {
    profileData,
    setProfileData,
    loading,
    error,
    fetchProfile,
    updateProfile,
  } = useProfileData(session);

  const {
    links,
    setLinks,
    loadingLinks,
    errorLinks,
    fetchSocialLinks,
    saveSocialLinks,
  } = useSocialLinks(session);

  // Form state
  const [formData, setFormData] = useState({ ...profileData });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Update form data when profile data changes
  useEffect(() => {
    setFormData({ ...profileData });
  }, [profileData]);

  // Form validation
  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    date_of_birth: "",
    aadhaar_number: "",
    website: "",
    bio: "",
    membership_type: "",
    level: "",
  });

  useWarmUpBrowser();
  const router = useRouter();

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Name validation
    if (!formData.first_name?.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    } else {
      newErrors.first_name = "";
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    } else {
      newErrors.last_name = "";
    }

    // Phone number validation
    if (!formData.phone_number?.trim()) {
      newErrors.phone_number = "Phone Number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Enter a valid 10-digit Phone Number";
      isValid = false;
    } else {
      newErrors.phone_number = "";
    }

    // Aadhaar validation
    if (!formData.aadhaar_number?.trim()) {
      newErrors.aadhaar_number = "Aadhaar number is required";
      isValid = false;
    } else if (!/^\d{12}$/.test(formData.aadhaar_number)) {
      newErrors.aadhaar_number = "Enter a valid 12-digit Aadhaar number";
      isValid = false;
    } else {
      newErrors.aadhaar_number = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  // Date picker handlers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      handleChange("date_of_birth", selectedDate.toISOString().split("T")[0]);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Location handling
  const getCurrentLocation = async () => {
    try {
      setLocationError("");
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address && address.length > 0) {
        const locationString = `${address[0].city || ""}, ${
          address[0].region || ""
        }, ${address[0].country || ""}`;
        const formattedLocation = locationString.replace(/^,\s*|,\s*$/g, "");
        handleChange("location", formattedLocation);
      }
    } catch (error) {
      console.error("Error:", error);
      setLocationError("Failed to get location");
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please check the form for errors");
      return;
    }

    try {
      // Calculate full name from first and last name
      const updates = {
        ...formData,
        full_name: `${formData.first_name} ${formData.last_name}`,
      };

      // First update the profile
      const profileResult = await updateProfile(updates);

      if (!profileResult.success) {
        Alert.alert("Error", profileResult.message);
        return;
      }

      // Then save the social links
      const socialLinksResult = await saveSocialLinks(links);

      if (socialLinksResult.success) {
        Alert.alert(
          "Success",
          "Profile and social links updated successfully!"
        );
      } else {
        Alert.alert(
          "Warning",
          "Profile updated but there was an issue with social links: " +
            socialLinksResult.message
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Refresh profile data and social links
  const refreshProfile = async () => {
    await Promise.all([fetchProfile(), fetchSocialLinks()]);
    Alert.alert("Profile Refreshed", "Your profile data has been refreshed");
  };

  // Social links state and handlers
  const [currentLink, setCurrentLink] = useState("");
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [editIndex, setEditIndex] = useState(-1);

  const addLink = () => {
    if (currentLink.trim() === "" || currentPlatform.trim() === "") {
      Alert.alert(
        "Validation Error",
        "Both platform name and URL are required"
      );
      return;
    }

    if (editIndex >= 0) {
      // Edit existing item
      const updatedLinks = [...links];
      updatedLinks[editIndex] = { platform: currentPlatform, url: currentLink };
      setLinks(updatedLinks);
      setEditIndex(-1);
    } else {
      // Add new item
      setLinks([...links, { platform: currentPlatform, url: currentLink }]);
    }

    // Clear inputs
    setCurrentLink("");
    setCurrentPlatform("");
  };

  const removeLink = (index) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    setLinks(updatedLinks);
  };

  const editLink = (index) => {
    setCurrentPlatform(links[index].platform);
    setCurrentLink(links[index].url);
    setEditIndex(index);
  };

  const renderItem = ({ item, index }) => (
    <View className="flex-row justify-between items-center p-3 border border-gray-200 rounded mb-2">
      <View className="flex-1">
        <Text className="font-bold">{item.platform}</Text>
        <Text className="text-blue-700">{item.url}</Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          className="bg-green-600 p-2 rounded mr-2"
          onPress={() => editLink(index)}
        >
          <Text className="text-white font-bold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-600 p-2 rounded"
          onPress={() => removeLink(index)}
        >
          <Text className="text-white font-bold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#5e17eb" />
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
          <View className="h-2 bg-primary-400 px-6 pt-4 pb-4 relative">
            <View className="items-center justify-center flex-1"></View>
          </View>

          <View className="bg-white rounded-t-2xl -mt-8 flex-1 px-6 pb-10 shadow-lg">
            <View className="flex flex-row items-center justify-between mt-5">
              <Text className="text-xl font-rubik-bold">ViewProfile</Text>
              <View className="flex-row">
                <TouchableOpacity onPress={refreshProfile} className="mr-4">
                  <Ionicons name="refresh" size={24} color="#5e17eb" />
                </TouchableOpacity>
                <Image source={icons.bell} className="size-5" />
              </View>
            </View>

            <View className="flex flex-row justify-center mt-6">
              <View className="flex flex-col items-center relative">
                <Avatar
                  url={formData.avatar_url}
                  onUpload={(filePath) => handleChange("avatar_url", filePath)}
                />
                <Text className="text-2xl font-rubik-bold mt-2">
                  {displayName}
                </Text>
              </View>
            </View>

            {/* Loading indicator */}
            {loading && (
              <View className="items-center justify-center py-4">
                <ActivityIndicator size="large" color="#5e17eb" />
                <Text className="mt-2 text-primary-400 font-rubik-medium">
                  Loading profile data...
                </Text>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                <Text className="font-rubik-medium">{error}</Text>
                <TouchableOpacity
                  onPress={fetchProfile}
                  className="bg-red-500 py-2 px-4 rounded mt-2 items-center"
                >
                  <Text className="text-white font-rubik-medium">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Profile Form */}
            {!loading && !error && (
              <View className="mt-8">
                <Text className="text-xl font-rubik-semibold text-center mb-4 border-t pt-5 border-primary-200">
                  Profile Information
                </Text>

                {/* First Name Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    First Name
                  </Text>
                  <View
                    className={`mb-1 border ${
                      errors.first_name ? "border-red-500" : "border-gray-300"
                    } rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons name="person-outline" size={18} color="#8C8E98" />
                    <TextInput
                      placeholder="Your first name"
                      className="flex-1 h-12 ml-2 font-rubik"
                      value={formData.first_name}
                      onChangeText={(text) => {
                        // Only allow alphabets and limit to 15 characters
                        const alphabeticText = text.replace(/[^A-Za-z]/g, "");
                        const limitedText = alphabeticText.slice(0, 15);
                        handleChange("first_name", limitedText);
                      }}
                      maxLength={15}
                      accessibilityLabel="First name input field"
                      testID="first-name-input"
                    />
                  </View>
                  {errors.first_name ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {errors.first_name}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                {/* Last Name Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Last Name
                  </Text>
                  <View
                    className={`mb-1 border ${
                      errors.last_name ? "border-red-500" : "border-gray-300"
                    } rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons name="person-outline" size={18} color="#8C8E98" />
                    <TextInput
                      placeholder="Your last name"
                      className="flex-1 h-12 ml-2 font-rubik"
                      value={formData.last_name}
                      onChangeText={(text) => {
                        // Only allow alphabets and limit to 15 characters
                        const alphabeticText = text.replace(/[^A-Za-z]/g, "");
                        const limitedText = alphabeticText.slice(0, 15);
                        handleChange("last_name", limitedText);
                      }}
                      maxLength={15}
                      accessibilityLabel="Last name input field"
                      testID="last-name-input"
                    />
                  </View>
                  {errors.last_name ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {errors.last_name}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Phone Number
                  </Text>
                  <View
                    className={`mb-1 border ${
                      errors.phone_number ? "border-red-500" : "border-gray-300"
                    } rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons name="call-outline" size={18} color="#8C8E98" />
                    <TextInput
                      placeholder="Your phone number"
                      className="flex-1 h-12 ml-2 font-rubik text-gray-500"
                      value={formData.phone_number}
                      editable={false}
                      selectTextOnFocus={false}
                      accessibilityLabel="Phone number input field (non-editable)"
                      testID="phone-number-input"
                    />
                  </View>
                  {errors.phone_number ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {errors.phone_number}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Date of Birth
                  </Text>
                  <View
                    className={`mb-1 border ${
                      errors.date_of_birth
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#8C8E98"
                    />
                    <Text className="flex-1 ml-4 font-rubik text-gray-500 py-3">
                      {formData.date_of_birth || "No date selected"}
                    </Text>
                  </View>
                  {errors.date_of_birth ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {errors.date_of_birth}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                {/* Bio Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    About Yourself
                  </Text>
                  <View
                    className={`mb-1 border ${
                      errors.bio ? "border-red-500" : "border-gray-300"
                    } rounded-xl px-4 py-2 flex-row items-start bg-accent-100`}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#8C8E98"
                      style={{ marginTop: 8 }}
                    />
                    <TextInput
                      placeholder="Tell us about yourself"
                      className="flex-1 ml-2 font-rubik pt-2"
                      value={formData.bio}
                      onChangeText={(text) => handleChange("bio", text)}
                      multiline
                      numberOfLines={3}
                      style={{ height: 80 }}
                      textAlignVertical="top"
                      accessibilityLabel="Bio input field"
                      testID="bio-input"
                    />
                  </View>
                  {errors.bio ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {errors.bio}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                {/* Location Input with Get Current Location */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Location
                  </Text>
                  <View className="flex-row">
                    <View
                      className={`flex-1 mb-1 border ${
                        locationError ? "border-red-500" : "border-gray-300"
                      } rounded-l-xl px-4 py-2 flex-row items-center bg-accent-100`}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#8C8E98"
                      />
                      <TextInput
                        placeholder="Your location"
                        className="flex-1 h-12 ml-2 font-rubik text-gray-500"
                        value={formData.location}
                        editable={false}
                        selectTextOnFocus={false}
                        accessibilityLabel="Location input field (non-editable)"
                        testID="location-input"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={getCurrentLocation}
                      className="bg-primary-400 px-4 rounded-r-xl justify-center items-center mb-1"
                    >
                      <Ionicons name="location" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  {locationError ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {locationError}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                {/* Aadhaar Number Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Aadhaar Number
                  </Text>
                  <View
                    className={`mb-1 border ${
                      errors.aadhaar_number
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons name="card-outline" size={18} color="#8C8E98" />
                    <TextInput
                      placeholder="Your Aadhaar number"
                      className="flex-1 h-12 ml-2 font-rubik text-gray-500"
                      value={formData.aadhaar_number}
                      editable={false}
                      selectTextOnFocus={false}
                      accessibilityLabel="Aadhaar number input field (non-editable)"
                      testID="aadhaar-number-input"
                    />
                  </View>
                  {errors.aadhaar_number ? (
                    <Text className="text-danger text-xs mb-3 ml-1 font-rubik">
                      {errors.aadhaar_number}
                    </Text>
                  ) : (
                    <View className="mb-3" />
                  )}
                </View>

                {/* Membership Type Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Membership Type
                  </Text>
                  <View
                    className={`mb-1 border border-gray-300 rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons name="people-outline" size={18} color="#8C8E98" />
                    <TextInput
                      placeholder="Your membership type"
                      className="flex-1 h-12 ml-2 font-rubik text-gray-500"
                      value={formData.membership_type}
                      editable={false}
                      selectTextOnFocus={false}
                      accessibilityLabel="Membership type input field (non-editable)"
                      testID="membership-type-input"
                    />
                  </View>
                  <View className="mb-3" />
                </View>

                {/* Level Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Level
                  </Text>
                  <View className="mb-1 border border-gray-300 rounded-xl px-4 py-2 bg-accent-100">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="trophy-outline"
                        size={18}
                        color="#8C8E98"
                      />
                      <Picker
                        selectedValue={formData.level}
                        onValueChange={(itemValue) =>
                          handleChange("level", itemValue)
                        }
                        style={{
                          flex: 1,
                          height: 60,
                          marginLeft: 8,
                          color: formData.level ? "#333333" : "#8C8E98",
                          fontFamily: "Rubik-Medium",
                        }}
                        dropdownIconColor="#5e17eb"
                        accessibilityLabel="Level select field"
                        testID="level-select"
                        mode="dropdown"
                        itemStyle={{
                          fontFamily: "Rubik-Regular",
                          fontSize: 16,
                        }}
                      >
                        <Picker.Item
                          label="Select Level"
                          value=""
                          style={{
                            color: "#8C8E98",
                            fontFamily: "Rubik-Regular",
                          }}
                        />
                        <Picker.Item
                          label="Beginner"
                          value="Beginner"
                          style={{
                            color: "#4CAF50",
                            fontFamily: "Rubik-Medium",
                          }}
                        />
                        <Picker.Item
                          label="Intermediate"
                          value="Intermediate"
                          style={{
                            color: "#2196F3",
                            fontFamily: "Rubik-Medium",
                          }}
                        />
                        <Picker.Item
                          label="Expert"
                          value="Expert"
                          style={{ color: "#9C27B0", fontFamily: "Rubik-Bold" }}
                        />
                      </Picker>
                    </View>
                  </View>
                  <View className="mb-3" />
                </View>

                {/* Website Input */}
                <View>
                  <Text className="text-primary-400 text-sm mb-1 font-rubik-medium">
                    Website
                  </Text>
                  <View
                    className={`mb-1 border border-gray-300 rounded-xl px-4 py-2 flex-row items-center bg-accent-100`}
                  >
                    <Ionicons name="globe-outline" size={18} color="#8C8E98" />
                    <TextInput
                      placeholder="Your website"
                      className="flex-1 h-12 ml-2 font-rubik"
                      value={formData.website}
                      onChangeText={(text) => handleChange("website", text)}
                      autoCapitalize="none"
                      accessibilityLabel="Website input field"
                      testID="website-input"
                    />
                  </View>
                  <View className="mb-3" />
                </View>

                <View className="p-5">
                  <Text className="text-lg font-medium mb-5 text-gray-800">
                    Social Media Links
                  </Text>

                  <View className="mb-5">
                    <Text className="text-sm mb-1 text-blue-500 font-medium">
                      Platform
                    </Text>
                    <View className="mb-3 border border-gray-300 rounded-xl px-4 py-2 bg-white">
                      <TextInput
                        className="flex-1 h-12"
                        placeholder="Instagram, Twitter, LinkedIn, etc."
                        value={currentPlatform}
                        onChangeText={setCurrentPlatform}
                      />
                    </View>

                    <Text className="text-sm mb-1 text-blue-500 font-medium">
                      Profile URL
                    </Text>
                    <View className="mb-4 border border-gray-300 rounded-xl px-4 py-2 bg-white">
                      <TextInput
                        className="flex-1 h-12"
                        placeholder="https://..."
                        value={currentLink}
                        onChangeText={setCurrentLink}
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-blue-600 py-3 rounded-xl items-center"
                      onPress={addLink}
                    >
                      <Text className="text-white font-medium">
                        {editIndex >= 0 ? "Update Link" : "Add New Link"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Use a simple View + map instead of FlatList to avoid nesting issues */}
                  {links.length === 0 ? (
                    <Text className="text-center text-gray-500 mt-5">
                      No social media links added yet
                    </Text>
                  ) : (
                    <View className="mt-2">
                      {links.map((item, index) => (
                        <View
                          key={index}
                          className="mb-3 border border-gray-300 rounded-xl p-4 bg-white"
                        >
                          <View className="flex-row justify-between items-center">
                            <View className="flex-1">
                              <Text className="font-medium text-gray-800">
                                {item.platform}
                              </Text>
                              <Text className="text-blue-500 text-sm">
                                {item.url}
                              </Text>
                            </View>
                            <View className="flex-row">
                              <TouchableOpacity
                                className="px-3 py-2 rounded-lg bg-gray-100 mr-2"
                                onPress={() => editLink(index)}
                              >
                                <Text className="text-blue-600 font-medium">
                                  Edit
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="px-3 py-2 rounded-lg bg-gray-100"
                                onPress={() => removeLink(index)}
                              >
                                <Text className="text-red-600 font-medium">
                                  Delete
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View className="flex-row justify-between mt-5">
                  <Pressable
                    onPress={() => setFormData({ ...profileData })}
                    className="bg-gray-300 rounded-lg p-3 items-center flex-1 mr-2"
                  >
                    <Text className="text-lg text-gray-700 font-rubik-bold">
                      Reset
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={loading}
                    onPress={handleSubmit}
                    className="bg-primary-400 rounded-lg p-3 items-center flex-1 ml-2"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-lg text-white font-rubik-bold">
                        Update Profile
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ViewProfile;
