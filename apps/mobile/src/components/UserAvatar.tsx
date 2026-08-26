import { View, Text } from 'react-native';
import { PALETTE } from '../constants/palette';

export function UserAvatar({ email, size = 32 }: { email: string; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      className="items-center justify-center"
      style={[style, { backgroundColor: PALETTE.blue }]}
    >
      <Text className="text-white font-bold" style={{ fontSize: size * 0.42 }}>
        {email.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
