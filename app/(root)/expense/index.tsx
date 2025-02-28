import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddExpensePage = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([
    { id: 1, name: 'Food', icon: 'fast-food', color: '#0061FF' },
    { id: 2, name: 'Transport', icon: 'bus', color: '#F75555' },
    { id: 3, name: 'Books', icon: 'book', color: '#4CAF50' },
    { id: 4, name: 'Entertainment', icon: 'film', color: '#FF9800' },
    { id: 5, name: 'Rent', icon: 'home', color: '#9C27B0' },
    { id: 6, name: 'Others', icon: 'grid', color: '#795548' },
  ]);

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

  return (
    <SafeAreaView className="flex-1 bg-accent-100">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-4 py-4 flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#191D31" />
            </TouchableOpacity>
            <Text className="font-rubik-semibold text-black-300 text-xl">Add Expense</Text>
          </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddExpensePage;