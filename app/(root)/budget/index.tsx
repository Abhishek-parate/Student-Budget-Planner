import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@supabase/supabase-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SetBudgetPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get params or set defaults
  const { year = new Date().getFullYear(), month = new Date().getMonth() } = route.params || {};
  
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) throw categoriesError;
      
      // Format month date
      const monthDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      
      // Fetch budget for the selected month
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', monthDate)
        .single();
      
      if (budgetError && budgetError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw budgetError;
      }
      
      // Fetch category budgets
      const { data: categoryBudgetsData, error: categoryBudgetsError } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', monthDate);
      
      if (categoryBudgetsError) throw categoryBudgetsError;
      
      // Set categories
      setCategories(categoriesData || []);
      
      // Set total budget
      setBudget(budgetData ? String(budgetData.amount) : '');
      
      // Process category budgets
      const categoryBudgetsMap = {};
      if (categoryBudgetsData) {
        categoryBudgetsData.forEach(item => {
          categoryBudgetsMap[item.category_id] = String(item.amount);
        });
      }
      
      // Format category budgets
      const formattedCategoryBudgets = (categoriesData || []).map(category => {
        return {
          ...category,
          budget: categoryBudgetsMap[category.id] || ''
        };
      });
      
      setCategoryBudgets(formattedCategoryBudgets);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch budget data');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudget = async () => {
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid total budget amount');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Format month date
      const monthDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      
      // Upsert total budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .upsert([
          {
            year: selectedYear,
            month: monthDate,
            amount: parseFloat(budget)
          }
        ]);
      
      if (budgetError) throw budgetError;
      
      // Prepare category budgets for upsert
      const categoryBudgetsToSave = categoryBudgets
        .filter(category => category.budget && !isNaN(parseFloat(category.budget)) && parseFloat(category.budget) > 0)
        .map(category => ({
          year: selectedYear,
          month: monthDate,
          category_id: category.id,
          amount: parseFloat(category.budget)
        }));
      
      if (categoryBudgetsToSave.length > 0) {
        const { error: categoryBudgetsError } = await supabase
          .from('category_budgets')
          .upsert(categoryBudgetsToSave);
        
        if (categoryBudgetsError) throw categoryBudgetsError;
      }
      
      Alert.alert('Success', 'Budget saved successfully');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCategoryBudget = (categoryId, value) => {
    setCategoryBudgets(prevBudgets => 
      prevBudgets.map(item => 
        item.id === categoryId 
          ? { ...item, budget: value } 
          : item
      )
    );
  };

  const navigateMonth = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <SafeAreaView className="flex-1 bg-accent-100">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#191D31" />
        </TouchableOpacity>
        <Text className="font-rubik-semibold text-black-300 text-xl">Set Monthly Budget</Text>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Month selector */}
        <View className="flex-row items-center justify-center mx-4 mb-6">
          <TouchableOpacity onPress={() => navigateMonth(-1)} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#191D31" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Text className="font-rubik-medium text-black-300 text-lg">
              {monthNames[selectedMonth]} {selectedYear}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateMonth(1)} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#191D31" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="items-center justify-center h-60">
            <ActivityIndicator size="large" color="#0061FF" />
          </View>
        ) : (
          <>
            {/* Total budget input */}
            <View className="mx-4 p-4 bg-white rounded-2xl shadow-sm mb-6">
              <Text className="font-rubik-medium text-black-300 text-lg mb-2">
                Total Budget
              </Text>
              <View className="flex-row items-center">
                <Text className="font-rubik-medium text-black-300 text-xl mr-2">$</Text>
                <TextInput
                  className="font-rubik-semibold text-black-300 text-3xl flex-1"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>
              <Text className="font-rubik text-black-100 mt-2">
                Set your total budget for {monthNames[selectedMonth]} {selectedYear}
              </Text>
            </View>

            {/* Category budgets */}
            <View className="mx-4 mb-6">
              <Text className="font-rubik-medium text-black-300 text-lg mb-2">
                Category Budgets (Optional)
              </Text>
              <View className="bg-white rounded-2xl overflow-hidden">
                {categoryBudgets.map((category, index) => (
                  <View 
                    key={category.id} 
                    className={`p-4 flex-row items-center justify-between ${
                      index < categoryBudgets.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Ionicons name={category.icon} size={20} color={category.color} />
                      </View>
                      <Text className="font-rubik text-black-300">{category.name}</Text>
                    </View>
                    <View className="flex-row items-center bg-accent-100 p-2 rounded-xl">
                      <Text className="font-rubik text-black-300 mr-1">$</Text>
                      <TextInput
                        className="font-rubik text-black-300 w-20 text-right"
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={category.budget}
                        onChangeText={(value) => updateCategoryBudget(category.id, value)}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <Text className="font-rubik text-black-100 mt-2">
                Tip: Category budgets help you track spending in specific areas
              </Text>
            </View>

            {/* Save Button */}
            <View className="mx-4 mb-6">
              <TouchableOpacity 
                className="bg-primary-300 p-4 rounded-xl"
                onPress={saveBudget}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-rubik-medium text-white text-center">Save Budget</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SetBudgetPage;