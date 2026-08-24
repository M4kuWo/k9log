import { useState } from 'react';
import { View, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PasswordInput(props: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative justify-center">
      <TextInput
        className="border border-neutral-300 rounded-lg px-4 py-3 pr-11 text-base"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      <Pressable
        className="absolute right-3 p-1"
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
      >
        <Ionicons name={visible ? 'eye-off' : 'eye'} size={20} color="#737373" />
      </Pressable>
    </View>
  );
}
