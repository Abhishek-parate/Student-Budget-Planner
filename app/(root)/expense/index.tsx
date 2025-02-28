import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@supabase/supabase-js';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const AddExpensePage = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [scrollYPosition, setScrollYPosition] = useState(0);
  const scrollOpacity = useRef(new Animated.Value(0)).current;
  // Default bottom tab height - adjust this value based on your actual tab height
  const TAB_BAR_HEIGHT = 60;
  const [categories, setCategories] = useState([
    { id: 1, name: 'Food', icon: 'fast-food', color: '#0061FF' },
    { id: 2, name: 'Transport', icon: 'bus', color: '#F75555' },
    { id: 3, name: 'Books', icon: 'book', color: '#4CAF50' },
    { id: 4, name: 'Entertainment', icon: 'film', color: '#FF9800' },
    { id: 5, name: 'Rent', icon: 'home', color: '#9C27B0' },
    { id: 6, name: 'Others', icon: 'grid', color: '#795548' },
  ]);

  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // When keyboard appears, show the scroll indicator
        Animated.timing(scrollOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // When keyboard hides, hide the scroll indicator
        Animated.timing(scrollOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Fetch categories from Supabase
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (data && data.length > 0) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleSaveExpense = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        { 
          amount: parseFloat(amount), 
          description, 
          category_id: category.id,
          date: date.toISOString(),
          note,
          type: 'expense'
        },
      ]);

    if (error) {
      Alert.alert('Error', 'Failed to save expense');
      console.error(error);
      return;
    }

    Alert.alert('Success', 'Expense saved successfully');
    navigation.goBack();
  };

  // Helper function to scroll to a specific input
  const scrollToInput = (yPosition) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: yPosition,
        animated: true,
      });
    }
  };

    const handleGoBack = () => {
      router.replace('/(tabs)');
    };

  // Track scroll position to implement "scroll to top" functionality
  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    setScrollYPosition(currentY);
  };

  // Function to scroll to top
  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Calculate bottom padding to ensure content is visible above tab bar
  const getBottomPadding = () => {
    // Use insets.bottom for devices with home indicator (iPhone X and later)
    // If insets.bottom is 0, use the default TAB_BAR_HEIGHT
    const safeAreaBottom = insets.bottom > 0 ? insets.bottom : 0;
    return TAB_BAR_HEIGHT + safeAreaBottom + 20; // 20px extra padding for comfort
  };

  return (
    <SafeAreaView className="flex-1 bg-accent-100" style={{ paddingBottom: 0 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="px-4 py-4 flex-row items-center">
            <TouchableOpacity onPress={handleGoBack} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#191D31" />
            </TouchableOpacity>
            <Text className="font-rubik-semibold text-black-300 text-xl">Add Expense</Text>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ 
              paddingBottom: getBottomPadding()
            }}
          >
            {/* Amount Input */}
            <View className="mx-4 p-4 bg-white rounded-2xl shadow-sm mb-4">
              <Text className="font-rubik text-black-100 mb-2">Amount</Text>
              <View className="flex-row items-center">
                <Text className="font-rubik-medium text-black-300 text-xl mr-2">$</Text>
                <TextInput
                  className="font-rubik-semibold text-black-300 text-3xl flex-1"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  onFocus={() => scrollToInput(0)}
                />
              </View>
            </View>

            {/* Description Input */}
            <View className="mx-4 mb-4">
              <Text className="font-rubik text-black-100 mb-2">Description</Text>
              <TextInput
                className="bg-white p-4 rounded-2xl font-rubik text-black-300"
                placeholder="What did you spend on?"
                value={description}
                onChangeText={setDescription}
                onFocus={() => scrollToInput(100)}
              />
            </View>

            {/* Category Selection */}
            <View className="mx-4 mb-4">
              <Text className="font-rubik text-black-100 mb-2">Category</Text>
              <View className="flex-row flex-wrap">
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`mr-2 mb-2 p-3 rounded-xl flex-row items-center ${category?.id === cat.id ? 'bg-primary-200' : 'bg-white'}`}
                    onPress={() => setCategory(cat)}
                  >
                    <View 
                      className="w-8 h-8 rounded-full items-center justify-center mr-2"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Ionicons name={cat.icon} size={16} color={cat.color} />
                    </View>
                    <Text 
                      className={`font-rubik ${category?.id === cat.id ? 'text-primary-300 font-rubik-medium' : 'text-black-200'}`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Selection */}
            <View className="mx-4 mb-4">
              <Text className="font-rubik text-black-100 mb-2">Date</Text>
              <TouchableOpacity 
                onPress={showDatepicker}
                className="bg-white p-4 rounded-2xl flex-row items-center justify-between"
              >
                <Text className="font-rubik text-black-300">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#8C8E98" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Note Input */}
            <View className="mx-4 mb-6">
              <Text className="font-rubik text-black-100 mb-2">Note (Optional)</Text>
              <TextInput
                className="bg-white p-4 rounded-2xl font-rubik text-black-300 h-24"
                placeholder="Add note"
                multiline
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
                onFocus={() => scrollToInput(400)}
              />
            </View>

            {/* Save Button */}
            <View className="mx-4 mb-6">
              <TouchableOpacity 
                className="bg-primary-300 p-4 rounded-xl"
                onPress={handleSaveExpense}
              >
                <Text className="font-rubik-medium text-white text-center">Save Expense</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Scroll to top button - shows when scrolled down and keyboard is not visible */}
          {scrollYPosition > 100 && !keyboardVisible && (
            <TouchableOpacity 
              className="absolute bottom-6 right-6 bg-primary-300 w-12 h-12 rounded-full items-center justify-center shadow-md"
              style={{ bottom: insets.bottom > 0 ? insets.bottom + 70 : 70 }} // Position above tabs
              onPress={scrollToTop}
            >
              <Ionicons name="arrow-up" size={24} color="white" />
            </TouchableOpacity>
          )}

          {/* Scroll indicator that appears when keyboard is open */}
          <Animated.View 
            style={{
              position: 'absolute',
              right: 6,
              top: 100,
              bottom: getBottomPadding(),
              width: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 97, 255, 0.3)',
              opacity: scrollOpacity,
            }}
          >
            <Animated.View 
              style={{
                position: 'absolute',
                right: 0,
                top: `${Math.min(scrollYPosition / 500 * 100, 90)}%`,
                width: 4,
                height: '10%',
                borderRadius: 2,
                backgroundColor: '#0061FF',
              }}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddExpensePage;