import { Redirect, Tabs } from "expo-router";
import { Image, ImageSourcePropType, Text, View } from "react-native";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthProvider";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col items-center">
    <Image
      source={icon}
      style={{ tintColor: focused ? "#0061FF" : "#666876" }}
      resizeMode="contain"
      className="size-6"
    />
    <Text
      className={`${
        focused ? "text-primary-400 font-rubik-medium" : "text-black-200 font-rubik"
      } text-xs w-full text-center mt-1`}
    >
      {title}
    </Text>
  </View>
);

const TabsLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "white",
          position: "absolute",
          borderTopColor: "#0061FF1A",
          borderTopWidth: 1,
          minHeight: 70,
        },
        headerShown: false, // This ensures the header is hidden globally for all screens
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.home} title="Home" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.search} title="Explore" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.person} title="Profile" />,
        }}
      />
       <Tabs.Screen
        name="chat"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.chat} title="chat" />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
