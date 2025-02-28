import { View, Text } from "react-native";

const getInitials = (name: string) => {
  if (!name) return "U";
  const nameParts = name.split(" ");
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return nameParts[0][0].toUpperCase();
};



export default function UserAvatar({ name }: { name: string }) {
  return (
    <View className="w-36 h-36 bg-primary-400 rounded-full flex items-center justify-center shadow-4xl border-2 border-primary-100">
      <Text className="text-white text-6xl font-bold">{getInitials(name)}</Text>
    </View>
  );
}
